/**
 * Playbook completions — Supabase backfill + staff hydration.
 */
import { fetchPlaybookCompletions, upsertPlaybookCompletion } from './supabase/playbookProgress.js';

const STORAGE_KEY = 'spike_playbook_progress_v1';

/** @type {Set<string>} */
const hydratedParticipants = new Set();

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

function ensureUser(participantId) {
  const all = readAll();
  if (!all[participantId]) {
    all[participantId] = { worksheets: {}, activities: {}, reflections: {}, surveys: {} };
  }
  return all;
}

/**
 * Push local playbook progress to Supabase (sign-in backfill).
 * @param {string} participantId
 */
export async function backfillLocalPlaybookToSupabase(participantId) {
  if (!participantId || String(participantId).startsWith('mock-')) return;

  const user = readAll()[participantId];
  if (!user) return;

  for (const [worksheetId, entry] of Object.entries(user.worksheets ?? {})) {
    await upsertPlaybookCompletion(participantId, 'worksheet', worksheetId, null, {
      answers: entry?.answers ?? {},
    });
  }
  for (const [activityId] of Object.entries(user.activities ?? {})) {
    await upsertPlaybookCompletion(participantId, 'activity', activityId, null, {});
  }
  for (const [reflectionId, entry] of Object.entries(user.reflections ?? {})) {
    await upsertPlaybookCompletion(participantId, 'reflection', reflectionId, null, {
      responses: entry?.responses ?? {},
    });
  }
  for (const [surveyId, entry] of Object.entries(user.surveys ?? {})) {
    await upsertPlaybookCompletion(participantId, 'survey', surveyId, null, {
      answers: entry?.answers ?? {},
    });
  }
}

/**
 * Merge Supabase playbook_completions into local cache for staff review.
 * @param {string} participantId
 * @param {{ force?: boolean, preferRemote?: boolean }} [opts]
 */
export async function hydratePlaybookProgressFromSupabase(participantId, opts = {}) {
  if (!participantId || String(participantId).startsWith('mock-')) return;
  if (opts.force) hydratedParticipants.delete(participantId);
  if (!opts.force && hydratedParticipants.has(participantId)) return;

  const rows = await fetchPlaybookCompletions(participantId).catch(() => null);
  if (!rows?.length) {
    hydratedParticipants.add(participantId);
    return;
  }

  const all = ensureUser(participantId);
  const user = all[participantId];
  const now = new Date().toISOString();

  for (const row of rows) {
    const completedAt = row.completed_at ?? now;
    const payload = row.payload ?? {};
    const itemType = String(row.item_type);
    const itemId = String(row.item_id);

    if (itemType === 'worksheet') {
      const local = user.worksheets[itemId];
      if (opts.preferRemote || !local) {
        user.worksheets[itemId] = {
          completedAt,
          answers: payload.answers ?? {},
        };
      }
    } else if (itemType === 'activity') {
      if (opts.preferRemote || !user.activities[itemId]) {
        user.activities[itemId] = { completedAt };
      }
    } else if (itemType === 'reflection') {
      const local = user.reflections[itemId];
      if (opts.preferRemote || !local) {
        user.reflections[itemId] = {
          completedAt,
          responses: payload.responses ?? {},
        };
      }
    } else if (itemType === 'survey') {
      const local = user.surveys[itemId];
      if (opts.preferRemote || !local) {
        user.surveys[itemId] = {
          completedAt,
          answers: payload.answers ?? {},
        };
      }
    }
  }

  writeAll(all);
  hydratedParticipants.add(participantId);
}
