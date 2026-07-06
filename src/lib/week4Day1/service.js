import {
  getFecUnifiedVentureProposition,
  getFecField,
} from '../fecCanvasService.js';
import { getWeek3Day3FecBoxDisplayText } from '../week3Day3FecBoxContent.js';
import {
  loadWeek4Day1Mission,
  saveWeek4Day1Mission,
  defaultWeek4Day1MissionState,
} from './storage.js';
import {
  finalizeMission1VentureProposition,
  finalizeMission2ClientExperience,
  finalizeMission3WinningStrategy,
  finalizeMission4GrowthEngines,
} from './fecFinalize.js';
import { finalizeBlueprintIntegration } from './blueprintFinalize.js';

/** @param {string} participantId */
export function loadWeek4Day1MissionWithSuggestions(participantId) {
  const state = loadWeek4Day1Mission(participantId);
  const drafts = { ...state.drafts };

  if (!drafts.mission1.finalProposition.trim()) {
    drafts.mission1.finalProposition = getFecUnifiedVentureProposition(participantId) || '';
  }
  if (!drafts.mission2.clientExperience.trim()) {
    drafts.mission2.clientExperience =
      getWeek3Day3FecBoxDisplayText(participantId, 'client_experience')
      || String(getFecField(participantId, 'create_value', 'value_offering') ?? '').trim();
  }
  if (!drafts.mission3.winningStrategy.trim()) {
    drafts.mission3.winningStrategy =
      getWeek3Day3FecBoxDisplayText(participantId, 'winning_strategy')
      || String(getFecField(participantId, 'agency_leadership', 'growth_multipliers') ?? '').trim();
  }

  return { ...state, drafts };
}

/** @param {string} participantId @param {number} step */
export function canCompleteWeek4Day1Step(state, step) {
  const d = state.drafts;
  switch (step) {
    case 1:
      return String(d.mission1.finalProposition ?? '').trim().length >= 20;
    case 2:
      return String(d.mission2.clientExperience ?? '').trim().length >= 30;
    case 3:
      return String(d.mission3.winningStrategy ?? '').trim().length >= 20;
    case 4: {
      const sel = d.mission4.selected ?? {};
      return (
        (sel.advisorExcellence?.length ?? 0) > 0
        || (sel.teamLeadership?.length ?? 0) > 0
        || (sel.systemsScale?.length ?? 0) > 0
      );
    }
    case 5:
      return state.founderReviewAcknowledged;
    case 6:
      return (
        String(d.blueprint.keyActivities ?? '').trim().length >= 20
        && String(d.blueprint.keyResources ?? '').trim().length >= 20
      );
    default:
      return false;
  }
}

/** @param {string} participantId @param {import('./types.js').Week4Day1MissionState} state @param {number} step */
export function completeWeek4Day1Step(participantId, state, step) {
  if (!canCompleteWeek4Day1Step(state, step)) return null;

  let ok = true;
  if (step === 1) ok = finalizeMission1VentureProposition(participantId, state.drafts.mission1);
  if (step === 2) ok = finalizeMission2ClientExperience(participantId, state.drafts.mission2);
  if (step === 3) ok = finalizeMission3WinningStrategy(participantId, state.drafts.mission3);
  if (step === 4) ok = finalizeMission4GrowthEngines(participantId, state.drafts.mission4);
  if (step === 6) ok = finalizeBlueprintIntegration(participantId, state.drafts.blueprint);
  if (!ok && step !== 5) return null;

  const completedSteps = state.completedSteps.includes(step)
    ? state.completedSteps
    : [...state.completedSteps, step].sort((a, b) => a - b);

  const nextStep = step < 6 ? step + 1 : 6;
  const completedAt =
    completedSteps.length >= 6 ? new Date().toISOString() : state.completedAt;

  return saveWeek4Day1Mission(participantId, {
    ...state,
    completedSteps,
    currentStep: Math.min(nextStep, 6),
    completedAt,
  });
}

/** @param {string} participantId */
export function resetWeek4Day1MissionDraft(participantId) {
  return saveWeek4Day1Mission(participantId, defaultWeek4Day1MissionState(participantId));
}
