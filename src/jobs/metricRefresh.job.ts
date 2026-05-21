import cron from 'node-cron';
import { supabaseAdmin } from '../lib/supabase';
import { kigaliNow } from '../utils/dateHelpers';
import type { Enums } from '../types/database.types';

type MetricMap = Record<string, number>;

const CLOSED_PARTNERSHIP_STAGES = ['closed_lost', 'no_signs_of_life'];
const DEFAULT_ALERT_THRESHOLD_PCT = 10;

function ymd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function severityFor(gapPct: number): Enums<'alert_severity'> {
  if (gapPct >= 25) return 'critical';
  if (gapPct >= 15) return 'warning';
  return 'watch';
}

async function enrolledLearnerIds(orgId: string, programId: string | null): Promise<string[]> {
  let q = supabaseAdmin
    .from('learner_program_enrollments')
    .select('learner_id')
    .eq('org_id', orgId);
  if (programId) q = q.eq('program_id', programId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((r) => r.learner_id);
}

async function computeMetrics(orgId: string, programId: string | null): Promise<MetricMap> {
  let totalEnrolledQ = supabaseAdmin
    .from('learner_program_enrollments')
    .select('learner_id', { count: 'exact', head: true })
    .eq('org_id', orgId);
  if (programId) totalEnrolledQ = totalEnrolledQ.eq('program_id', programId);
  const { count: totalEnrolledCount, error: totalEnrolledErr } = await totalEnrolledQ;
  if (totalEnrolledErr) throw totalEnrolledErr;
  const totalEnrolled = totalEnrolledCount ?? 0;

  let totalPaidQ = supabaseAdmin
    .from('learner_program_enrollments')
    .select('learner_id', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('payment_status', 'payment_compliant');
  if (programId) totalPaidQ = totalPaidQ.eq('program_id', programId);
  const { count: totalPaidCount, error: totalPaidErr } = await totalPaidQ;
  if (totalPaidErr) throw totalPaidErr;
  const totalPaid = totalPaidCount ?? 0;

  let totalActivatedQ = supabaseAdmin
    .from('learner_program_enrollments')
    .select('learner_id', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('is_activated', true);
  if (programId) totalActivatedQ = totalActivatedQ.eq('program_id', programId);
  const { count: totalActivatedCount, error: totalActivatedErr } = await totalActivatedQ;
  if (totalActivatedErr) throw totalActivatedErr;
  const totalActivated = totalActivatedCount ?? 0;

  let programGraduatedQ = supabaseAdmin
    .from('learner_program_enrollments')
    .select('learner_id', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('is_program_graduated', true);
  if (programId) programGraduatedQ = programGraduatedQ.eq('program_id', programId);
  const { count: programGraduatedCount, error: programGraduatedErr } = await programGraduatedQ;
  if (programGraduatedErr) throw programGraduatedErr;
  const programGraduated = programGraduatedCount ?? 0;

  const learnerIds = await enrolledLearnerIds(orgId, programId);

  let totalProgress = 0;
  let graduatedProgress = 0;
  let course1Graduated = 0;
  let reachedCourse2 = 0;

  if (learnerIds.length > 0) {
    const { count: tp, error: tpErr } = await supabaseAdmin
      .from('learner_course_progress')
      .select('id', { count: 'exact', head: true })
      .in('learner_id', learnerIds);
    if (tpErr) throw tpErr;
    totalProgress = tp ?? 0;

    const { count: gp, error: gpErr } = await supabaseAdmin
      .from('learner_course_progress')
      .select('id', { count: 'exact', head: true })
      .in('learner_id', learnerIds)
      .eq('is_graduated', true);
    if (gpErr) throw gpErr;
    graduatedProgress = gp ?? 0;

    const { count: c1g, error: c1gErr } = await supabaseAdmin
      .from('learner_course_progress')
      .select('id', { count: 'exact', head: true })
      .in('learner_id', learnerIds)
      .eq('sequence_number', 1)
      .eq('is_graduated', true);
    if (c1gErr) throw c1gErr;
    course1Graduated = c1g ?? 0;

    const { count: rc2, error: rc2Err } = await supabaseAdmin
      .from('learner_course_progress')
      .select('id', { count: 'exact', head: true })
      .in('learner_id', learnerIds)
      .gte('sequence_number', 2);
    if (rc2Err) throw rc2Err;
    reachedCourse2 = rc2 ?? 0;
  }

  const today = kigaliNow();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 86400 * 1000);
  const { count: totalCallsCount, error: callsErr } = await supabaseAdmin
    .from('deals')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .gte('assigned_date', ymd(thirtyDaysAgo));
  if (callsErr) throw callsErr;

  const { data: partnerships, error: partnershipsErr } = await supabaseAdmin
    .from('partnerships')
    .select('value_rwf, stage')
    .eq('org_id', orgId)
    .not('stage', 'in', `(${CLOSED_PARTNERSHIP_STAGES.join(',')})`);
  if (partnershipsErr) throw partnershipsErr;
  const partnershipValue = (partnerships ?? []).reduce(
    (sum, p) => sum + Number(p.value_rwf ?? 0),
    0
  );

  return {
    total_enrolled: totalEnrolled,
    total_paid: totalPaid,
    conversion_rate: totalEnrolled > 0 ? (totalPaid / totalEnrolled) * 100 : 0,
    activation_rate: totalPaid > 0 ? (totalActivated / totalPaid) * 100 : 0,
    course_completion_rate: totalProgress > 0 ? (graduatedProgress / totalProgress) * 100 : 0,
    retention_rate: course1Graduated > 0 ? (reachedCourse2 / course1Graduated) * 100 : 0,
    graduation_rate_paid: totalPaid > 0 ? (programGraduated / totalPaid) * 100 : 0,
    graduation_rate_activated:
      totalActivated > 0 ? (programGraduated / totalActivated) * 100 : 0,
    total_calls: totalCallsCount ?? 0,
    partnership_value: partnershipValue,
  };
}

async function loadAlertThreshold(orgId: string): Promise<number> {
  const { data: row } = await supabaseAdmin
    .from('settings')
    .select('alert_threshold_pct')
    .eq('org_id', orgId)
    .maybeSingle();
  return row?.alert_threshold_pct ?? DEFAULT_ALERT_THRESHOLD_PCT;
}

async function syncTargetsAndAlerts(orgId: string, metrics: MetricMap): Promise<void> {
  const now = new Date().toISOString();

  for (const [key, value] of Object.entries(metrics)) {
    const { error } = await supabaseAdmin
      .from('targets')
      .update({ current_value: value, updated_at: now })
      .eq('org_id', orgId)
      .eq('key', key);
    if (error) {
      console.error(
        `[${new Date().toISOString()}] [metric-refresh] target update failed key=${key}:`,
        error
      );
    }
  }

  const threshold = await loadAlertThreshold(orgId);

  const { data: targets, error: targetsErr } = await supabaseAdmin
    .from('targets')
    .select('key, current_value, target_value')
    .eq('org_id', orgId);
  if (targetsErr) {
    console.error(`[${new Date().toISOString()}] [metric-refresh] target read failed:`, targetsErr);
    return;
  }

  for (const t of targets ?? []) {
    const cv = Number(t.current_value ?? 0);
    const tv = Number(t.target_value ?? 0);
    if (tv === 0) continue;

    const gapPct = ((tv - cv) / tv) * 100;

    if (cv < tv && gapPct >= threshold) {
      const { data: existing } = await supabaseAdmin
        .from('alerts')
        .select('id')
        .eq('org_id', orgId)
        .eq('metric_key', t.key)
        .is('resolved_at', null)
        .maybeSingle();
      if (!existing) {
        await supabaseAdmin.from('alerts').insert({
          org_id: orgId,
          metric_key: t.key,
          current_value: cv,
          target_value: tv,
          gap_pct: gapPct,
          severity: severityFor(gapPct),
        });
      }
    } else if (cv >= tv) {
      await supabaseAdmin
        .from('alerts')
        .update({ resolved_at: now })
        .eq('org_id', orgId)
        .eq('metric_key', t.key)
        .is('resolved_at', null);
    }
  }
}

export async function computeAndStoreMetrics(
  orgId: string,
  programId: string | null
): Promise<MetricMap> {
  const metrics = await computeMetrics(orgId, programId);
  if (programId === null) {
    await syncTargetsAndAlerts(orgId, metrics);
  }
  return metrics;
}

export async function triggerMetricRefresh(
  orgId: string,
  programId: string | null
): Promise<MetricMap> {
  return computeAndStoreMetrics(orgId, programId);
}

async function refreshAllOrgs(): Promise<void> {
  const { data: orgs, error } = await supabaseAdmin
    .from('organisations')
    .select('id');
  if (error) {
    console.error(`[${new Date().toISOString()}] [metric-refresh] org query failed:`, error);
    return;
  }

  for (const org of orgs ?? []) {
    try {
      await computeAndStoreMetrics(org.id, null);

      const { data: programs } = await supabaseAdmin
        .from('programs')
        .select('id, code')
        .eq('org_id', org.id);

      const fa = programs?.find((p) => p.code === 'FA');
      const fla = programs?.find((p) => p.code === 'FLA');

      if (fa) await computeAndStoreMetrics(org.id, fa.id);
      if (fla) await computeAndStoreMetrics(org.id, fla.id);
    } catch (err) {
      console.error(
        `[${new Date().toISOString()}] [metric-refresh] org=${org.id} failed:`,
        err
      );
    }
  }
}

export function startMetricRefreshJob(): void {
  cron.schedule(
    '*/5 * * * *',
    () => {
      refreshAllOrgs().catch((err) => {
        console.error(`[${new Date().toISOString()}] [metric-refresh] unexpected:`, err);
      });
    },
    { timezone: 'Africa/Kigali' }
  );
}
