const PREFIX = 'ra_spike_discovery_canvas_v1';

const discoveryModule = import.meta.glob('../../content/ra-spike/discovery-canvas.json', {
  eager: true,
  import: 'default',
});

/** @typedef {import('./raSpikeContentTypes.js').RaSpikeDiscoveryCanvas} RaSpikeDiscoveryCanvas */

/** @returns {RaSpikeDiscoveryCanvas} */
export function emptyDiscoveryCanvas() {
  return {
    interviewed: '',
    problems: ['', '', '', '', ''],
    topProblem: '',
    whyImportant: '',
    idealAge: '',
    idealOccupation: '',
    idealFamily: '',
    idealIncome: '',
    idealLifeStage: '',
    ifNothingChanges: '',
    reflectionStruggle: '',
  };
}

/** @returns {import('./raSpikeContentTypes.js').RaSpikeDiscoveryCanvasConfig | null} */
export function getRaSpikeDiscoveryCanvasConfig() {
  const entry = Object.values(discoveryModule)[0];
  return entry ?? null;
}

/** @param {string} participantId */
function storageKey(participantId) {
  return `${PREFIX}:${participantId}`;
}

/** @param {unknown} raw */
function normalizeCanvas(raw) {
  const base = emptyDiscoveryCanvas();
  if (!raw || typeof raw !== 'object') return base;
  const data = /** @type {Record<string, unknown>} */ (raw);
  const problems = Array.isArray(data.problems)
    ? data.problems.map((p) => String(p ?? '').trim()).slice(0, 5)
    : [];
  while (problems.length < 5) problems.push('');
  return {
    interviewed: String(data.interviewed ?? '').trim(),
    problems,
    topProblem: String(data.topProblem ?? '').trim(),
    whyImportant: String(data.whyImportant ?? '').trim(),
    idealAge: String(data.idealAge ?? '').trim(),
    idealOccupation: String(data.idealOccupation ?? '').trim(),
    idealFamily: String(data.idealFamily ?? '').trim(),
    idealIncome: String(data.idealIncome ?? '').trim(),
    idealLifeStage: String(data.idealLifeStage ?? '').trim(),
    ifNothingChanges: String(data.ifNothingChanges ?? '').trim(),
    reflectionStruggle: String(data.reflectionStruggle ?? '').trim(),
  };
}

/** @param {string} participantId */
export function getRaSpikeDiscoveryCanvas(participantId) {
  if (!participantId) return emptyDiscoveryCanvas();
  try {
    const raw = localStorage.getItem(storageKey(participantId));
    return raw ? normalizeCanvas(JSON.parse(raw)) : emptyDiscoveryCanvas();
  } catch {
    return emptyDiscoveryCanvas();
  }
}

/** @param {string} participantId @param {RaSpikeDiscoveryCanvas} canvas */
export function saveRaSpikeDiscoveryCanvas(participantId, canvas) {
  if (!participantId) return;
  try {
    localStorage.setItem(storageKey(participantId), JSON.stringify(normalizeCanvas(canvas)));
  } catch {
    /* quota */
  }
}

/** @param {string} value @param {number} [min] */
function meetsMin(value, min = 8) {
  return String(value ?? '').trim().length >= min;
}

/** @param {string} participantId */
export function isDiscoveryCanvasComplete(participantId) {
  const canvas = getRaSpikeDiscoveryCanvas(participantId);
  const filledProblems = canvas.problems.filter((p) => p.trim().length >= 4);
  return (
    meetsMin(canvas.interviewed, 10)
    && filledProblems.length >= 3
    && meetsMin(canvas.topProblem, 4)
    && meetsMin(canvas.whyImportant, 15)
    && meetsMin(canvas.idealAge, 2)
    && meetsMin(canvas.idealOccupation, 3)
    && meetsMin(canvas.idealFamily, 3)
    && meetsMin(canvas.idealIncome, 3)
    && meetsMin(canvas.idealLifeStage, 3)
    && meetsMin(canvas.ifNothingChanges, 15)
    && meetsMin(canvas.reflectionStruggle, 8)
  );
}

/** @param {RaSpikeDiscoveryCanvas} canvas */
export function listDiscoveryProblemOptions(canvas) {
  return canvas.problems.map((p) => p.trim()).filter(Boolean);
}
