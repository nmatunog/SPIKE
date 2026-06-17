/**
 * Day 3 Venture Studio — OpenAI coach via /api/coach/generate, prototype fallback offline.
 */
import { apiUrl } from '../apiClient.js';
import { GOAL_LABELS } from './ventureStudioTypes.js';
import {
  getVentureStudioCoachFeedback,
} from './ventureStudioCoachPrompts.js';

/** @typedef {import('./ventureStudioCoachPrompts.js').VentureStudioCoachFeedback} VentureStudioCoachFeedback */

/** @typedef {import('./ventureStudioTypes.js').VentureStudioState} VentureStudioContext */

export { getVentureStudioCoachFeedback, VENTURE_STUDIO_COACH_BY_STEP } from './ventureStudioCoachPrompts.js';

/** @param {number} stepIndex @param {VentureStudioContext} ctx */
function buildCoachPayloadFields(stepIndex, ctx) {
  const selectedGoals = Object.entries(ctx.step2.goals)
    .filter(([, on]) => on)
    .map(([key]) => GOAL_LABELS[key] ?? key);

  return {
    step: String(stepIndex),
    squadName: ctx.squadName,
    targetSegment: ctx.targetSegment,
    stage: ctx.step1.stage,
    dayInLife: ctx.step1.dayInLife,
    surprise: ctx.step1.surprise,
    goals: selectedGoals.join(', '),
    whyImportant: ctx.step2.whyImportant,
    problems: ctx.step3
      .map((r, i) => `${i + 1}. ${r.problem} | evidence: ${r.evidence} | ${r.confidence}`)
      .join('\n'),
    solutions: ctx.step4
      .map((r, i) => `${i + 1}. ${r.solution} | limits: ${r.limitations}`)
      .join('\n'),
    insight: ctx.step5.suggests,
    unmetNeed: ctx.step5.unmetNeed,
    valueCreation: ctx.step5.valueCreation,
    evidenceNotes: ctx.evidenceList
      .filter((e) => e.type === 'note')
      .map((e) => e.content)
      .slice(0, 5)
      .join(' | '),
    evidenceCount: String(ctx.evidenceList.length),
  };
}

/**
 * @param {number} stepIndex
 * @param {VentureStudioContext} ctx
 * @returns {Promise<VentureStudioCoachFeedback>}
 */
export async function requestVentureStudioCoachFeedback(stepIndex, ctx) {
  const fallback = getVentureStudioCoachFeedback(stepIndex, ctx);

  if (import.meta.env.VITE_COACH_AI === 'false') {
    return fallback;
  }

  try {
    const res = await fetch(apiUrl('/api/coach/generate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task: 'venture_studio_coach',
        stepIndex,
        fields: buildCoachPayloadFields(stepIndex, ctx),
        localHint: { bias: fallback.bias, coach: fallback.coach },
      }),
    });

    const raw = await res.text();
    if (/^\s*<(!DOCTYPE|html)/i.test(raw)) {
      return fallback;
    }

    let data = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      return fallback;
    }

    if (!res.ok || data?.unavailable) {
      return fallback;
    }

    const coach = String(data.coach ?? data.text ?? '').trim();
    const bias = String(data.bias ?? '').trim();
    if (!coach) return fallback;

    return {
      bias: bias || fallback.bias,
      coach,
      evidenceScore: String(data.evidenceScore ?? fallback.evidenceScore),
      provider: data.provider ?? 'openai',
    };
  } catch {
    return fallback;
  }
}
