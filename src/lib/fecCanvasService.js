/**
 * FEC v2 canvas service — schema version, v2 field access, completion (Phase 1).
 */
import {
  FEC_SCORECARD_FIELD_KEYS,
  FEC_V2_PILLARS,
  FEC_AGENCY_BUILDER_EXTENSIONS,
  listFecV2EntryFields,
} from './fecCanvasConstants.js';
import {
  getCanvasField,
  saveCanvasField,
  saveCanvasFieldDebounced,
} from './canvasService.js';
import { getCanvasSummary, saveCanvasSummary } from './canvasSummaryService.js';
import { ensureFecCanvasV2, resolveInitialCanvasSchemaVersion } from './fecCanvasMigration.js';

/** @param {string} participantId */
export function getCanvasSchemaVersion(participantId) {
  if (!participantId) return 'v2';
  const version = getCanvasSummary(participantId).canvas_schema_version;
  if (version === 'v1' || version === 'v2') return version;
  return resolveInitialCanvasSchemaVersion(participantId);
}

/**
 * @param {string} participantId
 * @param {import('./fecCanvasConstants.js').FecSchemaVersion} version
 */
export function setCanvasSchemaVersion(participantId, version) {
  if (!participantId) return;
  saveCanvasSummary(participantId, {
    canvas_schema_version: version,
    migrated_at: version === 'v2' ? new Date().toISOString() : null,
  });
}

/** @param {string} participantId @param {string} engineKey @param {string} fieldKey */
export function getFecField(participantId, engineKey, fieldKey) {
  return getCanvasField(participantId, engineKey, fieldKey);
}

/**
 * @param {string} participantId
 * @param {string} engineKey
 * @param {string} fieldKey
 * @param {string} value
 */
export function saveFecField(participantId, engineKey, fieldKey, value) {
  saveCanvasField(participantId, engineKey, fieldKey, value);
}

/** @param {string} participantId @param {string} engineKey @param {string} fieldKey @param {string} value */
export function saveFecFieldDebounced(participantId, engineKey, fieldKey, value) {
  saveCanvasFieldDebounced(participantId, engineKey, fieldKey, value);
}

/** @param {string} participantId @param {string} fieldKey */
export function getFecSummaryField(participantId, fieldKey) {
  const summary = getCanvasSummary(participantId);
  const value = summary[fieldKey];
  if (fieldKey === 'scorecard_manual_overrides' && value && typeof value === 'object') {
    return value;
  }
  return typeof value === 'string' ? value : value ?? '';
}

/**
 * @param {string} participantId
 * @param {Record<string, unknown>} patch
 */
export function saveFecSummaryField(participantId, patch) {
  saveCanvasSummary(participantId, patch);
}

/** @param {string} participantId */
export function getFecUnifiedVentureProposition(participantId) {
  const summary = getCanvasSummary(participantId);
  return (
    summary.unified_venture_proposition?.trim()
    || summary.strategy_statement?.trim()
    || ''
  );
}

/** @param {string} participantId */
export function getVentureScorecard(participantId) {
  /** @type {Record<string, string>} */
  const scorecard = {};
  for (const key of FEC_SCORECARD_FIELD_KEYS) {
    scorecard[key] = getCanvasField(participantId, 'prove_value', key);
  }
  return scorecard;
}

/**
 * @param {string} participantId
 * @param {string} metricKey
 * @param {string} value
 * @param {{ manual?: boolean }} [options]
 */
export function saveVentureScorecardMetric(participantId, metricKey, value, options = {}) {
  saveCanvasField(participantId, 'prove_value', metricKey, value);
  if (options.manual) {
    const overrides = getScorecardManualOverrides(participantId);
    overrides[metricKey] = true;
    saveCanvasSummary(participantId, { scorecard_manual_overrides: overrides });
  }
}

/** @param {string} participantId */
export function getScorecardManualOverrides(participantId) {
  const raw = getCanvasSummary(participantId).scorecard_manual_overrides;
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return /** @type {Record<string, boolean>} */ ({ ...raw });
  }
  return {};
}

/** @param {string} participantId @param {boolean} [includeAgency] */
export function computeFecCanvasCompletionPct(participantId, includeAgency = false) {
  if (!participantId) return 0;

  let filled = 0;
  let total = 0;

  const uvp = getFecUnifiedVentureProposition(participantId);
  total += 1;
  if (uvp.length >= 20) filled += 1;

  for (const row of listFecV2EntryFields()) {
    if (!includeAgency && (row.engineKey === 'agency_talent' || row.engineKey === 'agency_leadership')) {
      continue;
    }
    total += 1;
    const val = getCanvasField(participantId, row.engineKey, row.fieldKey);
    const min = row.engineKey === 'prove_value' ? 1 : row.minChars;
    if (String(val).trim().length >= min) filled += 1;
  }

  const summary = getCanvasSummary(participantId);
  for (const key of ['roadmap_12mo', 'roadmap_24mo', 'roadmap_36mo', 'success_narrative']) {
    total += 1;
    if (String(summary[key] ?? '').trim().length >= 5) filled += 1;
  }

  return total ? Math.round((filled / total) * 100) : 0;
}

/**
 * Hydrate + ensure v2 schema (runs migration when v1 data present).
 * @param {string} participantId
 */
export function prepareFecCanvas(participantId) {
  if (!participantId) return 'v2';
  return ensureFecCanvasV2(participantId);
}

/** @returns {typeof FEC_V2_PILLARS} */
export function getFecPillars() {
  return FEC_V2_PILLARS;
}

/** @returns {typeof FEC_AGENCY_BUILDER_EXTENSIONS} */
export function getFecAgencyExtensions() {
  return FEC_AGENCY_BUILDER_EXTENSIONS;
}

export { ensureFecCanvasV2, migrateCanvasV1ToV2, participantHasV1CanvasData } from './fecCanvasMigration.js';
