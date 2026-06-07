/**
 * Day 1 builder local storage — no playbook imports (avoids circular deps).
 */
import { DAY1_BUILDERS } from './day1BuilderConstants.js';

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
  return readAll()[participantId]?.builders?.[builderId] ?? null;
}

/** @param {string} participantId @param {string} builderId */
export function isBuilderCompleted(participantId, builderId) {
  return Boolean(readBuilderEntry(participantId, builderId)?.completedAt);
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
 */
export function writeBuilderEntry(participantId, builderId, data, completed = false) {
  const all = ensureDay1User(participantId);
  const entry = {
    data,
    updatedAt: new Date().toISOString(),
    ...(completed ? { completedAt: new Date().toISOString() } : {}),
  };
  all[participantId].builders[builderId] = entry;
  writeAll(all);
  return entry;
}

export { readAll as readDay1BuilderStore, writeAll as writeDay1BuilderStore };
