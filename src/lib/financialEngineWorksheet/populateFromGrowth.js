import { loadGrowthEngineWorksheet } from '../growthEngineWorksheet/storage.js';
import { GROWTH_STRATEGY_OPTIONS } from '../growthEngineWorksheet/types.js';
import { defaultFinancialEngineWorksheetState } from './storage.js';

/** @param {number | string} n */
function num(n) {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}

/** @param {number | string} n */
function fmtPeso(n) {
  const v = num(n);
  return v > 0 ? `₱${v.toLocaleString()}` : '—';
}

/** @param {string} strategyId */
function growthStrategyLabel(strategyId) {
  return GROWTH_STRATEGY_OPTIONS.find((o) => o.id === strategyId)?.label ?? strategyId ?? '—';
}

/**
 * Build Financial Engine worksheet fields from Growth Engine worksheet.
 * @param {string} participantId
 * @param {import('./types.js').FinancialEngineWorksheetState} [base]
 */
export function populateFinancialEngineFromGrowth(participantId, base = defaultFinancialEngineWorksheetState()) {
  const growth = loadGrowthEngineWorksheet(participantId);
  const targets = growth.targets ?? {};
  const weekly = targets.weeklyTargets ?? {};
  const monthly = targets.monthlyTargets ?? {};

  const year1Revenue = num(targets.yearRevenueGoal);
  const monthlyRevenue = num(monthly.revenue) || num(weekly.revenue) * 4;
  const weeklyRevenue = num(weekly.revenue);
  const revenuePerClient = num(targets.averageRevenuePerClient) || 10_000;
  const requiredClients = num(targets.requiredClients);
  const year1Clients = requiredClients || num(weekly.newClients) * 52;

  const year2Clients = Math.ceil(year1Clients * 1.5);
  const year3Clients = Math.ceil(year2Clients * 1.35);
  const year2Revenue = Math.round(year1Revenue * 1.5);
  const year3Revenue = Math.round(year2Revenue * 1.35);

  const variableCostsMonthly = Math.round(monthlyRevenue * 0.25);
  const fixedCostsMonthly = Math.round(monthlyRevenue * 0.15);
  const contributionPerClient = revenuePerClient;
  const marginPercent =
    monthlyRevenue > 0
      ? Math.round(((monthlyRevenue - variableCostsMonthly - fixedCostsMonthly) / monthlyRevenue) * 100)
      : '';

  const breakEvenMonthlyRevenue = variableCostsMonthly + fixedCostsMonthly;

  const streamsNarrative = [
    'REVENUE MODEL',
    `Year 1 revenue target: ${fmtPeso(year1Revenue)}`,
    `Required clients: ${year1Clients || '—'}`,
    `Average revenue per client: ${fmtPeso(revenuePerClient)}`,
    `Weekly run-rate: ${fmtPeso(weeklyRevenue)} · Monthly: ${fmtPeso(monthlyRevenue)}`,
    `Activity funnel: ${weekly.prospects ?? '—'} prospects → ${weekly.discoveryConversations ?? '—'} discovery → ${weekly.solutionPresentations ?? '—'} presentations → ${weekly.newClients ?? '—'} clients/week`,
    growth.growthStrategy
      ? `Growth strategy: ${growthStrategyLabel(growth.growthStrategy)}`
      : '',
  ]
    .filter(Boolean)
    .join('\n');

  const costStructureNarrative = [
    'ECONOMICS',
    `Monthly revenue at target: ${fmtPeso(monthlyRevenue)}`,
    `Variable costs (est. 25%): ${fmtPeso(variableCostsMonthly)} — prospecting, meetings, travel, tools`,
    `Fixed costs (est. 15%): ${fmtPeso(fixedCostsMonthly)} — licensing, training, platform`,
    `Contribution per new client: ${fmtPeso(contributionPerClient)}`,
    marginPercent !== '' ? `Operating margin at target: ${marginPercent}%` : '',
    'Scale activity before headcount — leverage systems and referrals from Growth Engine.',
  ]
    .filter(Boolean)
    .join('\n');

  const scalingNarrative = [
    'SCALING PLAN',
    `Year 1 — Launch: ${fmtPeso(year1Revenue)} · ${year1Clients} clients`,
    growth.fecYear1Launch ? `  ${growth.fecYear1Launch}` : '',
    `Year 2 — Expand: ${fmtPeso(year2Revenue)} · ${year2Clients} clients`,
    growth.fecYear2Expand ? `  ${growth.fecYear2Expand}` : '',
    `Year 3 — Multiply: ${fmtPeso(year3Revenue)} · ${year3Clients} clients`,
    growth.fecYear3Multiply ? `  ${growth.fecYear3Multiply}` : '',
    growth.developLeaders ? `Leaders: ${growth.developLeaders}` : '',
    growth.buildSystems ? `Systems: ${growth.buildSystems}` : '',
    growth.increaseCapacity ? `Capacity: ${growth.increaseCapacity}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const profitFormulaNarrative = [
    'SUSTAINABILITY & PROFIT',
    `Break-even monthly revenue: ${fmtPeso(breakEvenMonthlyRevenue)}`,
    `Year 1 commitment: ${fmtPeso(year1Revenue)} across ${year1Clients || '—'} clients`,
    'Reinvest margin into capacity (team, systems, technology) before lifestyle draw.',
    growth.longTermVision ? `Long-term vision: ${growth.longTermVision}` : '',
    'Profit formula: (Clients × Revenue per Client) − Variable Costs − Fixed Costs = Sustainable Growth',
  ]
    .filter(Boolean)
    .join('\n');

  return {
    ...base,
    importedFromGrowthAt: new Date().toISOString(),
    revenueModel: {
      year1Revenue,
      monthlyRevenue,
      weeklyRevenue,
      revenuePerClient,
      requiredClients: year1Clients,
      streamsNarrative,
    },
    economics: {
      variableCostsMonthly,
      fixedCostsMonthly,
      contributionPerClient,
      marginPercent,
      costStructureNarrative,
    },
    scaling: {
      year1Revenue,
      year2Revenue,
      year3Revenue,
      year1Clients,
      year2Clients,
      year3Clients,
      capacityInvestment: growth.growthStrategyReflection || growth.increaseCapacity || '',
      scalingNarrative,
    },
    sustainability: {
      breakEvenMonthlyRevenue,
      reinvestmentPlan:
        growth.growthStrategy === 'team'
          ? 'Reinvest first-year margin into associate advisors and coaching systems.'
          : growth.growthStrategy === 'systems'
            ? 'Reinvest into CRM, automation, and training before increasing personal activity.'
            : 'Reinvest 20–30% of monthly surplus into capacity that multiplies client acquisition.',
      profitFormulaNarrative,
    },
  };
}
