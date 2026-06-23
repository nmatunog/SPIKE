/**
 * Aggregate interview evidence across squad members.
 */
import { loadWeek2Discovery } from './week2DiscoveryStorage.js';
import { getParticipantSquad } from '../cohortFormationService.js';
import { INTERVIEWS_PER_MEMBER, SQUAD_INTERVIEW_TARGET } from './week2FecValidationConstants.js';

/** @param {string} participantId */
export function getSquadMemberIds(participantId) {
  const squad = getParticipantSquad(participantId);
  const ids = (squad?.members ?? []).map((m) => m.participantId).filter(Boolean);
  return ids.length ? ids : [participantId];
}

/** @param {string} participantId */
export function getSquadNameForParticipant(participantId) {
  return getParticipantSquad(participantId)?.name ?? '';
}

/**
 * @param {string[]} memberIds
 * @returns {Array<import('./week2DiscoveryTypes.js').Week2EncodedInterview & { memberId: string }>}
 */
export function aggregateSquadInterviews(memberIds) {
  /** @type {Array<import('./week2DiscoveryTypes.js').Week2EncodedInterview & { memberId: string }>} */
  const all = [];
  for (const id of memberIds) {
    const state = loadWeek2Discovery(id);
    for (const iv of state.interviews ?? []) {
      if (iv.encoded) all.push({ ...iv, memberId: id });
    }
  }
  return all;
}

/** @param {string[]} memberIds */
export function squadEncodedInterviewCount(memberIds) {
  return aggregateSquadInterviews(memberIds).length;
}

/** @param {string} participantId */
export function squadEvidenceSummary(participantId) {
  const memberIds = getSquadMemberIds(participantId);
  const interviews = aggregateSquadInterviews(memberIds);
  const perMember = memberIds.map((id) => ({
    memberId: id,
    count: (loadWeek2Discovery(id).interviews ?? []).filter((i) => i.encoded).length,
  }));
  return {
    memberIds,
    squadName: getSquadNameForParticipant(participantId),
    interviewCount: interviews.length,
    target: SQUAD_INTERVIEW_TARGET,
    perMember,
    interviewsPerMember: INTERVIEWS_PER_MEMBER,
    readyForFecLab: interviews.length >= Math.min(SQUAD_INTERVIEW_TARGET, memberIds.length * INTERVIEWS_PER_MEMBER),
  };
}
