/**
 * Client Growth funnel — derived from FNA records (Sprint 04 PR4.2).
 * @typedef {import('../types/fna').ClientGrowthFunnel} ClientGrowthFunnel
 * @typedef {import('../types/fna').FinancialNeedsAnalysis} FinancialNeedsAnalysis
 */

import { upsertClientGrowthFunnel } from './supabase/clientGrowth.js';

const STORAGE_KEY = 'spike_client_growth_funnel';

/** @returns {ClientGrowthFunnel} */
export function emptyFunnel() {
  return {
    prospects: 0,
    contacts: 0,
    appointments: 0,
    fnas: 0,
    proposals: 0,
    applications: 0,
    issuedCases: 0,
    referrals: 0,
  };
}

function readOverrides() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeOverrides(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/**
 * Derive funnel stage counts from FNA list.
 * @param {FinancialNeedsAnalysis[]} fnas
 * @returns {ClientGrowthFunnel}
 */
export function deriveFunnelFromFnas(fnas) {
  const completed = fnas.filter((f) => f.status !== 'draft');
  const presented = fnas.filter((f) => ['presented', 'implemented'].includes(f.status));
  const implemented = fnas.filter((f) => f.status === 'implemented');

  return {
    prospects: Math.max(completed.length, fnas.length),
    contacts: completed.length,
    appointments: completed.length,
    fnas: completed.length,
    proposals: presented.length,
    applications: presented.length,
    issuedCases: implemented.length,
    referrals: 0,
  };
}

/**
 * @param {string} participantId
 * @param {FinancialNeedsAnalysis[]} fnas
 * @returns {ClientGrowthFunnel}
 */
export function getClientGrowthSummary(participantId, fnas) {
  const derived = deriveFunnelFromFnas(fnas);
  const overrides = readOverrides()[participantId];
  if (!overrides) return derived;
  return { ...derived, ...overrides };
}

/**
 * @param {string} participantId
 * @param {FinancialNeedsAnalysis[]} fnas
 */
export function persistClientGrowthSummary(participantId, fnas) {
  const funnel = getClientGrowthSummary(participantId, fnas);
  const all = readOverrides();
  all[participantId] = funnel;
  writeOverrides(all);
  void upsertClientGrowthFunnel(participantId, funnel);
  return funnel;
}
