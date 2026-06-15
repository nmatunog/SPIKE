import { supabase } from '../../supabaseClient.js';
import { segmentFromHours } from '../segment.js';
import {
  fetchFormationSquadLabels,
  reconcileFormationSquadLabels,
} from './cohortOnboarding.js';

/**
 * @param {object} profile
 * @param {object | undefined} progress
 * @param {string | undefined} formationSquad
 */
function mapInternRow(profile, progress, formationSquad) {
  const squad = formationSquad?.trim() || progress?.squad?.trim() || null;
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role,
    segment: progress?.segment ?? 1,
    hours: progress?.hours ?? 0,
    licensed: progress?.licensed ?? false,
    squad,
    university: progress?.university ?? null,
  };
}

export async function fetchInterns() {
  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('id, name, email, role')
    .eq('role', 'INTERN')
    .order('name');
  if (profErr) throw profErr;

  const list = profiles || [];
  const ids = list.map((p) => p.id);
  let progressByUser = {};
  let formationByUser = {};

  if (ids.length > 0) {
    const [{ data: progRows, error: progErr }, formationLabels] = await Promise.all([
      supabase
        .from('intern_progress')
        .select('user_id, segment, hours, licensed, squad, university')
        .in('user_id', ids),
      fetchFormationSquadLabels(ids).catch(() => ({})),
    ]);
    if (progErr) throw progErr;
    progressByUser = Object.fromEntries((progRows || []).map((r) => [r.user_id, r]));
    formationByUser = formationLabels;

    const needsReconcile = ids.some((id) => {
      const formation = formationByUser[id]?.trim();
      const cached = progressByUser[id]?.squad?.trim();
      return formation && formation !== cached;
    });
    if (needsReconcile) {
      const reconciled = await reconcileFormationSquadLabels(ids).catch(() => formationByUser);
      formationByUser = { ...formationByUser, ...reconciled };
    }
  }

  return list.map((row) =>
    mapInternRow(row, progressByUser[row.id], formationByUser[row.id]),
  );
}

/**
 * @param {string} userId — profiles.id (uuid)
 * @param {{ segment?: number, hours?: number, hoursAdd?: number, licensed?: boolean, squad?: string|null, university?: string|null }} payload
 */
export async function updateInternProgress(userId, payload) {
  const { data: existing, error: fetchErr } = await supabase
    .from('intern_progress')
    .select('user_id, segment, hours, licensed, squad, university')
    .eq('user_id', userId)
    .maybeSingle();
  if (fetchErr) throw fetchErr;
  if (!existing) throw new Error('Intern progress record not found.');

  let nextHours = existing.hours;
  let nextSegment = existing.segment;

  if (payload.hoursAdd != null) {
    nextHours = Math.min(existing.hours + payload.hoursAdd, 600);
    nextSegment = segmentFromHours(nextHours);
  } else if (payload.hours != null) {
    nextHours = payload.hours;
    nextSegment = payload.segment ?? segmentFromHours(nextHours);
  } else if (payload.segment != null) {
    nextSegment = payload.segment;
  }

  const patch = {
    user_id: userId,
    hours: nextHours,
    segment: nextSegment,
    ...(payload.licensed !== undefined ? { licensed: payload.licensed } : {}),
    ...(payload.squad !== undefined ? { squad: payload.squad } : {}),
    ...(payload.university !== undefined ? { university: payload.university } : {}),
  };

  const { data, error } = await supabase
    .from('intern_progress')
    .upsert(patch, { onConflict: 'user_id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}
