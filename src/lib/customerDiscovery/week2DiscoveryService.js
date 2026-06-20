/**
 * Week 2 Customer Discovery — CRUD and business rules.
 */
import { loadWeek2Discovery, saveWeek2Discovery } from './week2DiscoveryStorage.js';
import { MAX_INTERVIEW_QUESTIONS } from './week2Constants.js';
import { resolveSquadMission } from './week2Constants.js';
import { syncWeek2Day1Portfolio } from './week2PortfolioSync.js';

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

/** @param {string} participantId */
export function acknowledgeMission(participantId) {
  return saveWeek2Discovery(participantId, { missionAcknowledged: true });
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

/**
 * Lightweight local AI synthesis for thinking shift (no API call required for Phase B).
 * @param {string} before
 * @param {string} after
 */
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
    const mission = resolveSquadMissionFromName(squadName);
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

/** @param {string} [squadName] */
function resolveSquadMissionFromName(squadName) {
  return resolveSquadMission(squadName);
}
