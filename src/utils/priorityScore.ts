import { daysBetween, isNullDate, toNullableDate } from './dateHelpers';

export interface LearnerForScoring {
  id: string;
  phone_number: string | null;
  payment_status: string;
  is_activated: boolean;
  enrollment_date: string | null;
  health_status: string;
  follow_up_date: string | null;
  last_contact_at: string | null;
  time_since_activation_days: number | null;
  courses_completed: number;
  current_course_days: number | null;
}

const PAYMENT_DUE_STATUSES = new Set([
  'payment_grace_period',
  'payment_overdue',
  'payment_due_now',
  'payment_due_soon',
]);

function todayString(today: Date): string {
  return today.toISOString().slice(0, 10);
}

export function scoreLearner(
  learner: LearnerForScoring,
  today: Date
): number | null {
  if (!learner.phone_number) return null;

  let score = 0;
  const todayStr = todayString(today);

  if (learner.follow_up_date && !isNullDate(learner.follow_up_date)) {
    if (learner.follow_up_date === todayStr) {
      score += 500;
    } else if (learner.follow_up_date < todayStr) {
      score += 400;
    }
  }

  if (PAYMENT_DUE_STATUSES.has(learner.payment_status)) {
    score += 300;
  }

  const enrollmentDate = toNullableDate(learner.enrollment_date);

  if (learner.payment_status === 'n/a' && enrollmentDate) {
    if (daysBetween(today, enrollmentDate) > 14) {
      score += 200;
    }
  }

  if (
    learner.payment_status === 'payment_compliant' &&
    learner.is_activated === false &&
    enrollmentDate &&
    daysBetween(today, enrollmentDate) > 7
  ) {
    score += 180;
  }

  if (
    learner.health_status === 'slow_but_progressing' &&
    learner.time_since_activation_days !== null &&
    learner.time_since_activation_days > 21
  ) {
    score += 160;
  }

  if (
    learner.courses_completed > 2 &&
    learner.current_course_days !== null &&
    learner.current_course_days > 14
  ) {
    score += 140;
  }

  const lastContact = toNullableDate(learner.last_contact_at);
  if (lastContact) {
    const sinceContactDays = daysBetween(today, lastContact);
    if (sinceContactDays > 7) {
      const bonus = Math.min(100, (sinceContactDays - 7) * 50);
      score += bonus;
    }
    if (today.getTime() - lastContact.getTime() < 24 * 60 * 60 * 1000) {
      score -= 200;
    }
  }

  return Math.max(0, score);
}
