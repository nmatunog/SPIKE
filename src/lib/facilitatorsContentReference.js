import reference from '../../content/facilitators-content-reference.json';

export const FACILITATORS_CONTENT_REFERENCE_META = reference.meta;

/** @type {typeof reference.weeks} */
export const FACILITATORS_CONTENT_REFERENCE_WEEKS = reference.weeks;

export function facilitatorsReferenceDayCount() {
  return reference.weeks.reduce((total, week) => total + week.days.length, 0);
}

export function facilitatorsReferenceWeek(weekNumber) {
  return reference.weeks.find((w) => w.weekNumber === weekNumber) ?? null;
}

export function facilitatorsReferenceDay(weekNumber, dayNumber) {
  const week = facilitatorsReferenceWeek(weekNumber);
  return week?.days.find((d) => d.dayNumber === dayNumber) ?? null;
}
