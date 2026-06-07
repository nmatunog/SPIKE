/**
 * Timeline Engine — local cache + Supabase participant_timeline_events (Sprint 04 PR4.3).
 */
import {
  appendBlueprintTimelineEvent,
  listBlueprintTimelineEvents,
} from './blueprintTimeline.js';
import { fetchTimelineEvents, insertTimelineEvent } from './supabase/timelineEvents.js';

/** @type {Set<string>} */
const hydratedUsers = new Set();

/**
 * @param {string} participantId
 * @param {{
 *   type: string,
 *   title: string,
 *   module?: string,
 *   sourceType?: string,
 *   sourceId?: string,
 *   metadata?: Record<string, unknown>,
 * }} event
 */
export function appendTimelineEvent(participantId, event) {
  if (!participantId || !event?.title) return;

  appendBlueprintTimelineEvent(participantId, event);
  void insertTimelineEvent(participantId, event);
}

/** @param {string} participantId @param {number} [limit] */
export function listTimelineEvents(participantId, limit = 10) {
  return listBlueprintTimelineEvents(participantId, limit);
}

/**
 * Merge recent Supabase events into local list when local is empty.
 * @param {string} participantId
 */
export async function hydrateTimelineFromSupabase(participantId) {
  if (!participantId || hydratedUsers.has(participantId)) return;

  const local = listBlueprintTimelineEvents(participantId, 1);
  if (local.length > 0) {
    hydratedUsers.add(participantId);
    return;
  }

  const remote = await fetchTimelineEvents(participantId, 20);
  if (!remote?.length) {
    hydratedUsers.add(participantId);
    return;
  }

  for (const evt of [...remote].reverse()) {
    appendBlueprintTimelineEvent(participantId, {
      type: evt.type,
      title: evt.title,
      module: evt.module ?? undefined,
      sourceType: evt.sourceType ?? undefined,
      sourceId: evt.sourceId ?? undefined,
    });
  }

  hydratedUsers.add(participantId);
}
