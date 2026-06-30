import { FUNNEL_RATIOS, WEEKLY_TO_MONTHLY_KEY } from './constants.js';

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

/**
 * @param {Record<string, number | string>} weekly
 */
export function weeklyToMonthly(weekly) {
  /** @type {Record<string, number | string>} */
  const out = {};
  for (const [weeklyKey, monthlyKey] of Object.entries(WEEKLY_TO_MONTHLY_KEY)) {
    const n = Number(weekly[weeklyKey]);
    out[monthlyKey] = Number.isFinite(n) ? n * 4 : '';
  }
  return out;
}

/**
 * @param {import('./types.js').BusinessEngineCanvasState} state
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
