/** Fields present in sprint 05c canvas_summary (pre–FEC v2 migration). */
export const LEGACY_CANVAS_SUMMARY_KEYS = new Set([
  'strategy_statement',
  'strategy_is_auto',
  'priority_1',
  'priority_2',
  'priority_3',
  'year1_goal',
  'year2_goal',
  'year3_goal',
]);

/** FEC v2 columns added in migration 20260713_fec_canvas_v2.sql */
export const FEC_V2_CANVAS_SUMMARY_KEYS = new Set([
  'canvas_schema_version',
  'migrated_at',
  'unified_venture_proposition',
  'uvp_is_auto',
  'roadmap_12mo',
  'roadmap_24mo',
  'roadmap_36mo',
  'success_narrative',
  'success_revenue',
  'success_customers',
  'success_families_protected',
  'success_jobs',
  'success_annual_profit',
  'scorecard_manual_overrides',
]);

/** @param {Record<string, unknown>} patch */
export function toLegacyCanvasSummaryPatch(patch) {
  /** @type {Record<string, unknown>} */
  const out = {};
  for (const [key, value] of Object.entries(patch)) {
    if (LEGACY_CANVAS_SUMMARY_KEYS.has(key)) out[key] = value;
  }
  return out;
}
