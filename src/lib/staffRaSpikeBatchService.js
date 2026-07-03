import { assertPortalCanWrite } from './portalWriteAccess.js';
import { isSupabaseConfigured, supabase } from '../supabaseClient.js';

function assertClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Cloud sync is not configured.');
  }
  return supabase;
}

/** @returns {Promise<Array<object>>} */
export async function fetchRaSpikeBatchesForStaff() {
  const client = assertClient();
  const { data, error } = await client
    .from('cohorts')
    .select(
      'id, name, batch_label, agency, unit_manager, batch_invite_code, signup_open, is_active, start_date, starts_on, created_at',
    )
    .eq('program_slug', 'ra-spike')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * @param {{
 *   agency: string,
 *   unitManager: string,
 *   batchLabel: string,
 *   inviteCode?: string,
 *   startDate?: string,
 *   makeActive?: boolean,
 * }} input
 */
export async function staffCreateRaSpikeBatch(input) {
  await assertPortalCanWrite();
  const client = assertClient();
  const { data, error } = await client.rpc('create_ra_spike_batch', {
    p_agency: input.agency,
    p_unit_manager: input.unitManager,
    p_batch_label: input.batchLabel,
    p_invite_code: input.inviteCode?.trim() || null,
    p_start_date: input.startDate?.trim() || null,
    p_make_active: input.makeActive !== false,
  });
  if (error) throw new Error(error.message);
  return data;
}

/** @param {number} cohortId */
export async function staffSetActiveCohort(cohortId) {
  await assertPortalCanWrite();
  const client = assertClient();
  const { data, error } = await client.rpc('staff_set_active_cohort', {
    p_cohort_id: cohortId,
  });
  if (error) throw new Error(error.message);
  return data;
}

/**
 * @param {number} cohortId
 * @param {{ signupOpen?: boolean, batchInviteCode?: string }} patch
 */
export async function staffPatchRaSpikeBatch(cohortId, patch) {
  await assertPortalCanWrite();
  const client = assertClient();
  /** @type {Record<string, unknown>} */
  const body = {};
  if (patch.signupOpen !== undefined) body.signup_open = patch.signupOpen;
  if (patch.batchInviteCode !== undefined) {
    body.batch_invite_code = patch.batchInviteCode.trim()
      ? patch.batchInviteCode.trim().toUpperCase()
      : null;
  }
  const { data, error } = await client
    .from('cohorts')
    .update(body)
    .eq('id', cohortId)
    .eq('program_slug', 'ra-spike')
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Could not update batch.');
  return data;
}
