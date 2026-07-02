const PREFIX = 'ra_spike_worksheet_v1';

/** @param {string} participantId @param {string} kind */
function key(participantId, kind) {
  return `${PREFIX}:${kind}:${participantId}`;
}

/** @param {string} participantId @param {string} kind */
export function getRaSpikeWorksheet(participantId, kind) {
  try {
    return localStorage.getItem(key(participantId, kind)) ?? '';
  } catch {
    return '';
  }
}

/** @param {string} participantId @param {string} kind @param {string} value */
export function saveRaSpikeWorksheet(participantId, kind, value) {
  try {
    localStorage.setItem(key(participantId, kind), value);
  } catch {
    /* quota */
  }
}

/** @param {string} participantId @param {string} kind @param {number} [minChars] */
export function isRaSpikeWorksheetComplete(participantId, kind, minChars = 30) {
  return getRaSpikeWorksheet(participantId, kind).trim().length >= minChars;
}
