import { isSupabaseConfigured, supabase } from '../../supabaseClient.js';

/** @param {unknown} row */
function mapFacultyRow(row) {
  return {
    id: row.id,
    segment: row.segment,
    week: row.week,
    day: row.day,
    theme: row.theme,
    learning_objectives: row.learning_objectives ?? [],
    key_concepts: row.key_concepts ?? [],
    speaker_notes: row.speaker_notes ?? '',
    discussion_questions: row.discussion_questions ?? [],
    activities: row.activities ?? [],
    worksheets: row.worksheets ?? [],
    assessments: row.assessments ?? [],
    rubrics: row.rubrics ?? [],
    expected_outputs: row.expected_outputs ?? [],
    status: row.status ?? 'published',
  };
}

/** @param {unknown} row */
function mapMentorRow(row) {
  return {
    id: row.id,
    segment: row.segment,
    week: row.week,
    day: row.day,
    coaching_objective: row.coaching_objective ?? '',
    discussion_questions: row.discussion_questions ?? [],
    reflection_prompts: row.reflection_prompts ?? [],
    warning_signs: row.warning_signs ?? [],
    coaching_tips: row.coaching_tips ?? [],
    expected_outcomes: row.expected_outcomes ?? [],
    status: row.status ?? 'published',
  };
}

/** @param {number} segment @param {number} week */
export async function fetchFacultyDayTemplates(segment, week) {
  if (!isSupabaseConfigured || !supabase) return null;

  const { data, error } = await supabase
    .from('faculty_day_templates')
    .select('*')
    .eq('segment', segment)
    .eq('week', week)
    .order('day', { ascending: true });

  if (error) {
    console.warn('[facultyMentorFramework] faculty fetch failed:', error.message);
    return null;
  }

  return (data ?? []).map(mapFacultyRow);
}

/** @param {number} segment @param {number} week @param {number} day */
export async function fetchFacultyDayTemplate(segment, week, day) {
  if (!isSupabaseConfigured || !supabase) return null;

  const { data, error } = await supabase
    .from('faculty_day_templates')
    .select('*')
    .eq('segment', segment)
    .eq('week', week)
    .eq('day', day)
    .maybeSingle();

  if (error) {
    console.warn('[facultyMentorFramework] faculty day fetch failed:', error.message);
    return null;
  }

  return data ? mapFacultyRow(data) : null;
}

/** @param {number} segment @param {number} week */
export async function fetchMentorDayGuides(segment, week) {
  if (!isSupabaseConfigured || !supabase) return null;

  const { data, error } = await supabase
    .from('mentor_day_guides')
    .select('*')
    .eq('segment', segment)
    .eq('week', week)
    .order('day', { ascending: true });

  if (error) {
    console.warn('[facultyMentorFramework] mentor fetch failed:', error.message);
    return null;
  }

  return (data ?? []).map(mapMentorRow);
}

/** @param {number} segment @param {number} week @param {number} day */
export async function fetchMentorDayGuide(segment, week, day) {
  if (!isSupabaseConfigured || !supabase) return null;

  const { data, error } = await supabase
    .from('mentor_day_guides')
    .select('*')
    .eq('segment', segment)
    .eq('week', week)
    .eq('day', day)
    .maybeSingle();

  if (error) {
    console.warn('[facultyMentorFramework] mentor day fetch failed:', error.message);
    return null;
  }

  return data ? mapMentorRow(data) : null;
}

/** @param {'faculty' | 'mentor'} kind */
export async function fetchAllFrameworkDays(kind) {
  const table = kind === 'faculty' ? 'faculty_day_templates' : 'mentor_day_guides';
  if (!isSupabaseConfigured || !supabase) return null;

  const { data, error } = await supabase.from(table).select('*').order('segment').order('week').order('day');

  if (error) {
    console.warn('[facultyMentorFramework] list failed:', error.message);
    return null;
  }

  return kind === 'faculty' ? (data ?? []).map(mapFacultyRow) : (data ?? []).map(mapMentorRow);
}
