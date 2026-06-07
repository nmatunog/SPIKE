import { isSupabaseConfigured, supabase } from '../../supabaseClient.js';

/**
 * @param {string} userId
 * @param {import('../clientGrowthService.js').ClientGrowthFunnel} funnel
 */
export async function upsertClientGrowthFunnel(userId, funnel) {
  if (!isSupabaseConfigured || !supabase || !userId) return null;

  const { error } = await supabase.from('client_growth').upsert(
    {
      user_id: userId,
      prospects: funnel.prospects,
      contacts: funnel.contacts,
      appointments: funnel.appointments,
      fnas: funnel.fnas,
      proposals: funnel.proposals,
      applications: funnel.applications,
      issued_cases: funnel.issuedCases,
      referrals: funnel.referrals,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );

  if (error) {
    console.warn('[clientGrowth] upsert failed:', error.message);
    return null;
  }

  return true;
}

/** @param {string} userId */
export async function fetchClientGrowthFunnel(userId) {
  if (!isSupabaseConfigured || !supabase || !userId) return null;

  const { data, error } = await supabase
    .from('client_growth')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.warn('[clientGrowth] fetch failed:', error.message);
    return null;
  }

  return data;
}
