import {
  getActivityMapping,
  getReflectionMapping,
  getSurveyMapping,
  getWorksheetMapping,
} from './activityBlueprintMappings.js';
import { formatSurveyAnswersForDisplay } from './surveyService.js';
import { appendBlueprintTimelineEvent } from './blueprintTimeline.js';
import {
  createBusinessPlanArtifactDraft,
  createPortfolioArtifactDraft,
} from './blueprintArtifacts.js';
import { syncBlueprintDraftsToSupabase } from './supabase/blueprintArtifacts.js';

/**
 * @param {import('./activityBlueprintMappings.js').WorksheetBlueprintMapping} mapping
 * @param {string} participantId
 * @param {string} sourceType
 * @param {string} sourceId
 * @param {string} content
 */
function syncFromMapping(mapping, participantId, sourceType, sourceId, content) {
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

  appendBlueprintTimelineEvent(participantId, {
    type: 'blueprint_update',
    title: mapping.artifactTitle,
    module: mapping.blueprintModule,
    sourceType,
    sourceId,
  });

  return { portfolio, businessPlan, mapping };
}

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
 * @param {string} participantId
 * @param {string} worksheetId
 * @param {Record<string, unknown>} answers
 * @param {Array<{ id: string, prompt: string }>} questions
 */
export function syncPlaybookWorksheet(participantId, worksheetId, answers, questions) {
  const mapping = getWorksheetMapping(worksheetId);
  if (!mapping) return null;
  const content = formatWorksheetContent(questions, answers);
  return syncFromMapping(mapping, participantId, 'worksheet', worksheetId, content);
}

/**
 * @param {string} participantId
 * @param {string} activityId
 * @param {{ title: string, outputs: string[] }} activity
 */
export function syncPlaybookActivity(participantId, activityId, activity) {
  const mapping = getActivityMapping(activityId);
  if (!mapping) return null;
  const content = [`Activity: ${activity.title}`, '', 'Outputs:', ...activity.outputs.map((o) => `• ${o}`)].join(
    '\n',
  );
  return syncFromMapping(mapping, participantId, 'activity', activityId, content);
}

/**
 * @param {string} participantId
 * @param {string} reflectionId
 * @param {Record<string, string>} responses
 * @param {{ title: string }} reflection
 */
export function syncPlaybookReflection(participantId, reflectionId, responses, reflection) {
  const mapping = getReflectionMapping(reflectionId);
  if (!mapping) return null;
  const content = [
    reflection.title,
    '',
    ...Object.entries(responses).map(([prompt, answer]) => `${prompt}\n${answer}`),
  ].join('\n\n');
  return syncFromMapping(mapping, participantId, 'reflection', reflectionId, content);
}

/**
 * @param {string} participantId
 * @param {string} surveyId
 * @param {Record<string, unknown>} answers
 * @param {Array<{ id: string, prompt: string, type: string }>} questions
 * @param {{ title: string }} survey
 */
export function syncPlaybookSurvey(participantId, surveyId, answers, questions, survey) {
  const mapping = getSurveyMapping(surveyId);
  if (!mapping) return null;
  const content = [survey.title, '', formatSurveyAnswersForDisplay(questions, answers)].join('\n');
  return syncFromMapping(mapping, participantId, 'survey', surveyId, content);
}
