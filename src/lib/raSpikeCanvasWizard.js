import { FEC_V2_PILLARS, FEC_UVP_HELPER } from './fecCanvasConstants.js';
import {
  getFecField,
  getFecSummaryField,
  saveFecFieldDebounced,
  saveFecSummaryField,
  computeFecCanvasCompletionPct,
  prepareFecCanvas,
} from './fecCanvasService.js';

const wizardModule = import.meta.glob('../../content/ra-spike/canvas-wizard.json', {
  eager: true,
  import: 'default',
});

/** @returns {import('../../lib/raSpikeContentTypes.js').RaSpikeCanvasWizardConfig | null} */
export function getRaSpikeCanvasWizardConfig() {
  const entry = Object.values(wizardModule)[0];
  return entry ?? null;
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

/** @param {string} participantId */
export function isCanvasWizardComplete(participantId) {
  prepareFecCanvas(participantId);
  return computeFecCanvasCompletionPct(participantId) >= 40;
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
