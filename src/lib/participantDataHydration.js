/**
 * Load participant work from Supabase for mentor / program-coach review.
 */
import { hydrateParticipantBuilderData, hydrateCohortBuilderData } from './day1BuilderSync.js';
import { hydrateVentureBlueprint } from './ventureBlueprintSync.js';
import { hydratePlaybookProgressFromSupabase } from './playbookProgressSync.js';
import { hydrateSurveysFromSupabase } from './surveyService.js';
import { hydrateCanvasFromSupabase } from './canvasService.js';
import { syncParticipantSquadCacheFromInterns } from './participantSquadCache.js';

const remoteOpts = { preferRemote: true };

/** @param {string} participantId @param {{ force?: boolean }} [opts] */
export async function hydrateParticipantForStaffView(participantId, opts = {}) {
  if (!participantId || String(participantId).startsWith('mock-')) return;
  await Promise.all([
    hydrateVentureBlueprint(participantId, remoteOpts),
    hydrateParticipantBuilderData(participantId, opts),
    hydratePlaybookProgressFromSupabase(participantId, { ...opts, ...remoteOpts }),
    hydrateSurveysFromSupabase(participantId, { ...opts, ...remoteOpts }),
    hydrateCanvasFromSupabase(participantId, remoteOpts),
  ]);
}

/** @param {string[]} participantIds @param {{ force?: boolean, interns?: Array<{ id: string, squad?: string }> }} [opts] */
export async function hydrateCohortForStaffView(participantIds, opts = {}) {
  const ids = participantIds.filter((id) => id && !String(id).startsWith('mock-'));
  if (!ids.length) return;
  if (opts.interns?.length) {
    syncParticipantSquadCacheFromInterns(opts.interns);
  }
  await Promise.all([
    ...ids.map((id) => hydrateVentureBlueprint(id, remoteOpts)),
    ...ids.map((id) => hydratePlaybookProgressFromSupabase(id, { ...opts, ...remoteOpts })),
    ...ids.map((id) => hydrateSurveysFromSupabase(id, { ...opts, ...remoteOpts })),
    ...ids.map((id) => hydrateCanvasFromSupabase(id, remoteOpts)),
    hydrateCohortBuilderData(ids, opts),
  ]);
}
