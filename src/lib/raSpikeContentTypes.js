/**
 * @typedef {Object} RaSpikeStepContent
 * @property {string} label
 * @property {string} headline
 * @property {string} summary
 * @property {number} [durationMinutes]
 * @property {string[]} [bullets]
 * @property {string} [callout]
 * @property {string[]} [prompts]
 * @property {{ type: string, label?: string, gate?: number } | null} [action]
 */

/**
 * @typedef {{ id: string, label: string }} RaSpikePortfolioArtifactDef
 */

/**
 * @typedef {{ id: string, slot: string, prompt: string }} RaSpikeCoachPrompt
 */

/**
 * @typedef {Object} RaSpikeWeekContent
 * @property {number} weekNumber
 * @property {string} segment
 * @property {string} title
 * @property {string} theme
 * @property {boolean} [contentReady]
 * @property {string[]} [modules]
 * @property {RaSpikePortfolioArtifactDef[]} [portfolioArtifacts]
 * @property {RaSpikeCoachPrompt[]} [coachPrompts]
 * @property {Partial<Record<'learn'|'workshop'|'assignment'|'reflection'|'portfolio'|'submit', RaSpikeStepContent>>} [steps]
 */

export {};
