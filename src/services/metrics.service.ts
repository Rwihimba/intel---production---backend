import { supabaseAdmin } from '../lib/supabase';

export interface MetricsResult {
  funnel: {
    total_enrolled: number;
    total_paid: number;
    conversion_rate: number;
    enrollment_growth_pct: number;
    payment_growth_pct: number;
  };
  engagement: {
    activation_rate: number;
    course_completion_rate: number;
    retention_rate: number;
    graduation_rate_paid: number;
    graduation_rate_activated: number;
  };
  operations: {
    total_calls: number;
    total_events: number;
    total_attendance: number;
    avg_nps_score: number | null;
  };
  partnerships: {
    total_value_rwf: number;
    followups_due_count: number;
    at_risk_count: number;
  };
  payment_bars: Array<{ label: string; value: number }>;
  sparklines: Record<string, number[]>;
}

const MS_PER_DAY = 86_400_000;
const SPARKLINE_BUCKETS = 7;
const CLOSED_PARTNERSHIP_STAGES = ['closed_lost', 'no_signs_of_life'];

function ymd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function safeRate(num: number, denom: number): number {
  return denom > 0 ? (num / denom) * 100 : 0;
}

function avg(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function bucketDates(fromDate: Date, toDate: Date, buckets: number): Array<{ from: Date; to: Date; label: string }> {
  const totalMs = Math.max(MS_PER_DAY, toDate.getTime() - fromDate.getTime());
  const bucketMs = totalMs / buckets;
  const out: Array<{ from: Date; to: Date; label: string }> = [];
  for (let i = 0; i < buckets; i += 1) {
    const from = new Date(fromDate.getTime() + i * bucketMs);
    const to = i === buckets - 1
      ? new Date(toDate.getTime() + 1)
      : new Date(fromDate.getTime() + (i + 1) * bucketMs);
    out.push({ from, to, label: ymd(from) });
  }
  return out;
}

function bucketByDate(dates: Array<string | null>, buckets: ReturnType<typeof bucketDates>): number[] {
  const counts = new Array<number>(buckets.length).fill(0);
  for (const d of dates) {
    if (!d) continue;
    const t = new Date(d).getTime();
    if (Number.isNaN(t)) continue;
    for (let i = 0; i < buckets.length; i += 1) {
      if (t >= buckets[i].from.getTime() && t < buckets[i].to.getTime()) {
        counts[i] += 1;
        break;
      }
    }
  }
  return counts;
}

async function countEnrollments(
  orgId: string,
  programId: string | null,
  opts: {
    paymentCompliant?: boolean;
    activated?: boolean;
    programGraduated?: boolean;
    fromDate?: Date;
    toDate?: Date;
  }
): Promise<number> {
  let q = supabaseAdmin
    .from('learner_program_enrollments')
    .select('learner_id', { count: 'exact', head: true })
    .eq('org_id', orgId);
  if (programId) q = q.eq('program_id', programId);
  if (opts.paymentCompliant) q = q.eq('payment_status', 'payment_compliant');
  if (opts.activated) q = q.eq('is_activated', true);
  if (opts.programGraduated) q = q.eq('is_program_graduated', true);
  if (opts.fromDate) q = q.gte('enrollment_date', ymd(opts.fromDate));
  if (opts.toDate) q = q.lte('enrollment_date', ymd(opts.toDate));
  const { count, error } = await q;
  if (error) throw error;
  return count ?? 0;
}

async function listEnrollmentDates(
  orgId: string,
  programId: string | null,
  opts: { paymentCompliant?: boolean; fromDate: Date; toDate: Date }
): Promise<Array<string | null>> {
  let q = supabaseAdmin
    .from('learner_program_enrollments')
    .select('enrollment_date')
    .eq('org_id', orgId)
    .gte('enrollment_date', ymd(opts.fromDate))
    .lte('enrollment_date', ymd(opts.toDate));
  if (programId) q = q.eq('program_id', programId);
  if (opts.paymentCompliant) q = q.eq('payment_status', 'payment_compliant');
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((r) => r.enrollment_date as string | null);
}

async function listDealDates(
  orgId: string,
  fromDate: Date,
  toDate: Date
): Promise<Array<string | null>> {
  const { data, error } = await supabaseAdmin
    .from('deals')
    .select('assigned_date')
    .eq('org_id', orgId)
    .gte('assigned_date', ymd(fromDate))
    .lte('assigned_date', ymd(toDate));
  if (error) throw error;
  return (data ?? []).map((d) => d.assigned_date as string | null);
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

async function engagementMetrics(
  orgId: string,
  programId: string | null,
  totalPaid: number,
  totalActivated: number,
  programGraduated: number
): Promise<MetricsResult['engagement']> {
  const learnerIds = await enrolledLearnerIds(orgId, programId);

  let totalProgress = 0;
  let graduatedProgress = 0;
  let course1Graduated = 0;
  let reachedCourse2 = 0;

  if (learnerIds.length > 0) {
    const { count: tp } = await supabaseAdmin
      .from('learner_course_progress')
      .select('id', { count: 'exact', head: true })
      .in('learner_id', learnerIds);
    totalProgress = tp ?? 0;

    const { count: gp } = await supabaseAdmin
      .from('learner_course_progress')
      .select('id', { count: 'exact', head: true })
      .in('learner_id', learnerIds)
      .eq('is_graduated', true);
    graduatedProgress = gp ?? 0;

    const { count: c1g } = await supabaseAdmin
      .from('learner_course_progress')
      .select('id', { count: 'exact', head: true })
      .in('learner_id', learnerIds)
      .eq('sequence_number', 1)
      .eq('is_graduated', true);
    course1Graduated = c1g ?? 0;

    const { count: rc2 } = await supabaseAdmin
      .from('learner_course_progress')
      .select('id', { count: 'exact', head: true })
      .in('learner_id', learnerIds)
      .gte('sequence_number', 2);
    reachedCourse2 = rc2 ?? 0;
  }

  return {
    activation_rate: safeRate(totalActivated, totalPaid),
    course_completion_rate: safeRate(graduatedProgress, totalProgress),
    retention_rate: safeRate(reachedCourse2, course1Graduated),
    graduation_rate_paid: safeRate(programGraduated, totalPaid),
    graduation_rate_activated: safeRate(programGraduated, totalActivated),
  };
}

async function operationsMetrics(
  orgId: string,
  fromDate: Date,
  toDate: Date
): Promise<MetricsResult['operations']> {
  const fromStr = ymd(fromDate);
  const toStr = ymd(toDate);

  const { count: totalCalls } = await supabaseAdmin
    .from('deals')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .gte('assigned_date', fromStr)
    .lte('assigned_date', toStr);

  const { count: totalEvents } = await supabaseAdmin
    .from('events')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .gte('date', fromStr)
    .lte('date', toStr);

  const { data: attendanceRows } = await supabaseAdmin
    .from('events')
    .select('actual_attendance')
    .eq('org_id', orgId)
    .gte('date', fromStr)
    .lte('date', toStr);
  const totalAttendance = (attendanceRows ?? []).reduce(
    (sum, e) => sum + (e.actual_attendance ?? 0),
    0
  );

  const { data: npsRows } = await supabaseAdmin
    .from('nps_responses')
    .select('score')
    .eq('org_id', orgId)
    .gte('collected_at', fromDate.toISOString())
    .lte('collected_at', toDate.toISOString());
  const scores = (npsRows ?? [])
    .map((r) => Number(r.score))
    .filter((n) => !Number.isNaN(n));

  return {
    total_calls: totalCalls ?? 0,
    total_events: totalEvents ?? 0,
    total_attendance: totalAttendance,
    avg_nps_score: avg(scores),
  };
}

async function partnershipsMetrics(
  orgId: string,
  fromDate: Date,
  toDate: Date
): Promise<MetricsResult['partnerships']> {
  const todayStr = ymd(new Date());

  const { data: partnerships } = await supabaseAdmin
    .from('partnerships')
    .select('value_rwf, stage, next_followup_date')
    .eq('org_id', orgId)
    .not('stage', 'in', `(${CLOSED_PARTNERSHIP_STAGES.join(',')})`);

  let totalValue = 0;
  let followupsDue = 0;
  let atRisk = 0;
  for (const p of partnerships ?? []) {
    totalValue += Number(p.value_rwf ?? 0);
    if (p.next_followup_date && (p.next_followup_date as string) <= todayStr) followupsDue += 1;
    if (typeof p.stage === 'string' && p.stage.toLowerCase().includes('risk')) atRisk += 1;
  }

  void fromDate;
  void toDate;

  return {
    total_value_rwf: totalValue,
    followups_due_count: followupsDue,
    at_risk_count: atRisk,
  };
}

async function paymentBars(
  orgId: string,
  programId: string | null,
  fromDate: Date,
  toDate: Date
): Promise<Array<{ label: string; value: number }>> {
  const totalDays = Math.max(1, Math.ceil((toDate.getTime() - fromDate.getTime()) / MS_PER_DAY));
  const weeks = Math.max(1, Math.ceil(totalDays / 7));
  const buckets = bucketDates(fromDate, toDate, weeks);
  const dates = await listEnrollmentDates(orgId, programId, {
    paymentCompliant: true,
    fromDate,
    toDate,
  });
  const counts = bucketByDate(dates, buckets);
  return counts.map((value, i) => ({ label: `Week ${i + 1}`, value }));
}

async function computeSparklines(
  orgId: string,
  programId: string | null,
  fromDate: Date,
  toDate: Date
): Promise<Record<string, number[]>> {
  const buckets = bucketDates(fromDate, toDate, SPARKLINE_BUCKETS);

  const [enrollmentDates, paidDates, dealDates] = await Promise.all([
    listEnrollmentDates(orgId, programId, { fromDate, toDate }),
    listEnrollmentDates(orgId, programId, { paymentCompliant: true, fromDate, toDate }),
    listDealDates(orgId, fromDate, toDate),
  ]);

  const enrolled = bucketByDate(enrollmentDates, buckets);
  const paid = bucketByDate(paidDates, buckets);
  const calls = bucketByDate(dealDates, buckets);
  const conversion = enrolled.map((e, i) => (e > 0 ? Math.round((paid[i] / e) * 1000) / 10 : 0));

  return {
    total_enrolled: enrolled,
    total_paid: paid,
    conversion_rate: conversion,
    total_calls: calls,
  };
}

export async function computeMetrics(
  orgId: string,
  programId: string | null,
  fromDate: Date,
  toDate: Date
): Promise<MetricsResult> {
  const periodMs = toDate.getTime() - fromDate.getTime();
  const prevTo = new Date(fromDate.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - periodMs);

  const [
    totalEnrolledRange,
    totalPaidRange,
    prevEnrolled,
    prevPaid,
    totalPaidCumulative,
    totalActivated,
    programGraduated,
  ] = await Promise.all([
    countEnrollments(orgId, programId, { fromDate, toDate }),
    countEnrollments(orgId, programId, { paymentCompliant: true, fromDate, toDate }),
    countEnrollments(orgId, programId, { fromDate: prevFrom, toDate: prevTo }),
    countEnrollments(orgId, programId, { paymentCompliant: true, fromDate: prevFrom, toDate: prevTo }),
    countEnrollments(orgId, programId, { paymentCompliant: true }),
    countEnrollments(orgId, programId, { activated: true }),
    countEnrollments(orgId, programId, { programGraduated: true }),
  ]);

  const funnel: MetricsResult['funnel'] = {
    total_enrolled: totalEnrolledRange,
    total_paid: totalPaidRange,
    conversion_rate: safeRate(totalPaidRange, totalEnrolledRange),
    enrollment_growth_pct: pctChange(totalEnrolledRange, prevEnrolled),
    payment_growth_pct: pctChange(totalPaidRange, prevPaid),
  };

  const [engagement, operations, partnerships, payment_bars, sparklines] = await Promise.all([
    engagementMetrics(orgId, programId, totalPaidCumulative, totalActivated, programGraduated),
    operationsMetrics(orgId, fromDate, toDate),
    partnershipsMetrics(orgId, fromDate, toDate),
    paymentBars(orgId, programId, fromDate, toDate),
    computeSparklines(orgId, programId, fromDate, toDate),
  ]);

  return {
    funnel,
    engagement,
    operations,
    partnerships,
    payment_bars,
    sparklines,
  };
}
