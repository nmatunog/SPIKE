/**
 * @typedef {Object} Week4Day1MissionDrafts
 * @property {{
 *   finalProposition: string,
 *   propositionKind: 'venture' | 'tool',
 *   toolRelocatedTo: string,
 *   brainstormNotes: string,
 * }} mission1
 * @property {{
 *   clientExperience: string,
 *   journey: { discover: string, plan: string, protect: string, review: string, refer: string },
 * }} mission2
 * @property {{ winningStrategy: string }} mission3
 * @property {{
 *   selected: { advisorExcellence: string[], teamLeadership: string[], systemsScale: string[] },
 *   summary: string,
 * }} mission4
 * @property {{ keyActivities: string, keyResources: string }} blueprint
 */

/**
 * @typedef {Object} Week4Day1MissionState
 * @property {string} participantId
 * @property {number} currentStep
 * @property {number[]} completedSteps
 * @property {Week4Day1MissionDrafts} drafts
 * @property {boolean} founderReviewAcknowledged
 * @property {string | null} completedAt
 * @property {string | null} updatedAt
 * @property {string | null} createdAt
 */

export {};
