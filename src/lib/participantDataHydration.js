/**
 * Load participant work from Supabase for mentor / program-coach review.
 */
import { hydrateParticipantBuilderData, hydrateCohortBuilderData } from './day1BuilderSync.js';
import { hydrateVentureBlueprint } from './ventureBlueprintSync.js';
import { hydratePlaybookProgressFromSupabase } from './playbookProgressSync.js';
import { hydrateSurveysFromSupabase } from './surveyService.js';
import { hydrateCanvasFromSupabase } from './canvasService.js';
import { syncParticipantSquadCacheFromInterns } from './participantSquadCache.js';

/** Staff review — cloud is source of truth; never upsert participant rows from a coach device. */
const remoteOpts = { preferRemote: true, readOnly: true };

/** @param {string} participantId @param {{ force?: boolean }} [opts] */
export async function hydrateParticipantForStaffView(participantId, opts = {}) {
  if (!participantId || String(participantId).startsWith('mock-')) return;
  const staffOpts = { ...remoteOpts, ...opts };
  await Promise.all([
    hydrateVentureBlueprint(participantId, staffOpts),
    hydrateParticipantBuilderData(participantId, staffOpts),
    hydratePlaybookProgressFromSupabase(participantId, staffOpts),
    hydrateSurveysFromSupabase(participantId, staffOpts),
    hydrateCanvasFromSupabase(participantId, staffOpts),
  ]);
}

/** @param {string[]} participantIds @param {{ force?: boolean, interns?: Array<{ id: string, squad?: string }> }} [opts] */
export async function hydrateCohortForStaffView(participantIds, opts = {}) {
  const ids = participantIds.filter((id) => id && !String(id).startsWith('mock-'));
  if (!ids.length) return;
  const staffOpts = { ...remoteOpts, ...opts };
  if (staffOpts.interns?.length) {
    syncParticipantSquadCacheFromInterns(staffOpts.interns);
  }
  await Promise.all([
    ...ids.map((id) => hydrateVentureBlueprint(id, staffOpts)),
    ...ids.map((id) => hydratePlaybookProgressFromSupabase(id, staffOpts)),
    ...ids.map((id) => hydrateSurveysFromSupabase(id, staffOpts)),
    ...ids.map((id) => hydrateCanvasFromSupabase(id, staffOpts)),
    hydrateCohortBuilderData(ids, staffOpts),
  ]);
}
