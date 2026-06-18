/** Friendly coach tips — rotated on home dashboard. */
export const STAFF_COACH_TIPS = [
  'Great pitches tell a clear story: Customer → Problem → Opportunity → UVP → Vision. Clarity creates conviction.',
  'Start coaching conversations with curiosity — ask what surprised them today before giving advice.',
  'If a squad is stuck, revisit their customer segment before polishing the canvas.',
  'Celebrate small wins publicly; save growth feedback for one-on-one coaching cards.',
  'Dream boards with captions but no photos usually mean sync never ran — ask them to tap Sync to cloud.',
];

/** Default day schedule slots when seed activities are sparse. */
export const DEFAULT_DAY_SCHEDULE_SLOTS = [
  { startMinutes: 8 * 60 + 30, defaultMinutes: 15 },
  { startMinutes: 9 * 60, defaultMinutes: 90 },
  { startMinutes: 10 * 60 + 45, defaultMinutes: 15 },
  { startMinutes: 11 * 60, defaultMinutes: 120 },
  { startMinutes: 13 * 60, defaultMinutes: 60 },
  { startMinutes: 14 * 60 + 30, defaultMinutes: 60 },
];

/** @param {number} minutesFromMidnight */
export function formatScheduleTime(minutesFromMidnight) {
  const h24 = Math.floor(minutesFromMidnight / 60);
  const m = minutesFromMidnight % 60;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}
