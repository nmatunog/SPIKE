/**
 * Financial Entrepreneurship Canvas — editable engines with auto-save (Sprint 05).
 */
import { CANVAS_ENGINES } from './blueprintSectionConstants.js';
import { upsertCanvasEntry, fetchCanvasEntries } from './supabase/canvasEntries.js';
import { setSectionField } from './blueprintSectionStore.js';
import { appendTimelineEvent } from './timelineService.js';
import { shouldApplyRemoteField } from './syncMergeUtils.js';

const STORAGE_KEY = 'spike_canvas_entries';
const MILESTONE_KEY = 'spike_canvas_milestone_30';
const debounceTimers = new Map();

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

/** @param {string} participantId @param {string} engineKey @param {string} fieldKey */
export function getCanvasField(participantId, engineKey, fieldKey) {
  return readAll()[participantId]?.[engineKey]?.[fieldKey] ?? '';
}

/** @param {string} participantId */
export function getCanvasEngine(participantId, engineKey) {
  return readAll()[participantId]?.[engineKey] ?? {};
}

/**
 * @param {string} participantId
 * @param {string} engineKey
 * @param {string} fieldKey
 * @param {string} value
 */
export function saveCanvasField(participantId, engineKey, fieldKey, value) {
  const all = readAll();
  const user = all[participantId] ?? {};
  const engine = user[engineKey] ?? {};
  engine[fieldKey] = value;
  user[engineKey] = engine;
  all[participantId] = user;
  writeAll(all);

  void upsertCanvasEntry(participantId, engineKey, fieldKey, value);

  // Mirror talent/leadership fields into recruitment/leadership sections (v1 + agency v2)
  if (engineKey === 'talent_growth' || engineKey === 'agency_talent') {
    setSectionField(participantId, 'recruitment-growth', fieldKey, value, { sourceType: 'canvas' });
  }
  if (engineKey === 'leadership_growth' || engineKey === 'agency_leadership') {
    setSectionField(participantId, 'leadership-growth', fieldKey, value, { sourceType: 'canvas' });
  }

  maybeRecordCanvasMilestone(participantId);
}

/** @param {string} participantId */
function maybeRecordCanvasMilestone(participantId) {
  const pct = computeCanvasCompletionPct(participantId);
  if (pct < 30) return;
  try {
    const flags = JSON.parse(localStorage.getItem(MILESTONE_KEY) || '{}');
    if (flags[participantId]) return;
    flags[participantId] = true;
    localStorage.setItem(MILESTONE_KEY, JSON.stringify(flags));
    appendTimelineEvent(participantId, {
      type: 'canvas_milestone',
      title: 'FE Canvas v1 draft (30%+)',
      module: 'financial-entrepreneurship',
      sourceType: 'canvas',
      metadata: { completionPct: pct },
    });
  } catch {
    /* storage unavailable */
  }
}

/**
 * Debounced save (2s) per field.
 * @param {string} participantId
 * @param {string} engineKey
 * @param {string} fieldKey
 * @param {string} value
 */
export function saveCanvasFieldDebounced(participantId, engineKey, fieldKey, value) {
  const timerKey = `${participantId}:${engineKey}:${fieldKey}`;
  const existing = debounceTimers.get(timerKey);
  if (existing) clearTimeout(existing);
  debounceTimers.set(
    timerKey,
    setTimeout(() => {
      saveCanvasField(participantId, engineKey, fieldKey, value);
      debounceTimers.delete(timerKey);
    }, 2000),
  );
}

/** @param {string} participantId */
export async function backfillLocalCanvasToSupabase(participantId) {
  if (!participantId || String(participantId).startsWith('mock-')) return;

  const user = readAll()[participantId];
  if (!user) return;

  for (const [engineKey, engine] of Object.entries(user)) {
    for (const [fieldKey, value] of Object.entries(engine ?? {})) {
      if (!String(value ?? '').trim()) continue;
      try {
        await upsertCanvasEntry(participantId, engineKey, fieldKey, String(value));
      } catch {
        /* best-effort */
      }
    }
  }
}

/** @param {string} participantId @param {{ preferRemote?: boolean, preferLocal?: boolean }} [opts] */
export async function hydrateCanvasFromSupabase(participantId, opts = {}) {
  if (!participantId) return;
  try {
    const rows = await fetchCanvasEntries(participantId);
    if (!rows.length) return;
    const all = readAll();
    const user = all[participantId] ?? {};
    for (const row of rows) {
      const engine = user[row.engine_key] ?? {};
      const localVal = engine[row.field_key] ?? '';
      const remoteVal = row.field_value ?? '';
      if (shouldApplyRemoteField(localVal, remoteVal, null, row.updated_at, opts)) {
        engine[row.field_key] = remoteVal;
      }
      user[row.engine_key] = engine;
    }
    all[participantId] = user;
    writeAll(all);
  } catch {
    /* offline */
  }
}

/** @param {string} participantId */
export function computeCanvasCompletionPct(participantId) {
  if (!participantId) return 0;
  let filled = 0;
  let total = 0;
  for (const [engineKey, engine] of Object.entries(CANVAS_ENGINES)) {
    for (const field of engine.fields) {
      total += 1;
      const val = getCanvasField(participantId, engineKey, field.key);
      if (String(val).trim().length >= 10) filled += 1;
    }
  }
  return total ? Math.round((filled / total) * 100) : 0;
}
