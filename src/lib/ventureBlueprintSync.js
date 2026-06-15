/**
 * Venture Blueprint Integration Engine — unified sync facade (Sprint 05).
 * Extends Sprint 04 playbookBlueprintSync + fnaAutomation.
 */
import {
  syncPlaybookWorksheet,
  syncPlaybookActivity,
  syncPlaybookReflection,
  syncPlaybookSurvey,
} from './playbookBlueprintSync.js';
import { runFnaAutomation } from './fnaAutomation.js';
import { formatSurveyAnswersForDisplay } from './surveyService.js';
import { syncSurveyToMarketIntelligence } from './marketIntelligenceService.js';
import { recordSurveyForSquadAnalytics } from './researchAnalyticsService.js';
import { generateResearchDeliverables } from './researchDeliverableService.js';
import { resolveSquadIdForUser } from './researchSquadService.js';
import { getMarketSegmentLabel } from './researchSeeds.js';
import { setSectionField } from './blueprintSectionStore.js';
import { appendLeadershipJournalEntry } from './leadershipJournalService.js';
import {
  hydrateBlueprintSectionsFromSupabase,
} from './blueprintSectionStore.js';
import { hydrateCanvasFromSupabase } from './canvasService.js';
import { hydrateCanvasSummaryFromSupabase } from './canvasSummaryService.js';
import { prepareFecCanvas } from './fecCanvasService.js';
import { hydrateLeadershipJournalFromSupabase } from './leadershipJournalService.js';

export {
  syncPlaybookWorksheet,
  syncPlaybookActivity,
  syncPlaybookReflection,
  syncPlaybookSurvey,
  runFnaAutomation,
};

/**
 * @param {string} participantId
 * @param {{ preferRemote?: boolean }} [opts]
 */
export async function hydrateVentureBlueprint(participantId, opts = {}) {
  if (!participantId || String(participantId).startsWith('mock-')) return;
  await Promise.all([
    hydrateBlueprintSectionsFromSupabase(participantId, opts),
    hydrateCanvasFromSupabase(participantId, opts),
    hydrateCanvasSummaryFromSupabase(participantId),
    hydrateLeadershipJournalFromSupabase(participantId),
  ]);
  prepareFecCanvas(participantId);
}

/**
 * Survey → Market Intelligence + legacy playbook sync.
 * @param {string} participantId
 * @param {string} surveyId
 * @param {Record<string, unknown>} answers
 * @param {import('../types/playbook').SurveyQuestion[]} questions
 * @param {{ title?: string }} [survey]
 */
export function syncSurveyCompletion(participantId, surveyId, answers, questions, survey) {
  const formatted = formatSurveyAnswersForDisplay(questions, answers);
  syncSurveyToMarketIntelligence(participantId, surveyId, formatted, survey?.title);

  const squadRef = resolveSquadIdForUser(participantId);
  if (squadRef?.id) {
    recordSurveyForSquadAnalytics(squadRef.id, surveyId, questions, answers);
    void generateResearchDeliverables(
      participantId,
      squadRef.id,
      surveyId,
      survey?.title ?? surveyId,
      getMarketSegmentLabel(squadRef.marketSegment),
    );
  }

  return syncPlaybookSurvey(participantId, surveyId, answers, questions, survey);
}

/**
 * Reflection → Ambition & Purpose structured fields + legacy sync.
 */
export function syncReflectionCompletion(participantId, reflectionId, responses, reflection) {
  const content = Object.entries(responses)
    .map(([prompt, answer]) => `${prompt}\n${answer}`)
    .join('\n\n');
  setSectionField(participantId, 'vision-purpose', 'growth_reflections', content, {
    append: true,
    sourceType: 'reflection',
    sourceId: reflectionId,
  });
  setSectionField(participantId, 'vision-purpose', 'lessons_learned', reflection.title, {
    append: true,
    sourceType: 'reflection',
    sourceId: reflectionId,
  });
  return syncPlaybookReflection(participantId, reflectionId, responses, reflection);
}

/**
 * FNA → Client Growth section + legacy automation.
 */
export function syncFnaCompletion(participantId, fna, allFnas) {
  const completed = allFnas.filter((f) => f.status !== 'draft');
  setSectionField(participantId, 'client-growth', 'completed_fnas', String(completed.length), {
    sourceType: 'fna',
    sourceId: fna.id,
  });

  const profiles = completed
    .map((f) => `• ${f.clientName} (${f.status})`)
    .join('\n');
  setSectionField(participantId, 'client-growth', 'client_profiles_summary', profiles, {
    sourceType: 'fna',
    sourceId: fna.id,
  });

  const gaps = completed
    .filter((f) => f.protectionGap || f.retirementGap)
    .map((f) => `• ${f.clientName}: protection ${f.protectionGap ?? '—'}, retirement ${f.retirementGap ?? '—'}`)
    .join('\n');
  if (gaps) {
    setSectionField(participantId, 'client-growth', 'protection_gaps_summary', gaps, {
      sourceType: 'fna',
      sourceId: fna.id,
    });
  }

  const categories = [
    ...new Set(
      completed.flatMap((f) => (f.recommendations ?? []).map((r) => r.category || r.title)),
    ),
  ].filter(Boolean);
  if (categories.length) {
    setSectionField(
      participantId,
      'client-growth',
      'recommendation_categories',
      categories.map((c) => `• ${c}`).join('\n'),
      { sourceType: 'fna', sourceId: fna.id },
    );
  }

  return runFnaAutomation(participantId, fna, allFnas);
}

/**
 * Coaching note → Leadership Journal + timeline (via coachingService caller).
 */
export async function syncCoachingNote(participantId, input) {
  return appendLeadershipJournalEntry(participantId, input);
}
