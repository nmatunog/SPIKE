/**
 * FNA → Venture Blueprint automation (Sprint 04 PR4.2).
 * @typedef {import('../types/fna').FinancialNeedsAnalysis} FinancialNeedsAnalysis
 */

import { appendBlueprintTimelineEvent } from './blueprintTimeline.js';
import {
  createBusinessPlanArtifactDraft,
  createPortfolioArtifactDraft,
} from './blueprintArtifacts.js';
import { syncBlueprintDraftsToSupabase } from './supabase/blueprintArtifacts.js';
import { persistClientGrowthSummary } from './clientGrowthService.js';

const FNA_BLUEPRINT_MAPPING = {
  portfolioSectionId: 'portfolio-advisor-startup',
  businessPlanChapterId: 'bp-chapter-3',
  blueprintModule: 'client-growth',
  artifactTitlePrefix: 'FNA —',
};

/**
 * @param {FinancialNeedsAnalysis} fna
 */
export function formatFnaArtifactContent(fna) {
  const recs = fna.recommendations
    .map((r) => `• ${r.title}${r.description ? `: ${r.description}` : ''}`)
    .join('\n');

  return [
    `Client: ${fna.clientName}`,
    `Age: ${fna.clientAge ?? '—'} | Dependents: ${fna.dependents}`,
    `Income: ${formatMoney(fna.income)} | Assets: ${formatMoney(fna.assets)} | Liabilities: ${formatMoney(fna.liabilities)}`,
    `Protection gap: ${formatMoney(fna.protectionGap)} | Retirement gap: ${formatMoney(fna.retirementGap)}`,
    `Status: ${fna.status}`,
    fna.notes ? `Notes: ${fna.notes}` : '',
    recs ? `Recommendations:\n${recs}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');
}

/** @param {number | null | undefined} value */
function formatMoney(value) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return `$${Number(value).toLocaleString()}`;
}

/**
 * @param {string} participantId
 * @param {FinancialNeedsAnalysis} fna
 * @param {FinancialNeedsAnalysis[]} allFnas
 */
export function runFnaAutomation(participantId, fna, allFnas) {
  if (fna.status === 'draft') {
    persistClientGrowthSummary(participantId, allFnas);
    return null;
  }

  const content = formatFnaArtifactContent(fna);
  const title = `${FNA_BLUEPRINT_MAPPING.artifactTitlePrefix} ${fna.clientName}`;
  const sourceId = fna.id;

  const portfolio = createPortfolioArtifactDraft({
    participantId,
    sectionId: FNA_BLUEPRINT_MAPPING.portfolioSectionId,
    title,
    content,
    sourceType: 'fna',
    sourceId,
  });

  const businessPlan = createBusinessPlanArtifactDraft({
    participantId,
    chapterId: FNA_BLUEPRINT_MAPPING.businessPlanChapterId,
    title,
    content,
    sourceType: 'fna',
    sourceId,
  });

  void syncBlueprintDraftsToSupabase(participantId, portfolio, businessPlan);

  appendBlueprintTimelineEvent(participantId, {
    type: 'fna_save',
    title,
    module: FNA_BLUEPRINT_MAPPING.blueprintModule,
    sourceType: 'fna',
    sourceId,
  });

  const funnel = persistClientGrowthSummary(participantId, allFnas);

  return { portfolio, businessPlan, funnel };
}
