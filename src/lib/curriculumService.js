/**
 * Curriculum facade — JSON `/content` tree with optional Supabase enrichment (Sprint 02 PR8).
 * @typedef {import('./contentLoader.js').DayContentBundle} DayContentBundle
 * @typedef {import('../types/playbook').DayContribution} DayContribution
 */

import * as jsonLoader from './contentLoader.js';
import {
  fetchAllDayContributions,
  hasSupabaseCurriculumTree,
} from './supabase/curriculum.js';

/** @type {Map<string, DayContribution>} */
const contributionsByDayId = new Map();

/** @type {'json' | 'hybrid'} */
let dataSource = 'json';

/** @type {Promise<void> | null} */
let hydrationPromise = null;

/**
 * Loads reference rows from Supabase (day contributions). Full curriculum tree still
 * comes from `/content` until DB import is populated.
 * @returns {Promise<void>}
 */
export async function hydrateCurriculumFromSupabase() {
  if (hydrationPromise) return hydrationPromise;

  hydrationPromise = (async () => {
    const [contributions, hasDbTree] = await Promise.all([
      fetchAllDayContributions(),
      hasSupabaseCurriculumTree(),
    ]);

    if (contributions?.length) {
      contributionsByDayId.clear();
      for (const row of contributions) {
        contributionsByDayId.set(row.dayId, row);
      }
    }

    if (contributions?.length || hasDbTree) {
      dataSource = 'hybrid';
    }
  })();

  return hydrationPromise;
}

/** @returns {'json' | 'hybrid'} */
export function getCurriculumDataSource() {
  return dataSource;
}

export const listSegments = jsonLoader.listSegments;
export const getSegment = jsonLoader.getSegment;
export const listWeeks = jsonLoader.listWeeks;
export const getWeek = jsonLoader.getWeek;
export const listDays = jsonLoader.listDays;
export const getSegment1Week1Day1Bundle = jsonLoader.getSegment1Week1Day1Bundle;
export const assertSegment1Week1Day1Ready = jsonLoader.assertSegment1Week1Day1Ready;

/**
 * @param {string} segmentSlug
 * @param {string} weekSlug
 * @param {string} daySlug
 * @returns {DayContentBundle | undefined}
 */
export function getDayContentBundle(segmentSlug, weekSlug, daySlug) {
  const bundle = jsonLoader.getDayContentBundle(segmentSlug, weekSlug, daySlug);
  if (!bundle) return undefined;

  const dbContrib = contributionsByDayId.get(bundle.day.id);
  if (!dbContrib) return bundle;

  return {
    ...bundle,
    contributions: dbContrib,
  };
}
