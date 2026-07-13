import { getFecField, getFecSummaryField, getFecUnifiedVentureProposition } from '../fecCanvasService.js';
import { listFecV2EntryFields } from '../fecCanvasConstants.js';
import { loadWeek5Day1Mission } from './storage.js';

/**
 * @param {string} participantId
 */
export function loadWeek5Day1MissionWithPrefill(participantId) {
  const state = loadWeek5Day1Mission(participantId);
  const responses = { ...state.responses };

  if (!responses.ventureOneSentence?.trim()) {
    responses.ventureOneSentence = getFecUnifiedVentureProposition(participantId) || '';
  }
  if (!responses.customerSegmentName?.trim()) {
    responses.customerSegmentName = getFecField(participantId, 'create_value', 'customer_segments') || '';
  }
  if (!responses.problemStatement?.trim()) {
    responses.problemStatement = getFecField(participantId, 'create_value', 'customer_problem') || '';
  }
  if (!responses.clientPromise?.trim()) {
    responses.clientPromise = getFecField(participantId, 'create_value', 'value_offering') || '';
  }
  if (!responses.strategyCompetitive?.trim()) {
    responses.strategyCompetitive =
      getFecField(participantId, 'create_value', 'winning_strategy') || '';
  }

  return { ...state, responses };
}

/**
 * @param {string} participantId
 */
export function buildFecReadinessSummary(participantId) {
  const entries = listFecV2EntryFields();
  /** @type {Record<string, 'strong' | 'needs-clarification' | 'missing' | 'needs-numbers' | 'ready'>} */
  const labels = {};
  for (const entry of entries) {
    const value =
      entry.engineKey === 'summary'
        ? String(getFecSummaryField(participantId, entry.fieldKey) ?? '')
        : getFecField(participantId, entry.engineKey, entry.fieldKey);
    const t = String(value ?? '').trim();
    if (!t) labels[entry.fieldKey] = 'missing';
    else if (t.length < 15) labels[entry.fieldKey] = 'needs-clarification';
    else if (entry.fieldKey.includes('revenue') && !/\d/.test(t)) labels[entry.fieldKey] = 'needs-numbers';
    else labels[entry.fieldKey] = 'strong';
  }
  return labels;
}

/**
 * @param {{ weeklyProspects?: string, weeklyDiscovery?: string, weeklyPresentations?: string, weeklyClients?: string, referralsPerClient?: string, revenuePerClient?: string }} r
 */
export function computeRevenueProjections(r) {
  const clients = Number(r.weeklyClients) || 0;
  const revenuePer = Number(r.revenuePerClient) || 0;
  const weekly = clients * revenuePer;
  const monthly = weekly * 4;
  const annual = weekly * 52;
  return { weekly, monthly, annual };
}
