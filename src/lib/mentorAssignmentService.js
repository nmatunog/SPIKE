/**
 * Mentor assignment scoping — filter cohort to assigned squads.
 */
import { ensureFormationStore } from './cohortFormationStorage.js';
import { isAdminLikeRole } from './roles.js';

/** @param {string} mentorId */
export function getParticipantIdsForMentor(mentorId) {
  if (!mentorId) return [];
  const squads = ensureFormationStore().squads.filter((s) => s.mentorId === mentorId);
  const ids = new Set();
  for (const squad of squads) {
    for (const member of squad.members ?? []) {
      if (member.participantId) ids.add(member.participantId);
    }
  }
  return [...ids];
}

/**
 * @param {Array<{ id: string }>} interns
 * @param {string | undefined} mentorId
 * @param {string} [userRole]
 */
export function filterInternsForMentor(interns, mentorId, userRole = 'mentor') {
  if (!mentorId || isAdminLikeRole(userRole)) return interns;
  const assigned = new Set(getParticipantIdsForMentor(mentorId));
  if (!assigned.size) return interns;
  return interns.filter((intern) => assigned.has(intern.id));
}

/** @param {string} mentorId */
export function getMentorSquads(mentorId) {
  if (!mentorId) return [];
  return ensureFormationStore().squads.filter((s) => s.mentorId === mentorId);
}
