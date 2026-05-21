import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../../lib/supabase';
import { requireAdmin } from '../../middleware/roleGuard.middleware';
import { logAudit, paramStr } from '../../utils/audit';
import { getResend, RESEND_FROM } from '../../lib/resend';

const router = Router();

const createUserSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(1),
  role: z.enum(['admin', 'agent', 'ambassador']),
});

const updateUserSchema = z.object({
  full_name: z.string().min(1).optional(),
  role: z.enum(['admin', 'agent', 'ambassador']).optional(),
  is_active: z.boolean().optional(),
});

router.get('/users', requireAdmin, async (req: Request, res: Response) => {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, email, full_name, role, is_active, last_login_at, created_at')
    .eq('org_id', req.user.org_id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  res.json({ data });
});

router.post('/users', requireAdmin, async (req: Request, res: Response) => {
  const body = createUserSchema.parse(req.body);

  const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
    email: body.email,
    email_confirm: false,
    user_metadata: { full_name: body.full_name, role: body.role },
  });
  if (authErr || !authUser?.user) {
    res.status(400).json({ error: authErr?.message ?? 'auth user creation failed', code: 400 });
    return;
  }

  const { data: profile, error: profErr } = await supabaseAdmin
    .from('users')
    .insert({
      id: authUser.user.id,
      org_id: req.user.org_id,
      email: body.email,
      full_name: body.full_name,
      role: body.role,
      is_active: true,
    })
    .select('id, email, full_name, role, is_active')
    .single();
  if (profErr) throw profErr;

  try {
    const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email: body.email,
    });
    const link = linkData?.properties?.action_link;
    if (link) {
      await getResend().emails.send({
        from: RESEND_FROM,
        to: body.email,
        subject: 'Welcome to INTEL — set up your account',
        text: `Hi ${body.full_name},\n\nYou have been invited to INTEL.\n\nSet up your account: ${link}\n`,
      });
    }
  } catch (mailErr) {
    console.error(`[${new Date().toISOString()}] [users] invite email failed:`, mailErr);
  }

  await logAudit({
    orgId: req.user.org_id,
    actorId: req.user.id,
    action: 'user.create',
    entityType: 'users',
    entityId: profile.id,
    after: profile,
  });

  res.status(201).json({ data: profile });
});

router.patch('/users/:id', requireAdmin, async (req: Request, res: Response) => {
  const body = updateUserSchema.parse(req.body);
  const userId = paramStr(req.params.id);

  const { data: before, error: beforeErr } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', userId)
    .eq('org_id', req.user.org_id)
    .maybeSingle();
  if (beforeErr) throw beforeErr;
  if (!before) {
    res.status(404).json({ error: 'User not found', code: 404 });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .update(body)
    .eq('id', userId)
    .eq('org_id', req.user.org_id)
    .select('id, email, full_name, role, is_active')
    .single();
  if (error) throw error;

  await logAudit({
    orgId: req.user.org_id,
    actorId: req.user.id,
    action: 'user.update',
    entityType: 'users',
    entityId: userId,
    before,
    after: data,
  });

  res.json({ data });
});

export default router;
