/**
 * Venture Scorecard autofill — Phase 1 stub (FNA funnel + impact hints).
 * Full sync logic ships in Phase 2/3 UI; this module defines the contract only.
 */
import { getClientGrowthSummary } from './clientGrowthService.js';
import { listFnas } from './fnaService.js';
import { getSectionField } from './blueprintSectionStore.js';
import { getVentureScorecard, getScorecardManualOverrides } from './fecCanvasService.js';

/**
 * @param {string} participantId
 * @returns {Record<string, string>}
 */
export function buildFecScorecardAutofillSuggestions(participantId) {
  const fnas = listFnas(participantId);
  const client = getClientGrowthSummary(participantId, fnas);
  const impact = getSectionField(participantId, 'vision-purpose', 'mission_statement');

  /** @type {Record<string, string>} */
  const suggestions = {};

  if (client.prospects) suggestions.clients = String(client.prospects);
  if (client.issuedCases) suggestions.revenue = String(client.issuedCases);
  if (client.fnas) suggestions.conversion = client.prospects
    ? `${Math.round((client.fnas / Math.max(client.prospects, 1)) * 100)}%`
    : '';
  if (impact?.trim()) suggestions.lives_improved = impact.trim().slice(0, 120);

  return suggestions;
}

/**
 * Apply autofill only for metrics not manually overridden and currently empty.
 * @param {string} participantId
 * @param {(id: string, engine: string, key: string, val: string) => void} saveMetric
 */
export function applyFecScorecardAutofill(participantId, saveMetric) {
  const overrides = getScorecardManualOverrides(participantId);
  const current = getVentureScorecard(participantId);
  const suggestions = buildFecScorecardAutofillSuggestions(participantId);

  for (const [key, value] of Object.entries(suggestions)) {
    if (!value || overrides[key]) continue;
    if (String(current[key] ?? '').trim()) continue;
    saveMetric(participantId, 'prove_value', key, value);
  }
}
