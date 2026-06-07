/** Local playbook completion until Automation Engine persists to Blueprint tables. */

import { getDay1MissionProgress, isBuilderCompleted } from './day1BuilderStorage.js';

const STORAGE_KEY = 'spike_playbook_local_progress';

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
 * @param {string} worksheetId
 * @param {Record<string, unknown>} answers
 */
export function markWorksheetCompleted(participantId, worksheetId, answers = {}) {
  const all = readAll();
  const user = all[participantId] || { worksheets: {} };
  user.worksheets[worksheetId] = {
    completedAt: new Date().toISOString(),
    answers,
  };
  all[participantId] = user;
  writeAll(all);
}

/** @param {string} participantId @param {string} worksheetId */
export function isWorksheetCompleted(participantId, worksheetId) {
  return Boolean(readAll()[participantId]?.worksheets?.[worksheetId]);
}

/**
 * Ambition & Purpose module progress from Day 1 builders and legacy worksheets.
 * @param {string | undefined} participantId
 */
export function getVisionPurposeProgress(participantId) {
  const base = {
    vision_statement: 0,
    mission_statement: 0,
    my_values: 0,
    personal_tagline: 0,
    future_self_narrative: 0,
    future_self_summary: 0,
    dream_board: 0,
  };
  if (!participantId) return base;

  if (isBuilderCompleted(participantId, 'ambition-builder')) {
    base.vision_statement = 20;
  }
  if (isBuilderCompleted(participantId, 'purpose-builder')) {
    base.mission_statement = 20;
  }
  if (isBuilderCompleted(participantId, 'values-builder')) {
    base.my_values = 20;
  }
  if (isBuilderCompleted(participantId, 'tagline-builder')) {
    base.personal_tagline = 16;
  }
  if (isBuilderCompleted(participantId, 'future-self')) {
    base.future_self_narrative = 20;
  }
  if (isBuilderCompleted(participantId, 'dream-board')) {
    base.dream_board = 20;
  }

  const mission = getDay1MissionProgress(participantId);
  if (mission.percent >= 100) {
    return {
      vision_statement: 20,
      mission_statement: 20,
      my_values: 20,
      personal_tagline: 16,
      future_self_narrative: 20,
      future_self_summary: 16,
      dream_board: 20,
    };
  }

  if (mission.percent > 0) return base;

  const entry = readAll()[participantId]?.worksheets?.['worksheet-day-1-personal-why'];
  if (!entry) return base;

  const answers = entry.answers || {};
  const hasPurpose = Boolean(String(answers['wq-day-1-why-1'] || '').trim());
  const hasAmbition = Boolean(String(answers['wq-day-1-why-2'] || '').trim());
  const hasRating = answers['wq-day-1-why-3'] != null && answers['wq-day-1-why-3'] !== '';
  const hasCommit = Boolean(answers['wq-day-1-why-4']);

  return {
    mission_statement: hasPurpose ? 20 : 0,
    vision_statement: hasAmbition ? 20 : 0,
    my_values: hasRating ? 20 : 0,
    future_self_narrative: hasPurpose && hasAmbition ? 20 : hasAmbition ? 12 : 0,
    dream_board: hasCommit ? 20 : 0,
  };
}

/** @param {string | undefined} participantId */
export function getVisionPurposeCompletionPct(participantId) {
  const p = getVisionPurposeProgress(participantId);
  return Math.round(
    (p.mission_statement
      + p.vision_statement
      + p.my_values
      + (p.personal_tagline ?? 0)
      + p.future_self_narrative
      + (p.future_self_summary ?? 0)
      + p.dream_board)
    / 7,
  );
}
