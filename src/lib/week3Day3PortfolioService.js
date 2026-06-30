/**
 * Week 3 Day 3 portfolio — FNA role-play reflections + FEC Box 4/5 improvement notes.
 */
import { ROUTES } from '../routes/paths.js';

const STORAGE_KEY = 'spike-week3-day3-portfolio';

/** @typedef {'whatWorked' | 'whatAwkward' | 'whatBuildsTrust' | 'clientExperienceVision' | 'whyChoosePractice'} Week3Day3PortfolioField */

/**
 * @typedef {Object} Week3Day3PortfolioState
 * @property {string} whatWorked
 * @property {string} whatAwkward
 * @property {string} whatBuildsTrust
 * @property {string} clientExperienceVision
 * @property {string} whyChoosePractice
 * @property {string | null} updatedAt
 */

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** @returns {Week3Day3PortfolioState} */
function defaultState() {
  return {
    whatWorked: '',
    whatAwkward: '',
    whatBuildsTrust: '',
    clientExperienceVision: '',
    whyChoosePractice: '',
    updatedAt: null,
  };
}

/** @param {string} participantId */
export function loadWeek3Day3Portfolio(participantId) {
  if (!participantId) return defaultState();
  const row = readAll()[participantId];
  return { ...defaultState(), ...(row ?? {}) };
}

/**
 * @param {string} participantId
 * @param {Partial<Week3Day3PortfolioState>} patch
 */
export function saveWeek3Day3Portfolio(participantId, patch) {
  if (!participantId) return defaultState();
  const all = readAll();
  const next = {
    ...loadWeek3Day3Portfolio(participantId),
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  all[participantId] = next;
  writeAll(all);
  return next;
}

/** @param {string} participantId */
export function isWeek3Day3PortfolioComplete(participantId) {
  const state = loadWeek3Day3Portfolio(participantId);
  const fields = [
    state.whatWorked,
    state.whatAwkward,
    state.whatBuildsTrust,
    state.clientExperienceVision,
    state.whyChoosePractice,
  ];
  return fields.every((value) => String(value ?? '').trim().length >= 20);
}

/** @param {string} [missionSlug] */
export function playbookWeek3Day3Href(missionSlug) {
  const params = new URLSearchParams({
    segment: '1',
    week: '3',
    day: '3',
  });
  if (missionSlug) params.set('mission', missionSlug);
  return `${ROUTES.playbook}?${params.toString()}`;
}

export const WEEK3_DAY3_FEC_EDIT_SLUGS = {
  box4: 'fec-step-4',
  box5: 'fec-step-5',
};

/** @param {string} slug */
export function isWeek3Day3FecEditSlug(slug) {
  return slug === WEEK3_DAY3_FEC_EDIT_SLUGS.box4 || slug === WEEK3_DAY3_FEC_EDIT_SLUGS.box5;
}
