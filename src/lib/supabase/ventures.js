import { supabase } from '../../supabaseClient.js';
import { shouldSkipSupabaseUserWrite, canWriteParticipantRow } from './writeGuards.js';
import {
  emptyVentureDocument,
  mergeVentureDocument,
  ventureDocumentFromRow,
  ventureDocumentToRowPayload,
} from '../ventureDocument.js';

/** @param {string | null | undefined} userId */
export async function fetchVentureByOwner(userId) {
  if (!supabase || shouldSkipSupabaseUserWrite(userId)) return null;
  const { data, error } = await supabase
    .from('ventures')
    .select('*')
    .eq('owner_user_id', userId)
    .is('squad_id', null)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** @param {string | null | undefined} squadId */
export async function fetchVentureBySquad(squadId) {
  if (!supabase || !squadId) return null;
  const { data, error } = await supabase
    .from('ventures')
    .select('*')
    .eq('squad_id', squadId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * @param {string} userId
 * @param {string | null | undefined} squadId
 */
export async function fetchVentureForParticipant(userId, squadId) {
  if (squadId) {
    const squadRow = await fetchVentureBySquad(squadId);
    if (squadRow) return squadRow;
  }
  return fetchVentureByOwner(userId);
}

/**
 * @param {string} userId
 * @param {Partial<import('../types/venture.js').VentureDocument>} patch
 * @param {{ squadId?: string | null, compiledSnapshot?: Record<string, unknown> }} [opts]
 */
export async function upsertVentureDocument(userId, patch, opts = {}) {
  if (!supabase || !(await canWriteParticipantRow(userId))) return null;

  const existing = await fetchVentureForParticipant(userId, opts.squadId ?? null);
  const merged = mergeVentureDocument(
    existing ? ventureDocumentFromRow(existing) : emptyVentureDocument(),
    patch,
  );
  const payload = {
    owner_user_id: userId,
    squad_id: opts.squadId ?? existing?.squad_id ?? null,
    ...ventureDocumentToRowPayload(merged),
    ...(opts.compiledSnapshot ? { compiled_snapshot: opts.compiledSnapshot } : {}),
  };

  if (existing?.id) {
    const { data, error } = await supabase
      .from('ventures')
      .update(payload)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase.from('ventures').insert(payload).select().single();
  if (error) throw error;
  return data;
}

/**
 * Bind a solo intern venture draft to a formation squad.
 * @param {string} userId
 * @param {string} squadId
 */
export async function attachVentureToSquad(userId, squadId) {
  if (!supabase || !(await canWriteParticipantRow(userId)) || !squadId) return null;

  const solo = await fetchVentureByOwner(userId);
  const squadVenture = await fetchVentureBySquad(squadId);

  if (squadVenture) {
    if (solo?.id && solo.id !== squadVenture.id) {
      const merged = mergeVentureDocument(
        ventureDocumentFromRow(squadVenture),
        ventureDocumentFromRow(solo),
      );
      const { data, error } = await supabase
        .from('ventures')
        .update({
          ...ventureDocumentToRowPayload(merged),
          owner_user_id: squadVenture.owner_user_id ?? userId,
        })
        .eq('id', squadVenture.id)
        .select()
        .single();
      if (error) throw error;
      await supabase.from('ventures').delete().eq('id', solo.id);
      return data;
    }
    return squadVenture;
  }

  if (solo) {
    const { data, error } = await supabase
      .from('ventures')
      .update({ squad_id: squadId })
      .eq('id', solo.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  return upsertVentureDocument(userId, emptyVentureDocument(), { squadId });
}
