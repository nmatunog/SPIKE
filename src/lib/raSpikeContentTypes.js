/**
 * @typedef {Object} RaSpikeStepContent
 * @property {string} label
 * @property {string} headline
 * @property {string} summary
 * @property {number} [durationMinutes]
 * @property {string[]} [bullets]
 * @property {string} [callout]
 * @property {string[]} [prompts]
 * @property {{ type: string, label?: string }} | null} [action]
 */

/**
 * @typedef {Object} RaSpikeWeekContent
 * @property {number} weekNumber
 * @property {string} segment
 * @property {string} title
 * @property {string} theme
 * @property {string[]} [modules]
 * @property {Partial<Record<'learn'|'workshop'|'assignment'|'reflection'|'submit', RaSpikeStepContent>>} steps
 */

/**
 * @typedef {Object} RaSpikeFecWizardField
 * @property {string} pillar
 * @property {string} key
 * @property {string} [label]
 * @property {string} [hint]
 * @property {number} [minChars]
 */

/**
 * @typedef {Object} RaSpikeFecWizardStep
 * @property {string} id
 * @property {string} [title]
 * @property {string} [question]
 * @property {string} [description]
 * @property {string} [pillar]
 * @property {RaSpikeFecWizardField[]} [fields]
 */

/**
 * @typedef {Object} RaSpikeFecWizardConfig
 * @property {string} title
 * @property {string} [subtitle]
 * @property {string} [lockedHeading]
 * @property {string[]} [lockedSections]
 * @property {RaSpikeFecWizardField[]} [lockedFieldKeys]
 * @property {RaSpikeFecWizardStep[]} steps
 */

/**
 * @typedef {Object} RaSpikeDiscoveryCanvas
 * @property {string} interviewed
 * @property {string[]} problems
 * @property {string} topProblem
 * @property {string} whyImportant
 * @property {string} idealAge
 * @property {string} idealOccupation
 * @property {string} idealFamily
 * @property {string} idealIncome
 * @property {string} idealLifeStage
 * @property {string} ifNothingChanges
 * @property {string} reflectionStruggle
 */

/**
 * @typedef {Object} RaSpikeDiscoveryCanvasConfig
 * @property {string} title
 * @property {string} [subtitle]
 * @property {string[]} [interviewExamples]
 * @property {number} [problemCount]
 */

export {};
