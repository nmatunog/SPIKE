/**
 * FNA CRUD — localStorage + Supabase (Sprint 04 PR4.2).
 * Re-exported for Sprint 06 Client CRM reuse.
 * @typedef {import('../types/fna').FinancialNeedsAnalysis} FinancialNeedsAnalysis
 * @typedef {import('../types/fna').FnaRecommendation} FnaRecommendation
 * @typedef {import('../types/fna').FnaStatus} FnaStatus
 */

import { suggestFnaGaps } from './fnaGaps.js';
import { runFnaAutomation } from './fnaAutomation.js';
import { upsertFnaRecord } from './supabase/fnaRecords.js';

const STORAGE_KEY = 'spike_fna_records';

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
function listForUser(participantId) {
  return readAll()[participantId] ?? [];
}

/** @param {string} participantId @param {FinancialNeedsAnalysis[]} list */
function writeForUser(participantId, list) {
  const all = readAll();
  all[participantId] = list;
  writeAll(all);
}

/**
 * @param {string} participantId
 * @returns {FinancialNeedsAnalysis[]}
 */
export function listFnas(participantId) {
  return listForUser(participantId).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

/** @param {string} participantId @param {string} fnaId */
export function getFna(participantId, fnaId) {
  return listForUser(participantId).find((f) => f.id === fnaId) ?? null;
}

/** @param {string} participantId */
export function countCompletedFnas(participantId) {
  return listFnas(participantId).filter((f) => f.status !== 'draft').length;
}

/**
 * @param {string} participantId
 * @param {Partial<FinancialNeedsAnalysis>} input
 */
export function createFnaDraft(participantId, input = {}) {
  const now = new Date().toISOString();
  const record = {
    id: `fna-${crypto.randomUUID()}`,
    participantId,
    clientName: input.clientName ?? '',
    clientAge: input.clientAge ?? null,
    dependents: input.dependents ?? 0,
    income: input.income ?? null,
    assets: input.assets ?? null,
    liabilities: input.liabilities ?? null,
    protectionGap: input.protectionGap ?? null,
    retirementGap: input.retirementGap ?? null,
    status: /** @type {FnaStatus} */ (input.status ?? 'draft'),
    notes: input.notes ?? '',
    recommendations: input.recommendations ?? [],
    createdAt: now,
    updatedAt: now,
  };

  const list = listForUser(participantId);
  list.push(record);
  writeForUser(participantId, list);
  return record;
}

/**
 * @param {string} participantId
 * @param {string} fnaId
 * @param {Partial<FinancialNeedsAnalysis>} patch
 */
export function saveFna(participantId, fnaId, patch) {
  const list = listForUser(participantId);
  const idx = list.findIndex((f) => f.id === fnaId);
  if (idx < 0) throw new Error('FNA not found');

  const merged = {
    ...list[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  if (
    patch.protectionGap === undefined &&
    patch.retirementGap === undefined &&
    (patch.income != null || patch.assets != null || patch.liabilities != null || patch.clientAge != null)
  ) {
    const suggested = suggestFnaGaps(merged);
    if (merged.protectionGap == null) merged.protectionGap = suggested.protectionGap;
    if (merged.retirementGap == null) merged.retirementGap = suggested.retirementGap;
  }

  list[idx] = merged;
  writeForUser(participantId, list);

  void upsertFnaRecord(participantId, merged, merged.recommendations);

  const automation = runFnaAutomation(participantId, merged, list);
  return { record: merged, automation };
}

/**
 * @param {string} participantId
 * @param {string} fnaId
 * @param {FnaStatus} status
 */
export function updateFnaStatus(participantId, fnaId, status) {
  return saveFna(participantId, fnaId, { status });
}

export { suggestFnaGaps };
