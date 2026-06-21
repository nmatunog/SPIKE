/**
 * Persist stage gate unlock state (local until cohort gate RPC ships).
 */
import { UNLOCK_WEEK2 } from './programUnlocks.js';

const STORAGE_KEY = 'spike_stage_gate_unlocks';

/** @param {number} segment @param {number} closingWeek */
export function stageGateKey(segment, closingWeek) {
  return `${segment}-${closingWeek}`;
}

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return { gates: {} };
  }
}

function writeAll(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('[stageGate] save failed:', err instanceof Error ? err.message : err);
  }
}

/** @param {number} segment @param {number} closingWeek */
export function isStageGateUnlocked(segment, closingWeek) {
  if (UNLOCK_WEEK2 && segment === 1 && closingWeek === 1) return true;
  const key = stageGateKey(segment, closingWeek);
  return Boolean(readAll().gates?.[key]?.unlockedAt);
}

/**
 * @param {number} segment
 * @param {number} closingWeek
 * @param {{ unlockedBy?: string, nextWeek?: number }} meta
 */
export function saveStageGateUnlock(segment, closingWeek, meta = {}) {
  const store = readAll();
  if (!store.gates) store.gates = {};
  const key = stageGateKey(segment, closingWeek);
  store.gates[key] = {
    unlockedAt: new Date().toISOString(),
    unlockedBy: meta.unlockedBy ?? null,
    nextWeek: meta.nextWeek ?? closingWeek + 1,
  };
  writeAll(store);
  return store.gates[key];
}

/** @param {number} segment @param {number} closingWeek */
export function readStageGateUnlock(segment, closingWeek) {
  const key = stageGateKey(segment, closingWeek);
  return readAll().gates?.[key] ?? null;
}

/** @param {number} segment @param {number} closingWeek */
export function clearStageGateUnlock(segment, closingWeek) {
  const store = readAll();
  if (!store.gates) return;
  delete store.gates[stageGateKey(segment, closingWeek)];
  writeAll(store);
}
