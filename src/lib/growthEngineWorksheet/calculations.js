import { FUNNEL_RATIOS, WEEKS_PER_MONTH, MONTHS_PER_YEAR } from '../businessEngineCanvas/constants.js';
import { cascadeFromProspects, weeklyToMonthly } from '../businessEngineCanvas/funnel.js';

/** Bump when funnel ratio logic changes (e.g. 10-5-3-1-3 fix). */
export const FUNNEL_ENGINE_VERSION = 2;

/**
 * Reverse weekly funnel from target new clients per week.
 * @param {number} weeklyClients
 * @param {number} [revenuePerClient]
 */
export function cascadeFromWeeklyClients(weeklyClients, revenuePerClient = FUNNEL_RATIOS.revenuePerClient) {
  const clients = Math.max(0, Number(weeklyClients) || 0);
  const presentations = clients / FUNNEL_RATIOS.presentationToClient;
  const discovery = presentations / FUNNEL_RATIOS.discoveryToPresentation;
  const prospects = discovery / FUNNEL_RATIOS.prospectToDiscovery;
  const revenue = clients * revenuePerClient;
  const referrals = clients * FUNNEL_RATIOS.referralsPerClient;
  return {
    prospects: Math.ceil(prospects),
    discovery: Math.ceil(discovery),
    presentations: Math.ceil(presentations),
    clients: Math.ceil(clients),
    revenue: Math.round(revenue),
    referrals: Math.ceil(referrals),
  };
}

/**
 * @param {number | string} yearRevenueGoal
 * @param {number | string} averageRevenuePerClient
 */
export function computeRequiredClients(yearRevenueGoal, averageRevenuePerClient) {
  const goal = Number(yearRevenueGoal);
  const avg = Number(averageRevenuePerClient);
  if (!Number.isFinite(goal) || !Number.isFinite(avg) || avg <= 0) return '';
  return Math.ceil(goal / avg);
}

/**
 * Build monthly + weekly targets from annual client requirement.
 * @param {number | string} requiredClients
 * @param {number | string} averageRevenuePerClient
 */
export function buildTargetsFromRequiredClients(requiredClients, averageRevenuePerClient) {
  const annualClients = Number(requiredClients);
  const revPer = Number(averageRevenuePerClient) || FUNNEL_RATIOS.revenuePerClient;
  if (!Number.isFinite(annualClients) || annualClients <= 0) {
    return { monthlyTargets: {}, weeklyTargets: {} };
  }

  const weeklyClients = Math.max(1, Math.ceil(annualClients / 52));
  const weeklyCascade = cascadeFromWeeklyClients(weeklyClients, revPer);

  const weeklyTargets = {
    prospects: weeklyCascade.prospects,
    discoveryConversations: weeklyCascade.discovery,
    solutionPresentations: weeklyCascade.presentations,
    newClients: weeklyCascade.clients,
    revenue: weeklyCascade.revenue,
    referrals: weeklyCascade.referrals,
  };

  const monthlyTargets = {
    ...weeklyToMonthly(weeklyTargets),
    newClients: Math.ceil(annualClients / MONTHS_PER_YEAR),
    revenue: Math.round((Number(weeklyTargets.revenue) || 0) * WEEKS_PER_MONTH),
  };

  return { weeklyTargets, monthlyTargets };
}

/**
 * Repopulate required clients and all weekly/monthly funnel targets from
 * Year 1 revenue goal + average revenue per client (income is the base).
 * Manual overrides in calculated fields are replaced on each recalculate.
 * @param {import('./types.js').GrowthEngineTargets} targets
 */
export function recalculateGrowthTargets(targets) {
  const yearRevenueGoal = targets.yearRevenueGoal;
  const averageRevenuePerClient = targets.averageRevenuePerClient;
  const requiredClients = computeRequiredClients(yearRevenueGoal, averageRevenuePerClient);
  const cascaded = buildTargetsFromRequiredClients(requiredClients, averageRevenuePerClient);

  return {
    yearRevenueGoal,
    averageRevenuePerClient,
    requiredClients,
    weeklyTargets: { ...cascaded.weeklyTargets },
    monthlyTargets: { ...cascaded.monthlyTargets },
  };
}

/** @param {number | string} prospects @param {number | string} revPer */
export function cascadeWeeklyFromProspects(prospects, revPer) {
  return cascadeFromProspects(Number(prospects) || 0, Number(revPer) || FUNNEL_RATIOS.revenuePerClient);
}
