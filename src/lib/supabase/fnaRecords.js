import { isSupabaseConfigured, supabase } from '../../supabaseClient.js';

/**
 * @param {string} userId
 * @param {object} record
 * @param {Array<{ title: string, description: string, priority: number, sortOrder: number }>} recommendations
 */
export async function upsertFnaRecord(userId, record, recommendations = []) {
  if (!isSupabaseConfigured || !supabase || !userId) return null;

  const row = {
    id: record.id,
    user_id: userId,
    client_name: record.clientName,
    client_age: record.clientAge,
    dependents: record.dependents ?? 0,
    income: record.income,
    assets: record.assets,
    liabilities: record.liabilities,
    protection_gap: record.protectionGap,
    retirement_gap: record.retirementGap,
    status: record.status,
    notes: record.notes ?? '',
    updated_at: new Date().toISOString(),
  };

  const { data: fnaRow, error } = await supabase
    .from('financial_needs_analyses')
    .upsert(row, { onConflict: 'id' })
    .select('id')
    .single();

  if (error || !fnaRow?.id) {
    console.warn('[fnaRecords] upsert failed:', error?.message);
    return null;
  }

  if (recommendations.length > 0) {
    await supabase.from('fna_recommendations').delete().eq('fna_id', fnaRow.id);
    const { error: recErr } = await supabase.from('fna_recommendations').insert(
      recommendations.map((r, idx) => ({
        fna_id: fnaRow.id,
        title: r.title,
        description: r.description ?? '',
        priority: r.priority ?? 1,
        sort_order: r.sortOrder ?? idx,
      })),
    );
    if (recErr) console.warn('[fnaRecords] recommendations failed:', recErr.message);
  }

  return fnaRow.id;
}

/** @param {string} userId */
export async function fetchFnaRecords(userId) {
  if (!isSupabaseConfigured || !supabase || !userId) return null;

  const { data, error } = await supabase
    .from('financial_needs_analyses')
    .select('*, fna_recommendations(*)')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.warn('[fnaRecords] fetch failed:', error.message);
    return null;
  }

  return data ?? [];
}
