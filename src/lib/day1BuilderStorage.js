/**
 * Day 1 builder local storage — no playbook imports (avoids circular deps).
 */
import { DAY1_BUILDERS, DAY1_BUILDER_COACH_MAP, LEGACY_BUILDER_IDS } from './day1BuilderConstants.js';
import { isCoachSectionComplete, isCoachSectionEditLocked, resetCoachSection } from './ventureCoachStorage.js';
import {
  canRefineDay1Builder,
  isDay1BuilderEditLocked,
} from './portfolioEditWindow.js';

const STORAGE_KEY = 'spike_day1_builders';

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeAll(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** @param {string} participantId */
export function ensureDay1User(participantId) {
  const all = readAll();
  if (!all[participantId]) {
    all[participantId] = { builders: {}, charter: null };
  }
  return all;
}

/** @param {string} participantId @param {string} builderId */
export function readBuilderEntry(participantId, builderId) {
  const builders = readAll()[participantId]?.builders ?? {};
  if (builders[builderId]) return builders[builderId];

  const legacyId = Object.entries(LEGACY_BUILDER_IDS).find(([, current]) => current === builderId)?.[0];
  if (legacyId && builders[legacyId]) return builders[legacyId];

  return null;
}

/** @param {string} participantId @param {string} builderId */
export function isBuilderCompleted(participantId, builderId) {
  if (readBuilderEntry(participantId, builderId)?.completedAt) return true;
  const coachSection = DAY1_BUILDER_COACH_MAP[builderId];
  if (coachSection && isCoachSectionComplete(participantId, coachSection)) return true;
  return false;
}

/** @param {string} participantId @param {string} builderId */
export function isBuilderEditLocked(participantId, builderId) {
  const entry = readBuilderEntry(participantId, builderId);
  if (entry) return isDay1BuilderEditLocked(entry);
  const coachSection = DAY1_BUILDER_COACH_MAP[builderId];
  if (coachSection) return isCoachSectionEditLocked(participantId, coachSection);
  return false;
}

/** @param {string} participantId @param {string} builderId */
export function canRefineBuilder(participantId, builderId) {
  const entry = readBuilderEntry(participantId, builderId);
  if (entry) return canRefineDay1Builder(entry);
  return false;
}

/** @param {string} participantId @param {string} builderId */
export function startBuilderRefinement(participantId, builderId) {
  const entry = readBuilderEntry(participantId, builderId);
  if (!entry || !canRefineDay1Builder(entry)) return entry;
  return writeBuilderEntry(participantId, builderId, entry.data, false, { refining: true, force: true });
}

/** @param {string} participantId */
export function getDay1MissionProgress(participantId) {
  const completed = DAY1_BUILDERS.filter((b) => isBuilderCompleted(participantId, b.id)).length;
  return {
    completed,
    total: DAY1_BUILDERS.length,
    percent: Math.round((completed / DAY1_BUILDERS.length) * 100),
    builders: DAY1_BUILDERS.map((b) => ({
      ...b,
      completed: isBuilderCompleted(participantId, b.id),
    })),
  };
}

/** @param {string} participantId */
export function getAllDay1BuilderData(participantId) {
  const user = readAll()[participantId];
  if (!user) return {};
  return { ...(user.builders ?? {}) };
}

/**
 * @param {string} participantId
 * @param {string} builderId
 * @param {Record<string, unknown>} data
 * @param {boolean} [completed]
 * @param {{ refining?: boolean, force?: boolean }} [options]
 */
export function writeBuilderEntry(participantId, builderId, data, completed = false, options = {}) {
  const existing = readBuilderEntry(participantId, builderId);
  if (!options.force && existing && isDay1BuilderEditLocked(existing)) {
    return existing;
  }

  const all = ensureDay1User(participantId);
  const now = new Date().toISOString();
  const firstCompletedAt =
    existing?.firstCompletedAt ?? (completed || existing?.completedAt ? now : undefined);

  /** @type {Record<string, unknown>} */
  let entry;
  if (completed) {
    entry = {
      data,
      updatedAt: now,
      firstCompletedAt: firstCompletedAt ?? now,
      completedAt: now,
      refining: false,
    };
  } else {
    entry = {
      data,
      updatedAt: now,
      ...(firstCompletedAt ? { firstCompletedAt } : {}),
      ...(existing?.completedAt ? { completedAt: existing.completedAt } : {}),
      refining: options.refining ?? existing?.refining ?? false,
    };
  }
  all[participantId].builders[builderId] = entry;
  writeAll(all);
  return entry;
}

/** @param {string} participantId @param {string} builderId */
export function clearBuilderEntry(participantId, builderId) {
  const all = readAll();
  const user = all[participantId];
  if (!user?.builders) return;

  delete user.builders[builderId];

  const legacyId = Object.entries(LEGACY_BUILDER_IDS).find(([, current]) => current === builderId)?.[0];
  if (legacyId) delete user.builders[legacyId];

  const coachSection = DAY1_BUILDER_COACH_MAP[builderId];
  if (coachSection) resetCoachSection(participantId, coachSection);

  writeAll(all);
}

export { readAll as readDay1BuilderStore, writeAll as writeDay1BuilderStore };
