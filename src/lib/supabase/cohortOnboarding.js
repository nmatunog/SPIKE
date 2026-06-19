import { supabase, isSupabaseConfigured } from '../../supabaseClient.js';
import {
  bootstrapInternProgressViaApi,
  isInternProgressApiUnavailable,
} from '../internProgressApi.js';

/** @param {{ code?: string, message?: string }} error */
function isMissingRpcError(error) {
  if (!error) return false;
  const message = String(error.message ?? '');
  return (
    error.code === 'PGRST202'
    || error.code === '42P01'
    || /not find|404|schema cache/i.test(message)
  );
}

/** @typedef {'suggestions_closed' | 'suggestions_open' | 'finalists_ready' | 'voting_open' | 'voting_closed' | 'winner_revealed' | 'cohort_photo_complete' | 'squads_assigned' | 'onboarding_complete'} OnboardingPhase */

/**
 * @typedef {{
 *   id: number,
 *   name: string,
 *   code: string | null,
 *   is_active: boolean,
 *   onboarding_phase: OnboardingPhase,
 *   official_name: string | null,
 *   photo_url: string | null,
 *   motto: string,
 *   theme_statement: string,
 *   start_date?: string | null,
 * }} CohortRow
 */

function assertClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }
  return supabase;
}

/** @param {{ code?: string, message?: string, details?: string }} error */
function formatDbError(error, fallback) {
  if (!error) return fallback;
  const code = String(error.code ?? '');
  const message = String(error.message ?? fallback);
  if (code === 'PGRST116' || /0 rows/i.test(message)) {
    return 'Permission denied or cohort record not found. Superusers need migration 20260707_superuser_cohort_onboarding.sql applied in Supabase.';
  }
  if (code === '42501' || /permission|policy|row-level security/i.test(message)) {
    return 'You do not have permission for this cohort action. Ensure your account role is SUPERUSER, FACULTY, MENTOR, or ADMIN.';
  }
  return message || fallback;
}

/** @param {Record<string, unknown> | null | undefined} row */
function normalizeCohortRow(row) {
  if (!row) return null;
  const startDate = row.start_date ?? row.starts_on ?? null;
  return /** @type {CohortRow} */ ({
    ...row,
    start_date: startDate ? String(startDate).slice(0, 10) : null,
  });
}

/** @param {{ code?: string, message?: string }} error */
function isMissingColumnError(error) {
  if (!error) return false;
  const message = String(error.message ?? '');
  return error.code === '42703' || /column .* does not exist|schema cache/i.test(message);
}

/** @param {import('@supabase/supabase-js').SupabaseClient} client @param {string} select */
async function fetchFirstCohortRow(client, select) {
  const withActive = await client
    .from('cohorts')
    .select(select)
    .eq('is_active', true)
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!withActive.error) return withActive.data;

  const anyCohort = await client
    .from('cohorts')
    .select(select)
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!anyCohort.error) return anyCohort.data;
  return { error: anyCohort.error ?? withActive.error };
}

/** @returns {Promise<CohortRow | null>} */
export async function fetchActiveCohort() {
  const client = assertClient();
  const selects = [
    'id, name, code, is_active, onboarding_phase, official_name, photo_url, motto, theme_statement, start_date, starts_on',
    'id, name, code, is_active, onboarding_phase, official_name, photo_url, motto, theme_statement, starts_on',
    'id, name, code, is_active, onboarding_phase, official_name, photo_url, motto, theme_statement',
    'id, name, code',
  ];

  for (const select of selects) {
    const result = await fetchFirstCohortRow(client, select);
    if (result && !('error' in result)) {
      const normalized = normalizeCohortRow(result);
      if (normalized) return normalized;
    }
    if (result && 'error' in result && !isMissingColumnError(result.error)) {
      break;
    }
  }

  const minimal = await client
    .from('cohorts')
    .select('id, name, code')
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (minimal.error) throw minimal.error;
  if (!minimal.data) return null;
  return normalizeCohortRow({
    ...minimal.data,
    is_active: true,
    onboarding_phase: 'suggestions_closed',
    official_name: null,
    photo_url: null,
    motto: '',
    theme_statement: '',
  });
}

/** Bootstrap founding cohort (staff RPC). Requires Supabase session as FACULTY/MENTOR/ADMIN. */
export async function ensureActiveCohortForStaff() {
  const client = assertClient();
  const { data, error } = await client.rpc('ensure_active_cohort');
  if (error) throw error;
  return data;
}

/** @param {number} cohortId @param {Partial<CohortRow>} patch */
export async function updateCohort(cohortId, patch) {
  const client = assertClient();
  /** @type {Record<string, unknown>} */
  let payload = { ...patch };
  if (patch.start_date !== undefined) {
    payload.starts_on = patch.start_date;
  }

  async function attemptUpdate(body) {
    return client
      .from('cohorts')
      .update(body)
      .eq('id', cohortId)
      .select()
      .maybeSingle();
  }

  let { data, error } = await attemptUpdate(payload);
  if (error && isMissingColumnError(error) && payload.start_date !== undefined) {
    ({ data, error } = await attemptUpdate({ starts_on: payload.start_date }));
  } else if (error && isMissingColumnError(error) && payload.starts_on !== undefined) {
    ({ data, error } = await attemptUpdate({ start_date: payload.starts_on }));
  }

  if (error) throw new Error(formatDbError(error, 'Could not update cohort.'));
  if (!data) {
    throw new Error(
      'Cohort update was blocked (no rows changed). Run migration 20260707_superuser_cohort_onboarding.sql in Supabase SQL Editor, then reload the API schema.',
    );
  }
  return normalizeCohortRow(data);
}

/** @param {number} cohortId */
export async function fetchSuggestions(cohortId) {
  const client = assertClient();
  const { data, error } = await client
    .from('cohort_suggestions')
    .select('id, cohort_id, participant_id, suggested_name, reason, created_at')
    .eq('cohort_id', cohortId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/**
 * @param {number} cohortId
 * @param {string} participantId
 * @param {{ name: string, reason?: string }} input
 */
export async function upsertSuggestion(cohortId, participantId, input) {
  const client = assertClient();
  const { data, error } = await client
    .from('cohort_suggestions')
    .upsert(
      {
        cohort_id: cohortId,
        participant_id: participantId,
        suggested_name: input.name.trim(),
        reason: String(input.reason ?? '').trim(),
      },
      { onConflict: 'cohort_id,participant_id' },
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** @param {number} cohortId */
export async function fetchFinalists(cohortId) {
  const client = assertClient();
  const { data, error } = await client
    .from('cohort_finalists')
    .select('id, cohort_id, display_order, name, source_suggestion_ids, created_at')
    .eq('cohort_id', cohortId)
    .order('display_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/**
 * @param {number} cohortId
 * @param {Array<{ name: string, mergedFrom?: string[] }>} finalists
 * @param {string} [editedBy]
 */
export async function replaceFinalists(cohortId, finalists, editedBy) {
  const client = assertClient();
  const { error: delErr } = await client.from('cohort_finalists').delete().eq('cohort_id', cohortId);
  if (delErr) throw delErr;

  if (!finalists.length) return [];

  const rows = finalists.map((f, idx) => ({
    cohort_id: cohortId,
    display_order: idx,
    name: f.name.trim(),
    source_suggestion_ids: f.mergedFrom ?? [],
    edited_by: editedBy ?? null,
  }));

  const { data, error } = await client.from('cohort_finalists').insert(rows).select();
  if (error) throw error;
  return data ?? [];
}

/** @param {string} finalistId @param {string} name @param {string} [editedBy] */
export async function updateFinalistName(finalistId, name, editedBy) {
  const client = assertClient();
  const { data, error } = await client
    .from('cohort_finalists')
    .update({ name: name.trim(), edited_by: editedBy ?? null })
    .eq('id', finalistId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** @param {number} cohortId */
export async function fetchVotes(cohortId) {
  const client = assertClient();
  const { data, error } = await client
    .from('cohort_votes')
    .select('id, cohort_id, participant_id, finalist_id, created_at')
    .eq('cohort_id', cohortId);
  if (error) throw error;
  return data ?? [];
}

/**
 * @param {number} cohortId
 * @param {string} participantId
 * @param {string} finalistId
 */
export async function castVote(cohortId, participantId, finalistId) {
  const client = assertClient();
  const { data, error } = await client
    .from('cohort_votes')
    .insert({ cohort_id: cohortId, participant_id: participantId, finalist_id: finalistId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** @param {string} participantId */
export async function fetchParticipantVote(cohortId, participantId) {
  const client = assertClient();
  const { data, error } = await client
    .from('cohort_votes')
    .select('id, finalist_id, created_at')
    .eq('cohort_id', cohortId)
    .eq('participant_id', participantId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** @param {string} participantId */
export async function fetchParticipantSuggestion(cohortId, participantId) {
  const client = assertClient();
  const { data, error } = await client
    .from('cohort_suggestions')
    .select('id, suggested_name, reason, created_at')
    .eq('cohort_id', cohortId)
    .eq('participant_id', participantId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** @param {string} participantId */
export async function fetchParticipantSquad(participantId) {
  const client = assertClient();
  const { data: member, error: memErr } = await client
    .from('formation_squad_members')
    .select('squad_id, role')
    .eq('participant_id', participantId)
    .maybeSingle();
  if (memErr) throw memErr;
  if (!member) return null;

  const { data: squad, error: squadErr } = await client
    .from('formation_squads')
    .select('id, cohort_id, name, motto, photo_url, registered_at, onboarding_complete, status, capacity')
    .eq('id', member.squad_id)
    .maybeSingle();
  if (squadErr) throw squadErr;
  return { membership: member, squad };
}

/** @param {number} cohortId */
export async function fetchFormationSquads(cohortId) {
  const client = assertClient();
  const { data, error } = await client
    .from('formation_squads')
    .select('id, name, motto, photo_url, registered_at, onboarding_complete, status, capacity, formation_squad_members(participant_id, role)')
    .eq('cohort_id', cohortId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/**
 * @param {number} cohortId
 * @param {string} name
 * @param {string[]} memberIds — up to 3
 */
export async function createFormationSquad(cohortId, name, memberIds) {
  const client = assertClient();
  const ids = memberIds.slice(0, 3);
  const { data: squad, error } = await client
    .from('formation_squads')
    .insert({
      cohort_id: cohortId,
      name: name.trim() || 'Squad',
      capacity: 3,
      status: 'forming',
    })
    .select()
    .single();
  if (error) throw error;

  if (ids.length) {
    await assertParticipantNotInSquad(client, ids[0]);
    for (const pid of ids.slice(1)) {
      await assertParticipantNotInSquad(client, pid);
    }
    const rows = ids.map((pid, idx) => ({
      squad_id: squad.id,
      participant_id: pid,
      role: idx === 0 ? 'Leader' : 'Member',
    }));
    const { error: memErr } = await client.from('formation_squad_members').insert(rows);
    if (memErr) throw memErr;
    for (const pid of ids) {
      await syncInternProgressSquadLabel(client, pid, squad.name);
    }
  }
  return squad;
}

/** @param {string} participantId */
async function assertParticipantNotInSquad(client, participantId, exceptSquadId = null) {
  const { data, error } = await client
    .from('formation_squad_members')
    .select('squad_id')
    .eq('participant_id', participantId);
  if (error) throw error;
  const conflict = (data ?? []).find((row) => row.squad_id !== exceptSquadId);
  if (conflict) {
    throw new Error('This intern is already assigned to another squad. Remove them there first.');
  }
}

/** @param {string} participantId @param {string | null} squadName */
async function syncInternProgressSquadLabel(client, participantId, squadName) {
  const { error } = await client
    .from('intern_progress')
    .update({ squad: squadName ?? '' })
    .eq('user_id', participantId);
  if (error) throw error;
}

/** @param {string} squadId */
export async function syncFormationSquadMemberLabels(squadId) {
  const client = assertClient();
  const { data: squad, error: squadErr } = await client
    .from('formation_squads')
    .select('name')
    .eq('id', squadId)
    .maybeSingle();
  if (squadErr) throw squadErr;

  const { data: members, error: memErr } = await client
    .from('formation_squad_members')
    .select('participant_id')
    .eq('squad_id', squadId);
  if (memErr) throw memErr;

  for (const member of members ?? []) {
    await syncInternProgressSquadLabel(client, member.participant_id, squad?.name ?? null);
  }
}

/**
 * Canonical squad labels from formation_squad_members + formation_squads.
 * @param {string[]} participantIds
 */
export async function fetchFormationSquadLabels(participantIds) {
  const client = assertClient();
  const ids = participantIds.filter(Boolean);
  if (!ids.length) return {};

  const { data, error } = await client
    .from('formation_squad_members')
    .select('participant_id, formation_squads(name)')
    .in('participant_id', ids);
  if (error) throw error;

  /** @type {Record<string, string>} */
  const labels = {};
  for (const row of data ?? []) {
    const name = row.formation_squads?.name;
    if (row.participant_id && name) {
      labels[row.participant_id] = String(name);
    }
  }
  return labels;
}

/**
 * Backfill intern_progress.squad from formation tables when stale or empty.
 * @param {string[]} participantIds
 */
export async function reconcileFormationSquadLabels(participantIds) {
  const client = assertClient();
  const labels = await fetchFormationSquadLabels(participantIds);
  await Promise.all(
    Object.entries(labels).map(([participantId, squadName]) =>
      syncInternProgressSquadLabel(client, participantId, squadName),
    ),
  );
  return labels;
}

/** @param {string} squadId @param {string} participantId */
export async function addSquadMember(squadId, participantId) {
  const client = assertClient();
  await assertParticipantNotInSquad(client, participantId);

  const { count, error: countErr } = await client
    .from('formation_squad_members')
    .select('id', { count: 'exact', head: true })
    .eq('squad_id', squadId);
  if (countErr) throw countErr;
  if ((count ?? 0) >= 3) throw new Error('Squad already has 3 members.');

  const { data: squad, error: squadErr } = await client
    .from('formation_squads')
    .select('name')
    .eq('id', squadId)
    .maybeSingle();
  if (squadErr) throw squadErr;
  if (!squad) throw new Error('Squad not found.');

  const { data, error } = await client
    .from('formation_squad_members')
    .insert({ squad_id: squadId, participant_id: participantId, role: 'Member' })
    .select()
    .single();
  if (error) throw error;

  await syncInternProgressSquadLabel(client, participantId, squad.name);
  return data;
}

/** @param {string} squadId @param {string} participantId */
export async function removeSquadMember(squadId, participantId) {
  const client = assertClient();
  const { error } = await client
    .from('formation_squad_members')
    .delete()
    .eq('squad_id', squadId)
    .eq('participant_id', participantId);
  if (error) throw error;
  await syncInternProgressSquadLabel(client, participantId, null);
}

/** @param {string} squadId */
export async function deleteFormationSquad(squadId) {
  const client = assertClient();
  const { data: members, error: memErr } = await client
    .from('formation_squad_members')
    .select('participant_id')
    .eq('squad_id', squadId);
  if (memErr) throw memErr;

  const { error } = await client.from('formation_squads').delete().eq('id', squadId);
  if (error) throw error;

  for (const member of members ?? []) {
    await syncInternProgressSquadLabel(client, member.participant_id, null);
  }
}

/** @param {string} squadId @param {{ name?: string, motto?: string, photo_url?: string, registered_at?: string, onboarding_complete?: boolean, status?: string }} patch */
export async function updateFormationSquad(squadId, patch) {
  const client = assertClient();
  const { data, error } = await client
    .from('formation_squads')
    .update(patch)
    .eq('id', squadId)
    .select()
    .single();
  if (error) throw error;
  if (patch.name) {
    await syncFormationSquadMemberLabels(squadId);
  }
  return data;
}

/** @param {import('@supabase/supabase-js').SupabaseClient} client @param {string} userId */
async function fetchInternProgressRow(client, userId) {
  const { data, error } = await client
    .from('intern_progress')
    .select(
      'segment, hours, licensed, squad, university, career_track, career_track_selected_at, current_week, current_day, onboarding_complete, onboarding_welcomed_at, cohort_id',
    )
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** @param {string} participantId */
export async function markParticipantWelcomed(participantId) {
  const client = assertClient();
  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  if (sessionError) throw sessionError;
  const userId = sessionData.session?.user?.id;
  if (!userId) {
    throw new Error('Not signed in. Sign out and sign in with your SPIKE account.');
  }
  if (participantId && participantId !== userId) {
    throw new Error('Session user does not match participant.');
  }
  const { data, error } = await client.rpc('mark_onboarding_welcomed', { p_user_id: userId });
  if (!error) {
    return { onboarding_welcomed_at: data };
  }
  if (isMissingRpcError(error)) {
    try {
      const progress = await bootstrapInternProgressViaApi('welcome');
      if (progress?.onboarding_welcomed_at) {
        return { onboarding_welcomed_at: progress.onboarding_welcomed_at };
      }
    } catch (apiErr) {
      if (!isInternProgressApiUnavailable(apiErr)) {
        console.warn('[internProgress] welcome API fallback failed:', apiErr);
      }
    }
    const row = await fetchInternProgressRow(client, userId).catch(() => null);
    if (row?.onboarding_welcomed_at) {
      return { onboarding_welcomed_at: row.onboarding_welcomed_at };
    }
    throw new Error(
      'Could not save welcome progress. Ask your Program Coach to run migration 20260713_intern_progress_catchup.sql in Supabase.',
    );
  }
  throw error;
}

/** @param {string} participantId */
export async function markOnboardingComplete(participantId) {
  const client = assertClient();
  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  if (sessionError) throw sessionError;
  const userId = sessionData.session?.user?.id;
  if (!userId) {
    throw new Error('Not signed in. Sign out and sign in with your SPIKE account.');
  }
  if (participantId && participantId !== userId) {
    throw new Error('Session user does not match participant.');
  }
  const { data, error } = await client.rpc('mark_onboarding_complete', { p_user_id: userId });
  if (!error) {
    return { onboarding_complete: data };
  }
  if (isMissingRpcError(error)) {
    try {
      const progress = await bootstrapInternProgressViaApi('complete');
      if (progress) {
        return { onboarding_complete: Boolean(progress.onboarding_complete) };
      }
    } catch (apiErr) {
      if (!isInternProgressApiUnavailable(apiErr)) {
        console.warn('[internProgress] complete API fallback failed:', apiErr);
      }
    }
    const row = await fetchInternProgressRow(client, userId).catch(() => null);
    if (row?.onboarding_complete) {
      return { onboarding_complete: true };
    }
    throw new Error(
      'Could not mark onboarding complete. Ask your Program Coach to run migration 20260713_intern_progress_catchup.sql in Supabase.',
    );
  }
  throw error;
}

/**
 * @param {{ university?: string | null, squad?: string | null }} [opts]
 */
export async function ensureInternProgress(opts = {}) {
  const client = assertClient();
  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  if (sessionError) throw sessionError;
  const userId = sessionData.session?.user?.id;
  if (!userId) return null;
  const { data, error } = await client.rpc('ensure_intern_progress', {
    p_user_id: userId,
    p_university: opts.university ?? null,
    p_squad: opts.squad ?? null,
  });
  if (!error) return data;

  if (isMissingRpcError(error)) {
    console.warn(
      '[internProgress] ensure_intern_progress RPC missing — trying API fallback. Run supabase/migrations/20260713_intern_progress_catchup.sql',
    );
    try {
      const progress = await bootstrapInternProgressViaApi('ensure', opts);
      if (progress) return progress;
    } catch (apiErr) {
      if (!isInternProgressApiUnavailable(apiErr)) {
        console.warn('[internProgress] ensure API fallback failed:', apiErr);
      }
    }
    const row = await fetchInternProgressRow(client, userId).catch(() => null);
    if (row) return row;
    return null;
  }
  throw error;
}

/** @param {string} participantId */
export async function fetchParticipantOnboarding(participantId) {
  const client = assertClient();
  const { data, error } = await client
    .from('intern_progress')
    .select('onboarding_complete, onboarding_welcomed_at, cohort_id')
    .eq('user_id', participantId)
    .maybeSingle();
  if (error) {
    const missingColumns =
      error.code === '42703'
      || /onboarding_complete|onboarding_welcomed_at/i.test(String(error.message ?? ''));
    if (missingColumns) {
      throw new Error(
        'Onboarding columns missing in intern_progress. Run migrations 20260615 + 20260616 in Supabase SQL Editor, then NOTIFY pgrst, \'reload schema\';',
      );
    }
    const { data: fallback, error: fallbackErr } = await client
      .from('intern_progress')
      .select('cohort_id')
      .eq('user_id', participantId)
      .maybeSingle();
    if (fallbackErr) throw fallbackErr;
    return {
      onboarding_complete: false,
      onboarding_welcomed_at: null,
      cohort_id: fallback?.cohort_id ?? null,
    };
  }
  return data;
}

/** @param {number} cohortId @param {string} photoUrl */
export async function setCohortPhoto(cohortId, photoUrl) {
  return updateCohort(cohortId, {
    photo_url: photoUrl,
    onboarding_phase: 'cohort_photo_complete',
  });
}

/** @param {number} cohortId */
export async function computeVoteTally(cohortId) {
  const [finalists, votes] = await Promise.all([fetchFinalists(cohortId), fetchVotes(cohortId)]);
  return finalists.map((f) => ({
    finalistId: f.id,
    name: f.name,
    votes: votes.filter((v) => v.finalist_id === f.id).length,
  })).sort((a, b) => b.votes - a.votes);
}

/** @param {number} cohortId @param {OnboardingPhase} phase */
export async function setCohortPhase(cohortId, phase) {
  const patch = { onboarding_phase: phase };
  const now = new Date().toISOString();
  if (phase === 'suggestions_open') patch.suggestions_opened_at = now;
  if (phase === 'voting_open') patch.voting_opened_at = now;
  if (phase === 'voting_closed') patch.voting_closed_at = now;
  if (phase === 'winner_revealed') patch.revealed_at = now;
  return updateCohort(cohortId, patch);
}

/** @param {number} cohortId */
export async function revealWinner(cohortId) {
  const tally = await computeVoteTally(cohortId);
  const winner = tally[0];
  if (!winner?.name) throw new Error('No votes to reveal a winner.');
  return updateCohort(cohortId, {
    official_name: winner.name,
    name: winner.name,
    onboarding_phase: 'winner_revealed',
    revealed_at: new Date().toISOString(),
  });
}

/** @param {import('@supabase/supabase-js').RealtimeChannel | null} channel */
export function unsubscribeChannel(channel) {
  if (channel && supabase) supabase.removeChannel(channel);
}

/**
 * @param {number} cohortId
 * @param {() => void} onChange
 */
export function subscribeToCohortOnboarding(cohortId, onChange) {
  const client = assertClient();
  const channel = client
    .channel(`cohort-onboarding-${cohortId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'cohorts', filter: `id=eq.${cohortId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'cohort_votes', filter: `cohort_id=eq.${cohortId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'cohort_finalists', filter: `cohort_id=eq.${cohortId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'formation_squads', filter: `cohort_id=eq.${cohortId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'formation_squad_members' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'cohort_suggestions', filter: `cohort_id=eq.${cohortId}` }, onChange)
    .subscribe();
  return channel;
}
