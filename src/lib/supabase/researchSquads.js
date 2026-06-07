import { isSupabaseConfigured, supabase } from '../../supabaseClient.js';

/** @returns {Promise<Array<{ id: string, name: string, market_segment: string, cohort_id: number | null }>>} */
export async function fetchResearchSquads() {
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from('research_squads')
    .select('id, name, market_segment, cohort_id')
    .order('name');

  if (error) {
    console.warn('[researchSquads] fetch failed:', error.message);
    return [];
  }

  return data ?? [];
}

/** @param {string} userId */
export async function fetchSquadMembershipsForUser(userId) {
  if (!isSupabaseConfigured || !supabase || !userId) return [];

  const { data, error } = await supabase
    .from('research_squad_members')
    .select('squad_id, research_squads(id, name, market_segment, cohort_id)')
    .eq('user_id', userId);

  if (error) {
    console.warn('[researchSquads] membership fetch failed:', error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    squadId: row.squad_id,
    squad: row.research_squads,
  }));
}

/** @param {string} squadId */
export async function fetchResearchProjectsForSquad(squadId) {
  if (!isSupabaseConfigured || !supabase || !squadId) return [];

  const { data, error } = await supabase
    .from('research_projects')
    .select('id, squad_id, title, hypothesis, status')
    .eq('squad_id', squadId)
    .order('created_at');

  if (error) {
    console.warn('[researchSquads] projects fetch failed:', error.message);
    return [];
  }

  return data ?? [];
}
