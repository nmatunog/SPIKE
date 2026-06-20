/**
 * @typedef {Object} Week2Assumption
 * @property {string} id
 * @property {string} belief
 * @property {string} researchQuestion
 * @property {'High' | 'Medium' | 'Low'} priority
 * @property {'Not Started' | 'Testing' | 'Validated' | 'Invalidated'} status
 */

/**
 * @typedef {Object} Week2Question
 * @property {string} id
 * @property {string} text
 * @property {string} [purpose]
 * @property {string} [section]
 * @property {string} [linkedAssumptionId]
 */

/**
 * @typedef {Object} Week2ThinkingShift
 * @property {string} id
 * @property {string} prompt
 * @property {string} response
 * @property {string} [aiFrom]
 * @property {string} [aiTo]
 * @property {string} taskId
 * @property {string} createdAt
 */

/**
 * @typedef {Object} Week2DiscoveryState
 * @property {boolean} missionAcknowledged
 * @property {string | null} guideCompletedAt
 * @property {string | null} portfolioSyncedAt
 * @property {Week2Assumption[]} assumptions
 * @property {Week2Question[]} questions
 * @property {Week2ThinkingShift[]} thinkingShifts
 * @property {unknown[]} interviews
 * @property {string | null} updatedAt
 */

export {};
