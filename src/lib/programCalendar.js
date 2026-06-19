/**
 * Cohort program calendar — resolve Week/Day for staff dashboards and playbook defaults.
 */
import { resolveInternPlaybookDay } from './programUnlocks.js';

/**
 * Count Mon–Fri program days from cohort start through today (inclusive).
 * @param {string | Date | null | undefined} startDate
 * @param {Date} [now]
 */
export function deriveProgramDayFromStartDate(startDate, now = new Date()) {
  if (!startDate) return null;
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return null;
  start.setHours(0, 0, 0, 0);
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
 */
export function resolveCohortProgramDay(interns, cohortStartDate, override) {
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

  if (explicit.length) {
    return explicit.reduce((best, cur) =>
      (cur.week * 5 + cur.day) > (best.week * 5 + best.day) ? cur : best,
    );
  }

  const fromCalendar = deriveProgramDayFromStartDate(cohortStartDate);
  if (fromCalendar) return fromCalendar;

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
