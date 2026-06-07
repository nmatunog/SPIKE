/** Local Blueprint timeline until participant_timeline_events table (Sprint 04 PR4). */

const STORAGE_KEY = 'spike_blueprint_timeline';

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
 * @param {{
 *   type: string,
 *   title: string,
 *   module?: string,
 *   sourceType?: string,
 *   sourceId?: string,
 * }} event
 */
export function appendBlueprintTimelineEvent(participantId, event) {
  const all = readAll();
  const list = all[participantId] ?? [];
  list.unshift({
    id: `evt-${crypto.randomUUID()}`,
    at: new Date().toISOString(),
    ...event,
  });
  all[participantId] = list.slice(0, 50);
  writeAll(all);
}

/** @param {string} participantId @param {number} [limit] */
export function listBlueprintTimelineEvents(participantId, limit = 10) {
  const list = readAll()[participantId] ?? [];
  return list.slice(0, limit);
}
