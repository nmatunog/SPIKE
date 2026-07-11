/**
 * RA-SPIKE enrollment — cohort resolution and squad auto-assignment.
 */

import { raSpikeHomeOrgOptions } from './raSpikeAgencies.js';

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} admin
 * @param {{ inviteCode?: string, cohortId?: number | string }} opts
 */
export async function resolveRaSpikeCohort(admin, opts = {}) {
  // Invite codes disabled: never pass a code (avoids "Invalid batch invite code" from stale clients).
  const cohortId = opts.cohortId != null ? Number(opts.cohortId) : null;

  const { data, error } = await admin.rpc('resolve_ra_spike_cohort', {
    p_invite_code: null,
    p_cohort_id: Number.isFinite(cohortId) ? cohortId : null,
  });

  if (error) throw new Error(error.message);
  if (!data) throw new Error('Batch is not open for enrollment.');
  return data;
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} admin
 */
export async function listRaSpikeEnrollmentOptions(admin) {
  const { data, error } = await admin
    .from('cohorts')
    .select('id, batch_label, batch_invite_code, name, signup_open')
    .eq('program_slug', 'ra-spike')
    .eq('signup_open', true)
    .order('batch_label')
    .order('id');

  if (error) throw new Error(error.message);

  return {
    batches: (data ?? []).map((row) => ({
      cohortId: row.id,
      batchLabel: row.batch_label || row.name || `Batch ${row.id}`,
      hasInviteCode: Boolean(row.batch_invite_code),
    })),
    agencies: raSpikeHomeOrgOptions(),
  };
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} admin
 * @param {number} cohortId
 * @param {string} userId
 */
export async function assignRaSpikeSquad(admin, cohortId, userId) {
  const { data: squads, error } = await admin
    .from('formation_squads')
    .select('id, name, capacity, formation_squad_members(participant_id)')
    .eq('cohort_id', cohortId)
    .in('status', ['forming', 'active'])
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);

  let target = null;
  let minCount = Infinity;
  for (const squad of squads ?? []) {
    const count = (squad.formation_squad_members ?? []).length;
    const cap = squad.capacity ?? 4;
    if (count < cap && count < minCount) {
      minCount = count;
      target = squad;
    }
  }

  if (target) {
    const { error: memberErr } = await admin.from('formation_squad_members').upsert(
      {
        squad_id: target.id,
        participant_id: userId,
        role: 'Member',
      },
      { onConflict: 'squad_id,participant_id' },
    );
    if (memberErr) throw new Error(memberErr.message);
    return target.name;
  }

  const { data: cohort } = await admin
    .from('cohorts')
    .select('batch_label, name')
    .eq('id', cohortId)
    .maybeSingle();
  const label = cohort?.batch_label || cohort?.name || 'RA-SPIKE';
  return `${label} — forming`;
}
