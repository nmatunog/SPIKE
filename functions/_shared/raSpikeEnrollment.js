/**
 * RA-SPIKE enrollment — cohort resolution and squad auto-assignment.
 */

import { RA_SPIKE_AGENCIES } from '../../../shared/raSpikeAgencies.js';

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} admin
 * @param {{ inviteCode?: string, cohortId?: number | string }} opts
 */
export async function resolveRaSpikeCohort(admin, opts = {}) {
  const inviteCode = opts.inviteCode ? String(opts.inviteCode).trim() : null;
  const cohortId = opts.cohortId != null ? Number(opts.cohortId) : null;

  const { data, error } = await admin.rpc('resolve_ra_spike_cohort', {
    p_invite_code: inviteCode,
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
    .select('id, agency, unit_manager, batch_label, batch_invite_code, name, signup_open')
    .eq('program_slug', 'ra-spike')
    .eq('signup_open', true)
    .order('agency')
    .order('unit_manager')
    .order('batch_label');

  if (error) throw new Error(error.message);
  const rows = data ?? [];

  /** @type {Map<string, { agency: string, unitManagers: Map<string, { unitManager: string, batches: object[] }> }>} */
  const byAgency = new Map();

  for (const row of rows) {
    const agency = row.agency?.trim() || 'Agency';
    const unitManager = row.unit_manager?.trim() || 'Unit Manager';
    if (!byAgency.has(agency)) {
      byAgency.set(agency, { agency, unitManagers: new Map() });
    }
    const agencyEntry = byAgency.get(agency);
    if (!agencyEntry.unitManagers.has(unitManager)) {
      agencyEntry.unitManagers.set(unitManager, { unitManager, batches: [] });
    }
    agencyEntry.unitManagers.get(unitManager).batches.push({
      cohortId: row.id,
      batchLabel: row.batch_label || row.name || `Batch ${row.id}`,
      hasInviteCode: Boolean(row.batch_invite_code),
    });
  }

  return {
    agencies: RA_SPIKE_AGENCIES.map((name) => {
      const entry = byAgency.get(name);
      return {
        agency: name,
        unitManagers: entry ? [...entry.unitManagers.values()] : [],
      };
    }),
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
    const cap = squad.capacity ?? 6;
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
