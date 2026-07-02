import { FEW_STORAGE_KEY } from './types.js';
import { populateFinancialEngineFromGrowth } from './populateFromGrowth.js';
import { loadGrowthEngineWorksheet } from '../growthEngineWorksheet/storage.js';

/** @returns {import('./types.js').FinancialEngineWorksheetState} */
export function defaultFinancialEngineWorksheetState() {
  return {
    week: 3,
    day: 4,
    importedFromGrowthAt: null,
    revenueModel: {
      year1Revenue: '',
      monthlyRevenue: '',
      weeklyRevenue: '',
      revenuePerClient: '',
      requiredClients: '',
      streamsNarrative: '',
    },
    economics: {
      variableCostsMonthly: '',
      fixedCostsMonthly: '',
      contributionPerClient: '',
      marginPercent: '',
      costStructureNarrative: '',
    },
    scaling: {
      year1Revenue: '',
      year2Revenue: '',
      year3Revenue: '',
      year1Clients: '',
      year2Clients: '',
      year3Clients: '',
      capacityInvestment: '',
      scalingNarrative: '',
    },
    sustainability: {
      breakEvenMonthlyRevenue: '',
      reinvestmentPlan: '',
      profitFormulaNarrative: '',
    },
    mentorStatus: null,
    mentorFeedback: '',
    completed: false,
    updatedAt: null,
    createdAt: null,
  };
}

function readAll() {
  try {
    const raw = localStorage.getItem(FEW_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(data) {
  localStorage.setItem(FEW_STORAGE_KEY, JSON.stringify(data));
}

function growthHasTargets(growth) {
  return Boolean(growth?.targets?.yearRevenueGoal && growth?.targets?.requiredClients);
}

/** @param {string} participantId @returns {import('./types.js').FinancialEngineWorksheetState} */
export function loadFinancialEngineWorksheet(participantId) {
  if (!participantId) return defaultFinancialEngineWorksheetState();
  const all = readAll();
  const row = all[participantId];
  if (!row) {
    const growth = loadGrowthEngineWorksheet(participantId);
    if (growthHasTargets(growth)) {
      return populateFinancialEngineFromGrowth(participantId);
    }
    return defaultFinancialEngineWorksheetState();
  }
  const merged = {
    ...defaultFinancialEngineWorksheetState(),
    ...row,
    revenueModel: { ...defaultFinancialEngineWorksheetState().revenueModel, ...(row.revenueModel ?? {}) },
    economics: { ...defaultFinancialEngineWorksheetState().economics, ...(row.economics ?? {}) },
    scaling: { ...defaultFinancialEngineWorksheetState().scaling, ...(row.scaling ?? {}) },
    sustainability: {
      ...defaultFinancialEngineWorksheetState().sustainability,
      ...(row.sustainability ?? {}),
    },
  };
  return merged;
}

/** @param {string} participantId @param {import('./types.js').FinancialEngineWorksheetState} state */
export function saveFinancialEngineWorksheet(participantId, state) {
  if (!participantId) return state;
  const all = readAll();
  const now = new Date().toISOString();
  const next = {
    ...state,
    updatedAt: now,
    createdAt: state.createdAt ?? now,
  };
  all[participantId] = next;
  writeAll(all);
  return next;
}

/** @param {import('./types.js').FinancialEngineWorksheetState} state */
export function computeFinancialEngineProgress(state) {
  const texts = [
    state.revenueModel.streamsNarrative,
    state.economics.costStructureNarrative,
    state.scaling.scalingNarrative,
    state.scaling.capacityInvestment,
    state.sustainability.profitFormulaNarrative,
    state.sustainability.reinvestmentPlan,
  ];
  const filled = texts.filter((t) => String(t).trim().length >= 20).length;
  const nums = [
    state.revenueModel.year1Revenue,
    state.scaling.year2Revenue,
    state.scaling.year3Revenue,
    state.economics.marginPercent,
  ].filter((n) => num(n) > 0).length;
  return Math.round(((filled + nums) / 10) * 100);
}

function num(n) {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}
