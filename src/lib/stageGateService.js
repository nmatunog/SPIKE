/**
 * SPIKE Stage Gate Service v1 — validate, unlock, certificates, notifications, audit.
 */
import { deriveStageGateCeremony } from './stageGateCeremonyService.js';
import { getStageGateDefinition } from './stageGateCeremonyConstants.js';
import {
  isStageGateUnlocked,
  readStageGateUnlock,
  saveStageGateUnlock,
} from './stageGateCeremonyStorage.js';
import {
  applyStageUnlockToParticipant,
  dismissStageGateNotification,
  fetchCertificatesRemote,
  findCertificateByWeekLocal,
  listCertificatesLocal,
  queueStageGateNotification,
  readPendingNotification,
  saveCertificateLocal,
  unlockStageRemote,
  upsertCertificatesRemote,
} from './stageGateParticipantStorage.js';
import { getParticipantSquad } from './cohortFormationService.js';
import { isMockUserId } from './mockAuth.js';
import { resolveClosingWeekForPresentation } from './stageGateCeremonyConstants.js';
import { queuePortfolioStageGateCelebration } from './stageGatePortfolioCelebration.js';

/**
 * @typedef {{
 *   participantName: string,
 *   squadName: string,
 *   programName: string,
 *   completedDate: string,
 *   stageLabel: string,
 *   nextStageLabel: string,
 *   title: string,
 *   closingWeek: number,
 * }} StageGateCertificateDisplay
 */

/**
 * Sample certificate for coach preview — not saved or issued.
 * @param {number} closingWeek
 * @param {{ participantName?: string, squadName?: string }} [opts]
 * @returns {StageGateCertificateDisplay}
 */
export function buildSampleStageGateCertificate(closingWeek, opts = {}) {
  const gate = getStageGateDefinition(closingWeek);
  return {
    participantName: opts.participantName?.trim() || 'Sample Intern',
    squadName: opts.squadName?.trim() || 'Sample Squad',
    programName: 'SPIKE Venture Studio',
    completedDate: new Date().toISOString().slice(0, 10),
    stageLabel: gate.stageLabel,
    nextStageLabel: gate.nextStageLabel,
    title: gate.ceremonyTitle,
    closingWeek,
  };
}

/** @param {string | undefined} value */
function uuidLike(value) {
  const id = String(value ?? '').trim();
  if (/^[0-9a-f-]{36}$/i.test(id)) return id;
  return crypto.randomUUID?.() ?? `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * @param {Array<{ id: string, name: string, squad?: string }>} interns
 * @param {{ segment?: number, closingWeek?: number, role?: 'faculty' | 'mentor' }} opts
 */
export function validateStageCompletion(interns, opts = {}) {
  const model = deriveStageGateCeremony(interns, opts);
  const gate = model.gate;
  const ready =
    model.metrics.totalInterns > 0
    && model.metrics.totalSquads > 0
    && model.metrics.pitchesSubmittedPct >= 50;
  const week1CompletionPct = model.squads.length
    ? Math.round(
        model.squads.reduce((sum, s) => sum + (s.outputs?.avgOutputPct ?? 0), 0) / model.squads.length,
      )
    : 0;

  return {
    ready,
    alreadyUnlocked: model.unlocked,
    model,
    gate,
    metrics: {
      totalParticipants: model.metrics.totalInterns,
      totalSquads: model.metrics.totalSquads,
      weekCompletionPct: week1CompletionPct,
      pitchesSubmittedPct: model.metrics.pitchesSubmittedPct,
      allSquadsReady: model.metrics.allSquadsReady,
    },
    blockers: ready
      ? []
      : [
          model.metrics.totalSquads === 0 ? 'Assign squads before unlocking.' : null,
          model.metrics.pitchesSubmittedPct < 50
            ? 'Upload squad pitch decks to portfolio (Presentation category).'
            : null,
        ].filter(Boolean),
  };
}

/**
 * @param {Array<{ id: string, name: string, squad?: string }>} interns
 * @param {{ segment: number, closingWeek: number, staffId?: string, staffName?: string }} params
 */
export function generateCertificates(interns, params) {
  const { segment, closingWeek, staffId = '' } = params;
  const gate = getStageGateDefinition(closingWeek);
  const completedDate = new Date().toISOString().slice(0, 10);
  const programName = 'SPIKE Venture Studio';

  return interns.map((intern) => {
    const squadRecord = getParticipantSquad(intern.id);
    const certificate = {
      id: uuidLike(),
      participantId: intern.id,
      participantName: intern.name,
      segment,
      closingWeek,
      stage: gate.stageLabel,
      stageLabel: gate.stageLabel,
      title: gate.ceremonyTitle,
      completedDate,
      squadName: intern.squad ?? squadRecord?.name ?? '',
      programName,
      nextStageLabel: gate.nextStageLabel,
      createdBy: staffId,
      createdAt: new Date().toISOString(),
    };
    saveCertificateLocal(certificate);
    applyStageUnlockToParticipant(intern.id, closingWeek, completedDate);
    return certificate;
  });
}

/**
 * @param {Array<{ id: string, name: string }>} interns
 * @param {{ closingWeek: number, stageLabel: string, nextStageLabel: string, certificateIds: Record<string, string> }} params
 */
export function notifyParticipants(interns, params) {
  const { closingWeek, stageLabel, nextStageLabel, certificateIds = {} } = params;
  for (const intern of interns) {
    queueStageGateNotification(intern.id, {
      closingWeek,
      stageLabel,
      nextStageLabel,
      certificateId: certificateIds[intern.id] ?? '',
    });
  }
}

/**
 * @param {{ staffId?: string, staffName?: string, segment: number, closingWeek: number, participantCount: number, squadCount: number, stageLabel: string, nextStageLabel: string }} entry
 */
export function logStageHistory(entry) {
  const key = 'spike_stage_gate_history';
  let history = [];
  try {
    history = JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    history = [];
  }
  history.unshift({
    ...entry,
    unlockedAt: new Date().toISOString(),
  });
  try {
    localStorage.setItem(key, JSON.stringify(history.slice(0, 50)));
  } catch {
    /* quota */
  }
  return history[0];
}

/**
 * @param {Array<{ id: string, name: string, squad?: string }>} interns
 * @param {{ segment: number, closingWeek: number, staffId?: string, staffName?: string, force?: boolean }} params
 */
export async function unlockStage(interns, params) {
  const { segment, closingWeek, staffId = '', staffName = 'Coach', force = false } = params;
  const validation = validateStageCompletion(interns, { segment, closingWeek });
  if (validation.alreadyUnlocked) {
    return { ok: true, alreadyUnlocked: true, validation };
  }
  if (!validation.ready && !force) {
    return { ok: false, validation, error: validation.blockers[0] ?? 'Stage gate is not ready.' };
  }

  const gate = validation.gate;
  try {
    await unlockStageRemote(closingWeek, segment);
  } catch (err) {
    console.warn('[stageGate] remote unlock failed, using local:', err);
  }

  saveStageGateUnlock(segment, closingWeek, {
    unlockedBy: staffId,
    nextWeek: gate.nextWeek,
    stageLabel: gate.stageLabel,
    nextStageLabel: gate.nextStageLabel,
  });

  const certificates = generateCertificates(interns, { segment, closingWeek, staffId });
  const certificateIds = Object.fromEntries(certificates.map((c) => [c.participantId, c.id]));

  try {
    await upsertCertificatesRemote(certificates, staffId);
  } catch (err) {
    console.warn('[stageGate] certificate sync failed:', err);
  }

  notifyParticipants(interns, {
    closingWeek,
    stageLabel: gate.stageLabel,
    nextStageLabel: gate.nextStageLabel,
    certificateIds,
  });

  logStageHistory({
    staffId,
    staffName,
    segment,
    closingWeek,
    participantCount: interns.length,
    squadCount: validation.metrics.totalSquads,
    stageLabel: gate.stageLabel,
    nextStageLabel: gate.nextStageLabel,
  });

  return {
    ok: true,
    validation,
    nextWeek: gate.nextWeek,
    certificates,
  };
}

/** @param {string} participantId */
export async function listParticipantCertificates(participantId) {
  const local = listCertificatesLocal(participantId);
  if (local.length) return local;
  return fetchCertificatesRemote(participantId);
}

/** @param {string} participantId */
export function readParticipantStageNotification(participantId) {
  return readPendingNotification(participantId);
}

export { dismissStageGateNotification, findCertificateByWeekLocal, isStageGateUnlocked, readStageGateUnlock };

/**
 * Issue a stage gate certificate when a squad pitch deck is uploaded to portfolio.
 * Pitch deck upload counts as successful pitch — no FEC / UVP / coach evaluation required.
 * @param {string} participantId
 * @param {{ week?: number | null, segment?: number, participantName?: string, squadName?: string }} [opts]
 */
export async function issueCertificateForPitchDeckUpload(participantId, opts = {}) {
  if (!participantId || String(participantId).startsWith('mock-') || isMockUserId(participantId)) {
    return null;
  }

  const closingWeek = resolveClosingWeekForPresentation(opts.week);
  const segment = opts.segment ?? 1;

  const existing = findCertificateByWeekLocal(participantId, closingWeek);
  if (existing) return existing;

  const gate = getStageGateDefinition(closingWeek);
  const squadRecord = getParticipantSquad(participantId);
  const completedDate = new Date().toISOString().slice(0, 10);

  const certificate = {
    id: uuidLike(),
    participantId,
    participantName: opts.participantName ?? '',
    segment,
    closingWeek,
    stage: gate.stageLabel,
    stageLabel: gate.stageLabel,
    title: gate.ceremonyTitle,
    completedDate,
    squadName: opts.squadName ?? squadRecord?.name ?? '',
    programName: 'SPIKE Venture Studio',
    nextStageLabel: gate.nextStageLabel,
    createdBy: '',
    createdAt: new Date().toISOString(),
  };

  saveCertificateLocal(certificate);
  applyStageUnlockToParticipant(participantId, closingWeek, completedDate);
  queuePortfolioStageGateCelebration(participantId, closingWeek);

  try {
    await upsertCertificatesRemote([certificate], '');
  } catch (err) {
    console.warn('[stageGate] pitch certificate sync failed:', err);
  }

  queueStageGateNotification(participantId, {
    closingWeek,
    stageLabel: gate.stageLabel,
    nextStageLabel: gate.nextStageLabel,
    certificateId: certificate.id,
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('spike-stage-gate-certificate-issued', {
        detail: { participantId, closingWeek, certificateId: certificate.id },
      }),
    );
  }

  return certificate;
}

/**
 * Backfill certificates for any presentation deliverables already in portfolio.
 * @param {string} participantId
 */
export async function ensurePitchCertificatesFromPortfolio(participantId) {
  const { listPortfolioDeliverablesLocal } = await import('./portfolioDeliverableService.js');
  const presentations = listPortfolioDeliverablesLocal(participantId).filter(
    (item) => item.category === 'presentation',
  );
  if (!presentations.length) return [];

  const issued = [];
  const seenWeeks = new Set();
  for (const item of presentations) {
    const closingWeek = resolveClosingWeekForPresentation(item.week);
    if (seenWeeks.has(closingWeek)) continue;
    seenWeeks.add(closingWeek);
    const cert = await issueCertificateForPitchDeckUpload(participantId, { week: item.week });
    if (cert) issued.push(cert);
  }
  return issued;
}
