import { parse } from 'fast-csv';
import { Readable } from 'stream';
import { supabaseAdmin } from '../lib/supabase';
import { formatPhone } from '../utils/phoneFormatter';
import { toNullableDate } from '../utils/dateHelpers';
import { triggerMetricRefresh } from '../jobs/metricRefresh.job';
import type { Enums, Json, TablesUpdate } from '../types/database.types';

type PaymentStatus = Enums<'payment_status'>;
type CourseStatus = Enums<'course_status'>;
type HealthStatus = Enums<'health_status'>;
type DealType = Enums<'deal_type'>;

export interface ChangesSummary {
  new_learners: number;
  updated_learners: number;
  state_changes: Array<{
    email: string;
    field: string;
    from: string | null;
    to: string | null;
  }>;
  validation_errors: Array<{
    row: number;
    field: string;
    reason: string;
  }>;
  skipped: number;
}

type CsvRow = Record<string, string>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PAYMENT_STATUS_MAP: Record<string, PaymentStatus> = {
  'n/a': 'n/a',
  '': 'n/a',
  'payment compliant': 'payment_compliant',
  'payment grace period': 'payment_grace_period',
  'payment overdue': 'payment_overdue',
  'payment due soon': 'payment_due_soon',
  'payment due now': 'payment_due_now',
  'payment plan cancelled': 'payment_plan_cancelled',
};

const COURSE_STATUS_MAP: Record<string, CourseStatus> = {
  'in progress': 'in_progress',
  validated: 'validated',
};

const HEALTH_CLASSIFICATION_MAP: Record<string, HealthStatus> = {
  'active state': 'active_state',
  'slow but progressing state': 'slow_but_progressing',
  graduated: 'graduated',
};

const DEAL_VALUE_RWF: Record<DealType, number> = {
  conversion: 0,
  followup_conversion: 0,
  cold_lead_enrollment: 0,
  course_graduation: 500,
  graduation_push: 1500,
  activation: 0,
  retention: 0,
};

function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value);
}

function parseBool(value: string | undefined | null): boolean {
  if (!value) return false;
  const v = value.trim().toLowerCase();
  return v === 'true' || v === '1' || v === 'yes' || v === 'y';
}

function mapPaymentStatus(raw: string | undefined): PaymentStatus {
  const key = (raw ?? '').trim().toLowerCase();
  return PAYMENT_STATUS_MAP[key] ?? 'n/a';
}

function mapCourseStatus(raw: string | undefined): CourseStatus | null {
  if (!raw) return null;
  return COURSE_STATUS_MAP[raw.trim().toLowerCase()] ?? null;
}

function mapHealthClassification(raw: string | undefined): HealthStatus | null {
  if (!raw) return null;
  return HEALTH_CLASSIFICATION_MAP[raw.trim().toLowerCase()] ?? null;
}

function dateToIso(d: Date | null): string | null {
  return d ? d.toISOString() : null;
}

function toStringOrNull(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  return String(v);
}

function diff(
  email: string,
  field: string,
  from: unknown,
  to: unknown,
  changes: ChangesSummary['state_changes']
): void {
  const a = toStringOrNull(from);
  const b = toStringOrNull(to);
  if (a === b) return;
  changes.push({ email, field, from: a, to: b });
}

async function downloadAndParseCsv(fileUrl: string): Promise<CsvRow[]> {
  const res = await fetch(fileUrl);
  if (!res.ok) {
    throw new Error(`Failed to download CSV (${res.status} ${res.statusText}): ${fileUrl}`);
  }
  const text = await res.text();

  return new Promise<CsvRow[]>((resolve, reject) => {
    const rows: CsvRow[] = [];
    Readable.from([text])
      .pipe(parse({ headers: true, trim: true, ignoreEmpty: true }))
      .on('error', reject)
      .on('data', (row: CsvRow) => rows.push(row))
      .on('end', () => resolve(rows));
  });
}

async function recordUploadHistory(
  orgId: string,
  programId: string,
  uploadedBy: string,
  fileUrl: string,
  sheetType: 'health' | 'activity',
  summary: ChangesSummary
): Promise<void> {
  const { error } = await supabaseAdmin.from('upload_history').insert({
    org_id: orgId,
    program_id: programId,
    uploaded_by: uploadedBy,
    file_url: fileUrl,
    sheet_type: sheetType,
    changes_summary: summary as unknown as Json,
    row_count:
      summary.new_learners + summary.updated_learners + summary.skipped,
    validation_errors: summary.validation_errors as unknown as Json,
  });
  if (error) {
    console.error(
      `[${new Date().toISOString()}] [csv:${sheetType}] upload_history insert failed:`,
      error
    );
  }
}

export async function processHealthSheet(
  fileUrl: string,
  programId: string,
  orgId: string,
  uploadedBy: string
): Promise<ChangesSummary> {
  const summary: ChangesSummary = {
    new_learners: 0,
    updated_learners: 0,
    state_changes: [],
    validation_errors: [],
    skipped: 0,
  };

  const rows = await downloadAndParseCsv(fileUrl);
  const programCache = new Map<string, string | null>();

  let rowNum = 1;
  for (const row of rows) {
    rowNum += 1;

    const rawEmail = (row['Email'] ?? '').trim();
    if (!rawEmail) {
      summary.validation_errors.push({ row: rowNum, field: 'Email', reason: 'missing' });
      summary.skipped += 1;
      continue;
    }
    const email = rawEmail.toLowerCase();
    if (!isValidEmail(email)) {
      summary.validation_errors.push({ row: rowNum, field: 'Email', reason: 'invalid format' });
      summary.skipped += 1;
      continue;
    }

    const phone = formatPhone(row['Phone number'] ?? null);
    const paymentStatus = mapPaymentStatus(row['Payment status']);
    const activationDate = toNullableDate(row['Activation date'] ?? null);
    const programGraduationDate = toNullableDate(row['Program graduation date'] ?? null);
    const isActivated = parseBool(row['Is enrollment activated']);
    const isProgramGraduated = parseBool(row['Is program graduated']);
    const programName = (row['Program name'] ?? '').trim();

    if (!programName) {
      summary.validation_errors.push({
        row: rowNum,
        field: 'Program name',
        reason: 'missing',
      });
      summary.skipped += 1;
      continue;
    }

    let rowProgramId: string | null;
    if (programCache.has(programName)) {
      rowProgramId = programCache.get(programName) ?? null;
    } else {
      const { data: prog, error: progErr } = await supabaseAdmin
        .from('programs')
        .select('id')
        .eq('org_id', orgId)
        .eq('code', programName)
        .maybeSingle();
      if (progErr) {
        summary.validation_errors.push({
          row: rowNum,
          field: 'Program name',
          reason: progErr.message,
        });
        summary.skipped += 1;
        continue;
      }
      rowProgramId = prog?.id ?? null;
      programCache.set(programName, rowProgramId);
    }
    if (!rowProgramId) {
      summary.validation_errors.push({
        row: rowNum,
        field: 'Program name',
        reason: `program "${programName}" not found for org`,
      });
      summary.skipped += 1;
      continue;
    }

    const firstName = (row['First name'] ?? '').trim();
    const lastName = (row['Last name'] ?? '').trim();
    const learnerPayload = {
      org_id: orgId,
      email,
      first_name: firstName || '',
      last_name: lastName || '',
      gender: (row['Gender'] ?? '').trim() || null,
      phone_number: phone,
      country: (row['Country of residence'] ?? '').trim() || null,
      region: (row['Regions'] ?? '').trim() || null,
      ehub_profile_url: (row['eHub profile'] ?? '').trim() || null,
      lms_profile_url: (row['LMS profile'] ?? '').trim() || null,
    };

    const { data: existingLearner, error: lookupErr } = await supabaseAdmin
      .from('learners')
      .select('id')
      .eq('org_id', orgId)
      .eq('email', email)
      .maybeSingle();
    if (lookupErr) {
      summary.validation_errors.push({ row: rowNum, field: 'learner', reason: lookupErr.message });
      summary.skipped += 1;
      continue;
    }

    let learnerId: string;
    if (existingLearner) {
      const { error: updErr } = await supabaseAdmin
        .from('learners')
        .update(learnerPayload)
        .eq('id', existingLearner.id);
      if (updErr) {
        summary.validation_errors.push({ row: rowNum, field: 'learner', reason: updErr.message });
        summary.skipped += 1;
        continue;
      }
      learnerId = existingLearner.id;
      summary.updated_learners += 1;
    } else {
      const { data: inserted, error: insErr } = await supabaseAdmin
        .from('learners')
        .insert(learnerPayload)
        .select('id')
        .single();
      if (insErr || !inserted) {
        summary.validation_errors.push({
          row: rowNum,
          field: 'learner',
          reason: insErr?.message ?? 'insert failed',
        });
        summary.skipped += 1;
        continue;
      }
      learnerId = inserted.id;
      summary.new_learners += 1;
    }

    const { data: existingEnroll, error: enrollLookupErr } = await supabaseAdmin
      .from('learner_program_enrollments')
      .select(
        'id, payment_status, is_activated, activation_date, is_program_graduated, program_graduation_date'
      )
      .eq('learner_id', learnerId)
      .eq('program_id', rowProgramId)
      .maybeSingle();

    if (enrollLookupErr) {
      summary.validation_errors.push({
        row: rowNum,
        field: 'enrollment',
        reason: enrollLookupErr.message,
      });
      summary.skipped += 1;
      continue;
    }

    const newEnrollFields = {
      payment_status: paymentStatus,
      is_activated: isActivated,
      activation_date: dateToIso(activationDate),
      is_program_graduated: isProgramGraduated,
      program_graduation_date: dateToIso(programGraduationDate),
    };

    if (existingEnroll) {
      diff(email, 'payment_status', existingEnroll.payment_status, newEnrollFields.payment_status, summary.state_changes);
      diff(email, 'is_activated', existingEnroll.is_activated, newEnrollFields.is_activated, summary.state_changes);
      diff(email, 'activation_date', existingEnroll.activation_date, newEnrollFields.activation_date, summary.state_changes);
      diff(email, 'is_program_graduated', existingEnroll.is_program_graduated, newEnrollFields.is_program_graduated, summary.state_changes);
      diff(email, 'program_graduation_date', existingEnroll.program_graduation_date, newEnrollFields.program_graduation_date, summary.state_changes);

      const { error: enrollUpdErr } = await supabaseAdmin
        .from('learner_program_enrollments')
        .update(newEnrollFields)
        .eq('id', existingEnroll.id);
      if (enrollUpdErr) {
        summary.validation_errors.push({
          row: rowNum,
          field: 'enrollment',
          reason: enrollUpdErr.message,
        });
      }
    } else {
      const { error: enrollInsErr } = await supabaseAdmin
        .from('learner_program_enrollments')
        .insert({
          learner_id: learnerId,
          program_id: rowProgramId,
          org_id: orgId,
          enrollment_date: dateToIso(activationDate) ?? new Date().toISOString(),
          ...newEnrollFields,
        });
      if (enrollInsErr) {
        summary.validation_errors.push({
          row: rowNum,
          field: 'enrollment',
          reason: enrollInsErr.message,
        });
      }
    }
  }

  await recordUploadHistory(orgId, programId, uploadedBy, fileUrl, 'health', summary);
  await triggerMetricRefresh(orgId, programId);

  return summary;
}

async function autoCreateDeliverableSubmissions(
  learnerId: string,
  courseId: string,
  orgId: string,
  graduationDate: Date | null
): Promise<void> {
  const { data: deliverables, error: dErr } = await supabaseAdmin
    .from('deliverables')
    .select('id')
    .eq('course_id', courseId);
  if (dErr || !deliverables || deliverables.length === 0) return;

  const { data: existing, error: exErr } = await supabaseAdmin
    .from('deliverable_submissions')
    .select('deliverable_id')
    .eq('learner_id', learnerId)
    .in(
      'deliverable_id',
      deliverables.map((d) => d.id)
    );
  if (exErr) return;

  const existingIds = new Set((existing ?? []).map((s) => s.deliverable_id));
  const missing = deliverables.filter((d) => !existingIds.has(d.id));
  if (missing.length === 0) return;

  const submittedAt = (graduationDate ?? new Date()).toISOString();
  await supabaseAdmin.from('deliverable_submissions').insert(
    missing.map((d) => ({
      deliverable_id: d.id,
      learner_id: learnerId,
      course_id: courseId,
      org_id: orgId,
      submitted_at: submittedAt,
      confirmed_by_data: true,
    }))
  );
}

async function autoApprovePendingDataDeals(
  learnerId: string,
  flags: { isActivated: boolean; isCourseGraduated: boolean; isProgramGraduated: boolean }
): Promise<void> {
  const { data: deals, error } = await supabaseAdmin
    .from('deals')
    .select('id, deal_type, agent_id, org_id')
    .eq('learner_id', learnerId)
    .eq('approval_status', 'pending_data')
    .in('deal_type', ['activation', 'course_graduation', 'graduation_push']);
  if (error || !deals || deals.length === 0) return;

  const nowIso = new Date().toISOString();

  for (const deal of deals) {
    let confirmed = false;
    if (deal.deal_type === 'activation' && flags.isActivated) confirmed = true;
    if (deal.deal_type === 'course_graduation' && flags.isCourseGraduated) confirmed = true;
    if (deal.deal_type === 'graduation_push' && flags.isProgramGraduated) confirmed = true;
    if (!confirmed) continue;

    const { error: updErr } = await supabaseAdmin
      .from('deals')
      .update({ approval_status: 'approved', approved_at: nowIso })
      .eq('id', deal.id);
    if (updErr) {
      console.error(
        `[${new Date().toISOString()}] [csv:activity] deal approval failed deal=${deal.id}:`,
        updErr
      );
      continue;
    }

    const amount = DEAL_VALUE_RWF[deal.deal_type] ?? 0;
    if (amount > 0) {
      const { error: ledgerErr } = await supabaseAdmin.from('value_ledger').insert({
        org_id: deal.org_id,
        agent_id: deal.agent_id,
        deal_id: deal.id,
        value_rwf: amount,
        event_label: `deal_${deal.deal_type}_approved`,
        status: 'pending',
      });
      if (ledgerErr) {
        console.error(
          `[${new Date().toISOString()}] [csv:activity] ledger credit failed deal=${deal.id}:`,
          ledgerErr
        );
      }
    }
  }
}

export async function processActivitySheet(
  fileUrl: string,
  programId: string,
  orgId: string,
  uploadedBy: string
): Promise<ChangesSummary> {
  const summary: ChangesSummary = {
    new_learners: 0,
    updated_learners: 0,
    state_changes: [],
    validation_errors: [],
    skipped: 0,
  };

  const rows = await downloadAndParseCsv(fileUrl);
  const courseCache = new Map<string, string | null>();

  let rowNum = 1;
  for (const row of rows) {
    rowNum += 1;

    const email = (row['Email'] ?? '').trim().toLowerCase();
    if (!email) {
      summary.validation_errors.push({ row: rowNum, field: 'Email', reason: 'missing' });
      summary.skipped += 1;
      continue;
    }

    const { data: learner, error: learnerErr } = await supabaseAdmin
      .from('learners')
      .select('id')
      .eq('org_id', orgId)
      .eq('email', email)
      .maybeSingle();
    if (learnerErr) {
      summary.validation_errors.push({ row: rowNum, field: 'learner', reason: learnerErr.message });
      summary.skipped += 1;
      continue;
    }
    if (!learner) {
      summary.validation_errors.push({
        row: rowNum,
        field: 'Email',
        reason: 'learner not found — upload health sheet first',
      });
      summary.skipped += 1;
      continue;
    }
    const learnerId = learner.id;

    const courseSeqRaw = (row['Course sequence number'] ?? '').trim();
    const courseSeq = Number.parseInt(courseSeqRaw, 10);
    if (!courseSeqRaw || Number.isNaN(courseSeq)) {
      summary.validation_errors.push({
        row: rowNum,
        field: 'Course sequence number',
        reason: 'missing or non-numeric',
      });
      summary.skipped += 1;
      continue;
    }

    const courseKey = `${programId}:${courseSeq}`;
    let courseId: string | null;
    if (courseCache.has(courseKey)) {
      courseId = courseCache.get(courseKey) ?? null;
    } else {
      const { data: course, error: courseErr } = await supabaseAdmin
        .from('courses')
        .select('id')
        .eq('program_id', programId)
        .eq('sequence_number', courseSeq)
        .maybeSingle();
      if (courseErr) {
        summary.validation_errors.push({
          row: rowNum,
          field: 'course',
          reason: courseErr.message,
        });
        summary.skipped += 1;
        continue;
      }
      courseId = course?.id ?? null;
      courseCache.set(courseKey, courseId);
    }
    if (!courseId) {
      summary.validation_errors.push({
        row: rowNum,
        field: 'Course sequence number',
        reason: `course #${courseSeq} not found for program`,
      });
      summary.skipped += 1;
      continue;
    }

    const courseStatus = mapCourseStatus(row['Course status (LMS)']);
    const healthClassification = mapHealthClassification(row['Learner health classification status']);

    const activationDate = toNullableDate(row['Activation date'] ?? null);
    const firstSignOfLifeDate = toNullableDate(row['First sign of life date'] ?? null);
    const courseGraduationDate = toNullableDate(row['Course graduation date'] ?? null);
    const programGraduationDate = toNullableDate(row['Program graduation date'] ?? null);

    const isActivated = parseBool(row['Is enrollment activated']);
    const isCourseGraduated = parseBool(row['Is course graduated']);
    const isProgramGraduated = parseBool(row['Is program graduated']);

    const timeSinceActivationDaysParsed = Number.parseInt(
      (row['Time since activation (days)'] ?? '').trim() || '',
      10
    );
    const timeSinceSignOfLifeDaysParsed = Number.parseInt(
      (row['Time since sign of life (days)'] ?? '').trim() || '',
      10
    );

    const progressPayload = {
      learner_id: learnerId,
      course_id: courseId,
      org_id: orgId,
      program_id: programId,
      sequence_number: courseSeq,
      course_status: courseStatus,
      is_graduated: isCourseGraduated,
      graduation_date: dateToIso(courseGraduationDate),
      time_since_activation_days: Number.isNaN(timeSinceActivationDaysParsed)
        ? null
        : timeSinceActivationDaysParsed,
      time_since_sign_of_life_days: Number.isNaN(timeSinceSignOfLifeDaysParsed)
        ? null
        : timeSinceSignOfLifeDaysParsed,
      first_sign_of_life_date: dateToIso(firstSignOfLifeDate),
      has_logged_lms: parseBool(row['Has logged into LMS']),
      has_shown_up: parseBool(row['Has shown up in course']),
    };

    const { data: existingProgress, error: progLookupErr } = await supabaseAdmin
      .from('learner_course_progress')
      .select('id, course_status, is_graduated')
      .eq('learner_id', learnerId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (progLookupErr) {
      summary.validation_errors.push({
        row: rowNum,
        field: 'course_progress',
        reason: progLookupErr.message,
      });
      summary.skipped += 1;
      continue;
    }

    if (existingProgress) {
      diff(email, 'course_status', existingProgress.course_status, progressPayload.course_status, summary.state_changes);
      diff(email, 'is_graduated', existingProgress.is_graduated, progressPayload.is_graduated, summary.state_changes);

      const { error: progUpdErr } = await supabaseAdmin
        .from('learner_course_progress')
        .update(progressPayload)
        .eq('id', existingProgress.id);
      if (progUpdErr) {
        summary.validation_errors.push({
          row: rowNum,
          field: 'course_progress',
          reason: progUpdErr.message,
        });
        continue;
      }
      summary.updated_learners += 1;
    } else {
      const { error: progInsErr } = await supabaseAdmin
        .from('learner_course_progress')
        .insert(progressPayload);
      if (progInsErr) {
        summary.validation_errors.push({
          row: rowNum,
          field: 'course_progress',
          reason: progInsErr.message,
        });
        continue;
      }
      summary.new_learners += 1;
    }

    if (healthClassification) {
      const enrollUpdate: TablesUpdate<'learner_program_enrollments'> = {
        health_status: healthClassification,
      };
      if (isActivated) {
        enrollUpdate.is_activated = true;
        if (activationDate) enrollUpdate.activation_date = dateToIso(activationDate);
      }
      if (isProgramGraduated) {
        enrollUpdate.is_program_graduated = true;
        if (programGraduationDate) {
          enrollUpdate.program_graduation_date = dateToIso(programGraduationDate);
        }
      }
      const { error: enrollUpdErr } = await supabaseAdmin
        .from('learner_program_enrollments')
        .update(enrollUpdate)
        .eq('learner_id', learnerId)
        .eq('program_id', programId);
      if (enrollUpdErr) {
        console.error(
          `[${new Date().toISOString()}] [csv:activity] enrollment update failed learner=${learnerId}:`,
          enrollUpdErr
        );
      }
    }

    if (isCourseGraduated) {
      await autoCreateDeliverableSubmissions(learnerId, courseId, orgId, courseGraduationDate);
    }

    await autoApprovePendingDataDeals(learnerId, {
      isActivated,
      isCourseGraduated,
      isProgramGraduated,
    });
  }

  await recordUploadHistory(orgId, programId, uploadedBy, fileUrl, 'activity', summary);
  await triggerMetricRefresh(orgId, programId);

  return summary;
}
