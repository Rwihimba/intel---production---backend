import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../../lib/supabase';
import { requireAdmin, requireAgentOrAmbassador } from '../../middleware/roleGuard.middleware';
import { kigaliNow } from '../../utils/dateHelpers';
import { ymd } from '../../utils/audit';

const router = Router();

const MS_DAY = 86_400_000;

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function workingDaysBetween(from: Date, to: Date, workingDays: string[]): number {
  const labelMap: Record<number, string> = {
    0: 'Sun',
    1: 'Mon',
    2: 'Tue',
    3: 'Wed',
    4: 'Thu',
    5: 'Fri',
    6: 'Sat',
  };
  let count = 0;
  const cur = new Date(from);
  while (cur <= to) {
    if (workingDays.includes(labelMap[cur.getDay()])) count += 1;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

async function loadOrgSettings(orgId: string) {
  const { data } = await supabaseAdmin
    .from('settings')
    .select('deal_cap_soft, working_days')
    .eq('org_id', orgId)
    .maybeSingle();
  return {
    soft: data?.deal_cap_soft ?? 30,
    workingDays: data?.working_days ?? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  };
}

async function buildAgentPerformance(
  orgId: string,
  agentId: string,
  from: Date,
  to: Date
): Promise<{
  mtd_assigned: number;
  mtd_successful: number;
  mtd_attempted: number;
  success_rate: number;
  value_created_rwf: number;
  attempt_rate: number;
  weekly_attempts: number[];
  monthly_success_rate_trend: number[];
}> {
  const fromStr = ymd(from);
  const toStr = ymd(to);

  const { data: deals } = await supabaseAdmin
    .from('deals')
    .select('id, status, outcome_positive, approval_status, assigned_date, created_at')
    .eq('agent_id', agentId)
    .gte('assigned_date', fromStr)
    .lte('assigned_date', toStr);

  const dealsArr = deals ?? [];
  const assigned = dealsArr.length;
  const successful = dealsArr.filter((d) => d.approval_status === 'approved').length;
  const attempted = dealsArr.filter(
    (d) => d.status === 'attempted' || d.status === 'successful'
  ).length;

  const { data: ledger } = await supabaseAdmin
    .from('value_ledger')
    .select('value_rwf')
    .eq('agent_id', agentId)
    .eq('status', 'credited')
    .gte('credited_at', from.toISOString())
    .lte('credited_at', to.toISOString());
  const valueCreated = (ledger ?? []).reduce((s, l) => s + (l.value_rwf ?? 0), 0);

  const settings = await loadOrgSettings(orgId);
  const workingDays = workingDaysBetween(from, to, settings.workingDays);
  const attemptRate =
    workingDays > 0 ? (attempted / (settings.soft * workingDays)) * 100 : 0;

  const today = kigaliNow();
  const dow = today.getDay();
  const mondayOffset = dow === 0 ? 6 : dow - 1;
  const weekStart = new Date(today.getTime() - mondayOffset * MS_DAY);
  weekStart.setHours(0, 0, 0, 0);
  const weeklyAttempts: number[] = [];
  for (let i = 0; i < 5; i += 1) {
    const day = new Date(weekStart.getTime() + i * MS_DAY);
    const dayStr = ymd(day);
    const count = dealsArr.filter(
      (d) =>
        d.assigned_date === dayStr &&
        (d.status === 'attempted' || d.status === 'successful')
    ).length;
    weeklyAttempts.push(count);
  }

  const monthlyTrend: number[] = [];
  for (let i = 3; i >= 0; i -= 1) {
    const weekEnd = new Date(today.getTime() - i * 7 * MS_DAY);
    const weekFrom = new Date(weekEnd.getTime() - 6 * MS_DAY);
    const weekFromStr = ymd(weekFrom);
    const weekToStr = ymd(weekEnd);
    const inWeek = dealsArr.filter(
      (d) => d.assigned_date && d.assigned_date >= weekFromStr && d.assigned_date <= weekToStr
    );
    const att = inWeek.filter((d) => d.status === 'attempted' || d.status === 'successful').length;
    const succ = inWeek.filter((d) => d.approval_status === 'approved').length;
    monthlyTrend.push(att > 0 ? (succ / att) * 100 : 0);
  }

  return {
    mtd_assigned: assigned,
    mtd_successful: successful,
    mtd_attempted: attempted,
    success_rate: attempted > 0 ? (successful / attempted) * 100 : 0,
    value_created_rwf: valueCreated,
    attempt_rate: attemptRate,
    weekly_attempts: weeklyAttempts,
    monthly_success_rate_trend: monthlyTrend,
  };
}

router.get('/performance/me', requireAgentOrAmbassador, async (req: Request, res: Response) => {
  const today = kigaliNow();
  const from = startOfMonth(today);
  const data = await buildAgentPerformance(req.user.org_id, req.user.id, from, today);
  res.json({ data });
});

router.get('/performance/agents', requireAdmin, async (req: Request, res: Response) => {
  const from = typeof req.query.from === 'string' ? new Date(req.query.from) : startOfMonth(kigaliNow());
  const to = typeof req.query.to === 'string' ? new Date(req.query.to) : kigaliNow();

  const { data: agents } = await supabaseAdmin
    .from('users')
    .select('id, full_name')
    .eq('org_id', req.user.org_id)
    .eq('is_active', true)
    .eq('role', 'agent');

  const rows = await Promise.all(
    (agents ?? []).map(async (a) => {
      const perf = await buildAgentPerformance(req.user.org_id, a.id, from, to);
      const { data: lastFive } = await supabaseAdmin
        .from('deals')
        .select(
          'id, deal_type, status, approval_status, outcome_positive, assigned_date, learner_id, learners(first_name, last_name)'
        )
        .eq('agent_id', a.id)
        .order('created_at', { ascending: false })
        .limit(5);

      const trend: number[] = [];
      for (let i = 6; i >= 0; i -= 1) {
        const day = new Date(to.getTime() - i * MS_DAY);
        const dayStr = ymd(day);
        const { count: total } = await supabaseAdmin
          .from('deals')
          .select('id', { count: 'exact', head: true })
          .eq('agent_id', a.id)
          .eq('assigned_date', dayStr)
          .or('status.eq.attempted,status.eq.successful');
        const { count: success } = await supabaseAdmin
          .from('deals')
          .select('id', { count: 'exact', head: true })
          .eq('agent_id', a.id)
          .eq('assigned_date', dayStr)
          .eq('approval_status', 'approved');
        trend.push((total ?? 0) > 0 ? ((success ?? 0) / (total ?? 1)) * 100 : 0);
      }

      return {
        agent_id: a.id,
        name: a.full_name,
        deals_attempted: perf.mtd_attempted,
        deals_successful: perf.mtd_successful,
        success_rate: perf.success_rate,
        value_created_rwf: perf.value_created_rwf,
        trend,
        last_five: lastFive ?? [],
      };
    })
  );

  rows.sort((a, b) => b.success_rate - a.success_rate);
  const ranked = rows.map((r, i) => ({ rank: i + 1, ...r }));

  res.json({ data: ranked });
});

router.get('/performance/ambassadors', requireAdmin, async (req: Request, res: Response) => {
  const from = typeof req.query.from === 'string' ? new Date(req.query.from) : startOfMonth(kigaliNow());
  const to = typeof req.query.to === 'string' ? new Date(req.query.to) : kigaliNow();
  const fromStr = ymd(from);
  const toStr = ymd(to);

  const { data: ambassadors } = await supabaseAdmin
    .from('users')
    .select('id, full_name')
    .eq('org_id', req.user.org_id)
    .eq('is_active', true)
    .eq('role', 'ambassador');

  const rows = await Promise.all(
    (ambassadors ?? []).map(async (a) => {
      const perf = await buildAgentPerformance(req.user.org_id, a.id, from, to);
      const { data: events } = await supabaseAdmin
        .from('events')
        .select('id, expected_attendance, actual_attendance, status, date')
        .eq('ambassador_id', a.id)
        .gte('date', fromStr)
        .lte('date', toStr);
      const evs = events ?? [];
      const created = evs.length;
      const completedAttendance = evs
        .filter((e) => e.status === 'completed')
        .map((e) => e.actual_attendance ?? 0);
      const avg =
        completedAttendance.length > 0
          ? completedAttendance.reduce((s, v) => s + v, 0) / completedAttendance.length
          : 0;
      const totalReach = completedAttendance.reduce((s, v) => s + v, 0);

      return {
        ambassador_id: a.id,
        name: a.full_name,
        deals_attempted: perf.mtd_attempted,
        deals_successful: perf.mtd_successful,
        events_created: created,
        avg_attendance: avg,
        total_reach: totalReach,
        trend: perf.monthly_success_rate_trend,
      };
    })
  );

  rows.sort((a, b) => b.total_reach - a.total_reach);
  const ranked = rows.map((r, i) => ({ rank: i + 1, ...r }));

  res.json({ data: ranked });
});

export default router;
