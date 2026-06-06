import { isSupabaseConfigured, supabase } from '../../supabaseClient.js';

/**
 * @typedef {import('../../types/playbook').DayContribution} DayContribution
 */

/**
 * @returns {Promise<DayContribution[] | null>}
 */
export async function fetchAllDayContributions() {
  if (!isSupabaseConfigured || !supabase) return null;

  try {
    const { data, error } = await supabase
      .from('day_contributions')
      .select(
        'day_slug, contributes_to_portfolio, contributes_to_business_plan, contributes_to_competencies',
      );

    if (error || !data?.length) return null;

    return data.map((row) => ({
      dayId: row.day_slug,
      contributesToPortfolio: row.contributes_to_portfolio ?? [],
      contributesToBusinessPlan: row.contributes_to_business_plan ?? [],
      contributesToCompetencies: row.contributes_to_competencies ?? [],
    }));
  } catch {
    return null;
  }
}

/**
 * Returns true when Supabase has at least one curriculum segment row (future import path).
 * @returns {Promise<boolean>}
 */
export async function hasSupabaseCurriculumTree() {
  if (!isSupabaseConfigured || !supabase) return false;

  try {
    const { count, error } = await supabase
      .from('segments')
      .select('id', { count: 'exact', head: true });
    return !error && (count ?? 0) > 0;
  } catch {
    return false;
  }
}
