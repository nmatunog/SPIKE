import {
  FUNNEL_RATIOS,
  MONTHLY_TO_YEAR1_KEY,
  MONTHS_PER_YEAR,
  WEEKLY_TO_MONTHLY_KEY,
  WEEKS_PER_MONTH,
} from './constants.js';

/**
 * Cascade funnel from prospects using 10→5→3→1→₱10,000→3 ratios.
 * @param {number} prospects
 * @param {number} [revenuePerClient]
 */
export function cascadeFromProspects(prospects, revenuePerClient = FUNNEL_RATIOS.revenuePerClient) {
  const p = Math.max(0, Number(prospects) || 0);
  const discovery = Math.round(p * FUNNEL_RATIOS.prospectToDiscovery);
  const presentations = Math.round(discovery * FUNNEL_RATIOS.discoveryToPresentation);
  const clients = Math.round(presentations * FUNNEL_RATIOS.presentationToClient);
  const revenue = clients * revenuePerClient;
  const referrals = clients * FUNNEL_RATIOS.referralsPerClient;
  return { prospects: p, discovery, presentations, clients, revenue, referrals };
}

const LEGACY_PRESENTATION_TO_CLIENT = 2 / 3;

/**
 * Detect funnels saved with the old 2/3 presentation→client ratio (10-5-3-2-3).
 * @param {Record<string, number | string>} [weeklyTargets]
 */
export function hasLegacyTwoThirdsClientFunnel(weeklyTargets = {}) {
  const presentations = Number(
    weeklyTargets.solutionPresentations ?? weeklyTargets.presentations,
  );
  const clients = Number(weeklyTargets.newClients ?? weeklyTargets.clients);
  if (!Number.isFinite(presentations) || presentations <= 0) return false;
  if (!Number.isFinite(clients) || clients <= 0) return false;
  const legacyClients = Math.round(presentations * LEGACY_PRESENTATION_TO_CLIENT);
  const correctClients = Math.round(presentations * FUNNEL_RATIOS.presentationToClient);
  return clients === legacyClients && clients !== correctClients;
}

/**
 * Re-cascade weekly/monthly targets from prospects using 10-5-3-1-3.
 * @param {Record<string, number | string>} weeklyTargets
 * @param {number} [revenuePerClient]
 */
export function repairWeeklyFunnelFromProspects(weeklyTargets, revenuePerClient = FUNNEL_RATIOS.revenuePerClient) {
  const prospects = Number(weeklyTargets.prospects);
  if (!prospects) return null;
  const cascaded = cascadeFromProspects(prospects, revenuePerClient);
  return {
    prospects: cascaded.prospects,
    discoveryConversations: cascaded.discovery,
    solutionPresentations: cascaded.presentations,
    newClients: cascaded.clients,
    revenue: cascaded.revenue,
    referrals: cascaded.referrals,
  };
}

/** @param {number | string} weeklyValue */
export function weeklyValueToMonthly(weeklyValue) {
  if (weeklyValue === '' || weeklyValue == null) return '';
  const n = Number(weeklyValue);
  return Number.isFinite(n) ? n * WEEKS_PER_MONTH : '';
}

/** @param {number | string} monthlyValue */
export function monthlyValueToYear1(monthlyValue) {
  if (monthlyValue === '' || monthlyValue == null) return '';
  const n = Number(monthlyValue);
  return Number.isFinite(n) ? n * MONTHS_PER_YEAR : '';
}

/**
 * @param {Record<string, number | string>} weekly
 */
export function weeklyToMonthly(weekly) {
  /** @type {Record<string, number | string>} */
  const out = {};
  for (const [weeklyKey, monthlyKey] of Object.entries(WEEKLY_TO_MONTHLY_KEY)) {
    out[monthlyKey] = weeklyValueToMonthly(weekly[weeklyKey]);
  }
  return out;
}

/**
 * @param {Record<string, number | string>} monthly
 */
export function monthlyToYear1(monthly) {
  /** @type {Record<string, number | string>} */
  const out = {};
  for (const [monthlyKey, year1Key] of Object.entries(MONTHLY_TO_YEAR1_KEY)) {
    out[year1Key] = monthlyValueToYear1(monthly[monthlyKey]);
  }
  return out;
}

/**
 * Recompute monthly targets from weekly, respecting manual overrides per row.
 * @param {import('./types.js').BusinessEngineCanvasState} state
 * @param {Record<string, number | string>} [weeklyTargets]
 */
export function syncMonthlyFromWeeklyState(state, weeklyTargets = state.weeklyTargets) {
  const monthlyTargets = { ...state.monthlyTargets };
  const monthlyManualOverride = state.monthlyManualOverride ?? {};

  for (const [weeklyKey, monthlyKey] of Object.entries(WEEKLY_TO_MONTHLY_KEY)) {
    if (monthlyManualOverride[monthlyKey]) continue;
    monthlyTargets[monthlyKey] = weeklyValueToMonthly(weeklyTargets[weeklyKey]);
  }

  return monthlyTargets;
}

/**
 * Recompute Year 1 KPIs from monthly, respecting manual overrides per row.
 * @param {import('./types.js').BusinessEngineCanvasState} state
 * @param {Record<string, number | string>} [monthlyTargets]
 */
export function syncYear1FromMonthlyState(state, monthlyTargets = state.monthlyTargets) {
  const year1Targets = { ...state.year1Targets };
  const year1ManualOverride = state.year1ManualOverride ?? {};

  for (const [monthlyKey, year1Key] of Object.entries(MONTHLY_TO_YEAR1_KEY)) {
    if (year1ManualOverride[year1Key]) continue;
    year1Targets[year1Key] = monthlyValueToYear1(monthlyTargets[monthlyKey]);
  }

  return year1Targets;
}

/**
 * Apply a single weekly row edit and cascade to linked monthly/year1 fields.
 * Editing Prospects re-runs the full 10→5→3→1 funnel across all weekly rows.
 * @param {import('./types.js').BusinessEngineCanvasState} state
 * @param {string} weeklyId
 * @param {number | string} value
 */
export function applyWeeklyTargetChange(state, weeklyId, value) {
  if (weeklyId === 'prospects') {
    const prospects = value === '' ? 0 : Number(value);
    if (Number.isFinite(prospects)) {
      const revenuePerClient = Number(state.activityEngine.revenue?.value) || FUNNEL_RATIOS.revenuePerClient;
      const cascaded = cascadeFromProspects(prospects, revenuePerClient);
      const activityEngine = { ...state.activityEngine };
      for (const [stepId, stepValue] of Object.entries({
        prospects: cascaded.prospects,
        discovery: cascaded.discovery,
        presentations: cascaded.presentations,
        clients: cascaded.clients,
        referrals: cascaded.referrals,
      })) {
        if (activityEngine[stepId]) {
          activityEngine[stepId] = { ...activityEngine[stepId], value: stepValue };
        }
      }

      const withEngine = applyEngineCascadeToTargets(
        { ...state, activityEngine },
        cascaded,
        { forceMonthly: true },
      );
      return {
        ...withEngine,
        growthSimulation: {
          ...withEngine.growthSimulation,
          current: {
            prospects: cascaded.prospects,
            discovery: cascaded.discovery,
            presentations: cascaded.presentations,
            clients: cascaded.clients,
            revenue: cascaded.revenue,
            referrals: cascaded.referrals,
          },
        },
      };
    }
  }

  return applyWeeklyTargetChangeSingle(state, weeklyId, value);
}

/**
 * @param {import('./types.js').BusinessEngineCanvasState} state
 * @param {string} weeklyId
 * @param {number | string} value
 */
function applyWeeklyTargetChangeSingle(state, weeklyId, value) {
  const weeklyTargets = { ...state.weeklyTargets, [weeklyId]: value };
  const monthlyKey = WEEKLY_TO_MONTHLY_KEY[weeklyId] ?? weeklyId;
  const monthlyTargets = { ...state.monthlyTargets };

  if (!state.monthlyManualOverride?.[monthlyKey]) {
    monthlyTargets[monthlyKey] = weeklyValueToMonthly(value);
  }

  const withMonthly = { ...state, weeklyTargets, monthlyTargets };
  return {
    ...withMonthly,
    year1Targets: syncYear1FromMonthlyState(withMonthly),
  };
}

/**
 * Apply activity-engine funnel cascade to weekly/monthly/year1 tables.
 * @param {import('./types.js').BusinessEngineCanvasState} state
 * @param {ReturnType<typeof cascadeFromProspects>} cascaded
 * @param {{ forceMonthly?: boolean }} [opts]
 */
export function applyEngineCascadeToTargets(state, cascaded, opts = {}) {
  const weeklyTargets = {
    prospects: cascaded.prospects,
    discoveryConversations: cascaded.discovery,
    solutionPresentations: cascaded.presentations,
    newClients: cascaded.clients,
    revenue: cascaded.revenue,
    referrals: cascaded.referrals,
  };
  const monthlyTargets = opts.forceMonthly
    ? weeklyToMonthly(weeklyTargets)
    : syncMonthlyFromWeeklyState(state, weeklyTargets);
  const withMonthly = { ...state, weeklyTargets, monthlyTargets };
  return {
    ...withMonthly,
    year1Targets: syncYear1FromMonthlyState(withMonthly),
  };
}

/**
 * Full manual recalc — funnel from weekly Prospects, then Monthly (×4) and Year 1 (×12).
 * Clears monthly/year1 auto-override flags (except Client Reviews).
 * @param {import('./types.js').BusinessEngineCanvasState} state
 */
export function recalculateAllTargets(state) {
  const raw = state.weeklyTargets.prospects;
  const prospects = raw === '' ? 0 : Number(raw);
  const revenuePerClient = Number(state.activityEngine.revenue?.value) || FUNNEL_RATIOS.revenuePerClient;
  const cascaded = cascadeFromProspects(Number.isFinite(prospects) ? prospects : 0, revenuePerClient);

  const activityEngine = { ...state.activityEngine };
  for (const [stepId, stepValue] of Object.entries({
    prospects: cascaded.prospects,
    discovery: cascaded.discovery,
    presentations: cascaded.presentations,
    clients: cascaded.clients,
    referrals: cascaded.referrals,
  })) {
    if (activityEngine[stepId]) {
      activityEngine[stepId] = { ...activityEngine[stepId], value: stepValue };
    }
  }

  const monthlyManualOverride = Object.fromEntries(
    Object.keys(state.monthlyManualOverride ?? {}).map((k) => [k, false]),
  );
  const year1ManualOverride = { ...(state.year1ManualOverride ?? {}) };
  for (const key of Object.keys(year1ManualOverride)) {
    if (key !== 'clientReviews') year1ManualOverride[key] = false;
  }

  const next = applyEngineCascadeToTargets(
    { ...state, activityEngine, monthlyManualOverride, year1ManualOverride },
    cascaded,
    { forceMonthly: true },
  );

  return {
    ...next,
    growthSimulation: {
      ...next.growthSimulation,
      current: {
        prospects: cascaded.prospects,
        discovery: cascaded.discovery,
        presentations: cascaded.presentations,
        clients: cascaded.clients,
        revenue: cascaded.revenue,
        referrals: cascaded.referrals,
      },
    },
  };
}

/**
 * @param {import('./types.js').BusinessEngineCanvasState} state
 * @param {number} prospects
 */
export function syncGrowthFromProspects(state, prospects) {
  const revenuePerClient = Number(state.activityEngine.revenue?.value) || FUNNEL_RATIOS.revenuePerClient;
  const cascaded = cascadeFromProspects(prospects, revenuePerClient);
  return {
    ...state.growthSimulation,
    new: {
      prospects: cascaded.prospects,
      discovery: cascaded.discovery,
      presentations: cascaded.presentations,
      clients: cascaded.clients,
      revenue: cascaded.revenue,
      referrals: cascaded.referrals,
    },
  };
}

/**
 * @param {import('./types.js').BusinessEngineCanvasState} state
 */
export function defaultGrowthCurrent(state) {
  const w = state.weeklyTargets;
  const prospects = Number(w.prospects) || Number(state.activityEngine.prospects?.value) || 10;
  const revenuePerClient = Number(state.activityEngine.revenue?.value) || FUNNEL_RATIOS.revenuePerClient;
  return cascadeFromProspects(prospects, revenuePerClient);
}
