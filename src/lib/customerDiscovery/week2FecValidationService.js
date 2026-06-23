/**
 * FEC Validation Lab™ — AI synthesis, step completion, FEC + portfolio sync.
 */
import {
  FEC_BOX_META,
  FEC_VALIDATION_STEPS,
  PITCH_SLIDE_KEYS,
  SQUAD_ROLE_DEFS,
} from './week2FecValidationConstants.js';
import {
  loadFecValidation,
  saveFecValidation,
  isFecStepComplete,
  fecValidationProgressPct,
  isFecLabComplete,
} from './week2FecValidationStorage.js';
import {
  aggregateSquadInterviews,
  getSquadMemberIds,
  getSquadNameForParticipant,
  squadEvidenceSummary,
} from './week2SquadEvidenceService.js';
import { resolveSquadMission } from './week2Constants.js';
import { loadWeek2Discovery, saveWeek2Discovery } from './week2DiscoveryStorage.js';
import {
  getFecField,
  getFecUnifiedVentureProposition,
  saveFecField,
  saveFecSummaryField,
} from '../fecCanvasService.js';
import { syncWeek2PortfolioArtifacts } from './week2PortfolioSync.js';
import { syncFecValidationToCloud } from './week2FecValidationSync.js';

/** @param {string} participantId */
function squadKeyFor(participantId) {
  return getSquadNameForParticipant(participantId) || `solo-${participantId}`;
}

/** @param {string[]} interviews */
function countFrequency(items) {
  /** @type {Record<string, number>} */
  const map = {};
  for (const item of items) {
    const k = String(item ?? '').trim();
    if (!k) continue;
    map[k] = (map[k] ?? 0) + 1;
  }
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .map(([text, count]) => ({ text, count }));
}

/** @param {ReturnType<typeof aggregateSquadInterviews>} interviews */
function buildCustomerRealityPayload(interviews) {
  const quotes = [];
  const goals = [];
  const concerns = [];
  const behaviors = [];
  const demographics = [];

  for (const iv of interviews) {
    const ins = iv.aiInsights ?? {};
    quotes.push(...(ins.quotes ?? []));
    goals.push(...(ins.goals ?? []));
    concerns.push(...(ins.painPoints ?? []));
    behaviors.push(...(ins.themes ?? []));
    if (iv.occupation) demographics.push(iv.occupation);
    if (iv.alias) demographics.push(`${iv.alias} (${iv.occupation || 'customer'})`);
  }

  const segment = resolveSquadMission(getSquadNameForParticipant(interviews[0]?.memberId ?? ''));
  const suggestedSummary = [
    `We serve ${segment.marketSegment}.`,
    goals[0] ? `They aspire to: ${goals[0].replace(/^Goal signal: /, '')}` : '',
    concerns[0] ? `Primary concern: ${concerns[0]}` : '',
    `Evidence from ${interviews.length} customer conversations.`,
  ]
    .filter(Boolean)
    .join(' ');

  return {
    topQuotes: [...new Set(quotes)].slice(0, 12),
    commonGoals: [...new Set(goals)].slice(0, 8),
    commonConcerns: [...new Set(concerns)].slice(0, 8),
    commonBehaviors: [...new Set(behaviors)].slice(0, 6),
    commonDemographics: [...new Set(demographics)].slice(0, 8),
    suggestedSummary,
  };
}

/** @param {ReturnType<typeof aggregateSquadInterviews>} interviews */
function buildProblemPayload(interviews) {
  const problems = [];
  const quotes = [];
  for (const iv of interviews) {
    const ins = iv.aiInsights ?? {};
    problems.push(...(ins.painPoints ?? []));
    quotes.push(...(ins.quotes ?? []));
  }
  const ranked = countFrequency(problems);
  const top = ranked[0]?.text ?? 'Financial uncertainty and protection gaps';
  const validatedStatement = `Our customers consistently face: ${top}. This appeared in ${ranked[0]?.count ?? interviews.length} of ${interviews.length} interviews.`;
  return { rankedProblems: ranked.slice(0, 8), quotes: quotes.slice(0, 6), validatedStatement, topProblem: top };
}

/** @param {string} participantId @param {ReturnType<typeof aggregateSquadInterviews>} interviews */
function buildUvpPayload(participantId, interviews) {
  const originalUvp = getFecUnifiedVentureProposition(participantId)
    || loadWeek2Discovery(participantId).assumptions?.[0]?.belief
    || 'Our venture helps customers achieve financial confidence.';
  const supporting = [];
  const conflicting = [];
  const quotes = [];
  for (const iv of interviews) {
    quotes.push(...(iv.aiInsights?.quotes ?? []));
    supporting.push(...(iv.aiInsights?.goals ?? []), ...(iv.aiInsights?.opportunities ?? []));
    conflicting.push(...(iv.aiInsights?.painPoints ?? []));
  }
  const segment = resolveSquadMission(getSquadNameForParticipant(participantId));
  const uvpV2 = `We help ${segment.marketSegment} move from ${conflicting[0]?.slice(0, 60) || 'financial stress'} to ${supporting[0]?.slice(0, 60) || 'clearer goals'} — with evidence from ${interviews.length} interviews.`;
  return {
    originalUvp,
    supporting: [...new Set(supporting)].slice(0, 5),
    conflicting: [...new Set(conflicting)].slice(0, 5),
    quotes: quotes.slice(0, 5),
    uvpV2,
  };
}

/** @param {ReturnType<typeof aggregateSquadInterviews>} interviews */
function buildExperiencePayload(interviews) {
  const trust = [];
  const comms = [];
  const service = [];
  const behaviors = [];
  for (const iv of interviews) {
    const joined = (iv.answers ?? []).join(' ').toLowerCase();
    if (/trust|honest|transparent|recommend/.test(joined)) trust.push('Customers value trust and transparency from advisors.');
    if (/call|text|chat|meet|explain|simple/.test(joined)) comms.push('Clear, jargon-free communication preferred.');
    if (/help|guide|plan|coach|advice/.test(joined)) service.push('Structured guidance over product pitches.');
    behaviors.push(...(iv.aiInsights?.themes ?? []));
  }
  const statement = [
    'Clients want advisors who listen first, explain clearly, and build trust before recommending solutions.',
    trust[0] ?? '',
    comms[0] ?? '',
  ]
    .filter(Boolean)
    .join(' ');
  return {
    trustSignals: [...new Set(trust)].slice(0, 4),
    communicationPreferences: [...new Set(comms)].slice(0, 4),
    serviceExpectations: [...new Set(service)].slice(0, 4),
    advisorBehaviors: [...new Set(behaviors)].slice(0, 4),
    experienceStatement: statement,
  };
}

/** @param {string} participantId @param {string} validatedProblem @param {string} segmentSummary @param {string} opportunity */
function buildStrategyPayload(participantId, validatedProblem, segmentSummary, opportunity) {
  const segment = resolveSquadMission(getSquadNameForParticipant(participantId));
  const opportunities = [
    opportunity || 'Protection gap education for underserved families',
    'Emergency fund coaching before product conversations',
    'Remittance-to-protection planning (if OFW segment)',
    'Gen Z first-job financial literacy',
  ].filter(Boolean);
  const statement = `Focus on ${opportunities[0]} for ${segment.marketSegment} — validated problem: ${validatedProblem.slice(0, 120)}`;
  return {
    validatedProblem,
    customerSegment: segmentSummary || segment.marketSegment,
    potentialImpact: 'High — recurring pain across squad interviews',
    opportunities,
    strategicStatement: statement,
  };
}

/**
 * @param {string} participantId
 * @param {import('./week2FecValidationTypes.js').FecValidationSquadState} fecState
 */
function generatePitchSlides(participantId, fecState) {
  const evidence = squadEvidenceSummary(participantId);
  const s1 = fecState.steps['fec-step-1'];
  const s2 = fecState.steps['fec-step-2'];
  const s3 = fecState.steps['fec-step-3'];
  const s5 = fecState.steps['fec-step-5'];
  const mission = resolveSquadMission(evidence.squadName);
  const assumptions = loadWeek2Discovery(participantId).assumptions?.map((a) => a.belief).filter(Boolean).join('; ');

  return {
    mission: mission.mission,
    whoInterviewed: `${evidence.interviewCount} customers — ${mission.marketSegment} (${evidence.squadName})`,
    whatWeThought: assumptions || 'We assumed we understood our customer segment.',
    whatWeHeard: s1?.approvedStatement ?? s1?.selections?.suggestedSummary ?? '',
    customerVoices: (s1?.selections?.topQuotes ?? []).slice(0, 3).map((q) => `"${q}"`).join('\n'),
    validatedProblem: s2?.approvedStatement ?? '',
    uvpBefore: s3?.beforeText ?? '',
    uvpAfter: s3?.afterText ?? s3?.approvedStatement ?? '',
    strategicOpportunity: s5?.approvedStatement ?? '',
    nextStep: 'Enter BUILD stage — prototype our validated venture model.',
  };
}

/** @param {string} participantId @param {import('./week2FecValidationConstants.js').FecBoxId} boxId @param {string} text @param {number} evidenceCount */
function syncFecBox(participantId, boxId, text, evidenceCount) {
  const meta = FEC_BOX_META[boxId];
  if (!meta) return;
  if (boxId === 'uvp') {
    saveFecSummaryField(participantId, { unified_venture_proposition: text });
  } else {
    saveFecField(participantId, 'create_value', meta.fieldKey, text);
  }
  const afterScore = Math.min(95, meta.before + Math.round(evidenceCount * 4.5) + 15);
  return afterScore;
}

/** @param {string} participantId */
export function assignSquadRoles(participantId) {
  const key = squadKeyFor(participantId);
  const state = loadFecValidation(key);
  if (Object.keys(state.squadRoles).length >= 3) return state.squadRoles;

  const memberIds = getSquadMemberIds(participantId);
  const roles = {};
  SQUAD_ROLE_DEFS.forEach((def, idx) => {
    roles[def.id] = memberIds[idx % memberIds.length] ?? participantId;
  });
  saveFecValidation(key, { squadRoles: roles });
  return roles;
}

/** @param {string} participantId */
export function getFecValidationLabState(participantId) {
  const key = squadKeyFor(participantId);
  const evidence = squadEvidenceSummary(participantId);
  const fec = loadFecValidation(key);
  const interviews = aggregateSquadInterviews(evidence.memberIds);
  const progressPct = fecValidationProgressPct(key);
  const activeStep = FEC_VALIDATION_STEPS.find((s) => !isFecStepComplete(key, s.id)) ?? FEC_VALIDATION_STEPS[FEC_VALIDATION_STEPS.length - 1];

  return {
    squadKey: key,
    evidence,
    fec,
    progressPct,
    activeStep,
    interviews,
    roles: assignSquadRoles(participantId),
    labComplete: isFecLabComplete(key),
    pitchSubmitted: Boolean(fec.pitchSubmittedAt),
  };
}

/** @param {string} participantId @param {string} stepId */
export function getFecStepPayload(participantId, stepId) {
  const evidence = squadEvidenceSummary(participantId);
  const interviews = aggregateSquadInterviews(evidence.memberIds);
  const fec = loadFecValidation(squadKeyFor(participantId));
  const segmentSummary = fec.steps['fec-step-1']?.approvedStatement ?? '';

  switch (stepId) {
    case 'fec-step-1':
      return buildCustomerRealityPayload(interviews);
    case 'fec-step-2':
      return buildProblemPayload(interviews);
    case 'fec-step-3':
      return buildUvpPayload(participantId, interviews);
    case 'fec-step-4':
      return buildExperiencePayload(interviews);
    case 'fec-step-5':
      return buildStrategyPayload(
        participantId,
        fec.steps['fec-step-2']?.approvedStatement ?? '',
        segmentSummary,
        fec.steps['fec-step-2']?.selections?.topProblem ?? '',
      );
    case 'fec-step-6':
      return { slides: fec.pitchSlides?.mission ? fec.pitchSlides : generatePitchSlides(participantId, fec) };
    default:
      return {};
  }
}

/**
 * @param {string} participantId
 * @param {string} stepId
 * @param {{ approvedStatement?: string, selections?: Record<string, unknown>, verdict?: string, beforeText?: string, afterText?: string }} input
 */
export function approveFecStep(participantId, stepId, input) {
  const key = squadKeyFor(participantId);
  const evidence = squadEvidenceSummary(participantId);
  const interviews = aggregateSquadInterviews(evidence.memberIds);
  const now = new Date().toISOString();
  const fec = loadFecValidation(key);
  const stepDef = FEC_VALIDATION_STEPS.find((s) => s.id === stepId);
  if (!stepDef) return fec;

  const approvedStatement = String(input.approvedStatement ?? '').trim();
  const stepState = {
    completedAt: now,
    approvedStatement,
    selections: input.selections ?? {},
    verdict: input.verdict,
    beforeText: input.beforeText,
    afterText: input.afterText,
  };

  /** @type {Record<string, import('./week2FecValidationTypes.js').FecBoxScore>} */
  const boxScores = { ...fec.boxScores };
  const boxId = stepDef.fecBox;
  const meta = FEC_BOX_META[boxId];
  let afterScore = meta?.before ?? 50;

  if (stepId === 'fec-step-1' && approvedStatement) {
    afterScore = syncFecBox(participantId, 'who_we_serve', approvedStatement, interviews.length) ?? 95;
    boxScores.who_we_serve = {
      ...boxScores.who_we_serve,
      after: afterScore,
      evidenceCount: interviews.length,
      status: 'Validated',
      approvedText: approvedStatement,
    };
  }
  if (stepId === 'fec-step-2' && approvedStatement) {
    afterScore = syncFecBox(participantId, 'problem_we_solve', approvedStatement, interviews.length) ?? 92;
    boxScores.problem_we_solve = {
      ...boxScores.problem_we_solve,
      after: afterScore,
      evidenceCount: interviews.length,
      status: 'Validated',
      approvedText: approvedStatement,
    };
  }
  if (stepId === 'fec-step-3') {
    const afterText = String(input.afterText ?? approvedStatement).trim();
    if (afterText) {
      afterScore = syncFecBox(participantId, 'uvp', afterText, interviews.length) ?? 85;
      boxScores.uvp = {
        ...boxScores.uvp,
        after: afterScore,
        evidenceCount: interviews.length,
        status: input.verdict === 'revision' ? 'Revised' : 'Validated',
        approvedText: afterText,
      };
    }
  }
  if (stepId === 'fec-step-4' && approvedStatement) {
    afterScore = syncFecBox(participantId, 'client_experience', approvedStatement, interviews.length) ?? 60;
    boxScores.client_experience = {
      ...boxScores.client_experience,
      after: afterScore,
      evidenceCount: interviews.length,
      status: 'Validated',
      approvedText: approvedStatement,
    };
  }
  if (stepId === 'fec-step-5' && approvedStatement) {
    afterScore = syncFecBox(participantId, 'winning_strategy', approvedStatement, interviews.length) ?? 50;
    boxScores.winning_strategy = {
      ...boxScores.winning_strategy,
      after: afterScore,
      evidenceCount: interviews.length,
      status: 'Validated',
      approvedText: approvedStatement,
    };
  }

  let pitchSlides = fec.pitchSlides;
  if (stepId === 'fec-step-6') {
    const nextFec = { ...fec, steps: { ...fec.steps, [stepId]: stepState }, boxScores };
    pitchSlides = generatePitchSlides(participantId, nextFec);
    for (const memberId of evidence.memberIds) {
      saveWeek2Discovery(memberId, {
        pitchOutline: {
          mission: pitchSlides.mission ?? '',
          whoInterviewed: pitchSlides.whoInterviewed ?? '',
          whatWeThought: pitchSlides.whatWeThought ?? '',
          whatWeLearned: pitchSlides.whatWeHeard ?? '',
          customerVoices: pitchSlides.customerVoices ?? '',
          biggestProblem: pitchSlides.validatedProblem ?? '',
          beliefShift: `${pitchSlides.uvpBefore ?? ''} → ${pitchSlides.uvpAfter ?? ''}`,
          ventureChanged: pitchSlides.strategicOpportunity ?? '',
          nextSteps: pitchSlides.nextStep ?? '',
          advisorInsight: pitchSlides.customerVoices ?? '',
        },
        pitchStartedAt: now,
      });
      syncWeek2PortfolioArtifacts(memberId);
    }
  }

  const next = saveFecValidation(key, {
    steps: { ...fec.steps, [stepId]: stepState },
    boxScores,
    pitchSlides: pitchSlides ?? fec.pitchSlides,
  });

  for (const memberId of evidence.memberIds) {
    syncWeek2PortfolioArtifacts(memberId);
  }
  void syncFecValidationToCloud(key, next, evidence.memberIds).catch(() => {});
  return next;
}

/** @param {string} participantId */
export function submitMarketValidationPitch(participantId) {
  const key = squadKeyFor(participantId);
  const now = new Date().toISOString();
  const evidence = squadEvidenceSummary(participantId);
  saveFecValidation(key, { pitchSubmittedAt: now });
  for (const memberId of evidence.memberIds) {
    saveWeek2Discovery(memberId, { pitchSubmittedAt: now });
    syncWeek2PortfolioArtifacts(memberId);
  }
  const fec = loadFecValidation(key);
  void syncFecValidationToCloud(key, { ...fec, pitchSubmittedAt: now }, evidence.memberIds).catch(() => {});
}

/** @param {string} participantId @param {string} stepId */
export function isFecStepCompleteForParticipant(participantId, stepId) {
  return isFecStepComplete(squadKeyFor(participantId), stepId);
}

/** @param {string} participantId */
export function getFridayReadiness(participantId) {
  const lab = getFecValidationLabState(participantId);
  const w2 = loadWeek2Discovery(participantId);
  const fecReady = lab.labComplete;
  const portfolioDone = Boolean(w2.portfolioSyncedAt) || fecReady;
  const readinessDone = Boolean(w2.professionalReadinessAt);
  const pitchReady = Boolean(lab.fec.pitchSlides?.mission) || Boolean(w2.pitchStartedAt);
  const pitchSubmitted = Boolean(lab.fec.pitchSubmittedAt) || Boolean(w2.pitchSubmittedAt);
  return { fecReady, portfolioDone, readinessDone, pitchReady, pitchSubmitted, interviewCount: lab.evidence.interviewCount };
}

/** @param {string} participantId */
export function getOriginalUvp(participantId) {
  return getFecUnifiedVentureProposition(participantId)
    || getFecField(participantId, 'create_value', 'customer_segments')
    || '';
}

export { fecValidationProgressPct, isFecLabComplete, isFecStepComplete };
