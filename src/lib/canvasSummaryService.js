/**
 * Executive Canvas Summary — editable fields (Sprint 05C).
 */
import { fetchCanvasSummary, upsertCanvasSummary } from './supabase/canvasSummary.js';
import { generateStrategyStatement } from './executiveCanvasModel.js';

const STORAGE_KEY = 'spike_canvas_summary';
const debounceTimers = new Map();

/** @returns {import('./executiveCanvasModel.js').CanvasSummaryRecord} */
export function emptyCanvasSummary() {
  return {
    strategy_statement: '',
    strategy_is_auto: true,
    priority_1: '',
    priority_2: '',
    priority_3: '',
    year1_goal: '',
    year2_goal: '',
    year3_goal: '',
    updated_at: null,
    canvas_schema_version: 'v2',
    migrated_at: null,
    unified_venture_proposition: '',
    uvp_is_auto: true,
    roadmap_12mo: '',
    roadmap_24mo: '',
    roadmap_36mo: '',
    success_narrative: '',
    success_revenue: '',
    success_customers: '',
    success_families_protected: '',
    success_jobs: '',
    success_annual_profit: '',
    scorecard_manual_overrides: {},
  };
}

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

/** @param {string} participantId */
export function getCanvasSummary(participantId) {
  if (!participantId) return emptyCanvasSummary();
  return { ...emptyCanvasSummary(), ...(readAll()[participantId] ?? {}) };
}

/**
 * @param {string} participantId
 * @param {Partial<import('./executiveCanvasModel.js').CanvasSummaryRecord>} patch
 */
export function saveCanvasSummary(participantId, patch) {
  if (!participantId) return;
  const all = readAll();
  const current = { ...emptyCanvasSummary(), ...(all[participantId] ?? {}) };
  const next = {
    ...current,
    ...patch,
    updated_at: new Date().toISOString(),
  };
  all[participantId] = next;
  writeAll(all);

  void upsertCanvasSummary(participantId, {
    strategy_statement: next.strategy_statement,
    strategy_is_auto: next.strategy_is_auto,
    priority_1: next.priority_1,
    priority_2: next.priority_2,
    priority_3: next.priority_3,
    year1_goal: next.year1_goal,
    year2_goal: next.year2_goal,
    year3_goal: next.year3_goal,
    canvas_schema_version: next.canvas_schema_version,
    migrated_at: next.migrated_at,
    unified_venture_proposition: next.unified_venture_proposition,
    uvp_is_auto: next.uvp_is_auto,
    roadmap_12mo: next.roadmap_12mo,
    roadmap_24mo: next.roadmap_24mo,
    roadmap_36mo: next.roadmap_36mo,
    success_narrative: next.success_narrative,
    success_revenue: next.success_revenue,
    success_customers: next.success_customers,
    success_families_protected: next.success_families_protected,
    success_jobs: next.success_jobs,
    success_annual_profit: next.success_annual_profit,
    scorecard_manual_overrides: next.scorecard_manual_overrides,
  });
}

/**
 * @param {string} participantId
 * @param {Partial<import('./executiveCanvasModel.js').CanvasSummaryRecord>} patch
 */
export function saveCanvasSummaryDebounced(participantId, patch) {
  const timerKey = `${participantId}:summary`;
  const existing = debounceTimers.get(timerKey);
  if (existing) clearTimeout(existing);
  debounceTimers.set(
    timerKey,
    setTimeout(() => {
      const current = getCanvasSummary(participantId);
      saveCanvasSummary(participantId, { ...current, ...patch });
      debounceTimers.delete(timerKey);
    }, 2000),
  );
}

/** @param {string} participantId @param {string} careerTrack */
export function refreshAutoStrategyStatement(participantId, careerTrack) {
  const summary = getCanvasSummary(participantId);
  if (!summary.strategy_is_auto) return summary;
  const generated = generateStrategyStatement(participantId, careerTrack);
  saveCanvasSummary(participantId, {
    strategy_statement: generated,
    strategy_is_auto: true,
  });
  return getCanvasSummary(participantId);
}

/** @param {string} participantId @param {string} careerTrack */
export function ensureDefaultYearGoals(participantId, careerTrack) {
  const summary = getCanvasSummary(participantId);
  if (summary.year1_goal && summary.year2_goal && summary.year3_goal) return summary;

  const defaults =
    careerTrack === 'specialist_consultant'
      ? {
          year1_goal: 'Establish Practice',
          year2_goal: 'Grow Authority',
          year3_goal: 'Dominate Niche',
        }
      : {
          year1_goal: 'Build Client Base',
          year2_goal: 'Build Team',
          year3_goal: 'Build Leaders',
        };

  saveCanvasSummary(participantId, {
    year1_goal: summary.year1_goal || defaults.year1_goal,
    year2_goal: summary.year2_goal || defaults.year2_goal,
    year3_goal: summary.year3_goal || defaults.year3_goal,
  });
  return getCanvasSummary(participantId);
}

/** @param {string} participantId */
export async function hydrateCanvasSummaryFromSupabase(participantId) {
  if (!participantId || String(participantId).startsWith('mock-')) return;
  try {
    const row = await fetchCanvasSummary(participantId);
    if (!row) return;
    const all = readAll();
    all[participantId] = {
      strategy_statement: row.strategy_statement ?? '',
      strategy_is_auto: row.strategy_is_auto ?? true,
      priority_1: row.priority_1 ?? '',
      priority_2: row.priority_2 ?? '',
      priority_3: row.priority_3 ?? '',
      year1_goal: row.year1_goal ?? '',
      year2_goal: row.year2_goal ?? '',
      year3_goal: row.year3_goal ?? '',
      updated_at: row.updated_at ?? null,
      canvas_schema_version: row.canvas_schema_version ?? 'v1',
      migrated_at: row.migrated_at ?? null,
      unified_venture_proposition: row.unified_venture_proposition ?? '',
      uvp_is_auto: row.uvp_is_auto ?? true,
      roadmap_12mo: row.roadmap_12mo ?? '',
      roadmap_24mo: row.roadmap_24mo ?? '',
      roadmap_36mo: row.roadmap_36mo ?? '',
      success_narrative: row.success_narrative ?? '',
      success_revenue: row.success_revenue ?? '',
      success_customers: row.success_customers ?? '',
      success_families_protected: row.success_families_protected ?? '',
      success_jobs: row.success_jobs ?? '',
      success_annual_profit: row.success_annual_profit ?? '',
      scorecard_manual_overrides: row.scorecard_manual_overrides ?? {},
    };
    writeAll(all);
  } catch {
    /* offline */
  }
}
