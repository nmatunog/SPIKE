/** @typedef {Object} FinancialEngineRevenueModel
 * @property {number | string} year1Revenue
 * @property {number | string} monthlyRevenue
 * @property {number | string} weeklyRevenue
 * @property {number | string} revenuePerClient
 * @property {number | string} requiredClients
 * @property {string} streamsNarrative
 */

/** @typedef {Object} FinancialEngineEconomics
 * @property {number | string} variableCostsMonthly
 * @property {number | string} fixedCostsMonthly
 * @property {number | string} contributionPerClient
 * @property {number | string} marginPercent
 * @property {string} costStructureNarrative
 */

/** @typedef {Object} FinancialEngineScaling
 * @property {number | string} year1Revenue
 * @property {number | string} year2Revenue
 * @property {number | string} year3Revenue
 * @property {number | string} year1Clients
 * @property {number | string} year2Clients
 * @property {number | string} year3Clients
 * @property {string} capacityInvestment
 * @property {string} scalingNarrative
 */

/** @typedef {Object} FinancialEngineSustainability
 * @property {number | string} breakEvenMonthlyRevenue
 * @property {string} reinvestmentPlan
 * @property {string} profitFormulaNarrative
 */

/**
 * @typedef {Object} FinancialEngineWorksheetState
 * @property {number} week
 * @property {number} day
 * @property {string | null} importedFromGrowthAt
 * @property {FinancialEngineRevenueModel} revenueModel
 * @property {FinancialEngineEconomics} economics
 * @property {FinancialEngineScaling} scaling
 * @property {FinancialEngineSustainability} sustainability
 * @property {string | null} mentorStatus
 * @property {string} mentorFeedback
 * @property {boolean} completed
 * @property {string | null} updatedAt
 * @property {string | null} createdAt
 */

export const FEW_STORAGE_KEY = 'spike_financial_engine_worksheet';
export const FEW_AUTOSAVE_MS = 3000;

export {};
