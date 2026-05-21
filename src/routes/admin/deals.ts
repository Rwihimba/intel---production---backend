import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../../lib/supabase';
import { requireAdmin } from '../../middleware/roleGuard.middleware';
import { logAudit, nextWorkingDay, ymd, paramStr } from '../../utils/audit';
import type { Enums } from '../../types/database.types';

const router = Router();

type DealType = Enums<'deal_type'>;

const VALUE_BY_TYPE: Record<DealType, { value_rwf: number; label: string }> = {
  conversion: { value_rwf: 500, label: 'Enrolled to Paid' },
  followup_conversion: { value_rwf: 500, label: 'Enrolled to Paid' },
  cold_lead_enrollment: { value_rwf: 500, label: 'Enrolled to Paid' },
  retention: { value_rwf: 500, label: 'Retention Success' },
  course_graduation: { value_rwf: 500, label: 'Course Graduation' },
  graduation_push: { value_rwf: 1500, label: 'Program Graduation' },
  activation: { value_rwf: 0, label: 'Activation' },
};

const TAB_TO_TYPES: Record<string, DealType[]> = {
  all: [],
  payments: ['conversion', 'followup_conversion', 'cold_lead_enrollment', 'retention'],
  activations: ['activation'],
  graduations: ['course_graduation', 'graduation_push'],
};

const rejectSchema = z.object({
  rejection_reason: z.string().min(1).max(1000),
});

router.get('/approvals', requireAdmin, async (req: Request, res: Response) => {
  const tab = typeof req.query.tab === 'string' ? req.query.tab : 'all';
  const program = typeof req.query.program === 'string' ? req.query.program : null;

  let q = supabaseAdmin
    .from('deals')
    .select(
      `
      id, deal_type, status, approval_status, priority_score, value_rwf,
      assigned_date, created_at, reason_category, reason_detail, comment,
      learner_id, agent_id, program_id, course_id,
      learners(first_name, last_name, email, phone_number),
      users:agent_id(full_name),
      programs(code, name),
      deal_deliverables(deliverable_id, is_confirmed, deliverables(name))
    `
    )
    .eq('org_id', req.user.org_id)
    .eq('approval_status', 'pending_admin')
    .order('created_at', { ascending: false });

  const types = TAB_TO_TYPES[tab] ?? [];
  if (types.length > 0) q = q.in('deal_type', types);

  if (program && program !== 'both') {
    const { data: prog } = await supabaseAdmin
      .from('programs')
      .select('id')
      .eq('org_id', req.user.org_id)
      .eq('code', program.toUpperCase())
      .maybeSingle();
    if (prog) q = q.eq('program_id', prog.id);
  }

  const { data, error } = await q;
  if (error) throw error;
  res.json({ data });
});

router.post('/deals/:id/approve', requireAdmin, async (req: Request, res: Response) => {
  const id = paramStr(req.params.id);

  const { data: deal, error: dealErr } = await supabaseAdmin
    .from('deals')
    .select('*')
    .eq('id', id)
    .eq('org_id', req.user.org_id)
    .maybeSingle();
  if (dealErr) throw dealErr;
  if (!deal) {
    res.status(404).json({ error: 'Deal not found', code: 404 });
    return;
  }

  const nowIso = new Date().toISOString();

  const { data: updated, error: updErr } = await supabaseAdmin
    .from('deals')
    .update({
      approval_status: 'approved',
      approved_by: req.user.id,
      approved_at: nowIso,
    })
    .eq('id', id)
    .select('*')
    .single();
  if (updErr) throw updErr;

  const config = VALUE_BY_TYPE[deal.deal_type];
  let valueCredited = 0;
  if (config && config.value_rwf > 0) {
    const { error: ledgerErr } = await supabaseAdmin.from('value_ledger').insert({
      org_id: req.user.org_id,
      agent_id: deal.agent_id,
      deal_id: deal.id,
      event_label: config.label,
      value_rwf: config.value_rwf,
      status: 'credited',
      credited_at: nowIso,
    });
    if (ledgerErr) throw ledgerErr;
    valueCredited = config.value_rwf;
  }

  await logAudit({
    orgId: req.user.org_id,
    actorId: req.user.id,
    action: 'deal.approve',
    entityType: 'deals',
    entityId: id,
    before: deal,
    after: updated,
  });

  res.json({ success: true, value_credited: valueCredited });
});

router.post('/deals/:id/reject', requireAdmin, async (req: Request, res: Response) => {
  const id = paramStr(req.params.id);
  const body = rejectSchema.parse(req.body);

  const { data: deal, error: dealErr } = await supabaseAdmin
    .from('deals')
    .select('*')
    .eq('id', id)
    .eq('org_id', req.user.org_id)
    .maybeSingle();
  if (dealErr) throw dealErr;
  if (!deal) {
    res.status(404).json({ error: 'Deal not found', code: 404 });
    return;
  }

  const { data: updated, error: updErr } = await supabaseAdmin
    .from('deals')
    .update({
      approval_status: 'rejected',
      rejected_reason: body.rejection_reason,
    })
    .eq('id', id)
    .select('*')
    .single();
  if (updErr) throw updErr;

  const followUp = nextWorkingDay(new Date());
  const followUpStr = ymd(followUp);
  const { error: followErr } = await supabaseAdmin.from('deals').insert({
    learner_id: deal.learner_id,
    agent_id: deal.agent_id,
    org_id: req.user.org_id,
    program_id: deal.program_id,
    course_id: deal.course_id,
    deal_type: deal.deal_type,
    priority_score: 500,
    assigned_date: followUpStr,
    status: 'pending',
    follow_up_date: followUpStr,
  });
  if (followErr) throw followErr;

  await logAudit({
    orgId: req.user.org_id,
    actorId: req.user.id,
    action: 'deal.reject',
    entityType: 'deals',
    entityId: id,
    before: deal,
    after: updated,
  });

  res.json({ success: true });
});

router.get('/deals', requireAdmin, async (req: Request, res: Response) => {
  const type = typeof req.query.type === 'string' ? req.query.type : null;
  const outcome = typeof req.query.outcome === 'string' ? req.query.outcome : null;
  const agentId = typeof req.query.agent_id === 'string' ? req.query.agent_id : null;
  const from = typeof req.query.from === 'string' ? req.query.from : null;
  const to = typeof req.query.to === 'string' ? req.query.to : null;
  const program = typeof req.query.program === 'string' ? req.query.program : null;

  let q = supabaseAdmin
    .from('deals')
    .select(
      `
      id, deal_type, status, approval_status, outcome_positive,
      reason_category, reason_detail, comment,
      priority_score, value_rwf, assigned_date, created_at,
      learner_id, agent_id, program_id,
      learners(first_name, last_name, email),
      users:agent_id(full_name),
      deal_deliverables(deliverable_id, is_confirmed)
    `
    )
    .eq('org_id', req.user.org_id)
    .order('created_at', { ascending: false });

  if (type) q = q.eq('deal_type', type as DealType);
  if (outcome === 'positive') q = q.eq('outcome_positive', true);
  if (outcome === 'negative') q = q.eq('outcome_positive', false);
  if (agentId) q = q.eq('agent_id', agentId);
  if (from) q = q.gte('assigned_date', from);
  if (to) q = q.lte('assigned_date', to);
  if (program && program !== 'both') {
    const { data: prog } = await supabaseAdmin
      .from('programs')
      .select('id')
      .eq('org_id', req.user.org_id)
      .eq('code', program.toUpperCase())
      .maybeSingle();
    if (prog) q = q.eq('program_id', prog.id);
  }

  const { data, error } = await q;
  if (error) throw error;
  res.json({ data });
});

export default router;
