/**
 * PCTC certificate uploads — Week 2 Day 3 (2 required certificates).
 */
import { loadWeek2Discovery, saveWeek2Discovery } from './week2DiscoveryStorage.js';
import { syncWeek2DiscoveryToCloud } from './week2DiscoverySync.js';
import { syncWeek2PortfolioArtifacts } from './week2PortfolioSync.js';
import {
  deletePortfolioDeliverable,
  listPortfolioDeliverables,
  listPortfolioDeliverablesLocal,
  openPortfolioDeliverable,
  uploadPortfolioDeliverable,
} from '../portfolioDeliverableService.js';

/** @type {Array<{ slot: 1 | 2, label: string, stateKey: 'pctcCertificate1Id' | 'pctcCertificate2Id' }>} */
export const PCTC_CERTIFICATE_SLOTS = [
  { slot: 1, label: 'PCTC Certificate 1', stateKey: 'pctcCertificate1Id' },
  { slot: 2, label: 'PCTC Certificate 2', stateKey: 'pctcCertificate2Id' },
];

/** @param {import('./week2DiscoveryTypes.js').Week2DiscoveryState} state */
export function hasAnyPctcCertificate(state) {
  return Boolean(state.pctcCertificate1Id || state.pctcCertificate2Id);
}

/** @param {import('./week2DiscoveryTypes.js').Week2DiscoveryState} state */
export function pctcCertificatesComplete(state) {
  return Boolean(state.pctcCertificate1Id && state.pctcCertificate2Id);
}

/** @param {import('./week2DiscoveryTypes.js').Week2DiscoveryState} state */
export function pctcLegacyTextComplete(state) {
  return Boolean(state.professionalReadinessAt)
    && String(state.readinessEvidenceNote ?? '').trim().length > 10
    && !hasAnyPctcCertificate(state);
}

/** @param {import('./week2DiscoveryTypes.js').Week2DiscoveryState} state */
export function isPctcMissionComplete(state) {
  return hasAnyPctcCertificate(state) || pctcLegacyTextComplete(state);
}

/** @param {string} participantId */
function refreshPctcCompletion(participantId) {
  const state = loadWeek2Discovery(participantId);
  const now = new Date().toISOString();

  if (hasAnyPctcCertificate(state)) {
    if (!state.professionalReadinessAt) {
      const next = saveWeek2Discovery(participantId, {
        professionalReadinessAt: now,
        readinessBadgeEarnedAt: now,
      });
      syncWeek2PortfolioArtifacts(participantId);
      void syncWeek2DiscoveryToCloud(participantId, next).catch(() => {});
      return next;
    }
    syncWeek2PortfolioArtifacts(participantId);
    return state;
  }

  const text = String(state.readinessEvidenceNote ?? '').trim();
  if (state.professionalReadinessAt && text.length <= 10) {
    const next = saveWeek2Discovery(participantId, {
      professionalReadinessAt: null,
      readinessBadgeEarnedAt: null,
    });
    void syncWeek2DiscoveryToCloud(participantId, next).catch(() => {});
    return next;
  }

  return state;
}

/** @param {string} participantId */
export async function getPctcCertificateStatus(participantId) {
  const state = loadWeek2Discovery(participantId);
  const deliverables = await listPortfolioDeliverables(participantId);
  const byId = Object.fromEntries(deliverables.map((d) => [d.id, d]));

  const slots = PCTC_CERTIFICATE_SLOTS.map((def) => {
    const deliverableId = state[def.stateKey] ?? '';
    const deliverable = deliverableId ? byId[deliverableId] ?? null : null;
    return {
      ...def,
      deliverableId,
      uploaded: Boolean(deliverableId && deliverable),
      deliverable,
    };
  });

  return {
    slots,
    uploadedCount: slots.filter((s) => s.uploaded).length,
    anyUploaded: slots.some((s) => s.uploaded),
    bothUploaded: slots.every((s) => s.uploaded),
    complete: isPctcMissionComplete(state),
  };
}

/**
 * @param {string} participantId
 * @param {1 | 2} slot
 * @param {File} file
 */
export async function uploadPctcCertificate(participantId, slot, file) {
  const def = PCTC_CERTIFICATE_SLOTS.find((s) => s.slot === slot);
  if (!def) throw new Error('Invalid certificate slot.');

  const state = loadWeek2Discovery(participantId);
  const oldId = state[def.stateKey];
  if (oldId) {
    try {
      await deletePortfolioDeliverable(participantId, oldId);
    } catch {
      /* replace even if delete fails */
    }
  }

  const deliverable = await uploadPortfolioDeliverable(participantId, file, {
    title: def.label,
    category: 'worksheet',
    notes: 'AIA Pre-Contract Training Course (PCTC) completion certificate',
    week: 2,
    day: 3,
  });

  saveWeek2Discovery(participantId, { [def.stateKey]: deliverable.id });
  refreshPctcCompletion(participantId);
  return deliverable;
}

/** @param {string} participantId @param {1 | 2} slot */
export async function removePctcCertificate(participantId, slot) {
  const def = PCTC_CERTIFICATE_SLOTS.find((s) => s.slot === slot);
  if (!def) return;

  const state = loadWeek2Discovery(participantId);
  const id = state[def.stateKey];
  if (id) {
    try {
      await deletePortfolioDeliverable(participantId, id);
    } catch {
      /* continue */
    }
  }
  saveWeek2Discovery(participantId, { [def.stateKey]: '' });
  refreshPctcCompletion(participantId);
}

/** @param {import('../portfolioDeliverableService.js').PortfolioDeliverable} deliverable */
export function openPctcCertificate(deliverable) {
  return openPortfolioDeliverable(deliverable);
}

/** @param {string} participantId */
export function getMemberPctcCertificateSummary(participantId) {
  const state = loadWeek2Discovery(participantId);
  const deliverables = listPortfolioDeliverablesLocal(participantId);
  const byId = Object.fromEntries(deliverables.map((d) => [d.id, d]));

  return PCTC_CERTIFICATE_SLOTS.map((def) => {
    const id = state[def.stateKey] ?? '';
    return {
      slot: def.slot,
      label: def.label,
      uploaded: Boolean(id && byId[id]),
      deliverable: id ? byId[id] ?? null : null,
    };
  });
}

/** @param {string[]} memberIds */
export function deriveSquadPctcCertificateMetrics(memberIds) {
  const ids = memberIds.filter(Boolean);
  if (!ids.length) return { cert1Pct: 0, cert2Pct: 0, anyPct: 0, bothPct: 0, members: [] };

  const members = ids.map((id) => {
    const slots = getMemberPctcCertificateSummary(id);
    const any = slots.some((s) => s.uploaded);
    return {
      participantId: id,
      cert1: slots[0]?.uploaded ?? false,
      cert2: slots[1]?.uploaded ?? false,
      any,
      both: slots.every((s) => s.uploaded),
      uploadedCount: slots.filter((s) => s.uploaded).length,
      slots,
    };
  });

  const cert1Pct = Math.round((members.filter((m) => m.cert1).length / ids.length) * 100);
  const cert2Pct = Math.round((members.filter((m) => m.cert2).length / ids.length) * 100);
  const anyPct = Math.round((members.filter((m) => m.any).length / ids.length) * 100);
  const bothPct = Math.round((members.filter((m) => m.both).length / ids.length) * 100);

  return { cert1Pct, cert2Pct, anyPct, bothPct, members };
}
