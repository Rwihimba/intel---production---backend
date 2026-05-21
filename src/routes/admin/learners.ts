import { Router, Request, Response } from 'express';
import { paramStr } from '../../utils/audit';
import { supabaseAdmin } from '../../lib/supabase';
import { requireAdmin } from '../../middleware/roleGuard.middleware';

const router = Router();

const VALID_TABS = [
  'cold_leads',
  'enrolled_unpaid',
  'paid',
  'payment_at_risk',
  'active',
  'pending_graduation',
  'graduates',
] as const;
type Tab = (typeof VALID_TABS)[number];

const PAYMENT_AT_RISK = [
  'payment_grace_period',
  'payment_overdue',
  'payment_due_soon',
  'payment_due_now',
] as const;

const HEALTH_LABEL: Record<string, string> = {
  active_state: 'Active',
  slow_but_progressing: 'Not Active',
  graduated: 'Graduated',
  at_risk: 'At Risk',
  churned: 'Churned',
};

router.get('/learners', requireAdmin, async (req: Request, res: Response) => {
  const tabRaw = typeof req.query.tab === 'string' ? req.query.tab : 'paid';
  if (!VALID_TABS.includes(tabRaw as Tab)) {
    res.status(400).json({ error: `tab must be one of ${VALID_TABS.join(', ')}`, code: 400 });
    return;
  }
  const tab = tabRaw as Tab;
  const program = typeof req.query.program === 'string' ? req.query.program : 'both';
  const searchQ = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const page = Math.max(1, Number.parseInt(String(req.query.page ?? '1'), 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(String(req.query.limit ?? '8'), 10) || 8));
  const sort = typeof req.query.sort === 'string' ? req.query.sort : 'created_at';
  const order = req.query.order === 'asc' ? 'asc' : 'desc';
  const ascending = order === 'asc';

  let programId: string | null = null;
  if (program && program !== 'both') {
    const { data: prog } = await supabaseAdmin
      .from('programs')
      .select('id')
      .eq('org_id', req.user.org_id)
      .eq('code', program.toUpperCase())
      .maybeSingle();
    programId = prog?.id ?? null;
  }

  if (tab === 'cold_leads') {
    let q = supabaseAdmin
      .from('cold_leads')
      .select('*', { count: 'exact' })
      .eq('org_id', req.user.org_id);
    if (searchQ) {
      const pattern = `%${searchQ}%`;
      q = q.or(
        `email.ilike.${pattern},first_name.ilike.${pattern},last_name.ilike.${pattern},phone_number.ilike.${pattern}`
      );
    }
    q = q
      .order(sort, { ascending })
      .range((page - 1) * limit, page * limit - 1);
    const { data, count, error } = await q;
    if (error) throw error;
    return res.json({
      data,
      total: count ?? 0,
      page,
      total_pages: Math.ceil((count ?? 0) / limit),
    });
  }

  let enrollQ = supabaseAdmin
    .from('learner_program_enrollments')
    .select('learner_id, payment_status, is_activated, is_program_graduated, health_status, program_id')
    .eq('org_id', req.user.org_id);
  if (programId) enrollQ = enrollQ.eq('program_id', programId);
  if (tab === 'enrolled_unpaid') enrollQ = enrollQ.eq('payment_status', 'n/a');
  if (tab === 'paid') enrollQ = enrollQ.eq('payment_status', 'payment_compliant');
  if (tab === 'graduates') enrollQ = enrollQ.eq('is_program_graduated', true);
  if (tab === 'payment_at_risk') {
    enrollQ = enrollQ.in('payment_status', [...PAYMENT_AT_RISK]);
  }
  if (tab === 'active') {
    enrollQ = enrollQ.eq('is_program_graduated', false);
  }

  const { data: enrollments, error: enrollErr } = await enrollQ;
  if (enrollErr) throw enrollErr;
  let candidateLearnerIds = (enrollments ?? []).map((e) => e.learner_id);

  if (tab === 'active' || tab === 'pending_graduation') {
    if (candidateLearnerIds.length === 0) {
      return res.json({ data: [], total: 0, page, total_pages: 0 });
    }
    const progressQ = supabaseAdmin
      .from('learner_course_progress')
      .select('learner_id, course_id, sequence_number, course_status, time_since_activation_days, courses(name)')
      .in('learner_id', candidateLearnerIds)
      .eq('course_status', 'in_progress');
    const { data: progressRows, error: progressErr } = await progressQ;
    if (progressErr) throw progressErr;

    const { data: settings } = await supabaseAdmin
      .from('settings')
      .select('graduation_push_threshold_days')
      .eq('org_id', req.user.org_id)
      .maybeSingle();
    const threshold = settings?.graduation_push_threshold_days ?? 14;

    const filtered = (progressRows ?? []).filter((p) => {
      if (tab === 'pending_graduation') {
        return (p.time_since_activation_days ?? 0) > threshold;
      }
      return true;
    });
    candidateLearnerIds = filtered.map((p) => p.learner_id);
  }

  if (candidateLearnerIds.length === 0) {
    return res.json({ data: [], total: 0, page, total_pages: 0 });
  }

  let q = supabaseAdmin
    .from('learners')
    .select('*', { count: 'exact' })
    .eq('org_id', req.user.org_id)
    .is('deleted_at', null)
    .in('id', candidateLearnerIds);
  if (searchQ) {
    const pattern = `%${searchQ}%`;
    q = q.or(
      `email.ilike.${pattern},first_name.ilike.${pattern},last_name.ilike.${pattern},phone_number.ilike.${pattern}`
    );
  }
  q = q.order(sort, { ascending }).range((page - 1) * limit, page * limit - 1);

  const { data: learners, count, error: learnersErr } = await q;
  if (learnersErr) throw learnersErr;
  const ids = (learners ?? []).map((l) => l.id);

  const [progressResp, dealsResp] = await Promise.all([
    ids.length > 0
      ? supabaseAdmin
          .from('learner_course_progress')
          .select(
            'learner_id, course_id, sequence_number, course_status, time_since_activation_days, courses(name)'
          )
          .in('learner_id', ids)
          .eq('course_status', 'in_progress')
          .order('sequence_number', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    ids.length > 0
      ? supabaseAdmin
          .from('deals')
          .select('learner_id, assigned_date')
          .in('learner_id', ids)
          .order('assigned_date', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);

  const currentCourseByLearner = new Map<
    string,
    { name: string | null; days: number | null }
  >();
  for (const p of progressResp.data ?? []) {
    if (!currentCourseByLearner.has(p.learner_id)) {
      const courseRel = p.courses as unknown as { name: string } | null;
      currentCourseByLearner.set(p.learner_id, {
        name: courseRel?.name ?? null,
        days: p.time_since_activation_days ?? null,
      });
    }
  }

  const lastContactByLearner = new Map<string, string | null>();
  for (const d of dealsResp.data ?? []) {
    if (!lastContactByLearner.has(d.learner_id)) {
      lastContactByLearner.set(d.learner_id, d.assigned_date ?? null);
    }
  }

  const healthByLearner = new Map<string, string | null>();
  for (const e of enrollments ?? []) {
    if (!healthByLearner.has(e.learner_id)) {
      healthByLearner.set(e.learner_id, e.health_status ?? null);
    }
  }

  const enriched = (learners ?? []).map((l) => {
    const course = currentCourseByLearner.get(l.id);
    const healthKey = healthByLearner.get(l.id);
    return {
      ...l,
      status: healthKey ? HEALTH_LABEL[healthKey] ?? healthKey : null,
      current_course: course?.name ?? null,
      duration_on_course: course?.days ?? null,
      last_day_of_contact: lastContactByLearner.get(l.id) ?? null,
    };
  });

  return res.json({
    data: enriched,
    total: count ?? 0,
    page,
    total_pages: Math.ceil((count ?? 0) / limit),
  });
});

router.get('/learners/:id', requireAdmin, async (req: Request, res: Response) => {
  const id = paramStr(req.params.id);

  const { data: learner, error: learnerErr } = await supabaseAdmin
    .from('learners')
    .select('*')
    .eq('id', id)
    .eq('org_id', req.user.org_id)
    .is('deleted_at', null)
    .maybeSingle();
  if (learnerErr) throw learnerErr;
  if (!learner) {
    res.status(404).json({ error: 'Learner not found', code: 404 });
    return;
  }

  const [enrollments, progress, submissions, recentDeals] = await Promise.all([
    supabaseAdmin
      .from('learner_program_enrollments')
      .select('*, programs(code, name)')
      .eq('learner_id', id),
    supabaseAdmin
      .from('learner_course_progress')
      .select('*, courses(name, sequence_number)')
      .eq('learner_id', id)
      .order('sequence_number', { ascending: true }),
    supabaseAdmin
      .from('deliverable_submissions')
      .select('*, deliverables(name, sequence_number, course_id)')
      .eq('learner_id', id),
    supabaseAdmin
      .from('deals')
      .select(
        'id, deal_type, status, outcome_positive, reason_category, reason_detail, assigned_date, agent_id, users:agent_id(full_name)'
      )
      .eq('learner_id', id)
      .order('assigned_date', { ascending: false })
      .limit(3),
  ]);

  const lastContact = recentDeals.data?.[0]?.assigned_date ?? null;

  res.json({
    data: {
      ...learner,
      enrollments: enrollments.data ?? [],
      course_progress: progress.data ?? [],
      deliverable_submissions: submissions.data ?? [],
      recent_deals: recentDeals.data ?? [],
      last_contact_date: lastContact,
    },
  });
});

export default router;
