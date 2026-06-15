/**
 * Load participant work from Supabase for mentor / program-coach review.
 */
import { hydrateParticipantBuilderData, hydrateCohortBuilderData } from './day1BuilderSync.js';
import { hydrateVentureBlueprint } from './ventureBlueprintSync.js';

/** @param {string} participantId @param {{ force?: boolean }} [opts] */
export async function hydrateParticipantForStaffView(participantId, opts = {}) {
  if (!participantId || String(participantId).startsWith('mock-')) return;
  await Promise.all([
    hydrateVentureBlueprint(participantId),
    hydrateParticipantBuilderData(participantId, opts),
  ]);
}

/** @param {string[]} participantIds @param {{ force?: boolean }} [opts] */
export async function hydrateCohortForStaffView(participantIds, opts = {}) {
  const ids = participantIds.filter((id) => id && !String(id).startsWith('mock-'));
  if (!ids.length) return;
  await Promise.all([
    ...ids.map((id) => hydrateVentureBlueprint(id)),
    hydrateCohortBuilderData(ids, opts),
  ]);
}
