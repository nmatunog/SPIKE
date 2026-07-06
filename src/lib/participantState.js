import { deriveWeekDay } from './sprint01Metrics.js';
import { resolveInternPlaybookDay, resolveInternProgramWeek, UNLOCK_WEEK2, UNLOCK_WEEK4 } from './programUnlocks.js';
import { countCompletedFnas } from './fnaService.js';
import { computeSpikeReadinessScore } from './spikeReadinessScore.js';
import { computeBlueprintCompletion } from './blueprintCompletion.js';
import { SUPERUSER_INTERN_PREVIEW_PARTICIPANT_ID } from './superuserInternPreviewData.js';
import { resolveSuperuserInternCalendarDay } from './superuserInternPreview.js';

/**
 * Program State Engine (PRD Engine 1) — master state from intern_progress until DB view exists.
 * @param {string} participantId
 * @param {import('../AuthContext.jsx').object} internProgress — intern_progress row
 */
export function buildParticipantState(participantId, internProgress) {
  const hours = internProgress?.hours ?? 0;
  const segment = internProgress?.segment ?? 1;
  const derived = deriveWeekDay(hours);
  let week = resolveInternProgramWeek(internProgress);
  let day = internProgress?.current_day ?? derived.currentDay;
  if (participantId === SUPERUSER_INTERN_PREVIEW_PARTICIPANT_ID) {
    if (UNLOCK_WEEK2 && segment === 1) {
      week = resolveInternProgramWeek(internProgress);
      day = resolveInternPlaybookDay(internProgress);
    } else {
      const calendar = resolveSuperuserInternCalendarDay();
      week = calendar.week;
      day = calendar.day;
    }
  } else if (UNLOCK_WEEK2 && segment === 1 && week >= 2) {
    day = resolveInternPlaybookDay(internProgress);
  }
  if (UNLOCK_WEEK4 && segment === 1 && week >= 4) {
    day = resolveInternPlaybookDay(internProgress);
  }
  const trackSelected = Boolean(internProgress?.career_track_selected_at);
  const careerTrack = trackSelected
    ? normalizeCareerTrack(internProgress?.career_track)
    : 'undecided';
  const readiness = computeSpikeReadinessScore(internProgress, {
    fnaCount: countCompletedFnas(participantId),
  });
  const blueprint = computeBlueprintCompletion(participantId);

  return {
    participant_id: participantId,
    segment,
    week,
    day,
    hours,
    career_track: careerTrack,
    career_position: defaultCareerPosition(careerTrack, trackSelected),
    career_track_selected: trackSelected,
    blueprint_completion: blueprint.composite,
    blueprint_sections: blueprint.sections,
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

/** @param {string} careerTrack @param {boolean} trackSelected */
function defaultCareerPosition(careerTrack, trackSelected) {
  if (!trackSelected) return 'intern';
  return careerTrack === 'specialist_consultant' ? 'associate_advisor' : 'advisor';
}

/** @param {number} hours @param {number} segment */
function ventureBoardStatus(hours, segment) {
  if (segment >= 2 && hours >= 200) return 'in_progress';
  if (hours >= 180) return 'preparing';
  return 'not_started';
}

/** @param {ReturnType<typeof buildParticipantState>} state */
export function formatCareerTrackLabel(state) {
  if (!state.career_track_selected) {
    if (state.week >= 3) return 'Choose your track';
    if (state.week >= 2) return 'Track — Week 3';
    return 'Track — after Week 1';
  }
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
