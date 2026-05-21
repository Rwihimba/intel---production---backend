import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../../lib/supabase';
import { requireAdmin } from '../../middleware/roleGuard.middleware';
import { logAudit, ymd, paramStr } from '../../utils/audit';

const router = Router();

const stageEnum = z.enum([
  'prospect',
  'active',
  'at_risk',
  'no_signs_of_life',
  'closed_won',
  'closed_lost',
]);

const createSchema = z.object({
  organisation_name: z.string().min(1),
  contact_name: z.string().nullable().optional(),
  contact_email: z.string().email().nullable().optional(),
  program_scope: z.string().optional(),
  value_rwf: z.number().int().min(0).optional(),
  stage: stageEnum.optional(),
  last_interaction_date: z.string().nullable().optional(),
  next_followup_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

const updateSchema = createSchema.partial();

router.get('/partnerships', requireAdmin, async (req: Request, res: Response) => {
  const stage = typeof req.query.stage === 'string' ? req.query.stage : null;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400 * 1000);
  const cutoffStr = ymd(thirtyDaysAgo);

  const { data: staleCandidates } = await supabaseAdmin
    .from('partnerships')
    .select('id, stage, last_interaction_date')
    .eq('org_id', req.user.org_id)
    .neq('stage', 'no_signs_of_life')
    .neq('stage', 'closed_lost')
    .neq('stage', 'closed_won')
    .lt('last_interaction_date', cutoffStr);

  if (staleCandidates && staleCandidates.length > 0) {
    const ids = staleCandidates.map((p) => p.id);
    await supabaseAdmin
      .from('partnerships')
      .update({ stage: 'no_signs_of_life' })
      .in('id', ids);
  }

  let q = supabaseAdmin
    .from('partnerships')
    .select('*')
    .eq('org_id', req.user.org_id)
    .order('updated_at', { ascending: false });
  if (stage) q = q.eq('stage', stage as z.infer<typeof stageEnum>);

  const { data, error } = await q;
  if (error) throw error;
  res.json({ data });
});

router.post('/partnerships', requireAdmin, async (req: Request, res: Response) => {
  const body = createSchema.parse(req.body);
  const { data, error } = await supabaseAdmin
    .from('partnerships')
    .insert({
      org_id: req.user.org_id,
      organisation_name: body.organisation_name,
      contact_name: body.contact_name ?? null,
      contact_email: body.contact_email ?? null,
      program_scope: body.program_scope,
      value_rwf: body.value_rwf,
      stage: body.stage,
      last_interaction_date: body.last_interaction_date ?? null,
      next_followup_date: body.next_followup_date ?? null,
      notes: body.notes ?? null,
      created_by: req.user.id,
    })
    .select('*')
    .single();
  if (error) throw error;

  await logAudit({
    orgId: req.user.org_id,
    actorId: req.user.id,
    action: 'partnership.create',
    entityType: 'partnerships',
    entityId: data.id,
    after: data,
  });

  res.status(201).json({ data });
});

router.patch('/partnerships/:id', requireAdmin, async (req: Request, res: Response) => {
  const body = updateSchema.parse(req.body);
  const id = paramStr(req.params.id);

  const { data: before, error: beforeErr } = await supabaseAdmin
    .from('partnerships')
    .select('*')
    .eq('id', id)
    .eq('org_id', req.user.org_id)
    .maybeSingle();
  if (beforeErr) throw beforeErr;
  if (!before) {
    res.status(404).json({ error: 'Partnership not found', code: 404 });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('partnerships')
    .update(body)
    .eq('id', id)
    .eq('org_id', req.user.org_id)
    .select('*')
    .single();
  if (error) throw error;

  await logAudit({
    orgId: req.user.org_id,
    actorId: req.user.id,
    action: 'partnership.update',
    entityType: 'partnerships',
    entityId: id,
    before,
    after: data,
  });

  res.json({ data });
});

router.delete('/partnerships/:id', requireAdmin, async (req: Request, res: Response) => {
  const id = paramStr(req.params.id);

  const { data: before } = await supabaseAdmin
    .from('partnerships')
    .select('*')
    .eq('id', id)
    .eq('org_id', req.user.org_id)
    .maybeSingle();
  if (!before) {
    res.status(404).json({ error: 'Partnership not found', code: 404 });
    return;
  }

  const { error } = await supabaseAdmin
    .from('partnerships')
    .update({ stage: 'closed_lost' })
    .eq('id', id)
    .eq('org_id', req.user.org_id);
  if (error) throw error;

  await logAudit({
    orgId: req.user.org_id,
    actorId: req.user.id,
    action: 'partnership.delete',
    entityType: 'partnerships',
    entityId: id,
    before,
  });

  res.json({ success: true });
});

export default router;
