/**
 * Staff-side squad labels from intern_progress / formation_squad_members (via fetchInterns).
 * Week 1 checks use this when browser formation store is empty on coach devices.
 */

/** @type {Map<string, string>} */
const squadByParticipant = new Map();

/**
 * @param {Array<{ id: string, squad?: string | null }>} interns
 */
export function syncParticipantSquadCacheFromInterns(interns) {
  for (const intern of interns ?? []) {
    if (!intern?.id) continue;
    const label = intern.squad?.trim();
    if (label) squadByParticipant.set(intern.id, label);
  }
}

/** @param {string} participantId */
export function getParticipantSquadLabel(participantId) {
  return squadByParticipant.get(participantId) ?? null;
}

/** @param {string} participantId */
export function hasAssignedSquad(participantId) {
  return Boolean(getParticipantSquadLabel(participantId));
}

/** @param {string} participantId */
export function clearParticipantSquadCache(participantId) {
  squadByParticipant.delete(participantId);
}

export function clearAllParticipantSquadCache() {
  squadByParticipant.clear();
}
