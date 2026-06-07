/**
 * Playbook Integration Engine — routes completed items to Venture Blueprint (Sprint 04).
 */
import { syncPlaybookActivity, syncPlaybookReflection, syncPlaybookWorksheet } from './playbookBlueprintSync.js';

export { syncPlaybookWorksheet, syncPlaybookActivity, syncPlaybookReflection };

/**
 * @param {{
 *   participantId: string,
 *   itemType: 'worksheet' | 'activity' | 'reflection',
 *   itemId: string,
 *   payload?: Record<string, unknown>,
 *   questions?: Array<{ id: string, prompt: string }>,
 *   activity?: { title: string, outputs: string[] },
 *   reflection?: { title: string },
 * }} input
 */
export function runPlaybookAutomation(input) {
  const { participantId, itemType, itemId, payload = {}, questions, activity, reflection } = input;

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
      return syncPlaybookReflection(
        participantId,
        itemId,
        /** @type {Record<string, string>} */ (payload.responses ?? {}),
        reflection,
      );
    default:
      return null;
  }
}
