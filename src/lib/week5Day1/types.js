/** @typedef {{ id: string, fieldId?: string, previousValue: string, newValue: string, at: string, aiAssisted?: boolean }} ResponseVersion */

/** @typedef {{ id: string, title: string, description: string, emotion: string, advisorAction: string, platformSupport: string, risk: string }} JourneyStage */

/**
 * @typedef {Object} Week5Day1MissionState
 * @property {string} participantId
 * @property {Record<string, string>} responses
 * @property {JourneyStage[]} journeyStages
 * @property {Record<string, boolean>} fecPitchLocks
 * @property {Record<string, string>} sectionStatus
 * @property {Record<string, string>} reflection
 * @property {ResponseVersion[]} versions
 * @property {string | null} updatedAt
 * @property {string | null} createdAt
 */

export {};
