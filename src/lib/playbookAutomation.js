/**
 * Playbook Integration Engine — routes completed items to Venture Blueprint (Sprint 04/05).
 */
import {
  syncPlaybookActivity,
  syncPlaybookWorksheet,
  syncReflectionCompletion,
  syncSurveyCompletion,
} from './ventureBlueprintSync.js';

export {
  syncPlaybookWorksheet,
  syncPlaybookActivity,
  syncReflectionCompletion,
  syncSurveyCompletion,
};

/**
 * @param {{
 *   participantId: string,
 *   itemType: 'worksheet' | 'activity' | 'reflection' | 'survey',
 *   itemId: string,
 *   payload?: Record<string, unknown>,
 *   questions?: Array<{ id: string, prompt: string }>,
 *   activity?: { title: string, outputs: string[] },
 *   reflection?: { title: string },
 *   survey?: { title: string },
 * }} input
 */
export function runPlaybookAutomation(input) {
  const { participantId, itemType, itemId, payload = {}, questions, activity, reflection, survey } =
    input;

  switch (itemType) {
    case 'worksheet':
      return syncPlaybookWorksheet(
        participantId,
        itemId,
        /** @type {Record<string, unknown>} */ (payload.answers ?? {}),
        questions ?? [],
      );
    case 'activity':
      if (!activity) return null;
      return syncPlaybookActivity(participantId, itemId, activity);
    case 'reflection':
      if (!reflection) return null;
      return syncReflectionCompletion(
        participantId,
        itemId,
        /** @type {Record<string, string>} */ (payload.responses ?? {}),
        reflection,
      );
    case 'survey':
      if (!survey) return null;
      return syncSurveyCompletion(
        participantId,
        itemId,
        /** @type {Record<string, unknown>} */ (payload.answers ?? {}),
        questions ?? [],
        survey,
      );
    default:
      return null;
  }
}
