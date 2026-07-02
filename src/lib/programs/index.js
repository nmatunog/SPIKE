import { DEFAULT_PROGRAM_SLUG, PROGRAM_SLUGS } from './constants.js';
import { RA_SPIKE_PROGRAM } from './ra-spike.js';
import { SPIKE_INTERNSHIP_PROGRAM } from './spike-internship.js';

/**
 * @typedef {{
 *   slug: string,
 *   title: string,
 *   tagline: string,
 *   theme: string,
 *   defaultRoute: string,
 *   totalWeeks: number,
 *   unlockPolicy: 'strict' | 'pilot',
 *   segments: Array<{ id: string, label: string, weeks: number[] }>,
 *   stageGates: Array<{ id: string, week: number, segment: string, title: string, label: string }>,
 *   graduationTarget: string | null,
 *   nav: Array<{ path: string, label: string, shortLabel?: string, icon: string }>,
 *   weekModuleMap?: Record<number, string[]>,
 * }} ProgramDefinition
 */

/** @type {Record<string, ProgramDefinition>} */
const PROGRAM_REGISTRY = {
  [PROGRAM_SLUGS.RA_SPIKE]: RA_SPIKE_PROGRAM,
  [PROGRAM_SLUGS.SPIKE_INTERNSHIP]: SPIKE_INTERNSHIP_PROGRAM,
};

/**
 * @param {string | null | undefined} slug
 * @returns {ProgramDefinition}
 */
export function getProgramDefinition(slug) {
  const key = String(slug ?? '').trim() || DEFAULT_PROGRAM_SLUG;
  return PROGRAM_REGISTRY[key] ?? SPIKE_INTERNSHIP_PROGRAM;
}

/**
 * @param {object | null | undefined} internProgress
 * @returns {string}
 */
export function resolveProgramSlug(internProgress) {
  const slug = internProgress?.program_slug;
  if (slug && PROGRAM_REGISTRY[slug]) return slug;
  return DEFAULT_PROGRAM_SLUG;
}

/** @param {string | null | undefined} programSlug */
export function isRaSpikeProgram(programSlug) {
  return resolveProgramSlug({ program_slug: programSlug }) === PROGRAM_SLUGS.RA_SPIKE;
}

/**
 * @param {object | null | undefined} internProgress
 * @returns {number}
 */
export function resolveRaSpikeWeek(internProgress) {
  const week = internProgress?.ra_spike_current_week ?? 1;
  return Math.max(1, Math.min(RA_SPIKE_PROGRAM.totalWeeks, week));
}

/**
 * @param {object | null | undefined} internProgress
 * @returns {number}
 */
export function resolveRaSpikeSegment(internProgress) {
  const segment = internProgress?.ra_spike_segment ?? 1;
  return segment >= 2 ? 2 : 1;
}

/** @param {number} week */
export function raSpikeSegmentForWeek(week) {
  return week <= 4 ? 1 : 2;
}

/**
 * @param {object | null | undefined} internProgress
 * @returns {ProgramDefinition}
 */
export function getProgramForIntern(internProgress) {
  return getProgramDefinition(resolveProgramSlug(internProgress));
}

export { DEFAULT_PROGRAM_SLUG, PROGRAM_SLUGS, RA_SPIKE_PROGRAM, SPIKE_INTERNSHIP_PROGRAM };

/** @returns {ProgramDefinition[]} */
export function listProgramDefinitions() {
  return Object.values(PROGRAM_REGISTRY);
}
