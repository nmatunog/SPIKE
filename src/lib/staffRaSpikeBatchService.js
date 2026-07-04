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
      'id, name, official_name, batch_label, agency, unit_manager, batch_invite_code, signup_open, is_active, start_date, starts_on, created_at',
    )
    .eq('program_slug', 'ra-spike')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * @param {{
 *   agency?: string,
 *   unitManager?: string,
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
    p_agency: input.agency?.trim() || null,
    p_unit_manager: input.unitManager?.trim() || null,
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

/** Readable invite code (no ambiguous 0/O/1/I). */
export function generateRaSpikeInviteCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = typeof crypto !== 'undefined' && crypto.getRandomValues
    ? crypto.getRandomValues(new Uint8Array(8))
    : Array.from({ length: 8 }, () => Math.floor(Math.random() * 256));
  let code = '';
  for (const b of bytes) code += alphabet[b % alphabet.length];
  return code;
}

/**
 * Issue a new invite code for a cohort (invalidates the previous code).
 * @param {number} cohortId
 * @returns {Promise<{ batch_invite_code: string } & object>}
 */
export async function staffRegenerateRaSpikeInviteCode(cohortId) {
  await assertPortalCanWrite();
  const client = assertClient();

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const code = generateRaSpikeInviteCode();
    const { data: clash } = await client
      .from('cohorts')
      .select('id')
      .eq('program_slug', 'ra-spike')
      .eq('batch_invite_code', code)
      .maybeSingle();
    if (clash) continue;

    const row = await staffPatchRaSpikeBatch(cohortId, { batchInviteCode: code });
    return row;
  }

  throw new Error('Could not generate a unique invite code. Try again.');
}

/**
 * @param {number} cohortId
 * @param {{
 *   signupOpen?: boolean,
 *   batchInviteCode?: string,
 *   batchLabel?: string,
 *   officialName?: string,
 *   name?: string,
 * }} patch
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
  if (patch.batchLabel !== undefined) {
    const label = patch.batchLabel.trim();
    if (!label) throw new Error('Cohort / batch name is required.');
    body.batch_label = label;
    body.name = patch.name?.trim() || label;
  }
  if (patch.officialName !== undefined) {
    body.official_name = patch.officialName.trim() || null;
  }
  if (patch.name !== undefined && patch.batchLabel === undefined) {
    body.name = patch.name.trim();
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
