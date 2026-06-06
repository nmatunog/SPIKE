/** Local playbook completion until Automation Engine persists to Blueprint tables. */

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
 * Vision & Purpose module progress (PRD Module 1 weights) from local worksheet data.
 * @param {string | undefined} participantId
 */
export function getVisionPurposeProgress(participantId) {
  const base = {
    mission_statement: 0,
    vision_statement: 0,
    future_self_narrative: 0,
    dream_board: 0,
  };
  if (!participantId) return base;

  const entry = readAll()[participantId]?.worksheets?.['worksheet-day-1-personal-why'];
  if (!entry) return base;

  const answers = entry.answers || {};
  const hasWhy = Boolean(String(answers['wq-day-1-why-1'] || '').trim());
  const hasImpact = Boolean(String(answers['wq-day-1-why-2'] || '').trim());
  const hasRating = answers['wq-day-1-why-3'] != null && answers['wq-day-1-why-3'] !== '';
  const hasCommit = Boolean(answers['wq-day-1-why-4']);

  return {
    mission_statement: hasWhy ? 25 : 0,
    vision_statement: hasImpact ? 25 : 0,
    future_self_narrative: hasImpact && hasWhy ? 25 : hasImpact ? 15 : 0,
    dream_board: hasRating && hasCommit ? 25 : hasCommit ? 15 : 0,
  };
}

/** @param {string | undefined} participantId */
export function getVisionPurposeCompletionPct(participantId) {
  const p = getVisionPurposeProgress(participantId);
  return Math.round(
    (p.mission_statement + p.vision_statement + p.future_self_narrative + p.dream_board) / 4,
  );
}
