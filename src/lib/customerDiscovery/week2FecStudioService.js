/**
 * FEC Validation Lab™ — three-studio venture upgrade flow.
 */
import {
  FEC_BOX_META,
  FEC_BOX_STEP_MAP,
  FEC_STUDIO_PHASES,
} from './week2FecValidationConstants.js';
import {
  approveFecStep,
  getFecStepPayload,
  getFecValidationLabState,
  isFecStepCompleteForParticipant,
} from './week2FecValidationService.js';
import { loadFecValidation, saveFecValidation } from './week2FecValidationStorage.js';
import { getSquadNameForParticipant, squadEvidenceSummary } from './week2SquadEvidenceService.js';
import { buildFecLayoutParticipantContent } from '../fecCanvasLayoutContent.js';
import { loadWeek2Discovery } from './week2DiscoveryStorage.js';
import { getReadinessMissionState } from './week2ReadinessMissionService.js';
import { syncWeek2PortfolioArtifacts } from './week2PortfolioSync.js';
import { syncFecValidationToCloud } from './week2FecValidationSync.js';

/** @param {string} participantId */
function squadKeyFor(participantId) {
  return getSquadNameForParticipant(participantId) || `solo-${participantId}`;
}

/** @param {Record<string, { before: number, after: number }>} boxScores */
export function getCanvasClarityScore(boxScores) {
  const ids = Object.keys(FEC_BOX_META);
  if (!ids.length) return { week1: 52, week2: 52, delta: 0 };
  const week1 = Math.round(ids.reduce((s, id) => s + (boxScores[id]?.before ?? FEC_BOX_META[id].before), 0) / ids.length);
  const week2 = Math.round(ids.reduce((s, id) => s + (boxScores[id]?.after ?? boxScores[id]?.before ?? FEC_BOX_META[id].before), 0) / ids.length);
  return { week1, week2, delta: week2 - week1 };
}

/** @param {string} participantId */
export function getEvidenceBoardPayload(participantId) {
  const s1 = getFecStepPayload(participantId, 'fec-step-1');
  const s2 = getFecStepPayload(participantId, 'fec-step-2');
  const lab = getFecValidationLabState(participantId);
  const saved = lab.fec.evidenceBoard ?? {};

  const goals = s1.commonGoals ?? [];
  const problems = (s2.rankedProblems ?? []).map((p) => ({ text: p.text, count: p.count }));
  const quotes = s1.topQuotes ?? [];
  const themes = [...new Set([...(s1.commonBehaviors ?? []), ...(s1.commonConcerns ?? [])])].slice(0, 8);

  const marketSummary = {
    values: `The market appears to value ${goals[0]?.replace(/^Goal signal: /, '') || 'financial security and clear guidance'}.`,
    struggles: `The market appears to struggle with ${problems[0]?.text || 'protection gaps and income stability'}.`,
    needs: `The market appears to need ${themes[0] || 'trusted advisors who listen before recommending'}.`,
  };

  return {
    quotes,
    starredQuotes: saved.starredQuotes ?? quotes.slice(0, 3),
    problems,
    goals,
    themes,
    marketSummary: saved.marketSummary ?? marketSummary,
    interviewCount: lab.evidence.interviewCount,
    target: lab.evidence.target,
  };
}

/** @param {import('./week2FecValidationConstants.js').FecBoxId} boxId @param {string} participantId */
function week1BoxText(boxId, participantId) {
  const layout = buildFecLayoutParticipantContent(participantId);
  const w2 = loadWeek2Discovery(participantId);
  const boxes = layout.boxContents ?? {};
  switch (boxId) {
    case 'uvp':
      return layout.centerContent || w2.assumptions?.[0]?.belief || 'Our venture helps customers achieve financial confidence.';
    case 'who_we_serve':
      return boxes.who_we_serve || w2.assumptions?.[0]?.belief || 'Target customer segment from Week 1.';
    case 'problem_we_solve':
      return boxes.problem_we_solve || 'Problem we assumed in Week 1.';
    case 'client_experience':
      return boxes.client_experience || 'Advisor experience assumptions from Week 1.';
    case 'winning_strategy':
      return boxes.winning_strategy || 'Strategic assumptions from Week 1.';
    default:
      return '';
  }
}

/** @param {string} participantId */
export function getFecEvolutionBoxes(participantId) {
  const lab = getFecValidationLabState(participantId);
  const evidence = lab.evidence;

  return Object.entries(FEC_BOX_META).map(([boxId, meta]) => {
    const stepId = FEC_BOX_STEP_MAP[boxId];
    const payload = getFecStepPayload(participantId, stepId);
    const saved = lab.fec.steps[stepId];
    const score = lab.fec.boxScores[boxId] ?? { before: meta.before, after: meta.before, evidenceCount: 0, status: 'Needs Validation' };
    const week1 = saved?.beforeText || week1BoxText(boxId, participantId);

    let week2Suggested = '';
    let evidenceItems = [];
    if (boxId === 'uvp') {
      week2Suggested = String(payload.uvpV2 ?? '');
      evidenceItems = [...(payload.quotes ?? []), ...(payload.supporting ?? [])].slice(0, 4);
    } else if (boxId === 'who_we_serve') {
      week2Suggested = String(payload.suggestedSummary ?? '');
      evidenceItems = [...(payload.topQuotes ?? []), ...(payload.commonGoals ?? [])].slice(0, 4);
    } else if (boxId === 'problem_we_solve') {
      week2Suggested = String(payload.validatedStatement ?? '');
      evidenceItems = (payload.rankedProblems ?? []).map((p) => `${p.text} (${p.count} refs)`).slice(0, 4);
    } else if (boxId === 'client_experience') {
      week2Suggested = String(payload.experienceStatement ?? '');
      evidenceItems = [...(payload.trustSignals ?? []), ...(payload.communicationPreferences ?? [])].slice(0, 4);
    } else if (boxId === 'winning_strategy') {
      week2Suggested = String(payload.strategicStatement ?? '');
      evidenceItems = (payload.opportunities ?? []).slice(0, 4);
    }

    return {
      boxId,
      label: meta.label,
      week1,
      week2: saved?.afterText || saved?.approvedStatement || week2Suggested,
      week2Suggested,
      evidenceItems,
      verdict: saved?.verdict ?? '',
      score,
      complete: Boolean(saved?.completedAt),
      interviewCount: evidence.interviewCount,
    };
  });
}

/** @param {string} participantId */
export function getFecStudioState(participantId) {
  const lab = getFecValidationLabState(participantId);
  const readiness = getReadinessMissionState(participantId);
  const fec = lab.fec;
  const clarity = getCanvasClarityScore(fec.boxScores);
  const evolutionBoxes = getFecEvolutionBoxes(participantId);
  const studio2BoxesDone = evolutionBoxes.filter((b) => b.complete).length;

  const phases = FEC_STUDIO_PHASES.map((phase) => {
    let done = false;
    if (phase.id === 'fec-studio-1') done = Boolean(fec.studio1ApprovedAt);
    if (phase.id === 'fec-studio-2') done = Boolean(fec.studio2ApprovedAt) || studio2BoxesDone >= 5;
    if (phase.id === 'fec-studio-3') done = Boolean(fec.studio3ApprovedAt) || isFecStepCompleteForParticipant(participantId, 'fec-step-6');
    return { ...phase, done };
  });

  const studioPct = Math.round((phases.filter((p) => p.done).length / phases.length) * 100);
  const activePhase = phases.find((p) => !p.done) ?? phases[phases.length - 1];

  return {
    lab,
    readiness,
    clarity,
    evolutionBoxes,
    evidenceBoard: getEvidenceBoardPayload(participantId),
    phases,
    studioPct,
    activePhase,
    pitchSlides: fec.pitchSlides ?? {},
    ventureReport: fec.ventureEvolutionReport ?? {},
    nextExperiment: fec.nextExperiment ?? '',
    week3BuildDirection: fec.week3BuildDirection ?? '',
    buildReadiness: fec.buildReadiness ?? '',
    labComplete: Boolean(fec.studio3ApprovedAt) || lab.labComplete,
  };
}

/**
 * @param {string} participantId
 * @param {{ marketSummary?: Record<string, string>, starredQuotes?: string[] }} input
 */
export function approveEvidenceBoard(participantId, input) {
  const board = getEvidenceBoardPayload(participantId);
  const summary = input.marketSummary ?? board.marketSummary;
  const starred = input.starredQuotes ?? board.starredQuotes;
  const marketText = [summary.values, summary.struggles, summary.needs].filter(Boolean).join('\n\n');
  const key = squadKeyFor(participantId);
  const now = new Date().toISOString();

  approveFecStep(participantId, 'fec-step-1', {
    approvedStatement: marketText,
    selections: { topQuotes: starred, marketSummary: summary },
  });

  const next = saveFecValidation(key, {
    studio1ApprovedAt: now,
    evidenceBoard: { marketSummary: summary, starredQuotes: starred },
  });
  void syncFecValidationToCloud(key, next, squadEvidenceSummary(participantId).memberIds).catch(() => {});
  syncWeek2PortfolioArtifacts(participantId);
  return next;
}

/**
 * @param {string} participantId
 * @param {import('./week2FecValidationConstants.js').FecBoxId} boxId
 * @param {{ verdict?: string, week2Text?: string }} input
 */
export function approveFecBoxEvolution(participantId, boxId, input) {
  const stepId = FEC_BOX_STEP_MAP[boxId];
  const boxes = getFecEvolutionBoxes(participantId);
  const box = boxes.find((b) => b.boxId === boxId);
  if (!box || !stepId) return null;

  const week2Text = String(input.week2Text ?? box.week2 ?? box.week2Suggested).trim();
  const verdictKey = input.verdict ?? 'keep';

  approveFecStep(participantId, stepId, {
    approvedStatement: week2Text,
    verdict: verdictKey === 'rebuild' ? 'revision' : verdictKey === 'refine' ? 'partial' : 'supported',
    beforeText: box.week1,
    afterText: week2Text,
    selections: { boxId, verdict: verdictKey },
  });

  const key = squadKeyFor(participantId);
  const updated = getFecEvolutionBoxes(participantId);
  if (updated.every((b) => b.complete)) {
    saveFecValidation(key, { studio2ApprovedAt: new Date().toISOString() });
  }
  syncWeek2PortfolioArtifacts(participantId);
  return loadFecValidation(key);
}

/** @param {string} participantId */
export function generateVentureEvolutionReport(participantId) {
  const boxes = getFecEvolutionBoxes(participantId);
  const clarity = getCanvasClarityScore(getFecValidationLabState(participantId).fec.boxScores);
  const uvp = boxes.find((b) => b.boxId === 'uvp');
  const who = boxes.find((b) => b.boxId === 'who_we_serve');
  const problem = boxes.find((b) => b.boxId === 'problem_we_solve');
  const strategy = boxes.find((b) => b.boxId === 'winning_strategy');

  const report = {
    uvpChanges: uvp ? `${uvp.week1.slice(0, 80)}… → ${uvp.week2.slice(0, 80)}…` : '—',
    customerChanges: who ? who.week2.slice(0, 120) : '—',
    problemChanges: problem ? problem.week2.slice(0, 120) : '—',
    strategyChanges: strategy ? strategy.week2.slice(0, 120) : '—',
    topInsight: `Canvas clarity improved from ${clarity.week1}% to ${clarity.week2}% based on interview evidence.`,
    biggestSurprise: loadWeek2Discovery(participantId).readinessReflectionSurprised?.slice(0, 120) || 'How consistently customers voiced protection and stability needs.',
    biggestOpportunity: strategy?.week2Suggested?.slice(0, 120) || 'Evidence-backed strategic focus for Week 3 build.',
  };

  saveFecValidation(squadKeyFor(participantId), { ventureEvolutionReport: report });
  return report;
}

/** @param {string} participantId */
export function buildStudioPitchSlides(participantId) {
  const studio = getFecStudioState(participantId);
  const boxes = studio.evolutionBoxes;
  const report = generateVentureEvolutionReport(participantId);
  const lab = studio.lab;
  const assumptions = loadWeek2Discovery(participantId).assumptions?.map((a) => a.belief).filter(Boolean).join('; ');
  const fecBefore = boxes.map((b) => `${b.label}: ${b.score.before}%`).join(' · ');
  const fecAfter = boxes.map((b) => `${b.label}: ${b.score.after}%`).join(' · ');
  const uvp = boxes.find((b) => b.boxId === 'uvp');

  return {
    mission: lab.fec.pitchSlides?.mission || studio.lab.evidence.squadName,
    whatWeThought: assumptions || 'We assumed we understood our customer segment.',
    whoInterviewed: `${lab.evidence.interviewCount} customers — ${lab.evidence.squadName}`,
    whatWeHeard: studio.evidenceBoard.marketSummary.values,
    customerVoices: (studio.evidenceBoard.starredQuotes ?? []).map((q) => `"${q}"`).join('\n'),
    whatChanged: report.uvpChanges,
    fecBefore,
    fecAfter,
    strategicOpportunity: studio.lab.fec.steps['fec-step-5']?.approvedStatement || boxes.find((b) => b.boxId === 'winning_strategy')?.week2 || '',
    nextStep: studio.week3BuildDirection || studio.nextExperiment || 'Enter BUILD — prototype our validated venture model.',
    uvpBefore: uvp?.week1 ?? '',
    uvpAfter: uvp?.week2 ?? '',
    validatedProblem: boxes.find((b) => b.boxId === 'problem_we_solve')?.week2 ?? '',
  };
}

/**
 * @param {string} participantId
 * @param {{ strategicOpportunity?: string, nextExperiment?: string, week3BuildDirection?: string, buildReadiness?: string, pitchSlides?: Record<string, string> }} input
 */
export function approveStudio3(participantId, input) {
  const key = squadKeyFor(participantId);
  const now = new Date().toISOString();
  const strategic = String(input.strategicOpportunity ?? '').trim();
  const nextExp = String(input.nextExperiment ?? '').trim();
  const buildDir = String(input.week3BuildDirection ?? '').trim();
  const readiness = String(input.buildReadiness ?? 'Ready to enter BUILD with evidence-backed FEC Version 2.').trim();

  if (strategic && !isFecStepCompleteForParticipant(participantId, 'fec-step-5')) {
    approveFecStep(participantId, 'fec-step-5', { approvedStatement: strategic });
  } else if (strategic) {
    approveFecStep(participantId, 'fec-step-5', { approvedStatement: strategic });
  }

  const slides = { ...buildStudioPitchSlides(participantId), ...input.pitchSlides };
  approveFecStep(participantId, 'fec-step-6', { approvedStatement: 'Pitch draft approved' });

  const next = saveFecValidation(key, {
    studio3ApprovedAt: now,
    pitchSlides: slides,
    nextExperiment: nextExp,
    week3BuildDirection: buildDir,
    buildReadiness: readiness,
    ventureEvolutionReport: generateVentureEvolutionReport(participantId),
  });

  const evidence = squadEvidenceSummary(participantId);
  void syncFecValidationToCloud(key, next, evidence.memberIds).catch(() => {});
  for (const memberId of evidence.memberIds) {
    syncWeek2PortfolioArtifacts(memberId);
  }
  return next;
}

/** @param {string[]} memberIds */
export function deriveSquadDay4CoachMetrics(memberIds) {
  const ids = memberIds.filter(Boolean);
  if (!ids.length) {
    return { evidencePct: 0, fecUpdatedPct: 0, clarityScore: 0, pitchReadinessPct: 0, buildReadinessPct: 0 };
  }

  const states = ids.map(getFecStudioState);
  const evidencePct = Math.round(
    states.reduce((s, st) => s + Math.min(100, Math.round((st.lab.evidence.interviewCount / st.lab.evidence.target) * 100)), 0) / ids.length,
  );
  const fecUpdatedPct = Math.round(states.filter((st) => st.phases[1]?.done).length / ids.length * 100);
  const clarityScore = Math.round(states.reduce((s, st) => s + st.clarity.week2, 0) / ids.length);
  const pitchReadinessPct = Math.round(states.filter((st) => Boolean(st.pitchSlides?.mission)).length / ids.length * 100);
  const buildReadinessPct = Math.round(states.filter((st) => st.labComplete).length / ids.length * 100);

  return { evidencePct, fecUpdatedPct, clarityScore, pitchReadinessPct, buildReadinessPct };
}
