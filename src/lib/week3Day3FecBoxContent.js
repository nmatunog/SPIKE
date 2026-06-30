import { getFecField } from './fecCanvasService.js';
import { loadFecValidation } from './customerDiscovery/week2FecValidationStorage.js';
import { getSquadNameForParticipant } from './customerDiscovery/week2SquadEvidenceService.js';
import { FEC_BOX_META } from './customerDiscovery/week2FecValidationConstants.js';

/** @typedef {'client_experience' | 'winning_strategy'} Week3Day3FecBoxId */

/** @param {'fec-step-4' | 'fec-step-5'} stepSlug */
export function week3Day3FecBoxIdForStep(stepSlug) {
  return stepSlug === 'fec-step-5' ? 'winning_strategy' : 'client_experience';
}

/** @param {string} participantId @param {Week3Day3FecBoxId} boxId */
export function getWeek3Day3FecBoxDisplayText(participantId, boxId) {
  if (!participantId) return '';
  const squadKey = getSquadNameForParticipant(participantId) || `solo-${participantId}`;
  const validated = String(loadFecValidation(squadKey).boxScores?.[boxId]?.approvedText ?? '').trim();
  if (validated) return validated;

  const meta = FEC_BOX_META[boxId];
  if (!meta) return '';
  return String(getFecField(participantId, meta.engineKey ?? 'create_value', meta.fieldKey) ?? '').trim();
}
