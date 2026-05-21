import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../../lib/supabase';
import { requireAgentOrAmbassador } from '../../middleware/roleGuard.middleware';
import { kigaliNow } from '../../utils/dateHelpers';
import { ymd, paramStr } from '../../utils/audit';
import { replaceNotPickedUp } from '../../jobs/dealDispatch.job';
import type { Enums, Json, TablesUpdate } from '../../types/database.types';

const router = Router();

const DEAL_TYPES = [
  'conversion',
  'followup_conversion',
  'cold_lead_enrollment',
  'activation',
  'course_graduation',
  'graduation_push',
  'retention',
] as const;

const PAYMENT_LIKE: Set<Enums<'deal_type'>> = new Set([
  'conversion',
  'followup_conversion',
  'cold_lead_enrollment',
  'retention',
]);

const dealCreateSchema = z.object({
  learner_id: z.string().uuid(),
  deal_type: z.enum(DEAL_TYPES),
  course_id: z.string().uuid().optional(),
  program_id: z.string().uuid().optional(),
  picked_up: z.boolean(),
  outcome_positive: z.boolean().optional(),
  reason_category: z.string().optional(),
  reason_detail: z.string().optional(),
  comment: z.string().max(500).optional(),
  follow_up_date: z.string().optional(),
  deliverables_confirmed: z
    .array(
      z.object({
        deliverable_id: z.string().uuid(),
        is_confirmed: z.boolean(),
      })
    )
    .optional(),
});

const dealUpdateSchema = z.object({
  new_outcome: z.enum(['successful', 'still_unsuccessful']),
  deliverables_confirmed: z
    .array(
      z.object({
        deliverable_id: z.string().uuid(),
        is_confirmed: z.boolean(),
      })
    )
    .optional(),
  comment: z.string().max(500).optional(),
  reason_category: z.string().optional(),
  reason_detail: z.string().optional(),
  follow_up_date: z.string().optional(),
});

router.post('/deals', requireAgentOrAmbassador, async (req: Request, res: Response) => {
  const body = dealCreateSchema.parse(req.body);

  const { data: learner, error: learnerErr } = await supabaseAdmin
    .from('learners')
    .select('id, org_id')
    .eq('id', body.learner_id)
    .eq('org_id', req.user.org_id)
    .is('deleted_at', null)
    .maybeSingle();
  if (learnerErr) throw learnerErr;
  if (!learner) {
    res.status(404).json({ error: 'Learner not found', code: 404 });
    return;
  }

  const todayStr = ymd(kigaliNow());
  const nowIso = new Date().toISOString();
  void nowIso;

  if (!body.picked_up) {
    const { data: inserted, error: insErr } = await supabaseAdmin
      .from('deals')
      .insert({
        learner_id: body.learner_id,
        agent_id: req.user.id,
        org_id: req.user.org_id,
        program_id: body.program_id ?? null,
        course_id: body.course_id ?? null,
        deal_type: body.deal_type,
        status: 'not_picked_up',
        picked_up: false,
        assigned_date: todayStr,
      })
      .select('*')
      .single();
    if (insErr) throw insErr;

    const replacement = await replaceNotPickedUp(inserted.id, req.user.id, req.user.org_id);
    res.status(201).json({ deal: inserted, replacement_deal: replacement.newDeal });
    return;
  }

  if (body.outcome_positive === true) {
    const approvalStatus: Enums<'approval_status'> = PAYMENT_LIKE.has(body.deal_type)
      ? 'pending_admin'
      : 'pending_data';

    const { data: inserted, error: insErr } = await supabaseAdmin
      .from('deals')
      .insert({
        learner_id: body.learner_id,
        agent_id: req.user.id,
        org_id: req.user.org_id,
        program_id: body.program_id ?? null,
        course_id: body.course_id ?? null,
        deal_type: body.deal_type,
        status: 'successful',
        picked_up: true,
        outcome_positive: true,
        approval_status: approvalStatus,
        assigned_date: todayStr,
        comment: body.comment ?? null,
        follow_up_date: body.follow_up_date ?? null,
      })
      .select('*')
      .single();
    if (insErr) throw insErr;

    const confirmed = (body.deliverables_confirmed ?? []).filter((d) => d.is_confirmed);
    if (confirmed.length > 0 && body.course_id) {
      await supabaseAdmin.from('deal_deliverables').insert(
        confirmed.map((d) => ({
          deal_id: inserted.id,
          deliverable_id: d.deliverable_id,
          is_confirmed: true,
          confirmed_at: new Date().toISOString(),
        }))
      );
      await supabaseAdmin.from('deliverable_submissions').insert(
        confirmed.map((d) => ({
          learner_id: body.learner_id,
          deliverable_id: d.deliverable_id,
          course_id: body.course_id as string,
          org_id: req.user.org_id,
          submitted_at: new Date().toISOString(),
          submitted_by_agent_id: req.user.id,
          confirmed_by_data: false,
        }))
      );
    }

    res.status(201).json({ deal: inserted });
    return;
  }

  const { data: inserted, error: insErr } = await supabaseAdmin
    .from('deals')
    .insert({
      learner_id: body.learner_id,
      agent_id: req.user.id,
      org_id: req.user.org_id,
      program_id: body.program_id ?? null,
      course_id: body.course_id ?? null,
      deal_type: body.deal_type,
      status: 'attempted',
      picked_up: true,
      outcome_positive: false,
      reason_category: body.reason_category ?? null,
      reason_detail: body.reason_detail ?? null,
      comment: body.comment ?? null,
      follow_up_date: body.follow_up_date ?? null,
      assigned_date: todayStr,
    })
    .select('*')
    .single();
  if (insErr) throw insErr;

  const partial = (body.deliverables_confirmed ?? []).filter((d) => d.is_confirmed);
  if (partial.length > 0) {
    await supabaseAdmin.from('deal_deliverables').insert(
      partial.map((d) => ({
        deal_id: inserted.id,
        deliverable_id: d.deliverable_id,
        is_confirmed: true,
        confirmed_at: new Date().toISOString(),
      }))
    );
  }

  res.status(201).json({ deal: inserted });
});

router.patch('/deals/:id', requireAgentOrAmbassador, async (req: Request, res: Response) => {
  const id = paramStr(req.params.id);
  const body = dealUpdateSchema.parse(req.body);

  const { data: before, error: beforeErr } = await supabaseAdmin
    .from('deals')
    .select('*')
    .eq('id', id)
    .eq('agent_id', req.user.id)
    .maybeSingle();
  if (beforeErr) throw beforeErr;
  if (!before) {
    res.status(404).json({ error: 'Deal not found', code: 404 });
    return;
  }

  const update: TablesUpdate<'deals'> = {
    revision_count: (before.revision_count ?? 0) + 1,
  };

  if (body.new_outcome === 'successful') {
    update.status = 'successful';
    update.outcome_positive = true;
    update.approval_status = PAYMENT_LIKE.has(before.deal_type) ? 'pending_admin' : 'pending_data';
  } else {
    update.status = 'attempted';
    update.outcome_positive = false;
    if (body.reason_category !== undefined) update.reason_category = body.reason_category;
    if (body.reason_detail !== undefined) update.reason_detail = body.reason_detail;
    if (body.comment !== undefined) update.comment = body.comment;
    if (body.follow_up_date !== undefined) update.follow_up_date = body.follow_up_date;
  }

  const { data: after, error: updErr } = await supabaseAdmin
    .from('deals')
    .update(update)
    .eq('id', id)
    .select('*')
    .single();
  if (updErr) throw updErr;

  const confirmedToAdd = (body.deliverables_confirmed ?? []).filter((d) => d.is_confirmed);
  if (confirmedToAdd.length > 0) {
    const { data: existingLinks } = await supabaseAdmin
      .from('deal_deliverables')
      .select('deliverable_id, is_confirmed')
      .eq('deal_id', id);
    const existingConfirmed = new Set(
      (existingLinks ?? []).filter((l) => l.is_confirmed).map((l) => l.deliverable_id)
    );
    const newOnes = confirmedToAdd.filter((d) => !existingConfirmed.has(d.deliverable_id));
    if (newOnes.length > 0) {
      await supabaseAdmin.from('deal_deliverables').upsert(
        newOnes.map((d) => ({
          deal_id: id,
          deliverable_id: d.deliverable_id,
          is_confirmed: true,
          confirmed_at: new Date().toISOString(),
        })),
        { onConflict: 'deal_id,deliverable_id' }
      );
    }
  }

  await supabaseAdmin.from('deal_revisions').insert({
    deal_id: id,
    edited_by: req.user.id,
    before_state: before as unknown as Json,
    after_state: after as unknown as Json,
  });

  res.json({ data: after });
});

router.get('/deals/history', requireAgentOrAmbassador, async (req: Request, res: Response) => {
  const from = typeof req.query.from === 'string' ? req.query.from : null;
  const to = typeof req.query.to === 'string' ? req.query.to : null;

  let q = supabaseAdmin
    .from('deals')
    .select(
      `
      id, deal_type, status, outcome_positive, reason_category, reason_detail, comment,
      value_rwf, assigned_date, follow_up_date, created_at,
      learner_id, learners(first_name, last_name),
      deal_deliverables(deliverable_id, is_confirmed)
    `
    )
    .eq('agent_id', req.user.id)
    .order('created_at', { ascending: false });
  if (from) q = q.gte('assigned_date', from);
  if (to) q = q.lte('assigned_date', to);

  const { data, error } = await q;
  if (error) throw error;

  const enriched = (data ?? []).map((d) => {
    const links =
      (d.deal_deliverables as unknown as Array<{ is_confirmed: boolean | null }> | null) ?? [];
    const total = links.length;
    const done = links.filter((l) => l.is_confirmed).length;
    return { ...d, deliverables_done: `${done}/${total}` };
  });

  res.json({ data: enriched });
});

export default router;
