/**
 * @typedef {Object} FecBoxScore
 * @property {number} before
 * @property {number} after
 * @property {number} evidenceCount
 * @property {string} status
 * @property {string} approvedText
 */

/**
 * @typedef {Object} FecStepState
 * @property {string | null} completedAt
 * @property {string} [approvedStatement]
 * @property {Record<string, unknown>} [selections]
 * @property {string} [verdict]
 * @property {string} [beforeText]
 * @property {string} [afterText]
 */

/**
 * @typedef {Object} FecValidationSquadState
 * @property {Record<string, FecStepState>} steps
 * @property {Record<string, FecBoxScore>} boxScores
 * @property {Record<string, string>} squadRoles
 * @property {Record<string, string>} pitchSlides
 * @property {string | null} pitchSubmittedAt
 * @property {string | null} updatedAt
 */

export {};
