import { isSupabaseConfigured, supabase } from '../../supabaseClient.js';

const MAX_TITLE = 500;

/**
 * @param {string} userId
 * @param {{
 *   type: string,
 *   title: string,
 *   module?: string,
 *   sourceType?: string,
 *   sourceId?: string,
 *   metadata?: Record<string, unknown>,
 * }} event
 */
export async function insertTimelineEvent(userId, event) {
  if (!isSupabaseConfigured || !supabase || !userId) return null;

  const title = String(event.title || '').slice(0, MAX_TITLE);
  if (!title) return null;

  const { error } = await supabase.from('participant_timeline_events').insert({
    user_id: userId,
    event_type: String(event.type || 'activity').slice(0, 64),
    title,
    module: event.module ?? null,
    source_type: event.sourceType ?? null,
    source_id: event.sourceId ?? null,
    metadata: event.metadata ?? {},
  });

  if (error) {
    console.warn('[timelineEvents] insert failed:', error.message);
    return null;
  }

  return true;
}

/**
 * @param {string} userId
 * @param {number} [limit]
 */
export async function fetchTimelineEvents(userId, limit = 20) {
  if (!isSupabaseConfigured || !supabase || !userId) return null;

  const { data, error } = await supabase
    .from('participant_timeline_events')
    .select('id, event_type, title, module, source_type, source_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.warn('[timelineEvents] fetch failed:', error.message);
    return null;
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    type: row.event_type,
    title: row.title,
    module: row.module,
    sourceType: row.source_type,
    sourceId: row.source_id,
    at: row.created_at,
  }));
}
