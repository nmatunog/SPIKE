/**
 * Unified Week 1 / FEC / Venture Design completion — v1 canvas, FEC v2, and cloud UVP.
 */
import { computeCanvasCompletionPct } from './canvasService.js';
import {
  computeFecCanvasCompletionPct,
  getFecUnifiedVentureProposition,
} from './fecCanvasService.js';
import { getCanvasSummary } from './canvasSummaryService.js';
import {
  loadVentureDesignRecord,
  ventureDesignProgressPercent,
} from './ventureDesignStudioService.js';
import { deriveVentureMilestones } from './myVentureHqService.js';

/** @param {string | undefined | null} value */
function hasText(value) {
  return Boolean(String(value ?? '').trim());
}

/**
 * Best available canvas % — legacy engines, FEC v2 pillars, or UVP / venture design signals.
 * @param {string} participantId
 */
export function getEffectiveCanvasCompletionPct(participantId) {
  if (!participantId) return 0;

  const v1Pct = computeCanvasCompletionPct(participantId);
  const fecPct = computeFecCanvasCompletionPct(participantId);
  const uvp = getFecUnifiedVentureProposition(participantId);
  const design = loadVentureDesignRecord(participantId);

  let signalPct = 0;
  if (design.isComplete) signalPct = 90;
  else if (design.isStarted && design.highestStepReached >= 3) signalPct = 55;
  else if (uvp.length >= 20) signalPct = 45;

  return Math.min(100, Math.max(v1Pct, fecPct, signalPct));
}

/** @param {string} participantId */
export function isFeCanvasOutputComplete(participantId) {
  if (!participantId) return false;
  const design = loadVentureDesignRecord(participantId);
  const uvp = getFecUnifiedVentureProposition(participantId);
  const draft = design.individual;
  const uvpFromDesign =
    hasText(draft?.step3?.synthesisA)
    && hasText(draft?.step3?.synthesisB)
    && hasText(draft?.step3?.synthesisC);

  return (
    getEffectiveCanvasCompletionPct(participantId) >= 30
    || uvp.length >= 20
    || uvpFromDesign
    || design.isComplete
  );
}

/**
 * Staff view — local venture design store OR cloud-synced UVP / FEC after hydration.
 * @param {string} participantId
 */
export function deriveVentureDesignStaffProgress(participantId) {
  if (!participantId) return 0;

  const record = loadVentureDesignRecord(participantId);
  const localPct = ventureDesignProgressPercent(record);
  if (record.isComplete) return 100;

  const uvp = getFecUnifiedVentureProposition(participantId);
  const summary = getCanvasSummary(participantId);
  const draft = record.individual;

  if (uvp.length >= 20 || hasText(summary.unified_venture_proposition)) {
    return Math.max(localPct, 90);
  }
  if (
    hasText(draft?.step3?.synthesisA)
    && hasText(draft?.step3?.synthesisB)
    && hasText(draft?.step3?.synthesisC)
  ) {
    return Math.max(localPct, 80);
  }
  if (hasText(draft?.step4?.name) || hasText(draft?.step1?.customer)) {
    return Math.max(localPct, 50);
  }
  if (record.isStarted) return Math.max(localPct, ventureDesignProgressPercent(record));

  const { milestones } = deriveVentureMilestones(participantId);
  const uvpMilestone = milestones.find((m) => m.id === 'uvp');
  if (uvpMilestone?.complete) return Math.max(localPct, 85);

  return localPct;
}

/** @param {string} participantId */
export function isVentureDesignOutputComplete(participantId) {
  return deriveVentureDesignStaffProgress(participantId) >= 80;
}
