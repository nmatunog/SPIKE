/**
 * @typedef {Object} Week4Day2MissionDrafts
 * @property {{ fiveXChallenge: string }} mission1
 * @property {{
 *   stageId: string,
 *   bottleneck: string,
 *   solution: string,
 *   expectedImpact: string,
 * }} mission2
 * @property {{ leadershipMultiplier: string }} mission3
 */

/**
 * @typedef {Object} Week4Day2MissionState
 * @property {string} participantId
 * @property {number} currentStep
 * @property {number[]} completedSteps
 * @property {Week4Day2MissionDrafts} drafts
 * @property {string | null} completedAt
 * @property {string | null} updatedAt
 * @property {string | null} createdAt
 */

export {};
