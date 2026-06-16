/**
 * FEC v1 → v2 field migration (local storage). Preserves v1 keys; copies into v2 layout.
 */
import { CANVAS_ENGINES } from './blueprintSectionConstants.js';
import { getCanvasSummary, saveCanvasSummary } from './canvasSummaryService.js';
import { getCanvasField, saveCanvasField } from './canvasService.js';
import { isMockUserId } from './mockAuth.js';

/** @type {Array<{ v1Engine: string, v1Field: string, v2Engine: string, v2Field: string }>} */
export const FEC_V1_TO_V2_ENTRY_MAP = [
  { v1Engine: 'client_growth', v1Field: 'customer_segments', v2Engine: 'create_value', v2Field: 'customer_segments' },
  { v1Engine: 'client_growth', v1Field: 'value_proposition', v2Engine: 'create_value', v2Field: 'value_offering' },
  { v1Engine: 'client_growth', v1Field: 'revenue_streams', v2Engine: 'capture_value', v2Field: 'revenue_streams' },
  { v1Engine: 'foundation', v1Field: 'cost_structure', v2Engine: 'capture_value', v2Field: 'cost_structure' },
  { v1Engine: 'foundation', v1Field: 'resources', v2Engine: 'enable_value', v2Field: 'key_resources' },
  { v1Engine: 'foundation', v1Field: 'partners', v2Engine: 'enable_value', v2Field: 'key_partners' },
  { v1Engine: 'talent_growth', v1Field: 'talent_segments', v2Engine: 'agency_talent', v2Field: 'talent_segments' },
  { v1Engine: 'talent_growth', v1Field: 'recruit_value_proposition', v2Engine: 'agency_talent', v2Field: 'recruit_value_proposition' },
  { v1Engine: 'talent_growth', v1Field: 'recruitment_channels', v2Engine: 'agency_talent', v2Field: 'recruitment_channels' },
  { v1Engine: 'talent_growth', v1Field: 'talent_development_system', v2Engine: 'agency_talent', v2Field: 'talent_development_system' },
  { v1Engine: 'leadership_growth', v1Field: 'culture_statement', v2Engine: 'agency_leadership', v2Field: 'culture_statement' },
  { v1Engine: 'leadership_growth', v1Field: 'leadership_system', v2Engine: 'agency_leadership', v2Field: 'leadership_system' },
  { v1Engine: 'leadership_growth', v1Field: 'expansion_strategy', v2Engine: 'agency_leadership', v2Field: 'expansion_strategy' },
  { v1Engine: 'leadership_growth', v1Field: 'growth_multipliers', v2Engine: 'agency_leadership', v2Field: 'growth_multipliers' },
];

/** @param {string} participantId */
export function participantHasV1CanvasData(participantId) {
  for (const [engineKey, engine] of Object.entries(CANVAS_ENGINES)) {
    for (const field of engine.fields) {
      if (String(getCanvasField(participantId, engineKey, field.key)).trim()) {
        return true;
      }
    }
  }
  const summary = getCanvasSummary(participantId);
  if (summary.strategy_statement?.trim()) return true;
  if (summary.priority_1?.trim() || summary.priority_2?.trim() || summary.priority_3?.trim()) {
    return true;
  }
  if (summary.year1_goal?.trim() || summary.year2_goal?.trim() || summary.year3_goal?.trim()) {
    return true;
  }
  return false;
}

/**
 * Copy v1 canvas + summary into v2 fields. Idempotent — skips targets that already have content.
 * @param {string} participantId
 * @returns {{ migrated: boolean, copied: number }}
 */
export function migrateCanvasV1ToV2(participantId) {
  if (!participantId) return { migrated: false, copied: 0 };

  let copied = 0;
  const summary = getCanvasSummary(participantId);

  for (const row of FEC_V1_TO_V2_ENTRY_MAP) {
    const source = String(getCanvasField(participantId, row.v1Engine, row.v1Field)).trim();
    if (!source) continue;
    const existing = String(getCanvasField(participantId, row.v2Engine, row.v2Field)).trim();
    if (existing) continue;
    saveCanvasField(participantId, row.v2Engine, row.v2Field, source);
    copied += 1;
  }

  /** @type {Record<string, unknown>} */
  const summaryPatch = {};

  if (summary.strategy_statement?.trim() && !summary.unified_venture_proposition?.trim()) {
    summaryPatch.unified_venture_proposition = summary.strategy_statement;
    summaryPatch.uvp_is_auto = summary.strategy_is_auto ?? false;
    copied += 1;
  }

  if (summary.year1_goal?.trim() && !summary.roadmap_12mo?.trim()) {
    summaryPatch.roadmap_12mo = summary.year1_goal;
    copied += 1;
  }
  if (summary.year2_goal?.trim() && !summary.roadmap_24mo?.trim()) {
    summaryPatch.roadmap_24mo = summary.year2_goal;
    copied += 1;
  }
  if (summary.year3_goal?.trim() && !summary.roadmap_36mo?.trim()) {
    summaryPatch.roadmap_36mo = summary.year3_goal;
    copied += 1;
  }

  if (Object.keys(summaryPatch).length) {
    saveCanvasSummary(participantId, summaryPatch);
  }

  saveCanvasSummary(participantId, {
    canvas_schema_version: 'v2',
    migrated_at: new Date().toISOString(),
  });
  return { migrated: true, copied };
}

/**
 * Resolve schema version for a participant.
 * @param {string} participantId
 * @returns {import('./fecCanvasConstants.js').FecSchemaVersion}
 */
export function resolveInitialCanvasSchemaVersion(participantId) {
  const summary = getCanvasSummary(participantId);
  if (summary.canvas_schema_version === 'v2' || summary.canvas_schema_version === 'v1') {
    return summary.canvas_schema_version;
  }
  return participantHasV1CanvasData(participantId) ? 'v1' : 'v2';
}

/**
 * Ensure participant is on v2 — migrates v1 data once, then marks v2.
 * @param {string} participantId
 * @returns {import('./fecCanvasConstants.js').FecSchemaVersion}
 */
export function ensureFecCanvasV2(participantId) {
  if (!participantId || isMockUserId(participantId)) return 'v2';
  const current = getCanvasSummary(participantId).canvas_schema_version;
  if (current === 'v2') return 'v2';

  if (current === 'v1' || participantHasV1CanvasData(participantId)) {
    migrateCanvasV1ToV2(participantId);
    return 'v2';
  }

  markCanvasSchemaV2(participantId);
  return 'v2';
}

function markCanvasSchemaV2(participantId) {
  saveCanvasSummary(participantId, {
    canvas_schema_version: 'v2',
    migrated_at: new Date().toISOString(),
  });
}
