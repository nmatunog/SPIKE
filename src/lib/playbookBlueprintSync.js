import { getWorksheetMapping } from './activityBlueprintMappings.js';
import {
  createBusinessPlanArtifactDraft,
  createPortfolioArtifactDraft,
} from './blueprintArtifacts.js';
import { syncBlueprintDraftsToSupabase } from './supabase/blueprintArtifacts.js';

/**
 * @param {Array<{ id: string, prompt: string }>} questions
 * @param {Record<string, unknown>} answers
 */
function formatWorksheetContent(questions, answers) {
  return questions
    .map((q) => {
      const val = answers[q.id];
      const display =
        val === true ? 'Yes' : val === false || val == null || val === '' ? '—' : String(val);
      return `${q.prompt}\n${display}`;
    })
    .join('\n\n');
}

/**
 * Sync completed worksheet into Venture Blueprint portfolio + business plan drafts.
 * @param {string} participantId
 * @param {string} worksheetId
 * @param {Record<string, unknown>} answers
 * @param {Array<{ id: string, prompt: string }>} questions
 */
export function syncPlaybookWorksheet(participantId, worksheetId, answers, questions) {
  const mapping = getWorksheetMapping(worksheetId);
  if (!mapping) return null;

  const content = formatWorksheetContent(questions, answers);
  const sourceType = 'worksheet';
  const sourceId = worksheetId;

  const portfolio = createPortfolioArtifactDraft({
    participantId,
    sectionId: mapping.portfolioSectionId,
    title: mapping.artifactTitle,
    content,
    sourceType,
    sourceId,
  });

  const businessPlan = createBusinessPlanArtifactDraft({
    participantId,
    chapterId: mapping.businessPlanChapterId,
    title: mapping.artifactTitle,
    content,
    sourceType,
    sourceId,
  });

  void syncBlueprintDraftsToSupabase(participantId, portfolio, businessPlan);

  return { portfolio, businessPlan, mapping };
}
