import { isSupabaseConfigured, supabase } from '../../supabaseClient.js';
import { isMockUserId } from '../mockAuth.js';
import { PROGRAM_SLUGS } from '../programs/constants.js';

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
    .select('id, name, motto, cohort_id, cohorts!inner(program_slug)')
    .eq('id', membership.squad_id)
    .eq('cohorts.program_slug', PROGRAM_SLUGS.RA_SPIKE)
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
    .select('start_date, starts_on, program_slug')
    .eq('id', cohortId)
    .eq('program_slug', PROGRAM_SLUGS.RA_SPIKE)
    .maybeSingle();
  if (error || !data) return null;
  return data.start_date?.slice?.(0, 10) ?? data.starts_on?.slice?.(0, 10) ?? null;
}
