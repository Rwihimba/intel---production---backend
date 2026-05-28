import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { supabaseAdmin, supabaseClient } from '../lib/supabase';
import { getResend, RESEND_FROM } from '../lib/resend';
import { requireAdmin } from '../middleware/roleGuard.middleware';
import { logAudit } from '../utils/audit';

const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:3000';

// Slugs are URL fragments — keep them ascii lowercase, hyphenated, and
// bounded so they're safe in subdomains (rw.intel.alx.com style per
// SRS §2.4) and in tenant-aware bucket paths (org_id/program_id/…).
function normaliseSlug(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

/* =====================================================================
   PUBLIC auth router — mounted BEFORE authenticateUser in server.ts
   ===================================================================== */
export const publicAuthRouter = Router();

// Stricter limit on unauthenticated auth endpoints (signup spam, token
// probing, magic-link requests) — tighter than the global 100/min.
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});
publicAuthRouter.use(authLimiter);

const requestAccessSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(1),
  role: z.enum(['agent', 'ambassador']),
  approving_admin_id: z.string().uuid(),
});

async function findAuthUserIdByEmail(email: string): Promise<string | null> {
  const target = email.toLowerCase();
  // listUsers is paginated; walk pages until we find the email or run out.
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;
    const match = data.users.find((u) => (u.email ?? '').toLowerCase() === target);
    if (match) return match.id;
    if (data.users.length < 200) break;
  }
  return null;
}

publicAuthRouter.post('/auth/request-access', async (req: Request, res: Response) => {
  const body = requestAccessSchema.parse(req.body);
  const email = body.email.toLowerCase();

  const { data: admin, error: adminErr } = await supabaseAdmin
    .from('users')
    .select('id, org_id, full_name, email, role, is_active')
    .eq('id', body.approving_admin_id)
    .eq('role', 'admin')
    .eq('is_active', true)
    .maybeSingle();
  if (adminErr) throw adminErr;
  if (!admin) {
    res.status(400).json({ error: 'Selected approving admin not found', code: 400 });
    return;
  }

  const { data: existingUser } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  if (existingUser) {
    res.status(409).json({ error: 'An account with this email already exists', code: 409 });
    return;
  }

  const { data: existingPending } = await supabaseAdmin
    .from('pending_users')
    .select('id, status')
    .eq('email', email)
    .eq('status', 'pending')
    .maybeSingle();
  if (existingPending) {
    res.status(409).json({ error: 'A pending request for this email already exists', code: 409 });
    return;
  }

  // The pending row inherits the approving admin's org — that's how the
  // tenant binding is established. Never accept org_id from the request.
  const { data: inserted, error: insertErr } = await supabaseAdmin
    .from('pending_users')
    .insert({
      org_id: admin.org_id,
      email,
      full_name: body.full_name,
      role: body.role,
      approving_admin_id: body.approving_admin_id,
      status: 'pending',
    })
    .select('id')
    .single();
  if (insertErr) throw insertErr;

  if (admin.email) {
    try {
      await getResend().emails.send({
        from: RESEND_FROM,
        to: admin.email,
        subject: 'INTEL — New account request',
        text: `${body.full_name} has requested access as a ${body.role}. Review their request in INTEL: ${FRONTEND_URL}/workspace/admin/users`,
      });
    } catch (mailErr) {
      console.error(`[${new Date().toISOString()}] [auth] notify-admin email failed:`, mailErr);
    }
  }

  res.status(201).json({ success: true, pending_user_id: inserted.id });
});

publicAuthRouter.get('/auth/status', async (req: Request, res: Response) => {
  // Derive the email from the caller's own session token, never from a
  // query param — this prevents anonymous enumeration of who is
  // pending/rejected. The login page already holds a session here
  // (signInWithPassword succeeds even before a users row exists).
  const header = req.header('authorization') ?? req.header('Authorization') ?? '';
  if (!header.toLowerCase().startsWith('bearer ')) {
    res.status(401).json({ error: 'Unauthorized', code: 401 });
    return;
  }
  const token = header.slice(7).trim();
  const { data: authData, error: authErr } = await supabaseClient.auth.getUser(token);
  if (authErr || !authData?.user?.email) {
    res.status(401).json({ error: 'Unauthorized', code: 401 });
    return;
  }
  const email = authData.user.email.toLowerCase();

  const { data: pending, error } = await supabaseAdmin
    .from('pending_users')
    .select('status, rejection_reason, approving_admin_id')
    .eq('email', email)
    .order('requested_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;

  if (!pending) {
    res.json({ status: 'none' });
    return;
  }

  let approvingAdminName: string | null = null;
  if (pending.approving_admin_id) {
    const { data: admin } = await supabaseAdmin
      .from('users')
      .select('full_name')
      .eq('id', pending.approving_admin_id)
      .maybeSingle();
    approvingAdminName = admin?.full_name ?? null;
  }

  res.json({
    status: pending.status,
    rejection_reason: pending.rejection_reason,
    approving_admin_name: approvingAdminName,
  });
});

publicAuthRouter.get('/users/admins', async (_req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, full_name')
    .eq('role', 'admin')
    .eq('is_active', true)
    .order('full_name', { ascending: true });
  if (error) throw error;
  res.json({ data: data ?? [] });
});

// Admin bootstrap: called by the magic-link callback when the intent is
// to LOG IN (not sign up). Multi-tenant rule: this endpoint never creates
// users or orgs. It only refreshes last_login_at for an existing admin
// row keyed by auth uid. If the auth user has no profile yet, we return
// 404 with code='no_workspace' so the callback can redirect to the
// signup screen instead of silently provisioning the wrong tenant.
publicAuthRouter.post('/auth/admin-bootstrap', async (req: Request, res: Response) => {
  const header = req.header('authorization') ?? req.header('Authorization') ?? '';
  if (!header.toLowerCase().startsWith('bearer ')) {
    res.status(401).json({ error: 'Unauthorized', code: 401 });
    return;
  }
  const token = header.slice(7).trim();
  const { data: authData, error: authErr } = await supabaseClient.auth.getUser(token);
  if (authErr || !authData?.user) {
    res.status(401).json({ error: 'Unauthorized', code: 401 });
    return;
  }
  const authUser = authData.user;

  const { data: existing, error: lookupErr } = await supabaseAdmin
    .from('users')
    .select('id, org_id, email, full_name, role, is_active')
    .eq('id', authUser.id)
    .maybeSingle();
  if (lookupErr) throw lookupErr;

  if (!existing) {
    res.status(404).json({
      error: 'No INTEL workspace is associated with this account yet.',
      code: 'no_workspace',
    });
    return;
  }
  if (!existing.is_active) {
    res.status(403).json({ error: 'Account is deactivated', code: 403 });
    return;
  }
  if (existing.role !== 'admin') {
    res.status(403).json({
      error: 'This account is not an admin. Use the team sign-in screen.',
      code: 'wrong_role',
    });
    return;
  }

  const { error: touchErr } = await supabaseAdmin
    .from('users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', existing.id);
  if (touchErr) {
    console.error(`[${new Date().toISOString()}] [auth] last_login_at update failed:`, touchErr);
  }

  res.json({
    user: {
      id: existing.id,
      email: existing.email,
      full_name: existing.full_name,
      role: existing.role,
    },
  });
});

// Admin signup: called by the magic-link callback when intent=signup.
// Creates a brand-new tenant (organisation + admin user + default
// settings + default targets) atomically via provision_admin_org(). The
// caller MUST hold a valid Supabase session — that proves email
// ownership (the OTP click confirms it). Open registration, no domain
// gate — the multi-tenant model treats any verified email as a valid
// workspace founder.
const adminSignupSchema = z.object({
  org_name: z.string().trim().min(2).max(80),
  org_slug: z.string().trim().min(2).max(48).optional(),
  full_name: z.string().trim().min(1).max(120).optional(),
});

publicAuthRouter.post('/auth/admin-signup', async (req: Request, res: Response) => {
  const header = req.header('authorization') ?? req.header('Authorization') ?? '';
  if (!header.toLowerCase().startsWith('bearer ')) {
    res.status(401).json({ error: 'Unauthorized', code: 401 });
    return;
  }
  const token = header.slice(7).trim();
  const { data: authData, error: authErr } = await supabaseClient.auth.getUser(token);
  if (authErr || !authData?.user) {
    res.status(401).json({ error: 'Unauthorized', code: 401 });
    return;
  }
  const authUser = authData.user;
  const email = (authUser.email ?? '').toLowerCase();
  if (!email) {
    res.status(400).json({ error: 'Authenticated user has no email', code: 400 });
    return;
  }

  const body = adminSignupSchema.parse(req.body);
  const orgName = body.org_name;
  const slug = normaliseSlug(body.org_slug ?? body.org_name);
  if (slug.length < 2) {
    res.status(400).json({
      error: 'Workspace URL must contain at least 2 letters or numbers.',
      code: 'invalid_slug',
    });
    return;
  }
  const fullName =
    body.full_name?.trim() ||
    (authUser.user_metadata?.full_name as string | undefined) ||
    (authUser.user_metadata?.name as string | undefined) ||
    email.split('@')[0];

  // provision_admin_org is defined in migration 007; the generated
  // Database type won't include it until types are regenerated post-
  // migration, so we cast to the known result shape here.
  type ProvisionRow = {
    org_id: string;
    user_id: string;
    org_name: string;
    org_slug: string;
  };
  const rpcCall = supabaseAdmin.rpc as unknown as (
    fn: string,
    args: Record<string, string>
  ) => Promise<{ data: ProvisionRow[] | null; error: { message?: string } | null }>;

  const { data, error } = await rpcCall('provision_admin_org', {
    p_user_id: authUser.id,
    p_email: email,
    p_full_name: fullName,
    p_org_name: orgName,
    p_org_slug: slug,
  });

  if (error) {
    // Postgres function raises typed errors we surface back to the UI.
    if (error.message?.includes('SLUG_TAKEN')) {
      res.status(409).json({ error: 'That workspace URL is already taken.', code: 'slug_taken' });
      return;
    }
    if (error.message?.includes('EMAIL_ALREADY_REGISTERED')) {
      res.status(409).json({
        error: 'This email already belongs to a different workspace.',
        code: 'email_taken',
      });
      return;
    }
    throw new Error(error.message ?? 'provision_admin_org failed');
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.org_id) {
    res.status(500).json({ error: 'Workspace provisioning failed unexpectedly.', code: 500 });
    return;
  }

  res.status(201).json({
    user: { id: row.user_id, email, full_name: fullName, role: 'admin' as const },
    org: { id: row.org_id, name: row.org_name, slug: row.org_slug },
  });
});

/* =====================================================================
   ADMIN auth router — mounted AFTER authenticateUser in server.ts
   ===================================================================== */
export const adminAuthRouter = Router();

const approveSchema = z.object({ pending_user_id: z.string().uuid() });
const rejectSchema = z.object({
  pending_user_id: z.string().uuid(),
  rejection_reason: z.string().max(1000).optional(),
});

adminAuthRouter.get('/auth/pending', requireAdmin, async (req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('pending_users')
    .select('*')
    .eq('status', 'pending')
    .eq('org_id', req.user.org_id)
    .order('requested_at', { ascending: false });
  if (error) throw error;
  res.json({ data: data ?? [] });
});

adminAuthRouter.post('/auth/approve-user', requireAdmin, async (req: Request, res: Response) => {
  const { pending_user_id } = approveSchema.parse(req.body);

  const { data: pending, error: pendingErr } = await supabaseAdmin
    .from('pending_users')
    .select('*')
    .eq('id', pending_user_id)
    .eq('org_id', req.user.org_id)
    .maybeSingle();
  if (pendingErr) throw pendingErr;
  if (!pending) {
    res.status(404).json({ error: 'Pending request not found', code: 404 });
    return;
  }
  if (pending.status !== 'pending') {
    res.status(409).json({ error: `Request already ${pending.status}`, code: 409 });
    return;
  }

  const authUid = await findAuthUserIdByEmail(pending.email);
  if (!authUid) {
    res.status(409).json({
      error: 'No Supabase Auth user found for this email. They must complete signup first.',
      code: 409,
    });
    return;
  }

  // Approval IS the verification step: confirm the email so the user can
  // actually sign in. Without this, self-signups stay unconfirmed and
  // signInWithPassword rejects them with "invalid login credentials".
  const { error: confirmErr } = await supabaseAdmin.auth.admin.updateUserById(authUid, {
    email_confirm: true,
  });
  if (confirmErr) {
    res.status(500).json({ error: `Could not confirm email: ${confirmErr.message}`, code: 500 });
    return;
  }

  const { data: newUser, error: userErr } = await supabaseAdmin
    .from('users')
    .upsert(
      {
        id: authUid,
        org_id: req.user.org_id,
        email: pending.email,
        full_name: pending.full_name,
        role: pending.role,
        is_active: true,
      },
      { onConflict: 'id' }
    )
    .select('id, email, full_name, role')
    .single();
  if (userErr) throw userErr;

  const nowIso = new Date().toISOString();
  const { error: updateErr } = await supabaseAdmin
    .from('pending_users')
    .update({ status: 'approved', reviewed_at: nowIso, reviewed_by: req.user.id })
    .eq('id', pending_user_id);
  if (updateErr) throw updateErr;

  try {
    await getResend().emails.send({
      from: RESEND_FROM,
      to: pending.email,
      subject: 'INTEL — Your account is approved',
      text: `Hi ${pending.full_name}, your INTEL account has been approved by ${req.user.full_name}. You can now sign in at: ${FRONTEND_URL}/login`,
    });
  } catch (mailErr) {
    console.error(`[${new Date().toISOString()}] [auth] approval email failed:`, mailErr);
  }

  await logAudit({
    orgId: req.user.org_id,
    actorId: req.user.id,
    action: 'user.approve',
    entityType: 'pending_users',
    entityId: pending_user_id,
    after: newUser,
  });

  res.json({ success: true });
});

adminAuthRouter.post('/auth/reject-user', requireAdmin, async (req: Request, res: Response) => {
  const { pending_user_id, rejection_reason } = rejectSchema.parse(req.body);

  const { data: pending, error: pendingErr } = await supabaseAdmin
    .from('pending_users')
    .select('*')
    .eq('id', pending_user_id)
    .eq('org_id', req.user.org_id)
    .maybeSingle();
  if (pendingErr) throw pendingErr;
  if (!pending) {
    res.status(404).json({ error: 'Pending request not found', code: 404 });
    return;
  }
  if (pending.status !== 'pending') {
    res.status(409).json({ error: `Request already ${pending.status}`, code: 409 });
    return;
  }

  const nowIso = new Date().toISOString();
  const { error: updateErr } = await supabaseAdmin
    .from('pending_users')
    .update({
      status: 'rejected',
      rejection_reason: rejection_reason ?? null,
      reviewed_at: nowIso,
      reviewed_by: req.user.id,
    })
    .eq('id', pending_user_id);
  if (updateErr) throw updateErr;

  const authUid = await findAuthUserIdByEmail(pending.email);
  if (authUid) {
    const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(authUid);
    if (delErr) {
      console.error(`[${new Date().toISOString()}] [auth] deleteUser failed:`, delErr);
    }
  }

  try {
    const reasonLine = rejection_reason ? ` ${rejection_reason}.` : '';
    await getResend().emails.send({
      from: RESEND_FROM,
      to: pending.email,
      subject: 'INTEL — Account request update',
      text: `Hi ${pending.full_name}, your request for INTEL access was not approved.${reasonLine} Contact your team lead for more information.`,
    });
  } catch (mailErr) {
    console.error(`[${new Date().toISOString()}] [auth] rejection email failed:`, mailErr);
  }

  await logAudit({
    orgId: req.user.org_id,
    actorId: req.user.id,
    action: 'user.reject',
    entityType: 'pending_users',
    entityId: pending_user_id,
    after: { rejection_reason: rejection_reason ?? null },
  });

  res.json({ success: true });
});
