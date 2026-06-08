import {
  FACULTY_WEEK_THEMES,
  MENTOR_WEEK_THEMES,
  getFacultyDayFromSeed,
  getMentorDayFromSeed,
  listFacultyDaysFromSeed,
  listMentorDaysFromSeed,
} from './facultyMentorFrameworkSeed.js';
import {
  fetchAllFrameworkDays,
  fetchFacultyDayTemplate,
  fetchFacultyDayTemplates,
  fetchMentorDayGuide,
  fetchMentorDayGuides,
} from './supabase/facultyMentorFramework.js';
import { getCoachSummaryForMentor } from './ventureCoachService.js';

export { FACULTY_WEEK_THEMES, MENTOR_WEEK_THEMES };

/** @param {number} segment @param {number} week */
export async function loadFacultyWeekFramework(segment = 1, week = 1) {
  const db = await fetchFacultyDayTemplates(segment, week);
  const days = db?.length ? db : listFacultyDaysFromSeed(segment, week);
  return {
    segment,
    week,
    weekTheme: FACULTY_WEEK_THEMES[`${segment}-${week}`] ?? '',
    days,
    source: db?.length ? 'db' : 'seed',
  };
}

/** @param {number} segment @param {number} week @param {number} day */
export async function loadFacultyDayFramework(segment = 1, week = 1, day = 1) {
  const db = await fetchFacultyDayTemplate(segment, week, day);
  const template = db ?? getFacultyDayFromSeed(segment, week, day);
  return {
    template,
    weekTheme: FACULTY_WEEK_THEMES[`${segment}-${week}`] ?? '',
    source: db ? 'db' : 'seed',
  };
}

/** @param {number} segment @param {number} week */
export async function loadMentorWeekFramework(segment = 1, week = 1) {
  const db = await fetchMentorDayGuides(segment, week);
  const days = db?.length ? db : listMentorDaysFromSeed(segment, week);
  return {
    segment,
    week,
    weekTheme: MENTOR_WEEK_THEMES[`${segment}-${week}`] ?? '',
    days,
    source: db?.length ? 'db' : 'seed',
  };
}

/** @param {number} segment @param {number} week @param {number} day */
export async function loadMentorDayFramework(segment = 1, week = 1, day = 1) {
  const db = await fetchMentorDayGuide(segment, week, day);
  const guide = db ?? getMentorDayFromSeed(segment, week, day);
  return {
    guide,
    weekTheme: MENTOR_WEEK_THEMES[`${segment}-${week}`] ?? '',
    source: db ? 'db' : 'seed',
  };
}

/** @param {'faculty' | 'mentor'} kind */
export async function loadAllFrameworkDays(kind) {
  const db = await fetchAllFrameworkDays(kind);
  if (db?.length) return { days: db, source: 'db' };
  const seed = kind === 'faculty' ? listFacultyDaysFromSeed(1, 1) : listMentorDaysFromSeed(1, 1);
  return { days: seed, source: 'seed' };
}

/** @param {Array<{ squad?: string }>} interns */
export function groupInternsBySquad(interns) {
  /** @type {Record<string, Array<{ id: string, name: string }>>} */
  const map = {};
  for (const intern of interns) {
    const squad = intern.squad?.trim() || 'Unassigned';
    if (!map[squad]) map[squad] = [];
    map[squad].push({ id: intern.id, name: intern.name });
  }
  return Object.entries(map).map(([name, members]) => ({ name, members, count: members.length }));
}

/** @param {Array<{ id: string, licensed?: boolean, hours?: number }>} interns */
export function deriveMentorRiskFlags(interns) {
  return interns.filter((i) => !i.licensed && (i.hours ?? 0) >= 85 && (i.hours ?? 0) < 115);
}

/** @param {string} participantId */
export function deriveBlueprintCompletionPct(participantId) {
  return getCoachSummaryForMentor(participantId)?.progress?.percent ?? 0;
}
