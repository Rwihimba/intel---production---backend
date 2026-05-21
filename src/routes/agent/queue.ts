import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../../lib/supabase';
import { requireAgentOrAmbassador } from '../../middleware/roleGuard.middleware';
import { kigaliNow } from '../../utils/dateHelpers';
import { ymd } from '../../utils/audit';

const router = Router();

interface QueueItem {
  deal_id: string;
  rank: number;
}

router.get('/queues/today', requireAgentOrAmbassador, async (req: Request, res: Response) => {
  const todayStr = ymd(kigaliNow());

  const { data: queue, error: queueErr } = await supabaseAdmin
    .from('daily_queues')
    .select('id, items, generated_at, locked')
    .eq('owner_id', req.user.id)
    .eq('date', todayStr)
    .maybeSingle();
  if (queueErr) throw queueErr;

  if (!queue || !queue.items) {
    res.json({
      data: [],
      message: 'Your queue will be ready at 07:00 EAT',
    });
    return;
  }

  const items = Array.isArray(queue.items) ? (queue.items as unknown as QueueItem[]) : [];
  if (items.length === 0) {
    res.json({ data: [], message: 'Your queue will be ready at 07:00 EAT' });
    return;
  }

  const dealIds = items.map((i) => i.deal_id);

  const { data: deals, error: dealsErr } = await supabaseAdmin
    .from('deals')
    .select(
      `
      id, deal_type, status, priority_score, assigned_date, follow_up_date,
      learner_id, program_id, course_id, agent_id,
      learners(id, first_name, last_name, email, phone_number),
      programs(code, name),
      courses(name, sequence_number),
      deal_deliverables(deliverable_id, is_confirmed)
    `
    )
    .in('id', dealIds);
  if (dealsErr) throw dealsErr;

  const courseIds = Array.from(
    new Set((deals ?? []).map((d) => d.course_id).filter((id): id is string => !!id))
  );
  let deliverablesByCourse = new Map<string, Array<{ id: string; name: string; sequence_number: number }>>();
  if (courseIds.length > 0) {
    const { data: deliverables } = await supabaseAdmin
      .from('deliverables')
      .select('id, course_id, name, sequence_number')
      .in('course_id', courseIds)
      .eq('is_active', true)
      .order('sequence_number', { ascending: true });
    for (const d of deliverables ?? []) {
      const list = deliverablesByCourse.get(d.course_id) ?? [];
      list.push({ id: d.id, name: d.name, sequence_number: d.sequence_number });
      deliverablesByCourse.set(d.course_id, list);
    }
  }

  const dealTypes = Array.from(new Set((deals ?? []).map((d) => d.deal_type)));
  const programIds = Array.from(
    new Set((deals ?? []).map((d) => d.program_id).filter((id): id is string => !!id))
  );
  const templateCourseIds = courseIds;

  let templates: Array<{
    id: string;
    deal_type: string;
    program_id: string | null;
    course_id: string | null;
    body_text: string;
  }> = [];
  if (dealTypes.length > 0) {
    const { data: tpls } = await supabaseAdmin
      .from('nudge_templates')
      .select('id, deal_type, program_id, course_id, body_text')
      .eq('org_id', req.user.org_id)
      .eq('is_active', true)
      .in('deal_type', dealTypes);
    templates = tpls ?? [];
  }
  void programIds;
  void templateCourseIds;

  const findTemplate = (
    dealType: string,
    programId: string | null,
    courseId: string | null
  ): string | null => {
    const candidates = templates.filter((t) => t.deal_type === dealType);
    const exact = candidates.find((t) => t.course_id === courseId && t.program_id === programId);
    if (exact) return exact.body_text;
    const byCourse = candidates.find((t) => t.course_id === courseId);
    if (byCourse) return byCourse.body_text;
    const byProgram = candidates.find((t) => t.program_id === programId);
    if (byProgram) return byProgram.body_text;
    const global = candidates.find((t) => !t.course_id && !t.program_id);
    return global?.body_text ?? null;
  };

  const dealById = new Map((deals ?? []).map((d) => [d.id, d]));
  const ordered = items
    .sort((a, b) => a.rank - b.rank)
    .map((item) => {
      const d = dealById.get(item.deal_id);
      if (!d) return null;
      return {
        ...d,
        rank: item.rank,
        deliverables: d.course_id ? deliverablesByCourse.get(d.course_id) ?? [] : [],
        nudge_template: findTemplate(d.deal_type, d.program_id, d.course_id),
      };
    })
    .filter((d): d is NonNullable<typeof d> => d !== null);

  res.json({ data: ordered });
});

export default router;
