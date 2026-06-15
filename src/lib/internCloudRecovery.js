/**
 * One-time recovery: pull substantive intern work from Supabase into localStorage
 * when the device was wiped by a bad cloud merge on login.
 */
import { hydrateParticipantBuilderData } from './day1BuilderSync.js';
import { hydratePlaybookProgressFromSupabase } from './playbookProgressSync.js';
import { hydrateSurveysFromSupabase } from './surveyService.js';
import { hydrateVentureBlueprint } from './ventureBlueprintSync.js';
import { fetchRemoteWorkAssessment } from './participantRemoteData.js';
import { assessLocalInternWork } from './internLocalWorkAssessment.js';
import { isMockUserId } from './mockAuth.js';

const RECOVERY_DONE_KEY = 'spike_intern_cloud_recovery_v1';

const recoveryHydrateOpts = { preferRemote: true, force: true };

/**
 * @param {ReturnType<typeof assessLocalInternWork>} local
 * @param {Awaited<ReturnType<typeof fetchRemoteWorkAssessment>>} remote
 */
export function needsCloudRecovery(local, remote) {
  if (!remote?.hasSubstantiveData) return false;
  if (!local.isSparse && local.substantiveScore >= remote.substantiveScore) return false;
  return remote.substantiveScore > local.substantiveScore + 5;
}

/** @param {string} participantId */
export async function recoverInternWorkFromSupabase(participantId) {
  if (!participantId || isMockUserId(participantId)) {
    return { recovered: false, reason: 'skipped' };
  }

  await Promise.all([
    hydrateParticipantBuilderData(participantId, recoveryHydrateOpts),
    hydrateVentureBlueprint(participantId, recoveryHydrateOpts),
    hydratePlaybookProgressFromSupabase(participantId, recoveryHydrateOpts),
    hydrateSurveysFromSupabase(participantId, recoveryHydrateOpts),
  ]);

  markCloudRecoveryDone(participantId);

  const after = assessLocalInternWork(participantId);
  return {
    recovered: true,
    localScoreAfter: after.substantiveScore,
  };
}

/**
 * Assess local vs cloud; recover when cloud clearly has more work.
 * @param {string} participantId
 */
export async function maybeRecoverInternWorkFromSupabase(participantId) {
  if (!participantId || isMockUserId(participantId)) {
    return { action: 'skipped' };
  }

  const [local, remote] = await Promise.all([
    Promise.resolve(assessLocalInternWork(participantId)),
    fetchRemoteWorkAssessment(participantId),
  ]);

  if (!needsCloudRecovery(local, remote)) {
    return { action: 'not_needed', local, remote };
  }

  const result = await recoverInternWorkFromSupabase(participantId);
  return { action: 'recovered', local, remote, ...result };
}

/** @param {string} participantId */
export function markCloudRecoveryDone(participantId) {
  try {
    const flags = JSON.parse(localStorage.getItem(RECOVERY_DONE_KEY) || '{}');
    flags[participantId] = new Date().toISOString();
    localStorage.setItem(RECOVERY_DONE_KEY, JSON.stringify(flags));
  } catch {
    /* storage unavailable */
  }
}

/** @param {string} participantId */
export function hasCompletedCloudRecovery(participantId) {
  try {
    const flags = JSON.parse(localStorage.getItem(RECOVERY_DONE_KEY) || '{}');
    return Boolean(flags[participantId]);
  } catch {
    return false;
  }
}
