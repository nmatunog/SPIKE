/**
 * Week 2 Day 3 — Professional Readiness Mission (bridge to FEC Validation).
 */
import { loadWeek2Discovery, saveWeek2Discovery } from './week2DiscoveryStorage.js';
import { getSquadIntelligenceBoard } from './week2DiscoveryService.js';
import { squadEvidenceSummary } from './week2SquadEvidenceService.js';
import { getFecUnifiedVentureProposition } from '../fecCanvasService.js';
import { getFecStepPayload } from './week2FecValidationService.js';
import { assignSquadRoles } from './week2FecValidationService.js';
import { syncWeek2PortfolioArtifacts } from './week2PortfolioSync.js';
import { SQUAD_INTERVIEW_TARGET } from './week2FecValidationConstants.js';

const REFLECTION_KEYS = ['surprised', 'responsibility', 'trustedAdvisor'];

/** @param {import('./week2DiscoveryTypes.js').Week2DiscoveryState} state */
function reflectionAnswers(state) {
  return {
    surprised: state.readinessReflectionSurprised ?? '',
    responsibility: state.readinessReflectionResponsibility ?? '',
    trustedAdvisor: state.readinessReflectionTrustedAdvisor ?? '',
  };
}

/** @param {string} participantId */
export function getReadinessMissionState(participantId) {
  const state = loadWeek2Discovery(participantId);
  const evidence = squadEvidenceSummary(participantId);
  const board = getSquadIntelligenceBoard(participantId);
  const answers = reflectionAnswers(state);

  const pctcComplete = Boolean(state.professionalReadinessAt);
  const pctcStarted = pctcComplete || Boolean(state.pctcStartedAt) || String(state.readinessEvidenceNote ?? '').trim().length > 0;
  const reflectionFilled = REFLECTION_KEYS.every((k) => String(answers[k] ?? '').trim().length > 8);
  const reflectionApproved = Boolean(state.readinessReflectionApprovedAt);
  const uvpDone = Boolean(state.uvpCheckpointAt);

  const originalUvp =
    state.uvpCheckpointOriginal
    || getFecUnifiedVentureProposition(participantId)
    || state.assumptions?.[0]?.belief
    || 'Our venture helps customers achieve financial confidence.';

  const marketSignals = getFecStepPayload(participantId, 'fec-step-3');

  const steps = [
    { id: 'pctc-start', label: 'Start PCTC', done: pctcStarted },
    { id: 'pctc-complete', label: 'Complete PCTC', done: pctcComplete },
    { id: 'reflection', label: 'Reflection', done: reflectionApproved },
    { id: 'uvp', label: 'UVP Checkpoint', done: uvpDone },
    { id: 'thursday', label: 'Thursday Unlock', done: false },
  ];

  const interviewPct = Math.min(100, Math.round((evidence.interviewCount / evidence.target) * 100));
  const contributors = [
    { id: 'pctc', label: 'PCTC Completion', done: pctcComplete, weight: 25 },
    { id: 'reflection', label: 'Reflection Completion', done: reflectionApproved, weight: 25 },
    {
      id: 'interviews',
      label: `Interviews ${evidence.interviewCount}/${evidence.target}`,
      done: evidence.interviewCount >= Math.min(SQUAD_INTERVIEW_TARGET, evidence.memberIds.length * 3),
      weight: 25,
      pct: interviewPct,
    },
    { id: 'uvp', label: 'UVP Checkpoint', done: uvpDone, weight: 25 },
  ];

  let readinessPct = 0;
  for (const c of contributors) {
    if (c.done) readinessPct += c.weight;
    else if (c.id === 'interviews' && c.pct) readinessPct += Math.round((c.pct / 100) * c.weight);
  }

  const thursdayUnlocked = readinessPct >= 75;
  steps[4].done = thursdayUnlocked;

  const missionPct = Math.round(
    ((pctcStarted ? 15 : 0)
      + (pctcComplete ? 25 : 0)
      + (reflectionApproved ? 25 : 0)
      + (uvpDone ? 20 : 0)
      + (thursdayUnlocked ? 15 : 0)),
  );

  return {
    state,
    evidence,
    board,
    answers,
    originalUvp,
    marketSignals,
    steps,
    contributors,
    missionPct,
    readinessPct,
    thursdayUnlocked,
    pctcComplete,
    pctcStarted,
    reflectionFilled,
    reflectionApproved,
    uvpDone,
    reflectionSummary: state.readinessReflectionSummary ?? '',
    uvpVerdict: state.uvpCheckpointVerdict ?? '',
    uvpNotes: state.uvpCheckpointNotes ?? '',
    badgeEarned: Boolean(state.readinessBadgeEarnedAt || state.professionalReadinessAt),
  };
}

/** @param {string} participantId */
export function ensureWednesdaySquadRoles(participantId) {
  return assignSquadRoles(participantId);
}

/** @param {string} participantId @param {'not_started' | 'in_progress' | 'completed'} status @param {string} [note] */
export function savePctcStatus(participantId, status, note) {
  const text = String(note ?? '').trim();
  const patch = {
    readinessEvidenceNote: text || loadWeek2Discovery(participantId).readinessEvidenceNote,
    pctcStartedAt: status !== 'not_started'
      ? loadWeek2Discovery(participantId).pctcStartedAt ?? new Date().toISOString()
      : null,
  };
  if (status === 'completed' && text.length > 10) {
    patch.professionalReadinessAt = new Date().toISOString();
    patch.readinessBadgeEarnedAt = new Date().toISOString();
  } else if (status === 'in_progress') {
    patch.professionalReadinessAt = null;
  }
  const next = saveWeek2Discovery(participantId, patch);
  if (patch.professionalReadinessAt) syncWeek2PortfolioArtifacts(participantId);
  return next;
}

/** @param {string} participantId @param {Partial<Record<'surprised'|'responsibility'|'trustedAdvisor', string>>} answers */
export function saveReadinessReflectionAnswers(participantId, answers) {
  const patch = {
    readinessReflectionSurprised: answers.surprised ?? '',
    readinessReflectionResponsibility: answers.responsibility ?? '',
    readinessReflectionTrustedAdvisor: answers.trustedAdvisor ?? '',
  };
  return saveWeek2Discovery(participantId, patch);
}

/** @param {string} participantId */
export function generateReadinessReflectionSummary(participantId) {
  const { answers } = getReadinessMissionState(participantId);
  const parts = [];
  if (answers.surprised.trim()) parts.push(`You noted: "${answers.surprised.trim().slice(0, 120)}…"`);
  if (answers.responsibility.trim()) parts.push(`Responsibility stood out: ${answers.responsibility.trim().slice(0, 100)}`);
  if (answers.trustedAdvisor.trim()) parts.push(`Trust means: ${answers.trustedAdvisor.trim().slice(0, 100)}`);
  const summary = parts.length
    ? `You recognized that serving others requires preparation, listening, and responsibility. ${parts.join(' ')}`
    : 'Complete your three reflection prompts to generate a summary.';
  saveWeek2Discovery(participantId, { readinessReflectionSummary: summary });
  return summary;
}

/** @param {string} participantId @param {string} [summary] */
export function approveReadinessReflection(participantId, summary) {
  const text = String(summary ?? loadWeek2Discovery(participantId).readinessReflectionSummary ?? '').trim();
  const now = new Date().toISOString();
  const state = loadWeek2Discovery(participantId);
  const thinkingShifts = [...(state.thinkingShifts ?? [])];
  const combined = [
    state.readinessReflectionSurprised,
    state.readinessReflectionResponsibility,
    state.readinessReflectionTrustedAdvisor,
  ].filter(Boolean).join('\n\n');

  const existingIdx = thinkingShifts.findIndex((s) => s.taskId === 'readiness-reflect');
  const shift = {
    id: existingIdx >= 0 ? thinkingShifts[existingIdx].id : `shift-readiness-${participantId}`,
    prompt: 'Professional Readiness Reflection Summary',
    response: text || combined,
    taskId: 'readiness-reflect',
    createdAt: existingIdx >= 0 ? thinkingShifts[existingIdx].createdAt : now,
  };
  if (existingIdx >= 0) thinkingShifts[existingIdx] = shift;
  else thinkingShifts.push(shift);

  const next = saveWeek2Discovery(participantId, {
    thinkingShifts,
    readinessReflectionSummary: text,
    readinessReflectionApprovedAt: now,
    readinessReflectionAt: now,
  });
  syncWeek2PortfolioArtifacts(participantId);
  return next;
}

/**
 * @param {string} participantId
 * @param {{ verdict: string, notes?: string, originalUvp?: string }} input
 */
export function saveUvpCheckpoint(participantId, input) {
  const verdict = String(input.verdict ?? '').trim();
  const now = verdict ? new Date().toISOString() : null;
  const next = saveWeek2Discovery(participantId, {
    uvpCheckpointVerdict: verdict,
    uvpCheckpointNotes: String(input.notes ?? '').trim(),
    uvpCheckpointOriginal: String(input.originalUvp ?? '').trim(),
    uvpCheckpointAt: now,
  });
  if (now) syncWeek2PortfolioArtifacts(participantId);
  return next;
}

/** @param {string[]} memberIds */
export function deriveSquadDay3CoachMetrics(memberIds) {
  const ids = memberIds.filter(Boolean);
  if (!ids.length) {
    return {
      pctcPct: 0,
      interviewPct: 0,
      reflectionPct: 0,
      uvpStatus: '—',
      thursdayReadinessPct: 0,
    };
  }

  const missions = ids.map(getReadinessMissionState);
  const pctcPct = Math.round((missions.filter((m) => m.pctcComplete).length / ids.length) * 100);
  const reflectionPct = Math.round((missions.filter((m) => m.reflectionApproved).length / ids.length) * 100);
  const evidence = squadEvidenceSummary(ids[0]);
  const interviewPct = Math.min(100, Math.round((evidence.interviewCount / evidence.target) * 100));
  const uvpCounts = { supported: 0, refinement: 0, revision: 0, pending: 0 };
  for (const m of missions) {
    if (m.uvpVerdict === 'supported') uvpCounts.supported += 1;
    else if (m.uvpVerdict === 'refinement') uvpCounts.refinement += 1;
    else if (m.uvpVerdict === 'revision') uvpCounts.revision += 1;
    else uvpCounts.pending += 1;
  }
  let uvpStatus = 'Pending';
  if (uvpCounts.supported === ids.length) uvpStatus = 'Supported';
  else if (uvpCounts.refinement > 0) uvpStatus = 'Needs Refinement';
  else if (uvpCounts.revision > 0) uvpStatus = 'Needs Revision';
  else if (uvpCounts.supported > 0) uvpStatus = 'Partial';

  const thursdayReadinessPct = Math.round(
    missions.reduce((sum, m) => sum + m.readinessPct, 0) / missions.length,
  );

  return { pctcPct, interviewPct, reflectionPct, uvpStatus, thursdayReadinessPct };
}
