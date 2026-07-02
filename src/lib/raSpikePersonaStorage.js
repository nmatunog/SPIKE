const PREFIX = 'ra_spike_persona_v1';

/** @typedef {{ segment: string, problem: string, goals: string }} RaSpikePersona */

/** @param {string} participantId */
export function getRaSpikePersona(participantId) {
  if (!participantId) return { segment: '', problem: '', goals: '' };
  try {
    const raw = localStorage.getItem(`${PREFIX}:${participantId}`);
    return raw ? JSON.parse(raw) : { segment: '', problem: '', goals: '' };
  } catch {
    return { segment: '', problem: '', goals: '' };
  }
}

/** @param {string} participantId @param {RaSpikePersona} persona */
export function saveRaSpikePersona(participantId, persona) {
  if (!participantId) return;
  try {
    localStorage.setItem(`${PREFIX}:${participantId}`, JSON.stringify(persona));
  } catch {
    /* quota */
  }
}

/** @param {string} participantId */
export function isRaSpikePersonaComplete(participantId) {
  const p = getRaSpikePersona(participantId);
  return p.segment.trim().length >= 10 && p.problem.trim().length >= 10 && p.goals.trim().length >= 10;
}
