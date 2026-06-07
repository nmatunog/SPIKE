import { deriveWeekDay } from './sprint01Metrics.js';
import { countCompletedFnas } from './fnaService.js';
import { computeSpikeReadinessScore } from './spikeReadinessScore.js';

/**
 * Program State Engine (PRD Engine 1) — master state from intern_progress until DB view exists.
 * @param {string} participantId
 * @param {import('../AuthContext.jsx').object} internProgress — intern_progress row
 */
export function buildParticipantState(participantId, internProgress) {
  const hours = internProgress?.hours ?? 0;
  const segment = internProgress?.segment ?? 1;
  const derived = deriveWeekDay(hours);
  const careerTrack = normalizeCareerTrack(internProgress?.career_track);
  const readiness = computeSpikeReadinessScore(internProgress, {
    fnaCount: countCompletedFnas(participantId),
  });

  return {
    participant_id: participantId,
    segment,
    week: internProgress?.current_week ?? derived.currentWeek,
    day: internProgress?.current_day ?? derived.currentDay,
    hours,
    career_track: careerTrack,
    career_position: defaultCareerPosition(careerTrack),
    blueprint_completion: estimateBlueprintCompletion(hours, readiness.composite),
    venture_board_status: ventureBoardStatus(hours, segment),
    spike_readiness_score: readiness.composite,
    spike_readiness_dimensions: readiness.dimensions,
  };
}

/** @param {string | null | undefined} value */
function normalizeCareerTrack(value) {
  if (value === 'specialist_consultant') return 'specialist_consultant';
  return 'agency_builder';
}

/** @param {string} careerTrack */
function defaultCareerPosition(careerTrack) {
  return careerTrack === 'specialist_consultant' ? 'associate_advisor' : 'advisor';
}

/** @param {number} hours @param {number} readinessComposite */
function estimateBlueprintCompletion(hours, readinessComposite) {
  const hourPct = Math.min(100, Math.round((hours / 600) * 55));
  return Math.min(100, Math.round(hourPct * 0.5 + readinessComposite * 0.5));
}

/** @param {number} hours @param {number} segment */
function ventureBoardStatus(hours, segment) {
  if (segment >= 2 && hours >= 200) return 'in_progress';
  if (hours >= 180) return 'preparing';
  return 'not_started';
}

/** @param {ReturnType<typeof buildParticipantState>} state */
export function formatCareerTrackLabel(state) {
  return state.career_track === 'specialist_consultant'
    ? 'Specialist Consultant'
    : 'Agency Builder';
}

/** @param {string} status */
export function formatVentureBoardStatus(status) {
  const labels = {
    not_started: 'Not started',
    preparing: 'Preparing packet',
    in_progress: 'In progress',
    submitted: 'Submitted',
    completed: 'Completed',
  };
  return labels[status] ?? status;
}
