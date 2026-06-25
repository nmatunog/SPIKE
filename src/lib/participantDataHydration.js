/**
 * Load participant work from Supabase for mentor / program-coach review.
 */
import { hydrateParticipantBuilderData, hydrateCohortBuilderData } from './day1BuilderSync.js';
import { hydrateVentureBlueprint } from './ventureBlueprintSync.js';
import { hydratePlaybookProgressFromSupabase } from './playbookProgressSync.js';
import { hydrateSurveysFromSupabase } from './surveyService.js';
import { hydrateCanvasFromSupabase } from './canvasService.js';
import { syncParticipantSquadCacheFromInterns } from './participantSquadCache.js';
import { hydrateWeek2DiscoveryFromCloud } from './customerDiscovery/week2DiscoverySync.js';

/** Staff review — cloud is source of truth; never upsert participant rows from a coach device. */
const remoteOpts = { preferRemote: true, readOnly: true };

const COHORT_HYDRATION_CHUNK = 5;

/** @param {string} id @param {typeof remoteOpts & { force?: boolean }} staffOpts */
async function hydrateWeek2ForStaff(id, staffOpts) {
  await hydrateWeek2DiscoveryFromCloud(id, staffOpts);
}

/** @param {string[]} ids @param {typeof remoteOpts & { force?: boolean }} staffOpts */
async function hydrateCohortChunk(ids, staffOpts) {
  await Promise.all([
    ...ids.map((id) => hydrateVentureBlueprint(id, staffOpts)),
    ...ids.map((id) => hydratePlaybookProgressFromSupabase(id, staffOpts)),
    ...ids.map((id) => hydrateSurveysFromSupabase(id, staffOpts)),
    ...ids.map((id) => hydrateCanvasFromSupabase(id, staffOpts)),
    ...ids.map((id) => hydrateWeek2ForStaff(id, staffOpts)),
    hydrateCohortBuilderData(ids, staffOpts),
  ]);
}

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
    hydrateWeek2ForStaff(participantId, staffOpts),
  ]);
}

/**
 * Hydrate squad members' Week 2 discovery + playbook progress for Squad XP aggregation.
 * @param {string[]} memberIds
 * @param {{ force?: boolean }} [opts]
 */
export async function hydrateSquadMembersForStaffView(memberIds, opts = {}) {
  const ids = memberIds.filter((id) => id && !String(id).startsWith('mock-'));
  if (!ids.length) return;
  const staffOpts = { ...remoteOpts, ...opts };
  await Promise.all(
    ids.flatMap((id) => [
      hydrateWeek2ForStaff(id, staffOpts),
      hydratePlaybookProgressFromSupabase(id, staffOpts),
    ]),
  );
}

/** @param {string[]} participantIds @param {{ force?: boolean, interns?: Array<{ id: string, squad?: string }> }} [opts] */
export async function hydrateCohortForStaffView(participantIds, opts = {}) {
  const ids = participantIds.filter((id) => id && !String(id).startsWith('mock-'));
  if (!ids.length) return;
  const staffOpts = { ...remoteOpts, ...opts };
  if (staffOpts.interns?.length) {
    syncParticipantSquadCacheFromInterns(staffOpts.interns);
  }
  for (let i = 0; i < ids.length; i += COHORT_HYDRATION_CHUNK) {
    const chunk = ids.slice(i, i + COHORT_HYDRATION_CHUNK);
    await hydrateCohortChunk(chunk, staffOpts);
  }
}
