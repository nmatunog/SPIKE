import { isSupabaseConfigured, supabase } from '../../supabaseClient.js';
import { isMockUserId } from '../mockAuth.js';

/**
 * @param {string} participantId
 * @returns {Promise<{ squadName: string | null, memberCount: number, memberIds: string[] } | null>}
 */
export async function fetchRaSpikeSquadSummary(participantId) {
  if (!participantId || isMockUserId(participantId) || !isSupabaseConfigured || !supabase) {
    return null;
  }

  const { data: membership, error: memErr } = await supabase
    .from('formation_squad_members')
    .select('squad_id')
    .eq('participant_id', participantId)
    .maybeSingle();
  if (memErr || !membership?.squad_id) return null;

  const { data: squad, error: squadErr } = await supabase
    .from('formation_squads')
    .select('id, name, motto')
    .eq('id', membership.squad_id)
    .maybeSingle();
  if (squadErr || !squad) return null;

  const { data: members, error: membersErr } = await supabase
    .from('formation_squad_members')
    .select('participant_id, role')
    .eq('squad_id', squad.id);
  if (membersErr) return null;

  const memberIds = (members ?? []).map((m) => m.participant_id).filter(Boolean);

  return {
    squadId: squad.id,
    squadName: squad.name ?? null,
    motto: squad.motto ?? null,
    memberCount: memberIds.length,
    memberIds,
    isSelf: participantId,
  };
}

/**
 * @param {number | null | undefined} cohortId
 * @returns {Promise<string | null>}
 */
export async function fetchCohortStartDate(cohortId) {
  if (!cohortId || !isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase
    .from('cohorts')
    .select('start_date, starts_on')
    .eq('id', cohortId)
    .maybeSingle();
  if (error || !data) return null;
  return data.start_date?.slice?.(0, 10) ?? data.starts_on?.slice?.(0, 10) ?? null;
}
