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

export {};
