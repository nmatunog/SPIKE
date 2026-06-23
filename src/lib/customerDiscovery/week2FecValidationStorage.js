/**
 * Squad-level FEC Validation Lab state (shared across members).
 */
import { FEC_BOX_META, FEC_VALIDATION_STEPS } from './week2FecValidationConstants.js';

const STORAGE_KEY = 'spike_week2_fec_validation_v1';

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeAll(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** @returns {import('./week2FecValidationTypes.js').FecValidationSquadState} */
export function defaultFecValidationState() {
  /** @type {Record<string, import('./week2FecValidationTypes.js').FecBoxScore>} */
  const boxScores = {};
  for (const [id, meta] of Object.entries(FEC_BOX_META)) {
    boxScores[id] = {
      before: meta.before,
      after: meta.before,
      evidenceCount: 0,
      status: 'Needs Validation',
      approvedText: '',
    };
  }
  return {
    steps: {},
    boxScores,
    squadRoles: {},
    pitchSlides: {},
    pitchSubmittedAt: null,
    updatedAt: null,
  };
}

/** @param {string} squadKey */
export function loadFecValidation(squadKey) {
  const key = String(squadKey ?? '').trim() || 'default';
  const stored = readAll()[key];
  if (!stored) return defaultFecValidationState();
  const base = defaultFecValidationState();
  return {
    ...base,
    ...stored,
    boxScores: { ...base.boxScores, ...(stored.boxScores ?? {}) },
    steps: stored.steps ?? {},
    squadRoles: stored.squadRoles ?? {},
    pitchSlides: stored.pitchSlides ?? {},
  };
}

/**
 * @param {string} squadKey
 * @param {Partial<import('./week2FecValidationTypes.js').FecValidationSquadState>} patch
 */
export function saveFecValidation(squadKey, patch) {
  const key = String(squadKey ?? '').trim() || 'default';
  const all = readAll();
  const current = loadFecValidation(key);
  const next = {
    ...current,
    ...patch,
    boxScores: patch.boxScores ? { ...current.boxScores, ...patch.boxScores } : current.boxScores,
    steps: patch.steps ? { ...current.steps, ...patch.steps } : current.steps,
    squadRoles: patch.squadRoles ? { ...current.squadRoles, ...patch.squadRoles } : current.squadRoles,
    pitchSlides: patch.pitchSlides ? { ...current.pitchSlides, ...patch.pitchSlides } : current.pitchSlides,
    updatedAt: new Date().toISOString(),
  };
  all[key] = next;
  writeAll(all);
  return next;
}

/** @param {string} squadKey @param {string} stepId */
export function isFecStepComplete(squadKey, stepId) {
  return Boolean(loadFecValidation(squadKey).steps[stepId]?.completedAt);
}

/** @param {string} squadKey */
export function fecValidationProgressPct(squadKey) {
  const done = FEC_VALIDATION_STEPS.filter((s) => isFecStepComplete(squadKey, s.id)).length;
  return Math.round((done / FEC_VALIDATION_STEPS.length) * 100);
}

/** @param {string} squadKey */
export function isFecLabComplete(squadKey) {
  return FEC_VALIDATION_STEPS.every((s) => isFecStepComplete(squadKey, s.id));
}
