/**
 * Merge local + cloud Week 2 discovery without dropping encoded interviews.
 */

/** @param {import('./week2DiscoveryTypes.js').Week2EncodedInterview | undefined} iv */
function interviewRichness(iv) {
  if (!iv) return 0;
  const answers = (iv.answers ?? []).filter((a) => String(a).trim().length > 0).length;
  const substantial = (iv.answers ?? []).filter((a) => String(a).trim().length > 8).length;
  return (
    substantial * 20
    + answers * 5
    + (iv.encoded ? 200 : 0)
    + (String(iv.alias ?? '').trim().length > 1 ? 10 : 0)
    + String(iv.reflection ?? '').trim().length
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
    const localIv = localArr?.[i];
    const remoteIv = remoteArr?.[i];
    if (!localIv && remoteIv) {
      merged.push(remoteIv);
      continue;
    }
    if (localIv && !remoteIv) {
      merged.push(localIv);
      continue;
    }
    if (!localIv && !remoteIv) continue;
    merged.push(interviewRichness(localIv) >= interviewRichness(remoteIv) ? localIv : remoteIv);
  }
  return merged;
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
