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

/**
 * Recompute derived economics and refresh narrative blocks from current numbers.
 * @param {import('./types.js').FinancialEngineWorksheetState} state
 */
export function recalculateFinancialEngine(state) {
  const monthlyRevenue = num(state.revenueModel.monthlyRevenue);
  const variableCosts = num(state.economics.variableCostsMonthly);
  const fixedCosts = num(state.economics.fixedCostsMonthly);
  const revenuePerClient = num(state.revenueModel.revenuePerClient);
  const marginPercent =
    monthlyRevenue > 0
      ? Math.round(((monthlyRevenue - variableCosts - fixedCosts) / monthlyRevenue) * 100)
      : '';
  const breakEven = variableCosts + fixedCosts;

  const updatedEconomics = [
    'ECONOMICS',
    `Monthly revenue at target: ${fmtPeso(monthlyRevenue)}`,
    `Variable costs: ${fmtPeso(variableCosts)}`,
    `Fixed costs: ${fmtPeso(fixedCosts)}`,
    `Contribution per new client: ${fmtPeso(revenuePerClient)}`,
    marginPercent !== '' ? `Operating margin at target: ${marginPercent}%` : '',
    'Scale activity before headcount — reinvest surplus into capacity.',
  ]
    .filter(Boolean)
    .join('\n');

  const scaling = state.scaling;
  const updatedScaling = [
    'SCALING PLAN',
    `Year 1 — Launch: ${fmtPeso(scaling.year1Revenue)} · ${scaling.year1Clients} clients`,
    `Year 2 — Expand: ${fmtPeso(scaling.year2Revenue)} · ${scaling.year2Clients} clients`,
    `Year 3 — Multiply: ${fmtPeso(scaling.year3Revenue)} · ${scaling.year3Clients} clients`,
    scaling.capacityInvestment ? `Capacity investment: ${scaling.capacityInvestment}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const updatedSustainability = [
    'SUSTAINABILITY & PROFIT',
    `Break-even monthly revenue: ${fmtPeso(breakEven)}`,
    `Year 1 target: ${fmtPeso(state.revenueModel.year1Revenue)} · ${state.revenueModel.requiredClients} clients`,
    state.sustainability.reinvestmentPlan
      ? `Reinvestment: ${state.sustainability.reinvestmentPlan}`
      : '',
    'Profit formula: (Clients × Revenue per Client) − Variable Costs − Fixed Costs = Sustainable Growth',
  ]
    .filter(Boolean)
    .join('\n');

  return {
    ...state,
    economics: {
      ...state.economics,
      contributionPerClient: revenuePerClient,
      marginPercent,
      costStructureNarrative: updatedEconomics,
    },
    sustainability: {
      ...state.sustainability,
      breakEvenMonthlyRevenue: breakEven,
      profitFormulaNarrative: updatedSustainability,
    },
    scaling: {
      ...state.scaling,
      scalingNarrative: updatedScaling,
    },
  };
}
