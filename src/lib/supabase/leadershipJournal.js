import { supabase } from '../../supabaseClient.js';

/**
 * @param {string} userId
 * @param {{ mentorId?: string, topic?: string, notes: string, themes?: string, actionPlan?: string, sourceId?: string }} input
 */
export async function insertLeadershipJournalEntry(userId, input) {
  if (!supabase || !userId) return null;
  const { data, error } = await supabase
    .from('leadership_journal')
    .insert({
      user_id: userId,
      mentor_id: input.mentorId ?? null,
      topic: input.topic ?? 'Coaching session',
      notes: input.notes,
      themes: input.themes ?? null,
      action_plan: input.actionPlan ?? null,
      source_id: input.sourceId ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** @param {string} userId */
export async function fetchLeadershipJournal(userId) {
  if (!supabase || !userId) return [];
  const { data, error } = await supabase
    .from('leadership_journal')
    .select('id, mentor_id, topic, notes, themes, action_plan, source_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}
