import cron from 'node-cron';
import { supabaseAdmin } from '../lib/supabase';
import { getResend, RESEND_FROM } from '../lib/resend';
import { kigaliNow, daysBetween, isNullDate, toNullableDate } from '../utils/dateHelpers';
import { scoreLearner, LearnerForScoring } from '../utils/priorityScore';
import type { Enums } from '../types/database.types';

type DealType = Enums<'deal_type'>;
type UserRole = Enums<'user_role'>;

const PAYMENT_DUE_STATUSES = new Set([
  'payment_grace_period',
  'payment_overdue',
  'payment_due_now',
  'payment_due_soon',
]);

const DEFAULT_DEAL_CAP_SOFT = 30;
const DEFAULT_DEAL_CAP_HARD = 35;
const DEFAULT_PROGRAM_SCOPE = 'Both';
const DEFAULT_DEAL_TYPE_MIX = {
  conversion: 40,
  activation: 25,
  graduation_push: 20,
  retention: 15,
};

export interface DispatchResult {
  agents_assigned: number;
  total_deals: number;
  by_agent: { agent_id: string; deal_count: number }[];
}

interface DistributionConfig {
  program_scope: string;
  deal_type_mix: typeof DEFAULT_DEAL_TYPE_MIX;
  deal_cap_soft: number;
  deal_cap_hard: number;
}

interface ScoredLearner {
  learner: LearnerForScoring;
  score: number;
  dealType: DealType;
}

function ymd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function deriveDealType(learner: LearnerForScoring, today: Date, todayStr: string): DealType {
  if (learner.follow_up_date && !isNullDate(learner.follow_up_date)) {
    if (learner.follow_up_date <= todayStr) return 'followup_conversion';
  }
  if (PAYMENT_DUE_STATUSES.has(learner.payment_status)) return 'retention';
  const enrollmentDate = toNullableDate(learner.enrollment_date);
  if (
    learner.payment_status === 'n/a' &&
    enrollmentDate &&
    daysBetween(today, enrollmentDate) > 14
  ) {
    return 'conversion';
  }
  if (
    learner.payment_status === 'payment_compliant' &&
    !learner.is_activated &&
    enrollmentDate &&
    daysBetween(today, enrollmentDate) > 7
  ) {
    return 'activation';
  }
  if (
    learner.health_status === 'slow_but_progressing' &&
    learner.time_since_activation_days !== null &&
    learner.time_since_activation_days > 21
  ) {
    return 'course_graduation';
  }
  if (
    learner.courses_completed > 2 &&
    learner.current_course_days !== null &&
    learner.current_course_days > 14
  ) {
    return 'graduation_push';
  }
  return 'conversion';
}

async function loadConfig(orgId: string, dateStr: string): Promise<DistributionConfig> {
  const [configResp, settingsResp] = await Promise.all([
    supabaseAdmin
      .from('distribution_configs')
      .select('program_scope, deal_type_mix')
      .eq('org_id', orgId)
      .eq('date', dateStr)
      .maybeSingle(),
    supabaseAdmin
      .from('settings')
      .select('deal_cap_soft, deal_cap_hard')
      .eq('org_id', orgId)
      .maybeSingle(),
  ]);

  const programScope = configResp.data?.program_scope ?? DEFAULT_PROGRAM_SCOPE;
  const dealTypeMix =
    (configResp.data?.deal_type_mix as typeof DEFAULT_DEAL_TYPE_MIX | null) ??
    DEFAULT_DEAL_TYPE_MIX;

  return {
    program_scope: programScope,
    deal_type_mix: dealTypeMix,
    deal_cap_soft: settingsResp.data?.deal_cap_soft ?? DEFAULT_DEAL_CAP_SOFT,
    deal_cap_hard: settingsResp.data?.deal_cap_hard ?? DEFAULT_DEAL_CAP_HARD,
  };
}

async function loadActiveAgents(orgId: string) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, email, full_name, role')
    .eq('org_id', orgId)
    .eq('is_active', true)
    .in('role', ['agent', 'ambassador']);
  if (error) throw error;
  return data ?? [];
}

async function buildScoredPool(orgId: string, today: Date): Promise<ScoredLearner[]> {
  const todayStr = ymd(today);

  const { data: learners, error: learnersErr } = await supabaseAdmin
    .from('learners')
    .select('id, phone_number')
    .eq('org_id', orgId)
    .is('deleted_at', null)
    .not('phone_number', 'is', null);
  if (learnersErr) throw learnersErr;
  if (!learners || learners.length === 0) return [];

  const learnerIds = learners.map((l) => l.id);

  const [enrollResp, progressResp, dealsResp] = await Promise.all([
    supabaseAdmin
      .from('learner_program_enrollments')
      .select('learner_id, payment_status, is_activated, enrollment_date, health_status')
      .in('learner_id', learnerIds),
    supabaseAdmin
      .from('learner_course_progress')
      .select('learner_id, time_since_activation_days, is_graduated, course_status')
      .in('learner_id', learnerIds),
    supabaseAdmin
      .from('deals')
      .select('learner_id, assigned_date, follow_up_date')
      .in('learner_id', learnerIds)
      .order('assigned_date', { ascending: false }),
  ]);

  if (enrollResp.error) throw enrollResp.error;
  if (progressResp.error) throw progressResp.error;
  if (dealsResp.error) throw dealsResp.error;

  const enrollByLearner = new Map<string, NonNullable<typeof enrollResp.data>[number]>();
  for (const e of enrollResp.data ?? []) {
    if (!enrollByLearner.has(e.learner_id)) enrollByLearner.set(e.learner_id, e);
  }

  const progressByLearner = new Map<string, NonNullable<typeof progressResp.data>[number]>();
  const completedByLearner = new Map<string, number>();
  for (const cp of progressResp.data ?? []) {
    if (!progressByLearner.has(cp.learner_id)) progressByLearner.set(cp.learner_id, cp);
    if (cp.is_graduated) {
      completedByLearner.set(cp.learner_id, (completedByLearner.get(cp.learner_id) ?? 0) + 1);
    }
  }

  const lastContactByLearner = new Map<string, string | null>();
  const followUpByLearner = new Map<string, string | null>();
  for (const d of dealsResp.data ?? []) {
    if (!lastContactByLearner.has(d.learner_id)) {
      lastContactByLearner.set(d.learner_id, d.assigned_date);
      followUpByLearner.set(d.learner_id, d.follow_up_date);
    }
  }

  const scored: ScoredLearner[] = [];
  for (const l of learners) {
    const enrollment = enrollByLearner.get(l.id);
    if (!enrollment) continue;
    const progress = progressByLearner.get(l.id);

    const candidate: LearnerForScoring = {
      id: l.id,
      phone_number: l.phone_number,
      payment_status: enrollment.payment_status ?? '',
      is_activated: enrollment.is_activated ?? false,
      enrollment_date: enrollment.enrollment_date ?? null,
      health_status: enrollment.health_status ?? '',
      follow_up_date: followUpByLearner.get(l.id) ?? null,
      last_contact_at: lastContactByLearner.get(l.id) ?? null,
      time_since_activation_days: progress?.time_since_activation_days ?? null,
      courses_completed: completedByLearner.get(l.id) ?? 0,
      current_course_days: null,
    };

    const score = scoreLearner(candidate, today);
    if (score === null) continue;

    scored.push({
      learner: candidate,
      score,
      dealType: deriveDealType(candidate, today, todayStr),
    });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored;
}

export async function runDailyDispatch(
  date: Date,
  orgId: string
): Promise<DispatchResult> {
  const dateStr = ymd(date);
  const config = await loadConfig(orgId, dateStr);
  const agents = await loadActiveAgents(orgId);

  if (agents.length === 0) {
    return { agents_assigned: 0, total_deals: 0, by_agent: [] };
  }

  const pool = await buildScoredPool(orgId, date);
  const assignedSet = new Set<string>();
  const byAgent: { agent_id: string; deal_count: number }[] = [];
  let totalDeals = 0;

  for (const agent of agents) {
    const picks: ScoredLearner[] = [];

    for (const item of pool) {
      if (picks.length >= config.deal_cap_soft) break;
      if (assignedSet.has(item.learner.id)) continue;
      picks.push(item);
      assignedSet.add(item.learner.id);
    }

    for (const item of pool) {
      if (picks.length >= config.deal_cap_hard) break;
      if (assignedSet.has(item.learner.id)) continue;
      if (item.score < 400) continue;
      picks.push(item);
      assignedSet.add(item.learner.id);
    }

    byAgent.push({ agent_id: agent.id, deal_count: picks.length });

    if (picks.length === 0) continue;

    const rows = picks.map((p) => ({
      org_id: orgId,
      learner_id: p.learner.id,
      agent_id: agent.id,
      assigned_date: dateStr,
      status: 'pending' as const,
      deal_type: p.dealType,
      priority_score: p.score,
    }));

    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from('deals')
      .insert(rows)
      .select('id');
    if (insertErr) throw insertErr;

    const queueItems = (inserted ?? []).map((d, idx) => ({ deal_id: d.id, rank: idx + 1 }));
    const { error: queueErr } = await supabaseAdmin.from('daily_queues').insert({
      org_id: orgId,
      owner_id: agent.id,
      owner_role: agent.role as UserRole,
      date: dateStr,
      items: queueItems,
    });
    if (queueErr) throw queueErr;

    totalDeals += picks.length;
  }

  return { agents_assigned: agents.length, total_deals: totalDeals, by_agent: byAgent };
}

export async function replaceNotPickedUp(
  dealId: string,
  agentId: string,
  orgId: string
): Promise<{ newDeal: Record<string, unknown> | null }> {
  const today = kigaliNow();
  const todayStr = ymd(today);

  const { error: markErr } = await supabaseAdmin
    .from('deals')
    .update({ status: 'not_picked_up' })
    .eq('id', dealId);
  if (markErr) throw markErr;

  const { data: existing, error: existingErr } = await supabaseAdmin
    .from('deals')
    .select('learner_id')
    .eq('agent_id', agentId)
    .eq('assigned_date', todayStr);
  if (existingErr) throw existingErr;
  const excluded = new Set((existing ?? []).map((d) => d.learner_id));

  const pool = await buildScoredPool(orgId, today);
  const next = pool.find((item) => !excluded.has(item.learner.id));
  if (!next) return { newDeal: null };

  const { data: agentRow } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', agentId)
    .maybeSingle();
  const ownerRole = (agentRow?.role ?? 'agent') as UserRole;

  const { data: insertedDeals, error: insertErr } = await supabaseAdmin
    .from('deals')
    .insert({
      org_id: orgId,
      learner_id: next.learner.id,
      agent_id: agentId,
      assigned_date: todayStr,
      status: 'pending',
      deal_type: next.dealType,
      priority_score: next.score,
    })
    .select('id, learner_id, agent_id, assigned_date, status, deal_type, priority_score');
  if (insertErr) throw insertErr;

  const newDeal = insertedDeals?.[0] ?? null;

  const { data: queueRow } = await supabaseAdmin
    .from('daily_queues')
    .select('id, items')
    .eq('owner_id', agentId)
    .eq('date', todayStr)
    .maybeSingle();

  if (newDeal) {
    const currentItems = Array.isArray(queueRow?.items)
      ? (queueRow.items as Array<{ deal_id: string; rank: number }>)
      : [];
    if (queueRow) {
      const nextItems = [
        ...currentItems,
        { deal_id: newDeal.id, rank: currentItems.length + 1 },
      ];
      await supabaseAdmin
        .from('daily_queues')
        .update({ items: nextItems })
        .eq('id', queueRow.id);
    } else {
      await supabaseAdmin.from('daily_queues').insert({
        org_id: orgId,
        owner_id: agentId,
        owner_role: ownerRole,
        date: todayStr,
        items: [{ deal_id: newDeal.id, rank: 1 }],
      });
    }
  }

  const { data: learner } = await supabaseAdmin
    .from('learners')
    .select('id, first_name, last_name, phone_number')
    .eq('id', next.learner.id)
    .maybeSingle();

  return { newDeal: newDeal ? { ...newDeal, learner } : null };
}

async function sendDispatchFailureAlert(
  org: { id: string; name: string | null },
  err: unknown
): Promise<void> {
  const message = err instanceof Error ? err.message : String(err);
  const timestamp = new Date().toISOString();

  try {
    const { data: admins } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('org_id', org.id)
      .eq('is_active', true)
      .eq('role', 'admin');

    const recipients = (admins ?? []).map((a) => a.email).filter(Boolean) as string[];
    if (recipients.length === 0) return;

    const dateStr = ymd(kigaliNow());
    await getResend().emails.send({
      from: RESEND_FROM,
      to: recipients,
      subject: `INTEL — Deal dispatch failed [${dateStr}]`,
      text: [
        `Organisation: ${org.name ?? org.id}`,
        `Error: ${message}`,
        `Timestamp: ${timestamp}`,
      ].join('\n'),
    });
  } catch (alertErr) {
    console.error(
      `[${timestamp}] [deal-dispatch] failed to send failure alert for org=${org.id}:`,
      alertErr
    );
  }
}

export function startDealDispatchJob(): void {
  cron.schedule(
    '0 7 * * 1-5',
    async () => {
      const startedAt = new Date().toISOString();
      console.log(`[${startedAt}] [deal-dispatch] running`);
      const today = kigaliNow();

      const { data: orgs, error } = await supabaseAdmin
        .from('organisations')
        .select('id, name');

      if (error) {
        console.error(`[${new Date().toISOString()}] [deal-dispatch] org query failed:`, error);
        return;
      }

      for (const org of orgs ?? []) {
        try {
          const result = await runDailyDispatch(today, org.id);
          console.log(
            `[${new Date().toISOString()}] [deal-dispatch] org=${org.id} agents=${result.agents_assigned} deals=${result.total_deals}`
          );
        } catch (err) {
          console.error(`[${new Date().toISOString()}] [deal-dispatch] org=${org.id} failed:`, err);
          await sendDispatchFailureAlert(org, err);
        }
      }
    },
    { timezone: 'Africa/Kigali' }
  );
}
