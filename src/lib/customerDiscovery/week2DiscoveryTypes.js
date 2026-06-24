/**
 * @typedef {Object} Week2Assumption
 * @property {string} id
 * @property {string} belief
 * @property {string} [researchQuestion]
 * @property {'High' | 'Medium' | 'Low'} [priority]
 * @property {'Not Started' | 'Testing' | 'Validated' | 'Invalidated'} [status]
 */

/**
 * @typedef {Object} Week2Question
 * @property {string} id
 * @property {string} text
 * @property {string} [purpose]
 * @property {string} [section]
 * @property {string} [placeholder]
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
 * @typedef {Object} Week2InterviewInsights
 * @property {string[]} goals
 * @property {string[]} painPoints
 * @property {string[]} themes
 * @property {string[]} opportunities
 * @property {string[]} quotes
 * @property {string[]} protectionGaps
 */

/**
 * @typedef {Object} Week2EncodedInterview
 * @property {string} id
 * @property {string} alias
 * @property {string} occupation
 * @property {string[]} answers
 * @property {string} [reflection]
 * @property {boolean} encoded
 * @property {Week2InterviewInsights} [aiInsights]
 * @property {string} [encodedAt]
 */

/**
 * @typedef {Object} Week2PitchOutline
 * @property {string} mission
 * @property {string} whoInterviewed
 * @property {string} whatWeThought
 * @property {string} whatWeLearned
 * @property {string} customerVoices
 * @property {string} biggestProblem
 * @property {string} beliefShift
 * @property {string} ventureChanged
 * @property {string} nextSteps
 * @property {string} advisorInsight
 */

/**
 * @typedef {Object} Week2DiscoveryState
 * @property {boolean} missionAcknowledged
 * @property {string | null} assumptionsCompletedAt
 * @property {string | null} guideCompletedAt
 * @property {string | null} researchPlanSubmittedAt
 * @property {string | null} squadAlignedAt
 * @property {string | null} portfolioSyncedAt
 * @property {string | null} exchangeReflectionAt
 * @property {string} exchangeReflectionText
 * @property {string | null} professionalReadinessAt
 * @property {string | null} readinessReflectionAt
 * @property {string | null} synthesisReviewedAt
 * @property {string | null} intelligenceBoardAt
 * @property {string | null} pitchStartedAt
 * @property {string | null} pitchSubmittedAt
 * @property {Week2Assumption[]} assumptions
 * @property {Week2Question[]} questions
 * @property {Week2ThinkingShift[]} thinkingShifts
 * @property {Week2EncodedInterview[]} interviews
 * @property {string} fieldResearchPlan
 * @property {string} squadDiscussionNotes
 * @property {string} readinessEvidenceNote
 * @property {string | null} pctcStartedAt
 * @property {string} pctcCertificate1Id
 * @property {string} pctcCertificate2Id
 * @property {string | null} readinessBadgeEarnedAt
 * @property {string} readinessReflectionSurprised
 * @property {string} readinessReflectionResponsibility
 * @property {string} readinessReflectionTrustedAdvisor
 * @property {string} readinessReflectionSummary
 * @property {string | null} readinessReflectionApprovedAt
 * @property {string} uvpCheckpointOriginal
 * @property {string} uvpCheckpointVerdict
 * @property {string} uvpCheckpointNotes
 * @property {string | null} uvpCheckpointAt
 * @property {Week2PitchOutline} pitchOutline
 * @property {string | null} cloudSyncedAt
 * @property {string | null} updatedAt
 */

export {};
