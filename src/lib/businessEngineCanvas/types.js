/**
 * @typedef {Object} EngineStepValue
 * @property {number} value
 * @property {string} label
 */

/**
 * @typedef {Object} GrowthSimRow
 * @property {number | string} prospects
 * @property {number | string} discovery
 * @property {number | string} presentations
 * @property {number | string} clients
 * @property {number | string} revenue
 * @property {number | string} referrals
 */

/**
 * @typedef {Object} BusinessEngineCanvasState
 * @property {number} week
 * @property {Record<string, EngineStepValue>} activityEngine
 * @property {Record<string, number | string>} weeklyTargets
 * @property {Record<string, number | string>} monthlyTargets
 * @property {Record<string, boolean>} monthlyManualOverride
 * @property {Record<string, number | string>} year1Targets
 * @property {string | null} businessLever
 * @property {{ current: GrowthSimRow, new: GrowthSimRow }} growthSimulation
 * @property {Record<string, string>} reflections
 * @property {string | null} updatedAt
 * @property {string | null} createdAt
 */

export {};
