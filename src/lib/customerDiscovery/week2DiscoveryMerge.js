/**
 * Merge local + cloud Week 2 discovery without dropping encoded interviews.
 */
import { MAX_INTERVIEW_QUESTIONS } from './week2Constants.js';
import { padInterviewAnswers } from './week2DiscoveryStorage.js';
import { buildEncodedInterviewRecord } from './week2InterviewEncode.js';

/** @param {string | null | undefined} a @param {string | null | undefined} b */
function pickRicherText(a, b) {
  const textA = String(a ?? '').trim();
  const textB = String(b ?? '').trim();
  if (!textA) return String(b ?? '');
  if (!textB) return textA;
  return textB.length >= textA.length ? textB : textA;
}

/**
 * @param {import('./week2DiscoveryTypes.js').Week2EncodedInterview | undefined} localIv
 * @param {import('./week2DiscoveryTypes.js').Week2EncodedInterview | undefined} remoteIv
 */
export function mergeWeek2InterviewSlot(localIv, remoteIv) {
  if (!localIv && remoteIv) return { ...remoteIv };
  if (localIv && !remoteIv) return { ...localIv };
  if (!localIv && !remoteIv) return null;

  const maxAnswers = Math.max(
    localIv.answers?.length ?? 0,
    remoteIv.answers?.length ?? 0,
    MAX_INTERVIEW_QUESTIONS,
  );
  /** @type {string[]} */
  const answers = [];
  for (let i = 0; i < maxAnswers; i++) {
    answers.push(pickRicherText(localIv.answers?.[i], remoteIv.answers?.[i]));
  }

  return buildEncodedInterviewRecord(
    {
      ...localIv,
      ...remoteIv,
      id: localIv.id ?? remoteIv.id,
      encodedAt: localIv.encodedAt || remoteIv.encodedAt || null,
    },
    {
      alias: pickRicherText(localIv.alias, remoteIv.alias),
      occupation: pickRicherText(localIv.occupation, remoteIv.occupation),
      reflection: pickRicherText(localIv.reflection, remoteIv.reflection),
      answers: padInterviewAnswers(answers),
    },
  );
}

/**
 * @param {import('./week2DiscoveryTypes.js').Week2EncodedInterview[] | undefined} localArr
 * @param {import('./week2DiscoveryTypes.js').Week2EncodedInterview[] | undefined} remoteArr
 */
export function mergeWeek2Interviews(localArr, remoteArr) {
  const maxLen = Math.max(localArr?.length ?? 0, remoteArr?.length ?? 0, 3);
  /** @type {import('./week2DiscoveryTypes.js').Week2EncodedInterview[]} */
  const merged = [];
  for (let i = 0; i < maxLen; i++) {
    const slot = mergeWeek2InterviewSlot(localArr?.[i], remoteArr?.[i]);
    if (slot) merged.push(slot);
  }
  return merged;
}

/**
 * @param {string | null | undefined} a
 * @param {string | null | undefined} b
 */
function orTimestamp(a, b) {
  return a || b || null;
}

/**
 * @param {import('./week2DiscoveryTypes.js').Week2DiscoveryState} local
 * @param {import('./week2DiscoveryTypes.js').Week2DiscoveryState} remote
 */
export function mergeWeek2DiscoveryStates(local, remote) {
  const localAt = String(local.updatedAt ?? '');
  const remoteAt = String(remote.updatedAt ?? '');
  const newerBase = remoteAt > localAt ? remote : local;
  const olderBase = remoteAt > localAt ? local : remote;

  const mergedQuestions =
    (local.questions?.filter((q) => String(q.text ?? '').trim().length > 8).length ?? 0)
    >= (remote.questions?.filter((q) => String(q.text ?? '').trim().length > 8).length ?? 0)
      ? local.questions
      : remote.questions;

  return {
    ...olderBase,
    ...newerBase,
    missionAcknowledged: Boolean(local.missionAcknowledged || remote.missionAcknowledged),
    assumptionsCompletedAt: orTimestamp(local.assumptionsCompletedAt, remote.assumptionsCompletedAt),
    guideCompletedAt: orTimestamp(local.guideCompletedAt, remote.guideCompletedAt),
    researchPlanSubmittedAt: orTimestamp(local.researchPlanSubmittedAt, remote.researchPlanSubmittedAt),
    squadAlignedAt: orTimestamp(local.squadAlignedAt, remote.squadAlignedAt),
    exchangeReflectionAt: orTimestamp(local.exchangeReflectionAt, remote.exchangeReflectionAt),
    professionalReadinessAt: orTimestamp(local.professionalReadinessAt, remote.professionalReadinessAt),
    readinessReflectionAt: orTimestamp(local.readinessReflectionAt, remote.readinessReflectionAt),
    readinessReflectionApprovedAt: orTimestamp(local.readinessReflectionApprovedAt, remote.readinessReflectionApprovedAt),
    uvpCheckpointAt: orTimestamp(local.uvpCheckpointAt, remote.uvpCheckpointAt),
    pctcStartedAt: orTimestamp(local.pctcStartedAt, remote.pctcStartedAt),
    readinessBadgeEarnedAt: orTimestamp(local.readinessBadgeEarnedAt, remote.readinessBadgeEarnedAt),
    pctcCertificate1Id: local.pctcCertificate1Id || remote.pctcCertificate1Id || '',
    pctcCertificate2Id: local.pctcCertificate2Id || remote.pctcCertificate2Id || '',
    weekWrapCompletedAt: orTimestamp(local.weekWrapCompletedAt, remote.weekWrapCompletedAt),
    empathyLabCompletedAt: orTimestamp(local.empathyLabCompletedAt, remote.empathyLabCompletedAt),
    pitchSubmittedAt: orTimestamp(local.pitchSubmittedAt, remote.pitchSubmittedAt),
    interviews: mergeWeek2Interviews(local.interviews, remote.interviews),
    questions: mergedQuestions?.length ? mergedQuestions : newerBase.questions ?? local.questions,
    assumptions:
      (local.assumptions?.length ?? 0) >= (remote.assumptions?.length ?? 0)
        ? local.assumptions
        : remote.assumptions,
    pitchOutline: {
      ...(olderBase.pitchOutline ?? {}),
      ...(newerBase.pitchOutline ?? {}),
    },
    updatedAt: remoteAt > localAt ? remoteAt : localAt,
    cloudSyncedAt:
      remote.cloudSyncedAt && local.cloudSyncedAt
        ? remote.cloudSyncedAt > local.cloudSyncedAt
          ? remote.cloudSyncedAt
          : local.cloudSyncedAt
        : remote.cloudSyncedAt ?? local.cloudSyncedAt ?? null,
  };
}
