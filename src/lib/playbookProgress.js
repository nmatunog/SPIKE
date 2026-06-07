/**
 * Playbook completion tracking — localStorage until Supabase playbook_completions (Sprint 03 PR4).
 * @typedef {import('../types/playbook').DayCompletionSummary} DayCompletionSummary
 * @typedef {import('./contentLoader.js').DayContentBundle} DayContentBundle
 */

import {
  isWorksheetCompleted as isLegacyWorksheetCompleted,
  markWorksheetCompleted as markLegacyWorksheetCompleted,
} from './playbookLocalProgress.js';
import { upsertPlaybookCompletion } from './supabase/playbookProgress.js';

const STORAGE_KEY = 'spike_playbook_progress_v1';

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
function ensureUser(participantId) {
  const all = readAll();
  if (!all[participantId]) {
    all[participantId] = { worksheets: {}, activities: {}, reflections: {} };
  }
  return all;
}

/**
 * @param {string} participantId
 * @param {string} worksheetId
 * @param {Record<string, unknown>} [answers]
 */
export function markWorksheetCompleted(participantId, worksheetId, answers = {}, dayId) {
  markLegacyWorksheetCompleted(participantId, worksheetId, answers);
  const all = ensureUser(participantId);
  all[participantId].worksheets[worksheetId] = {
    completedAt: new Date().toISOString(),
    answers,
  };
  writeAll(all);
  void upsertPlaybookCompletion(participantId, 'worksheet', worksheetId, dayId, { answers });
}

/** @param {string} participantId @param {string} worksheetId */
export function isWorksheetCompleted(participantId, worksheetId) {
  return Boolean(
    readAll()[participantId]?.worksheets?.[worksheetId] ||
      isLegacyWorksheetCompleted(participantId, worksheetId),
  );
}

/**
 * @param {string} participantId
 * @param {string} activityId
 */
export function markActivityCompleted(participantId, activityId, dayId) {
  const all = ensureUser(participantId);
  all[participantId].activities[activityId] = {
    completedAt: new Date().toISOString(),
  };
  writeAll(all);
  void upsertPlaybookCompletion(participantId, 'activity', activityId, dayId);
}

/** @param {string} participantId @param {string} activityId */
export function isActivityCompleted(participantId, activityId) {
  return Boolean(readAll()[participantId]?.activities?.[activityId]);
}

/**
 * @param {string} participantId
 * @param {string} reflectionId
 * @param {Record<string, string>} responses
 */
export function markReflectionCompleted(participantId, reflectionId, responses = {}, dayId) {
  const all = ensureUser(participantId);
  all[participantId].reflections[reflectionId] = {
    completedAt: new Date().toISOString(),
    responses,
  };
  writeAll(all);
  void upsertPlaybookCompletion(participantId, 'reflection', reflectionId, dayId, { responses });
}

/** @param {string} participantId @param {string} reflectionId */
export function isReflectionCompleted(participantId, reflectionId) {
  return Boolean(readAll()[participantId]?.reflections?.[reflectionId]);
}

/** @param {string} participantId @param {string} worksheetId */
export function getWorksheetSubmission(participantId, worksheetId) {
  const legacy = readAll()[participantId]?.worksheets?.[worksheetId];
  if (legacy) return legacy;
  try {
    const old = JSON.parse(localStorage.getItem('spike_playbook_local_progress') || '{}');
    return old[participantId]?.worksheets?.[worksheetId] ?? null;
  } catch {
    return null;
  }
}

/**
 * @param {string | undefined} participantId
 * @param {DayContentBundle} bundle
 * @returns {DayCompletionSummary}
 */
export function getDayCompletionSummary(participantId, bundle) {
  const items = [];

  for (const ws of bundle.worksheets?.worksheets ?? []) {
    items.push({
      id: ws.id,
      type: /** @type {'worksheet'} */ ('worksheet'),
      title: ws.title,
      completed: participantId ? isWorksheetCompleted(participantId, ws.id) : false,
    });
  }

  for (const act of bundle.activities?.activities ?? []) {
    items.push({
      id: act.id,
      type: /** @type {'activity'} */ ('activity'),
      title: act.title,
      completed: participantId ? isActivityCompleted(participantId, act.id) : false,
    });
  }

  for (const ref of bundle.reflections?.reflections ?? []) {
    items.push({
      id: ref.id,
      type: /** @type {'reflection'} */ ('reflection'),
      title: ref.title,
      completed: participantId ? isReflectionCompleted(participantId, ref.id) : false,
    });
  }

  const totalItems = items.length;
  const completedItems = items.filter((i) => i.completed).length;

  return {
    dayId: bundle.day.id,
    totalItems,
    completedItems,
    percent: totalItems ? Math.round((completedItems / totalItems) * 100) : 0,
    items,
  };
}

/**
 * @param {string} participantId
 */
export function listParticipantSubmissions(participantId) {
  const all = readAll()[participantId];
  const worksheets = [];

  if (all?.worksheets) {
    for (const [id, entry] of Object.entries(all.worksheets)) {
      worksheets.push({ worksheetId: id, ...entry });
    }
  }

  try {
    const legacy = JSON.parse(localStorage.getItem('spike_playbook_local_progress') || '{}');
    const leg = legacy[participantId]?.worksheets ?? {};
    for (const [id, entry] of Object.entries(leg)) {
      if (!worksheets.find((w) => w.worksheetId === id)) {
        worksheets.push({ worksheetId: id, ...entry });
      }
    }
  } catch {
    /* ignore */
  }

  return {
    worksheets,
    activities: all?.activities ?? {},
    reflections: all?.reflections ?? {},
  };
}

/**
 * Mentor view — summarize intern playbook progress for a day bundle.
 * @param {string} participantId
 * @param {string} [participantName]
 * @param {DayContentBundle | null} bundle
 */
export function summarizeInternPlaybookProgress(participantId, participantName, bundle) {
  if (!bundle) {
    return {
      participantId,
      participantName,
      dayId: null,
      completionPct: 0,
      submissions: listParticipantSubmissions(participantId),
    };
  }

  const summary = getDayCompletionSummary(participantId, bundle);
  return {
    participantId,
    participantName,
    dayId: bundle.day.id,
    dayTitle: bundle.day.title,
    completionPct: summary.percent,
    completedItems: summary.completedItems,
    totalItems: summary.totalItems,
    submissions: listParticipantSubmissions(participantId),
  };
}
