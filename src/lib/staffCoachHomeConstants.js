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

/**
 * Explicit schedule blocks — key `${segment}-${week}-${day}`.
 * @type {Record<string, Array<{ startMinutes: number, defaultMinutes: number, title: string, description?: string, timeLabel?: string }>>}
 */
export const FACULTY_DAY_SCHEDULE_OVERRIDES = {
  '1-1-5': [
    {
      startMinutes: 9 * 60,
      defaultMinutes: 180,
      timeLabel: '9:00 AM – 12:00 NN',
      title: 'Pitch preparations and rehearsals',
      description: 'Studio time — squads polish venture portfolio pitches',
    },
    {
      startMinutes: 13 * 60,
      defaultMinutes: 60,
      title: 'Squad venture pitch presentations',
      description: 'Commitment — each squad presents to the cohort',
    },
    {
      startMinutes: 14 * 60,
      defaultMinutes: 60,
      title: 'Commitment',
      description: 'Commitment ceremony — Week 1 direction and accountability',
    },
    {
      startMinutes: 15 * 60,
      defaultMinutes: 60,
      title: 'Introduction to Week 2',
      description: 'Preview priorities and deliverables for the week ahead',
    },
  ],
};

/** @type {typeof FACULTY_DAY_SCHEDULE_OVERRIDES} */
export const MENTOR_DAY_SCHEDULE_OVERRIDES = {
  '1-1-5': [
    {
      startMinutes: 9 * 60,
      defaultMinutes: 180,
      timeLabel: '9:00 AM – 12:00 NN',
      title: 'Pitch preparations and rehearsals',
      description: 'Coach squads on clarity, confidence, and story flow',
    },
    {
      startMinutes: 13 * 60,
      defaultMinutes: 60,
      title: 'Squad venture pitch presentations',
      description: 'Observe presentations — capture coaching notes',
    },
    {
      startMinutes: 14 * 60,
      defaultMinutes: 60,
      title: 'Commitment',
      description: 'Support commitment statements — log Week 1 coaching summary',
    },
    {
      startMinutes: 15 * 60,
      defaultMinutes: 60,
      title: 'Introduction to Week 2',
      description: 'Align squads on Week 2 focus and next actions',
    },
  ],
};

/** @param {number} segment @param {number} week @param {number} day */
export function facultyScheduleOverrideKey(segment, week, day) {
  return `${segment}-${week}-${day}`;
}

/** @param {number} minutesFromMidnight */
export function formatScheduleTime(minutesFromMidnight) {
  const h24 = Math.floor(minutesFromMidnight / 60);
  const m = minutesFromMidnight % 60;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}
