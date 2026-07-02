/** @typedef {'productivity' | 'technology' | 'systems' | 'partnerships' | 'advisors' | 'team' | 'other'} GrowthStrategyId */

/**
 * @typedef {Object} GrowthEngineTargets
 * @property {number | string} yearRevenueGoal
 * @property {number | string} averageRevenuePerClient
 * @property {number | string} requiredClients
 * @property {Record<string, number | string>} monthlyTargets
 * @property {Record<string, number | string>} weeklyTargets
 */

/**
 * @typedef {Object} GrowthEngineWorksheetState
 * @property {number} week
 * @property {number} day
 * @property {string} openingBiggestInsight
 * @property {string} openingBiggestSurprise
 * @property {string} openingOneImprovement
 * @property {string} capacityLimitReflection
 * @property {'activity' | 'capacity' | ''} capacityVsActivitySide
 * @property {string} developLeaders
 * @property {string} buildSystems
 * @property {string} increaseCapacity
 * @property {string} expandMarket
 * @property {string} longTermVision
 * @property {GrowthEngineTargets} targets
 * @property {boolean | null} engineAchievesTarget
 * @property {string} engineChangeIfNo
 * @property {GrowthStrategyId | ''} growthStrategy
 * @property {string} growthStrategyOther
 * @property {string} growthStrategyReflection
 * @property {string} fecYear1Launch
 * @property {string} fecYear2Expand
 * @property {string} fecYear3Multiply
 * @property {boolean} pitchClientExperience
 * @property {boolean} pitchWinningStrategy
 * @property {boolean} pitchBusinessEngine
 * @property {boolean} pitchGrowthEngine
 * @property {boolean} pitchRevenueTargets
 * @property {boolean} pitchCapacityPlan
 * @property {string | null} mentorStatus
 * @property {string} mentorFeedback
 * @property {boolean} completed
 * @property {string | null} updatedAt
 * @property {string | null} createdAt
 */

export const GROWTH_STRATEGY_OPTIONS = [
  { id: 'productivity', label: 'Increase productivity' },
  { id: 'technology', label: 'Technology' },
  { id: 'systems', label: 'Systems' },
  { id: 'partnerships', label: 'Partnerships' },
  { id: 'advisors', label: 'Develop advisors' },
  { id: 'team', label: 'Build a team' },
  { id: 'other', label: 'Other' },
];

export const GEW_STORAGE_KEY = 'spike_growth_engine_worksheet';
export const GEW_AUTOSAVE_MS = 3000;

export {};
