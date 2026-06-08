import { supabase } from '../../supabaseClient.js';

/** @param {unknown} error */
function throwIfError(error) {
  if (error) throw error;
}

export async function fetchCurriculumTree() {
  const { data: segments, error: segErr } = await supabase
    .from('segments')
    .select('id, slug, title, description, hours, status, sort_order')
    .order('sort_order');
  throwIfError(segErr);

  const { data: weeks, error: weekErr } = await supabase
    .from('weeks')
    .select('id, segment_id, slug, title, theme, description, status, week_number, sort_order')
    .order('sort_order');
  throwIfError(weekErr);

  const { data: days, error: dayErr } = await supabase
    .from('days')
    .select(
      'id, week_id, slug, title, theme, description, day_number, estimated_hours, status, learning_objectives, deliverables',
    )
    .order('sort_order');
  throwIfError(dayErr);

  const { data: sessions, error: sessErr } = await supabase
    .from('sessions')
    .select('id, day_id, slug, title, description, session_number, status')
    .order('sort_order');
  throwIfError(sessErr);

  return { segments: segments ?? [], weeks: weeks ?? [], days: days ?? [], sessions: sessions ?? [] };
}

/**
 * @param {{ blockType?: string, status?: string, search?: string }} [filters]
 */
export async function fetchContentBlocks(filters = {}) {
  let query = supabase
    .from('content_blocks')
    .select('id, block_type, title, description, status, version, audience, tags, updated_at')
    .order('updated_at', { ascending: false });

  if (filters.blockType) query = query.eq('block_type', filters.blockType);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.search) query = query.ilike('title', `%${filters.search}%`);

  const { data, error } = await query;
  throwIfError(error);
  return data ?? [];
}

/** @param {string} id */
export async function fetchContentBlock(id) {
  const { data, error } = await supabase.from('content_blocks').select('*').eq('id', id).maybeSingle();
  throwIfError(error);
  return data;
}

/** @param {Record<string, unknown>} block */
export async function upsertContentBlock(block) {
  const { data, error } = await supabase
    .from('content_blocks')
    .upsert({ ...block, updated_at: new Date().toISOString() })
    .select('*')
    .single();
  throwIfError(error);
  return data;
}

/** @param {string} daySlug */
export async function fetchDaySequence(daySlug) {
  const { data: seq, error: seqErr } = await supabase
    .from('day_content_sequences')
    .select('block_id, sort_order')
    .eq('day_slug', daySlug)
    .order('sort_order');
  throwIfError(seqErr);

  if (!seq?.length) return [];

  const ids = seq.map((row) => row.block_id);
  const { data: blocks, error: blockErr } = await supabase
    .from('content_blocks')
    .select('id, block_type, title, description, status')
    .in('id', ids);
  throwIfError(blockErr);

  const byId = Object.fromEntries((blocks ?? []).map((b) => [b.id, b]));
  return seq.map((row) => ({ ...byId[row.block_id], sort_order: row.sort_order })).filter((b) => b.id);
}

/**
 * @param {string} daySlug
 * @param {string[]} blockIds ordered
 */
export async function saveDaySequence(daySlug, blockIds) {
  await supabase.from('day_content_sequences').delete().eq('day_slug', daySlug);
  if (!blockIds.length) return;

  const rows = blockIds.map((blockId, index) => ({
    day_slug: daySlug,
    block_id: blockId,
    sort_order: index + 1,
  }));

  const { error } = await supabase.from('day_content_sequences').insert(rows);
  throwIfError(error);
}

/** @param {{ assetType?: string, search?: string }} [filters] */
export async function fetchContentAssets(filters = {}) {
  let query = supabase
    .from('content_assets')
    .select('id, title, asset_type, public_url, tags, segment_slug, week_slug, day_slug, topic, status, updated_at')
    .order('updated_at', { ascending: false });

  if (filters.assetType) query = query.eq('asset_type', filters.assetType);
  if (filters.search) query = query.ilike('title', `%${filters.search}%`);

  const { data, error } = await query;
  throwIfError(error);
  return data ?? [];
}

/** @param {Record<string, unknown>} asset */
export async function upsertContentAsset(asset) {
  const { data, error } = await supabase
    .from('content_assets')
    .upsert({ ...asset, updated_at: new Date().toISOString() })
    .select('*')
    .single();
  throwIfError(error);
  return data;
}

/** @param {string} id @param {string} status */
export async function updateContentBlockStatus(id, status) {
  const patch = { status, updated_at: new Date().toISOString() };
  if (status === 'published') patch.published_at = new Date().toISOString();

  const { data, error } = await supabase.from('content_blocks').update(patch).eq('id', id).select('*').single();
  throwIfError(error);
  return data;
}

/** @param {number} dayId @param {string} status */
export async function updateDayStatus(dayId, status) {
  const { data, error } = await supabase
    .from('days')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', dayId)
    .select('*')
    .single();
  throwIfError(error);
  return data;
}
