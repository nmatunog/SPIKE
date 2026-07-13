/**
 * Participant stage progress, certificates, and unlock notifications (local + Supabase sync).
 */
import { supabase, isSupabaseConfigured } from '../supabaseClient.js';
import { UNLOCK_WEEK2, UNLOCK_WEEK3, UNLOCK_WEEK4, UNLOCK_WEEK5 } from './programUnlocks.js';

const PROGRESS_KEY = 'spike_stage_progress';
const CERTS_KEY = 'spike_stage_gate_certificates';
const NOTIFICATIONS_KEY = 'spike_stage_gate_notifications';

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('[stageGateParticipant]', err instanceof Error ? err.message : err);
  }
}

/** @typedef {'locked' | 'active' | 'completed'} StageStatus */

/** @returns {Record<string, { status: StageStatus, completedDate?: string | null }>} */
export function readParticipantStageProgress(participantId) {
  const all = readJson(PROGRESS_KEY, {});
  let progress = { ...defaultStageProgress(), ...(all[participantId] ?? {}) };
  if (UNLOCK_WEEK2 && progress.discover?.status !== 'completed') {
    progress = applyStageUnlockToParticipant(participantId, 1, new Date().toISOString().slice(0, 10));
  }
  if (UNLOCK_WEEK5 && progress.pitch?.status === 'locked') {
    const today = new Date().toISOString().slice(0, 10);
    if (progress.build?.status !== 'completed') {
      progress = applyStageUnlockToParticipant(participantId, 4, today);
    }
  } else if (UNLOCK_WEEK4 && progress.build?.status === 'locked') {
    const today = new Date().toISOString().slice(0, 10);
    if (progress.validate?.status !== 'completed') {
      progress = applyStageUnlockToParticipant(participantId, 2, today);
    }
  } else if (UNLOCK_WEEK3 && progress.validate?.status === 'locked' && progress.discover?.status === 'completed') {
    progress = applyStageUnlockToParticipant(participantId, 2, new Date().toISOString().slice(0, 10));
  }
  return progress;
}

function defaultStageProgress() {
  return {
    discover: { status: 'active', completedDate: null },
    validate: { status: 'locked', completedDate: null },
    build: { status: 'locked', completedDate: null },
    pitch: { status: 'locked', completedDate: null },
  };
}

/**
 * @param {string} participantId
 * @param {number} closingWeek
 * @param {string} completedDate ISO date
 */
export function applyStageUnlockToParticipant(participantId, closingWeek, completedDate) {
  const all = readJson(PROGRESS_KEY, {});
  const progress = { ...defaultStageProgress(), ...(all[participantId] ?? {}) };
  const stageMap = [
    { key: 'discover', week: 1, next: 'validate' },
    { key: 'validate', week: 2, next: 'build' },
    { key: 'build', week: 4, next: 'pitch' },
  ];
  const match = stageMap.find((s) => s.week === closingWeek);
  if (match) {
    progress[match.key] = { status: 'completed', completedDate };
    if (progress[match.next]) {
      progress[match.next] = { status: 'active', completedDate: null };
    }
  }
  all[participantId] = progress;
  writeJson(PROGRESS_KEY, all);
  return progress;
}

/** @param {string} participantId */
export function getActiveProgramStageLabel(participantId) {
  const progress = readParticipantStageProgress(participantId);
  if (progress.pitch?.status === 'active') return 'PITCH';
  if (progress.build?.status === 'active') return 'BUILD';
  if (progress.validate?.status === 'active') return 'VALIDATE';
  if (progress.discover?.status === 'completed') return 'VALIDATE';
  return 'DISCOVER';
}

/**
 * @param {object} certificate
 */
export function saveCertificateLocal(certificate) {
  const all = readJson(CERTS_KEY, { byParticipant: {} });
  if (!all.byParticipant) all.byParticipant = {};
  const list = all.byParticipant[certificate.participantId] ?? [];
  const idx = list.findIndex(
    (c) => c.closingWeek === certificate.closingWeek && c.segment === certificate.segment,
  );
  if (idx >= 0) list[idx] = certificate;
  else list.push(certificate);
  all.byParticipant[certificate.participantId] = list.sort((a, b) => a.closingWeek - b.closingWeek);
  writeJson(CERTS_KEY, all);
  return certificate;
}

/** @param {string} participantId */
export function listCertificatesLocal(participantId) {
  const all = readJson(CERTS_KEY, { byParticipant: {} });
  return all.byParticipant?.[participantId] ?? [];
}

/** @param {string} participantId @param {string} certificateId */
export function findCertificateLocal(participantId, certificateId) {
  return listCertificatesLocal(participantId).find((c) => c.id === certificateId) ?? null;
}

/** @param {string} participantId @param {number} closingWeek */
export function findCertificateByWeekLocal(participantId, closingWeek) {
  return listCertificatesLocal(participantId).find((c) => c.closingWeek === closingWeek) ?? null;
}

/**
 * @param {string} participantId
 * @param {{ closingWeek: number, stageLabel: string, nextStageLabel: string, certificateId: string }} payload
 */
export function queueStageGateNotification(participantId, payload) {
  const all = readJson(NOTIFICATIONS_KEY, { pending: {} });
  if (!all.pending) all.pending = {};
  all.pending[participantId] = {
    ...payload,
    createdAt: new Date().toISOString(),
    dismissed: false,
  };
  writeJson(NOTIFICATIONS_KEY, all);
}

/** @param {string} participantId */
export function readPendingNotification(participantId) {
  const all = readJson(NOTIFICATIONS_KEY, { pending: {} });
  const note = all.pending?.[participantId];
  if (!note || note.dismissed) return null;
  return note;
}

/** @param {string} participantId */
export function dismissStageGateNotification(participantId) {
  const all = readJson(NOTIFICATIONS_KEY, { pending: {} });
  if (all.pending?.[participantId]) {
    all.pending[participantId].dismissed = true;
    writeJson(NOTIFICATIONS_KEY, all);
  }
}

/** @param {string} participantId */
export async function fetchCertificatesRemote(participantId) {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from('stage_gate_certificates')
    .select('*')
    .eq('participant_id', participantId)
    .order('closing_week', { ascending: true });
  if (error) return [];
  return (data ?? []).map(normalizeRemoteCertificate);
}

/** @param {object} row */
function normalizeRemoteCertificate(row) {
  return {
    id: row.id,
    participantId: row.participant_id,
    segment: row.segment ?? 1,
    closingWeek: row.closing_week,
    stage: row.stage,
    stageLabel: row.stage_label,
    title: row.title,
    completedDate: row.completed_date,
    squadName: row.squad_name ?? '',
    programName: row.program_name ?? 'SPIKE Venture Studio',
    participantName: row.participant_name ?? '',
    createdAt: row.created_at,
  };
}

/**
 * @param {Array<object>} certificates
 * @param {string} staffId
 */
export async function upsertCertificatesRemote(certificates, staffId) {
  if (!isSupabaseConfigured || !supabase || !certificates.length) return { ok: true, remote: false };
  const rows = certificates.map((c) => ({
    id: c.id,
    participant_id: c.participantId,
    segment: c.segment ?? 1,
    closing_week: c.closingWeek,
    stage: c.stage,
    stage_label: c.stageLabel,
    title: c.title,
    completed_date: c.completedDate,
    squad_name: c.squadName ?? null,
    program_name: c.programName ?? 'SPIKE Venture Studio',
    created_by: staffId || null,
  }));
  const { error } = await supabase.from('stage_gate_certificates').upsert(rows, {
    onConflict: 'participant_id,segment,closing_week',
  });
  if (error) throw new Error(error.message);
  return { ok: true, remote: true };
}

/** @param {number} closingWeek @param {number} [segment] */
export async function unlockStageRemote(closingWeek, segment = 1) {
  if (!isSupabaseConfigured || !supabase) return { ok: false, remote: false };
  const { data, error } = await supabase.rpc('unlock_cohort_stage', {
    p_closing_week: closingWeek,
    p_segment: segment,
  });
  if (error) throw new Error(error.message);
  return { ok: true, remote: true, data };
}
