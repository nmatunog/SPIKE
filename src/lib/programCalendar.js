/**
 * Cohort program calendar — resolve Week/Day for staff dashboards and playbook defaults.
 */
import { resolveInternPlaybookDay } from './programUnlocks.js';

/** Week 1 Day 1 = Mon 2026-06-15 → Fri 2026-06-19 = Day 5. Override via VITE_COHORT_START_DATE. */
export const DEFAULT_COHORT_START_DATE =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_COHORT_START_DATE?.trim())
  || '2026-06-15';

/** @param {string | null | undefined} cohortStartDate */
export function effectiveCohortStartDate(cohortStartDate) {
  const explicit = parseProgramDateOnly(cohortStartDate);
  const defaultStart = parseProgramDateOnly(DEFAULT_COHORT_START_DATE);
  if (!explicit) return DEFAULT_COHORT_START_DATE;
  // starts_on is often cohort-created mid-week — ignore if after canonical pilot Day 1
  if (defaultStart && explicit > defaultStart) {
    return DEFAULT_COHORT_START_DATE;
  }
  return formatProgramDateOnly(explicit);
}

/** @param {string | Date | null | undefined} value */
function parseProgramDateOnly(value) {
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
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** @param {Date} date */
function formatProgramDateOnly(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Staff/coach "Today" — wall-clock cohort calendar only (not intern progress).
 * @param {string | null | undefined} cohortStartDate
 * @param {Date} [now]
 */
export function resolveStaffProgramDay(cohortStartDate, now = new Date()) {
  return deriveProgramDayFromStartDate(effectiveCohortStartDate(cohortStartDate), now)
    ?? { week: 1, day: 1 };
}

/** @param {{ week: number, day: number }} programDay */
function programDayOrdinal({ week, day }) {
  return week * 5 + day;
}

/** Parse YYYY-MM-DD (or ISO prefix) as local midnight — avoids UTC off-by-one. */
function parseProgramDate(value) {
  const parsed = parseProgramDateOnly(value);
  return parsed;
}

/**
 * Count Mon–Fri program days from cohort start through today (inclusive).
 * @param {string | Date | null | undefined} startDate
 * @param {Date} [now]
 */
export function deriveProgramDayFromStartDate(startDate, now = new Date()) {
  if (!startDate) return null;
  const start = parseProgramDate(startDate);
  if (!start) return null;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  if (today < start) return { week: 1, day: 1 };

  let programDays = 0;
  const cursor = new Date(start);
  while (cursor <= today) {
    const dow = cursor.getDay();
    if (dow !== 0 && dow !== 6) programDays += 1;
    cursor.setDate(cursor.getDate() + 1);
  }

  const total = Math.max(1, programDays);
  const week = Math.min(15, Math.floor((total - 1) / 5) + 1);
  const day = ((total - 1) % 5) + 1;
  return { week, day };
}

/** @param {{ current_week?: number | null, current_day?: number | null, hours?: number }} intern */
function internProgressShape(intern) {
  if (intern.internProgress) return intern.internProgress;
  return {
    current_week: intern.current_week,
    current_day: intern.current_day,
    hours: intern.hours ?? 0,
  };
}

/**
 * Canonical cohort Week/Day — used on coach/mentor home.
 * @param {Array<{ hours?: number, current_week?: number | null, current_day?: number | null, internProgress?: object }>} interns
 * @param {string | null | undefined} [cohortStartDate]
 * @param {{ week?: number, day?: number }} [override]
 * @param {Date} [now]
 */
export function resolveCohortProgramDay(interns, cohortStartDate, override, now = new Date()) {
  if (override?.week && override?.day) {
    return {
      week: Math.max(1, override.week),
      day: Math.max(1, Math.min(5, override.day)),
    };
  }

  const explicit = interns
    .map((intern) => {
      const progress = internProgressShape(intern);
      const week = progress.current_week;
      const day = progress.current_day;
      if (week == null || day == null) return null;
      return { week: Math.max(1, week), day: Math.max(1, Math.min(5, day)) };
    })
    .filter(Boolean);

  const explicitMax = explicit.length
    ? explicit.reduce((best, cur) =>
      programDayOrdinal(cur) > programDayOrdinal(best) ? cur : best,
    )
    : null;

  const fromCalendar = deriveProgramDayFromStartDate(effectiveCohortStartDate(cohortStartDate), now);
  if (fromCalendar && explicitMax) {
    return programDayOrdinal(fromCalendar) >= programDayOrdinal(explicitMax)
      ? fromCalendar
      : explicitMax;
  }
  if (fromCalendar) return fromCalendar;
  if (explicitMax) return explicitMax;

  if (interns.length) {
    const days = interns.map((intern) => {
      const progress = internProgressShape(intern);
      const week = progress.current_week ?? 1;
      const day = resolveInternPlaybookDay(progress);
      return { week, day };
    });
    return days.reduce((best, cur) =>
      (cur.week * 5 + cur.day) > (best.week * 5 + best.day) ? cur : best,
    );
  }

  return { week: 1, day: 1 };
}

/** @deprecated Use resolveCohortProgramDay */
export function deriveCohortWeekDay(interns, cohortStartDate) {
  return resolveCohortProgramDay(interns, cohortStartDate);
}
