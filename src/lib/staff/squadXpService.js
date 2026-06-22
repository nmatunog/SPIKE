/**
 * Squad Weekly XP — automatic activity (80%) + Venture Proposition pitch bonus (20%).
 * All squad members share the same weekly XP.
 */
import { getParticipantSquad } from '../cohortFormationService.js';
import { loadWeek2Discovery } from '../customerDiscovery/week2DiscoveryStorage.js';
import { deriveVentureMilestones } from '../myVentureHqService.js';
import { isVentureDesignOutputComplete } from '../participantOutputMetrics.js';
import { participantHasPitchDeckDeliverable } from '../portfolioDeliverableService.js';
import { countSubmittedSurveys } from '../surveyService.js';
import { getCoachProgress } from '../ventureCoachStorage.js';
import { loadSquadDesignRecord } from '../ventureDesignStudioService.js';
import {
  AUTO_XP_WEIGHTS,
  MENTOR_REVIEW_DIMENSIONS,
  SQUAD_XP_AUTO_MAX,
  SQUAD_XP_PITCH_BONUS_MAX,
  SQUAD_XP_TOTAL_MAX,
  STAGE_GATE_DECISIONS,
} from './squadXpConstants.js';

const REVIEW_KEY = 'spike_squad_mentor_review_v1';
const GATE_KEY = 'spike_squad_stage_gate_v1';

function readReviews() {
  try {
    return JSON.parse(localStorage.getItem(REVIEW_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeReviews(data) {
  localStorage.setItem(REVIEW_KEY, JSON.stringify(data));
}

function readGate() {
  try {
    return JSON.parse(localStorage.getItem(GATE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeGate(data) {
  localStorage.setItem(GATE_KEY, JSON.stringify(data));
}

function reviewStorageKey(squadName, week) {
  return `${squadName}:w${week}`;
}

/** @param {string} participantId */
function memberActivitySignals(participantId) {
  const w2 = loadWeek2Discovery(participantId);
  const encoded = (w2.interviews ?? []).filter((i) => i.encoded).length;
  const hasReflection = (w2.thinkingShifts ?? []).some((s) => String(s.response ?? '').trim().length > 10);
  const portfolioDone = Boolean(w2.portfolioSyncedAt);
  const assignmentDone = Boolean(w2.guideCompletedAt);
  const missionDone = Boolean(w2.missionAcknowledged);
  const coachPct = getCoachProgress(participantId)?.percent ?? 0;
  const surveys = countSubmittedSurveys(participantId);
  const playbookActive = surveys > 0 || coachPct >= 20;
  const stageGateMin = encoded >= 3 && assignmentDone && hasReflection && portfolioDone;

  return {
    encoded,
    hasReflection,
    portfolioDone,
    assignmentDone,
    missionDone,
    playbookActive,
    stageGateMin,
    hasAnyProgress: missionDone || encoded > 0 || coachPct > 0 || surveys > 0,
  };
}

/**
 * @param {string[]} memberIds
 * @param {number} [week]
 */
export function computeSquadAutoXp(memberIds, week = 2) {
  void week;
  const ids = memberIds.filter(Boolean);
  if (!ids.length) return { autoXp: 0, breakdown: {}, completionPct: 0 };

  const signals = ids.map((id) => memberActivitySignals(id));
  const n = ids.length;
  const pct = (fn) => signals.filter(fn).length / n;

  const breakdown = {
    interviews: Math.round(pct((s) => s.encoded >= 3) * AUTO_XP_WEIGHTS.interviews),
    playbook: Math.round(pct((s) => s.playbookActive) * AUTO_XP_WEIGHTS.playbook),
    portfolio: Math.round(pct((s) => s.portfolioDone) * AUTO_XP_WEIGHTS.portfolio),
    reflection: Math.round(pct((s) => s.hasReflection) * AUTO_XP_WEIGHTS.reflection),
    assignment: Math.round(pct((s) => s.assignmentDone) * AUTO_XP_WEIGHTS.assignment),
    attendance: Math.round(pct((s) => s.hasAnyProgress) * AUTO_XP_WEIGHTS.attendance),
    participation: Math.round(pct((s) => s.missionDone) * AUTO_XP_WEIGHTS.participation),
    stageGatePrep: Math.round(pct((s) => s.stageGateMin) * AUTO_XP_WEIGHTS.stageGatePrep),
  };

  const autoXp = Math.min(
    SQUAD_XP_AUTO_MAX,
    Object.values(breakdown).reduce((sum, v) => sum + v, 0),
  );
  const completionPct = Math.round((autoXp / SQUAD_XP_AUTO_MAX) * 100);

  return { autoXp, breakdown, completionPct };
}

/** @param {import('../ventureDesignStudioConstants.js').VentureDesignIndividualDraft | undefined} consolidated */
function hasConsolidatedVentureProposition(consolidated) {
  const parts = [
    consolidated?.step3?.synthesisA,
    consolidated?.step3?.synthesisB,
    consolidated?.step3?.synthesisC,
  ].filter((part) => String(part ?? '').trim());
  return parts.length >= 2;
}

/** @param {string} participantId */
function memberVenturePropositionReady(participantId) {
  if (participantHasPitchDeckDeliverable(participantId)) return true;
  if (isVentureDesignOutputComplete(participantId)) return true;
  const { milestones } = deriveVentureMilestones(participantId);
  return Boolean(milestones.find((m) => m.id === 'uvp')?.complete);
}

/**
 * Squad earns pitch bonus when consolidated UVP exists, a pitch deck is uploaded,
 * or every member has completed their Venture Proposition work.
 * @param {string[]} memberIds
 */
export function squadVenturePropositionPitchComplete(memberIds) {
  const ids = memberIds.filter(Boolean);
  if (!ids.length) return false;

  const squadRecord = getParticipantSquad(ids[0]);
  const squadDesign = loadSquadDesignRecord(squadRecord?.id ?? '');
  if (hasConsolidatedVentureProposition(squadDesign.consolidated)) return true;
  if (ids.some((id) => participantHasPitchDeckDeliverable(id))) return true;
  return ids.every((id) => memberVenturePropositionReady(id));
}

/** @param {string[]} memberIds */
export function computePitchBonusXp(memberIds) {
  return squadVenturePropositionPitchComplete(memberIds) ? SQUAD_XP_PITCH_BONUS_MAX : 0;
}

/**
 * @param {string} squadName
 * @param {string[]} memberIds
 * @param {number} [week]
 */
export function getSquadWeeklyXp(squadName, memberIds, week = 2) {
  const { autoXp, breakdown, completionPct } = computeSquadAutoXp(memberIds, week);
  const review = getSquadMentorReview(squadName, week);
  const pitchBonus = computePitchBonusXp(memberIds);
  const pitchComplete = pitchBonus > 0;
  const totalXp = Math.min(SQUAD_XP_TOTAL_MAX, autoXp + pitchBonus);
  const gate = getSquadStageGateDecision(squadName, week);

  return {
    squadName,
    week,
    autoXp,
    pitchBonus,
    pitchComplete,
    totalXp,
    breakdown,
    completionPct,
    starRating: xpToStars(totalXp),
    review,
    gate,
    checklist: buildSquadChecklist(memberIds),
  };
}

/** @param {string[]} memberIds */
function buildSquadChecklist(memberIds) {
  const { breakdown } = computeSquadAutoXp(memberIds);
  const pitchDone = squadVenturePropositionPitchComplete(memberIds);
  return [
    { id: 'interviews', label: 'Interviews completed', done: breakdown.interviews >= AUTO_XP_WEIGHTS.interviews * 0.8 },
    { id: 'portfolio', label: 'Portfolio updated', done: breakdown.portfolio >= AUTO_XP_WEIGHTS.portfolio * 0.8 },
    { id: 'reflection', label: 'Reflection submitted', done: breakdown.reflection >= AUTO_XP_WEIGHTS.reflection * 0.8 },
    { id: 'assignment', label: 'Assignment submitted', done: breakdown.assignment >= AUTO_XP_WEIGHTS.assignment * 0.8 },
    { id: 'pitch', label: 'Venture Proposition pitch complete (+20 XP)', done: pitchDone },
  ];
}

/** @param {number} xp */
export function xpToStars(xp) {
  if (xp >= 90) return 5;
  if (xp >= 75) return 4;
  if (xp >= 60) return 3;
  if (xp >= 40) return 2;
  return 1;
}

/** @param {number} xp */
export function formatStarDisplay(xp) {
  const stars = xpToStars(xp);
  return '★'.repeat(stars) + '☆'.repeat(5 - stars);
}

/**
 * @param {Array<{ name: string, members: Array<{ id: string }> }>} squads
 * @param {number} [week]
 */
export function rankSquadsByXp(squads, week = 2) {
  return squads
    .map((squad) => {
      const memberIds = (squad.members ?? []).map((m) => m.id);
      const xp = getSquadWeeklyXp(squad.name, memberIds, week);
      return { ...xp, rank: 0 };
    })
    .sort((a, b) => b.totalXp - a.totalXp)
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

/** @param {string} squadName @param {number} week */
export function getSquadMentorReview(squadName, week) {
  return readReviews()[reviewStorageKey(squadName, week)] ?? null;
}

/**
 * @param {string} mentorId
 * @param {string} squadName
 * @param {number} week
 * @param {{ ratings: Record<string, number>, aiSummary?: string }} input
 */
export function saveSquadMentorReview(mentorId, squadName, week, input) {
  const ratings = {};
  for (const dim of MENTOR_REVIEW_DIMENSIONS) {
    const v = Number(input.ratings?.[dim.id] ?? 0);
    if (v > 0) ratings[dim.id] = Math.min(5, Math.max(1, v));
  }
  const entry = {
    mentorId,
    squadName,
    week,
    ratings,
    aiSummary: String(input.aiSummary ?? '').trim(),
    savedAt: new Date().toISOString(),
  };
  const all = readReviews();
  all[reviewStorageKey(squadName, week)] = entry;
  writeReviews(all);
  return entry;
}

/** @param {string} squadName @param {number} week */
export function getSquadStageGateDecision(squadName, week) {
  return readGate()[reviewStorageKey(squadName, week)] ?? null;
}

/**
 * @param {string} mentorId
 * @param {string} squadName
 * @param {number} week
 * @param {'not_ready' | 'almost_ready' | 'ready'} decision
 */
export function saveSquadStageGateDecision(mentorId, squadName, week, decision) {
  const meta = STAGE_GATE_DECISIONS.find((d) => d.id === decision);
  const entry = {
    mentorId,
    squadName,
    week,
    decision,
    label: meta?.label ?? decision,
    savedAt: new Date().toISOString(),
  };
  const all = readGate();
  all[reviewStorageKey(squadName, week)] = entry;
  writeGate(all);
  return entry;
}

/** @param {string} participantId @param {string} squadName @param {string[]} memberIds @param {number} [week] */
export function getParticipantSquadXp(participantId, squadName, memberIds, week = 2) {
  void participantId;
  return getSquadWeeklyXp(squadName, memberIds, week);
}

/**
 * Generate coaching summary from mentor star ratings (local — no API required).
 * @param {Record<string, number>} ratings
 * @param {string} squadName
 */
export function generateSquadCoachingSummary(ratings, squadName) {
  const avg =
    MENTOR_REVIEW_DIMENSIONS.reduce((sum, d) => sum + (Number(ratings[d.id] ?? 0) || 0), 0)
    / MENTOR_REVIEW_DIMENSIONS.length;
  const readiness = Number(ratings.readiness_for_stage_gate ?? 0);
  const collaboration = Number(ratings.collaboration ?? 0);

  let tone = 'steady progress';
  if (avg >= 4.5) tone = 'exceptional momentum';
  else if (avg >= 3.5) tone = 'strong collaboration and learning';
  else if (avg < 2.5) tone = 'needs focused support next week';

  const gateHint =
    readiness >= 4
      ? 'The squad appears ready for Stage Gate review.'
      : readiness >= 3
        ? 'A few deliverables should be tightened before Stage Gate submission.'
        : 'Prioritize completing core research deliverables before the gate.';

  const teamHint =
    collaboration >= 4
      ? 'Team dynamics are a strength — keep leveraging peer accountability.'
      : 'Encourage more shared squad sessions to lift collaboration.';

  return `${squadName} showed ${tone} this week. ${gateHint} ${teamHint}`;
}
