/**
 * Legacy weekly assessments — read-only; new scoring uses squadXpService.
 * One-time migration: squadAssessmentMigration.js
 */
import { fetchWeeklyMentorAssessment } from './supabase/weeklyMentorAssessments.js';

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
 * @deprecated Use squad weekly review + appendSquadInternNote instead.
 */
export async function saveWeeklyAssessment() {
  console.warn('[SPIKE] saveWeeklyAssessment is deprecated — use SquadWeeklyReviewPanel + squadInternNotesService.');
  return null;
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
