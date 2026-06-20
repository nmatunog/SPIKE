/**
 * Week 1 mentor weekly assessments — localStorage + optional Supabase sync.
 */
import { WEEK1_ASSESSMENT_CATEGORIES } from './mentorWeek1Constants.js';
import { createWeeklyMentorAssessment, fetchWeeklyMentorAssessment } from './supabase/weeklyMentorAssessments.js';

const STORAGE_KEY = 'spike_weekly_mentor_assessments';

/** @type {Set<string>} */
const hydratedAssessments = new Set();

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeAll(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** @param {string} participantId @param {number} [week] */
export function getWeeklyAssessment(participantId, week = 1) {
  const key = `${participantId}:w${week}`;
  return readAll()[key] ?? null;
}

/**
 * Merge Supabase assessment into local cache when local is empty.
 * @param {string} participantId
 * @param {number} [week]
 */
export async function hydrateWeeklyAssessmentFromSupabase(participantId, week = 1) {
  const cacheKey = `${participantId}:w${week}`;
  if (!participantId || String(participantId).startsWith('mock-') || hydratedAssessments.has(cacheKey)) {
    return;
  }

  if (readAll()[cacheKey]) {
    hydratedAssessments.add(cacheKey);
    return;
  }

  const remote = await fetchWeeklyMentorAssessment(participantId, week);
  if (!remote) {
    hydratedAssessments.add(cacheKey);
    return;
  }

  const entry = {
    id: remote.id,
    mentorId: remote.mentor_id,
    participantId: remote.participant_id,
    week: remote.week,
    scores: remote.scores ?? {},
    notes: remote.notes ?? '',
    recommendation: remote.recommendation ?? 'continue_normally',
    createdAt: remote.created_at,
    updatedAt: remote.updated_at,
  };

  const all = readAll();
  all[cacheKey] = entry;
  writeAll(all);
  hydratedAssessments.add(cacheKey);
}

/**
 * @param {string} mentorId
 * @param {string} participantId
 * @param {{
 *   week?: number,
 *   scores?: Record<string, number>,
 *   notes?: string,
 *   recommendation?: string,
 * }} input
 */
export async function saveWeeklyAssessment(mentorId, participantId, input = {}) {
  if (!mentorId || !participantId) return null;

  const week = input.week ?? 1;
  /** @type {Record<string, number>} */
  const scores = {};

  if (input.scores?.overall) {
    scores.overall = Math.min(5, Math.max(1, Number(input.scores.overall) || 0));
  } else {
    for (const cat of WEEK1_ASSESSMENT_CATEGORIES) {
      const raw = Number(input.scores?.[cat.id] ?? 0);
      scores[cat.id] = Math.min(cat.max, Math.max(cat.min, raw || 0));
    }
  }

  const entry = {
    id: `assess-${crypto.randomUUID()}`,
    mentorId,
    participantId,
    week,
    scores,
    notes: String(input.notes ?? '').trim().slice(0, 4000),
    recommendation: input.recommendation ?? 'continue_normally',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const all = readAll();
  all[`${participantId}:w${week}`] = entry;
  writeAll(all);

  void createWeeklyMentorAssessment(mentorId, participantId, entry);
  return entry;
}

/** @param {Record<string, number>} scores */
export function averageAssessmentScore(scores) {
  const values = Object.values(scores ?? {}).filter((v) => v > 0);
  if (!values.length) return 0;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

/** @param {string[]} participantIds @param {number} [week] */
export function countAssessmentsForParticipants(participantIds, week = 1) {
  const all = readAll();
  return participantIds.filter((id) => Boolean(all[`${id}:w${week}`])).length;
}
