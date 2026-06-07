/**
 * Survey response service — localStorage + optional Supabase (Sprint 04 PR4.1).
 * @typedef {import('../types/playbook').SurveyQuestion} SurveyQuestion
 */

import { upsertSurveyResponse } from './supabase/surveyResponses.js';

const STORAGE_KEY = 'spike_survey_responses';

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

/**
 * @param {string} participantId
 * @param {string} surveyId
 * @param {Record<string, unknown>} answers
 * @param {string} [dayId]
 */
export function saveSurveyResponseLocal(participantId, surveyId, answers, dayId) {
  const all = readAll();
  const user = all[participantId] || {};
  user[surveyId] = {
    surveyId,
    dayId,
    answers,
    submittedAt: new Date().toISOString(),
  };
  all[participantId] = user;
  writeAll(all);
  return user[surveyId];
}

/** @param {string} participantId @param {string} surveyId */
export function getSurveyResponseLocal(participantId, surveyId) {
  return readAll()[participantId]?.[surveyId] ?? null;
}

/** @param {string} participantId @param {string} surveyId */
export function isSurveySubmitted(participantId, surveyId) {
  return Boolean(getSurveyResponseLocal(participantId, surveyId));
}

/** @param {string} participantId */
export function countSubmittedSurveys(participantId) {
  if (!participantId) return 0;
  return Object.keys(readAll()[participantId] ?? {}).length;
}

/**
 * @param {string} participantId
 * @param {string} surveyId
 * @param {Record<string, unknown>} answers
 * @param {string} [dayId]
 * @param {SurveyQuestion[]} questions
 */
export async function submitSurveyResponse(participantId, surveyId, answers, dayId, questions) {
  const local = saveSurveyResponseLocal(participantId, surveyId, answers, dayId);

  const payload = questions.map((q) => ({
    questionId: q.id,
    value: answers[q.id],
  }));

  void upsertSurveyResponse(participantId, surveyId, dayId, payload);

  return local;
}

/**
 * @param {SurveyQuestion[]} questions
 * @param {Record<string, unknown>} answers
 */
export function formatSurveyAnswersForDisplay(questions, answers) {
  return questions
    .map((q) => {
      const val = answers[q.id];
      let display = '—';
      if (Array.isArray(val)) {
        display = val.join(', ');
      } else if (val && typeof val === 'object') {
        display = Object.entries(val)
          .sort(([, a], [, b]) => Number(a) - Number(b))
          .map(([k, rank]) => `${k} (#${rank})`)
          .join('; ');
      } else if (val === true) {
        display = 'Yes';
      } else if (val === false || val == null || val === '') {
        display = '—';
      } else {
        display = String(val);
      }
      return `${q.prompt}\n${display}`;
    })
    .join('\n\n');
}
