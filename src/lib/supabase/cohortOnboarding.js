import { supabase, isSupabaseConfigured } from '../../supabaseClient.js';

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
 * }} CohortRow
 */

function assertClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }
  return supabase;
}

/** @returns {Promise<CohortRow | null>} */
export async function fetchActiveCohort() {
  const client = assertClient();
  const fullSelect =
    'id, name, code, is_active, onboarding_phase, official_name, photo_url, motto, theme_statement';

  const withActive = await client
    .from('cohorts')
    .select(fullSelect)
    .eq('is_active', true)
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!withActive.error) return withActive.data;

  const anyCohort = await client
    .from('cohorts')
    .select(fullSelect)
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!anyCohort.error) return anyCohort.data;

  const minimal = await client
    .from('cohorts')
    .select('id, name, code')
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (minimal.error) throw minimal.error;
  if (!minimal.data) return null;
  return {
    ...minimal.data,
    is_active: true,
    onboarding_phase: 'suggestions_closed',
    official_name: null,
    photo_url: null,
    motto: '',
    theme_statement: '',
  };
}

/** @param {number} cohortId @param {Partial<CohortRow>} patch */
export async function updateCohort(cohortId, patch) {
  const client = assertClient();
  const { data, error } = await client
    .from('cohorts')
    .update(patch)
    .eq('id', cohortId)
    .select()
    .single();
  if (error) throw error;
  return data;
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
    const rows = ids.map((pid, idx) => ({
      squad_id: squad.id,
      participant_id: pid,
      role: idx === 0 ? 'Leader' : 'Member',
    }));
    const { error: memErr } = await client.from('formation_squad_members').insert(rows);
    if (memErr) throw memErr;
  }
  return squad;
}

/** @param {string} squadId @param {string} participantId */
export async function addSquadMember(squadId, participantId) {
  const client = assertClient();
  const { count, error: countErr } = await client
    .from('formation_squad_members')
    .select('id', { count: 'exact', head: true })
    .eq('squad_id', squadId);
  if (countErr) throw countErr;
  if ((count ?? 0) >= 3) throw new Error('Squad already has 3 members.');

  const { data, error } = await client
    .from('formation_squad_members')
    .insert({ squad_id: squadId, participant_id: participantId, role: 'Member' })
    .select()
    .single();
  if (error) throw error;
  return data;
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
  return data;
}

/** @param {string} participantId */
export async function markParticipantWelcomed(participantId) {
  void participantId;
  const client = assertClient();
  const { data, error } = await client.rpc('mark_onboarding_welcomed');
  if (error) throw error;
  return { onboarding_welcomed_at: data };
}

/** @param {string} participantId */
export async function markOnboardingComplete(participantId) {
  void participantId;
  const client = assertClient();
  const { data, error } = await client.rpc('mark_onboarding_complete');
  if (error) throw error;
  return { onboarding_complete: data };
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
    .subscribe();
  return channel;
}
