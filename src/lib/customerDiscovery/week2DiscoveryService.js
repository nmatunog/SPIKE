/**
 * Week 2 Customer Discovery — CRUD and business rules.
 */
import { loadWeek2Discovery, saveWeek2Discovery } from './week2DiscoveryStorage.js';
import { MAX_INTERVIEW_QUESTIONS, MIN_ENCODED_INTERVIEWS, resolveSquadMission } from './week2Constants.js';
import { syncWeek2Day1Portfolio, syncWeek2PortfolioArtifacts } from './week2PortfolioSync.js';
import { extractInterviewInsights, aggregateSquadIntelligence } from './week2InsightSynthesis.js';

/** @param {string} participantId */
export function getWeek2State(participantId) {
  return loadWeek2Discovery(participantId);
}

/**
 * @param {string} participantId
 * @param {Array<{ id: string, text: string, purpose?: string, section?: string, linkedAssumptionId?: string }>} questions
 */
export function saveInterviewQuestions(participantId, questions) {
  const trimmed = questions.slice(0, MAX_INTERVIEW_QUESTIONS).map((q) => ({
    ...q,
    text: String(q.text ?? '').trim(),
  }));
  const filled = trimmed.filter((q) => q.text.length > 8);
  const patch = { questions: trimmed };
  if (filled.length >= MAX_INTERVIEW_QUESTIONS) {
    patch.guideCompletedAt = new Date().toISOString();
  }
  const next = saveWeek2Discovery(participantId, patch);
  if (filled.length >= MAX_INTERVIEW_QUESTIONS) {
    syncWeek2Day1Portfolio(participantId);
  }
  return next;
}

/**
 * @param {string} participantId
 * @param {import('./week2DiscoveryTypes.js').Week2Assumption[]} assumptions
 */
export function saveAssumptions(participantId, assumptions) {
  const cleaned = assumptions
    .map((a) => ({ ...a, belief: String(a.belief ?? '').trim() }))
    .filter((a) => a.belief.length > 5)
    .slice(0, 6);
  const patch = { assumptions: cleaned };
  if (cleaned.length >= 2) {
    patch.assumptionsCompletedAt = new Date().toISOString();
  }
  const next = saveWeek2Discovery(participantId, patch);
  syncWeek2PortfolioArtifacts(participantId);
  return next;
}

/**
 * @param {string} participantId
 * @param {string} planText
 */
export function saveFieldResearchPlan(participantId, planText) {
  const text = String(planText ?? '').trim();
  const next = saveWeek2Discovery(participantId, {
    fieldResearchPlan: text,
    researchPlanSubmittedAt: text.length > 40 ? new Date().toISOString() : null,
  });
  if (text.length > 40) syncWeek2PortfolioArtifacts(participantId);
  return next;
}

/** @param {string} participantId */
export function acknowledgeSquadAlignment(participantId) {
  const next = saveWeek2Discovery(participantId, { squadAlignedAt: new Date().toISOString() });
  syncWeek2PortfolioArtifacts(participantId);
  return next;
}

/** @param {string} participantId */
export function acknowledgeMission(participantId) {
  return saveWeek2Discovery(participantId, { missionAcknowledged: true });
}

/**
 * @param {string} participantId
 * @param {number} interviewIndex 0-based
 * @param {{ alias?: string, occupation?: string, answers?: string[], reflection?: string }} data
 */
export function saveEncodedInterview(participantId, interviewIndex, data) {
  const state = loadWeek2Discovery(participantId);
  const interviews = [...(state.interviews ?? [])];
  while (interviews.length <= interviewIndex) {
    interviews.push({
      id: `iv-${interviews.length + 1}`,
      alias: '',
      occupation: '',
      answers: ['', '', '', '', ''],
      reflection: '',
      encoded: false,
    });
  }
  const answers = (data.answers ?? interviews[interviewIndex].answers ?? []).map((a) => String(a ?? '').trim());
  const filledAnswers = answers.filter((a) => a.length > 8);
  const encoded = filledAnswers.length >= 3 && String(data.alias ?? interviews[interviewIndex].alias ?? '').trim().length > 1;
  const aiInsights = encoded ? extractInterviewInsights(answers) : undefined;

  interviews[interviewIndex] = {
    ...interviews[interviewIndex],
    id: interviews[interviewIndex].id ?? `iv-${interviewIndex + 1}`,
    alias: String(data.alias ?? '').trim(),
    occupation: String(data.occupation ?? '').trim(),
    answers: answers.slice(0, MAX_INTERVIEW_QUESTIONS),
    reflection: String(data.reflection ?? '').trim(),
    encoded,
    aiInsights,
    encodedAt: encoded ? new Date().toISOString() : null,
  };

  const next = saveWeek2Discovery(participantId, { interviews });
  if (encodedCount(next) >= MIN_ENCODED_INTERVIEWS) {
    syncWeek2PortfolioArtifacts(participantId);
  }
  return next;
}

/** @param {import('./week2DiscoveryTypes.js').Week2DiscoveryState} state */
function encodedCount(state) {
  return (state.interviews ?? []).filter((i) => i.encoded).length;
}

/**
 * @param {string} participantId
 * @param {{ response: string, taskId?: string, prompt?: string }} input
 */
export function saveThinkingShift(participantId, input) {
  const state = loadWeek2Discovery(participantId);
  const shift = {
    id: `shift-${Date.now()}`,
    prompt: input.prompt ?? 'What changed your thinking today?',
    response: String(input.response ?? '').trim(),
    taskId: input.taskId ?? 'thinking',
    aiFrom: input.aiFrom ?? '',
    aiTo: input.aiTo ?? '',
    createdAt: new Date().toISOString(),
  };
  const thinkingShifts = [...(state.thinkingShifts ?? []), shift];
  return saveWeek2Discovery(participantId, { thinkingShifts });
}

/** @param {string} participantId @param {string} response */
export function saveExchangeReflection(participantId, response) {
  const text = String(response ?? '').trim();
  const next = saveWeek2Discovery(participantId, {
    exchangeReflectionAt: text.length > 15 ? new Date().toISOString() : null,
  });
  if (text.length > 15) {
    saveThinkingShift(participantId, {
      prompt: 'What pattern are you beginning to notice?',
      response: text,
      taskId: 'exchange',
    });
    syncWeek2PortfolioArtifacts(participantId);
  }
  return next;
}

/** @param {string} participantId @param {string} evidenceNote */
export function saveProfessionalReadiness(participantId, evidenceNote) {
  const text = String(evidenceNote ?? '').trim();
  const next = saveWeek2Discovery(participantId, {
    readinessEvidenceNote: text,
    professionalReadinessAt: text.length > 10 ? new Date().toISOString() : null,
  });
  if (text.length > 10) syncWeek2PortfolioArtifacts(participantId);
  return next;
}

/** @param {string} participantId @param {string} response */
export function saveReadinessReflection(participantId, response) {
  const text = String(response ?? '').trim();
  const next = saveWeek2Discovery(participantId, {
    readinessReflectionAt: text.length > 15 ? new Date().toISOString() : null,
  });
  if (text.length > 15) {
    saveThinkingShift(participantId, {
      prompt: 'What did you learn that will make you a better financial professional?',
      response: text,
      taskId: 'readiness-reflect',
    });
    syncWeek2PortfolioArtifacts(participantId);
  }
  return next;
}

/** @param {string} participantId */
export function markSynthesisReviewed(participantId) {
  const state = loadWeek2Discovery(participantId);
  if (encodedCount(state) < MIN_ENCODED_INTERVIEWS) return state;
  const next = saveWeek2Discovery(participantId, { synthesisReviewedAt: new Date().toISOString() });
  syncWeek2PortfolioArtifacts(participantId);
  return next;
}

/** @param {string} participantId @param {string} notes */
export function saveSquadDiscussionNotes(participantId, notes) {
  const text = String(notes ?? '').trim();
  const state = loadWeek2Discovery(participantId);
  const board = aggregateSquadIntelligence(state.interviews ?? []);
  const next = saveWeek2Discovery(participantId, {
    squadDiscussionNotes: text,
    intelligenceBoardAt: text.length > 20 && board.interviewCount >= MIN_ENCODED_INTERVIEWS
      ? new Date().toISOString()
      : state.intelligenceBoardAt,
  });
  if (next.intelligenceBoardAt) syncWeek2PortfolioArtifacts(participantId);
  return next;
}

/**
 * @param {string} participantId
 * @param {Partial<import('./week2DiscoveryTypes.js').Week2PitchOutline>} outline
 */
export function savePitchOutline(participantId, outline) {
  const state = loadWeek2Discovery(participantId);
  const merged = { ...state.pitchOutline, ...outline };
  const filled = Object.values(merged).filter((v) => String(v ?? '').trim().length > 10).length;
  const patch = { pitchOutline: merged };
  if (filled >= 3) patch.pitchStartedAt = new Date().toISOString();
  if (filled >= 7) patch.pitchSubmittedAt = new Date().toISOString();
  const next = saveWeek2Discovery(participantId, patch);
  if (patch.pitchStartedAt || patch.pitchSubmittedAt) syncWeek2PortfolioArtifacts(participantId);
  return next;
}

/** @param {string} participantId */
export function getSquadIntelligenceBoard(participantId) {
  const state = loadWeek2Discovery(participantId);
  return {
    ...aggregateSquadIntelligence(state.interviews ?? []),
    discussionNotes: state.squadDiscussionNotes ?? '',
  };
}

export function synthesizeThinkingShift(before, after) {
  const b = String(before ?? '').trim();
  const a = String(after ?? '').trim();
  if (!b && !a) return { from: '', to: '' };
  return {
    from: b || 'I thought I already understood my customer.',
    to: a || 'Now I realize I need real conversations before deciding.',
  };
}

/** @param {string} participantId @param {string} [squadName] */
export function getDreamConnection(participantId, squadName) {
  try {
    const coachRaw = localStorage.getItem('spike_venture_coach_v1');
    const coachAll = coachRaw ? JSON.parse(coachRaw) : {};
    const profile = coachAll[participantId]?.profile ?? {};
    const ambition = profile.ambition?.finalText ?? profile.ambition?.draft ?? '';
    const mission = resolveSquadMission(squadName);
    return {
      dream: ambition || 'Your venture dream',
      connection: `Today's research connects to understanding ${mission.marketSegment.toLowerCase()}.`,
    };
  } catch {
    return {
      dream: 'Your venture dream',
      connection: 'Customer discovery connects your dream to real people.',
    };
  }
}
