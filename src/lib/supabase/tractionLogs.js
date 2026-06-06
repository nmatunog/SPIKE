import { supabase } from '../../supabaseClient.js';
import { segmentFromHours } from '../segment.js';

function mapLogRow(row, profile) {
  return {
    id: row.id,
    userId: row.user_id,
    task: row.task,
    hours: row.hours,
    status: row.status,
    createdAt: row.created_at,
    ...(profile
      ? {
          user: {
            id: profile.id ?? row.user_id,
            name: profile.name,
            email: profile.email,
          },
        }
      : {}),
  };
}

export async function createTractionLog({ userId, task, hours }) {
  const { data, error } = await supabase
    .from('traction_logs')
    .insert({
      user_id: userId,
      task,
      hours,
      status: 'PENDING',
    })
    .select()
    .single();
  if (error) throw error;
  return mapLogRow(data);
}

export async function fetchMyTractionLogs(userId) {
  const { data, error } = await supabase
    .from('traction_logs')
    .select('id, user_id, task, hours, status, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data || []).map((row) => mapLogRow(row));
}

export async function fetchPendingTractionLogs() {
  const { data, error } = await supabase
    .from('traction_logs')
    .select('id, user_id, task, hours, status, created_at, profiles(id, name, email)')
    .eq('status', 'PENDING')
    .order('created_at', { ascending: true });
  if (error) throw error;

  return (data || []).map((row) => {
    const profile = row.profiles;
    return mapLogRow(row, profile);
  });
}

export async function reviewTractionLog(logId, action) {
  const { data: log, error: logErr } = await supabase
    .from('traction_logs')
    .select('id, user_id, task, hours, status')
    .eq('id', logId)
    .maybeSingle();
  if (logErr) throw logErr;
  if (!log || log.status !== 'PENDING') {
    throw new Error('Pending log not found.');
  }

  if (action === 'reject') {
    const { data, error } = await supabase
      .from('traction_logs')
      .update({ status: 'REJECTED' })
      .eq('id', logId)
      .select()
      .single();
    if (error) throw error;
    return mapLogRow(data);
  }

  if (action === 'approve') {
    const { data: progress, error: progErr } = await supabase
      .from('intern_progress')
      .select('user_id, hours, segment')
      .eq('user_id', log.user_id)
      .maybeSingle();
    if (progErr) throw progErr;
    if (!progress) throw new Error('Intern has no progress record.');

    const nextHours = Math.min(progress.hours + log.hours, 600);
    const nextSegment = segmentFromHours(nextHours);

    const { error: progressErr } = await supabase
      .from('intern_progress')
      .update({ hours: nextHours, segment: nextSegment })
      .eq('user_id', log.user_id);
    if (progressErr) throw progressErr;

    const { data: updated, error: updateErr } = await supabase
      .from('traction_logs')
      .update({ status: 'APPROVED' })
      .eq('id', logId)
      .select()
      .single();
    if (updateErr) throw updateErr;

    return {
      ok: true,
      hoursAdded: log.hours,
      newTotalHours: nextHours,
      segment: nextSegment,
      log: mapLogRow(updated),
    };
  }

  throw new Error('Invalid review action.');
}
