import { effectiveCohortStartDate } from '../programCalendar.js';

/** RA-SPIKE classroom block — 3 hours, default Friday of each program week. */
export const RA_SPIKE_SESSION_START_HOUR = 9;
export const RA_SPIKE_SESSION_END_HOUR = 12;
export const RA_SPIKE_SESSION_WEEKDAY = 5; // Friday (Mon=1 … Fri=5)

/**
 * @param {Date} cohortStart Monday (or program week 1 day 1)
 * @param {number} week 1–8
 */
export function raSpikeSessionDateForWeek(cohortStart, week) {
  const start = new Date(cohortStart);
  start.setHours(0, 0, 0, 0);
  const session = new Date(start);
  session.setDate(session.getDate() + (Math.max(1, week) - 1) * 7 + (RA_SPIKE_SESSION_WEEKDAY - 1));
  session.setHours(RA_SPIKE_SESSION_START_HOUR, 0, 0, 0);
  return session;
}

/**
 * @param {string | null | undefined} cohortStartDate
 * @param {number} week
 * @param {Date} [now]
 */
export function resolveRaSpikeNextSession(cohortStartDate, week, now = new Date()) {
  const startRaw = effectiveCohortStartDate(cohortStartDate);
  const start = parseLocalDate(startRaw);
  if (!start) {
    return {
      week,
      label: 'Classroom session',
      date: null,
      timeLabel: '9:00 AM – 12:00 PM',
      isPast: false,
      isToday: false,
      daysUntil: null,
    };
  }

  const clampedWeek = Math.max(1, Math.min(8, week));
  let targetWeek = clampedWeek;
  let sessionDate = raSpikeSessionDateForWeek(start, targetWeek);

  if (sessionDate < now && targetWeek < 8) {
    targetWeek += 1;
    sessionDate = raSpikeSessionDateForWeek(start, targetWeek);
  }

  const end = new Date(sessionDate);
  end.setHours(RA_SPIKE_SESSION_END_HOUR, 0, 0, 0);

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const sessionDay = new Date(sessionDate);
  sessionDay.setHours(0, 0, 0, 0);
  const daysUntil = Math.round((sessionDay.getTime() - today.getTime()) / 86400000);

  return {
    week: targetWeek,
    label: `Week ${targetWeek} classroom session`,
    date: sessionDate,
    endDate: end,
    timeLabel: '9:00 AM – 12:00 PM',
    isPast: end < now,
    isToday: daysUntil === 0,
    daysUntil,
  };
}

/** @param {string | Date | null | undefined} value */
function parseLocalDate(value) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  if (typeof value === 'string') {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
    if (match) {
      return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    }
  }
  return null;
}

/**
 * @param {string | null | undefined} cohortStartDate
 * @param {number} participantWeek
 * @param {Date} [now]
 */
export function resolveRaSpikeCalendarWeek(cohortStartDate, participantWeek, now = new Date()) {
  const start = effectiveCohortStartDate(cohortStartDate);
  const fromStart = parseLocalDate(start);
  if (!fromStart) return Math.max(1, Math.min(8, participantWeek ?? 1));

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  let calendarWeek = 1;
  for (let w = 1; w <= 8; w += 1) {
    const friday = raSpikeSessionDateForWeek(fromStart, w);
    friday.setHours(23, 59, 59, 999);
    if (today <= friday) {
      calendarWeek = w;
      break;
    }
    calendarWeek = Math.min(8, w + 1);
  }

  const participant = Math.max(1, Math.min(8, participantWeek ?? 1));
  return Math.max(participant, calendarWeek);
}

/** @param {Date | null} date */
export function formatRaSpikeSessionDate(date) {
  if (!date) return 'Date TBA';
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
