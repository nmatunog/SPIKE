import { FEC_V2_PILLARS, FEC_UVP_HELPER } from './fecCanvasConstants.js';
import {
  getFecField,
  getFecSummaryField,
  saveFecFieldDebounced,
  saveFecSummaryField,
  prepareFecCanvas,
} from './fecCanvasService.js';

const introModule = import.meta.glob('../../content/ra-spike/fec-intro-wizard.json', {
  eager: true,
  import: 'default',
});
const continueModule = import.meta.glob('../../content/ra-spike/canvas-wizard.json', {
  eager: true,
  import: 'default',
});

/** @typedef {'intro' | 'continue'} RaSpikeFecWizardMode */

/** @returns {import('./raSpikeContentTypes.js').RaSpikeFecWizardConfig | null} */
export function getRaSpikeFecIntroWizardConfig() {
  const entry = Object.values(introModule)[0];
  return entry ?? null;
}

/** @returns {import('./raSpikeContentTypes.js').RaSpikeFecWizardConfig | null} */
export function getRaSpikeCanvasWizardConfig() {
  const entry = Object.values(continueModule)[0];
  return entry ?? null;
}

/** @param {RaSpikeFecWizardMode} mode */
export function getRaSpikeFecWizardConfig(mode) {
  return mode === 'intro' ? getRaSpikeFecIntroWizardConfig() : getRaSpikeCanvasWizardConfig();
}

/**
 * @param {string} participantId
 * @param {string} pillarId
 * @param {string} fieldKey
 */
export function readWizardField(participantId, pillarId, fieldKey) {
  if (pillarId === 'summary' && fieldKey === 'unified_venture_proposition') {
    return String(getFecSummaryField(participantId, 'unified_venture_proposition') ?? '');
  }
  return String(getFecField(participantId, pillarId, fieldKey) ?? '');
}

/**
 * @param {string} participantId
 * @param {string} pillarId
 * @param {string} fieldKey
 * @param {string} value
 */
export function writeWizardField(participantId, pillarId, fieldKey, value) {
  if (pillarId === 'summary' && fieldKey === 'unified_venture_proposition') {
    saveFecSummaryField(participantId, { unified_venture_proposition: value });
    return;
  }
  saveFecFieldDebounced(participantId, pillarId, fieldKey, value);
}

/** @param {{ pillar: string, key: string, minChars?: number }} field */
function fieldMeetsMin(participantId, field) {
  return readWizardField(participantId, field.pillar, field.key).trim().length >= (field.minChars ?? 10);
}

/** @param {string} participantId @param {Array<{ fields?: Array<{ pillar: string, key: string, minChars?: number }> }>} steps */
function stepsComplete(participantId, steps) {
  prepareFecCanvas(participantId);
  return steps.every((step) => {
    const fields = step.fields?.length ? step.fields : getWizardStepFields(step.id);
    return fields.length > 0 && fields.every((f) => fieldMeetsMin(participantId, f));
  });
}

/** Week 2 — Customer Segment, Problem, Value Proposition only. */
export function isFecIntroWizardComplete(participantId) {
  const config = getRaSpikeFecIntroWizardConfig();
  if (!config?.steps?.length) return false;
  return stepsComplete(participantId, config.steps);
}

/** Week 3 — Capture Value, Enable Value, UVP (create_value locked from Week 2). */
export function isFecContinueWizardComplete(participantId) {
  const config = getRaSpikeCanvasWizardConfig();
  if (!config?.steps?.length) return false;
  return stepsComplete(participantId, config.steps);
}

/** @deprecated Use isFecContinueWizardComplete for Week 3. */
export function isCanvasWizardComplete(participantId) {
  return isFecContinueWizardComplete(participantId);
}

/** @param {string} stepId */
export function getWizardStepFields(stepId) {
  if (stepId === 'uvp') {
    return [{
      pillar: 'summary',
      key: 'unified_venture_proposition',
      label: 'Unified Venture Proposition',
      hint: FEC_UVP_HELPER,
      minChars: 20,
    }];
  }
  const pillar = FEC_V2_PILLARS[stepId];
  if (!pillar) return [];
  return pillar.fields.map((f) => ({
    pillar: stepId,
    key: f.key,
    label: f.label,
    minChars: f.minChars ?? 10,
  }));
}

/**
 * @param {{ fields?: Array<{ pillar: string, key: string, label?: string, hint?: string, minChars?: number }> } | undefined} step
 */
export function resolveWizardStepFields(step) {
  if (!step) return [];
  if (step.fields?.length) return step.fields;
  return getWizardStepFields(step.id);
}
