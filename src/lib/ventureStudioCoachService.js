/**
 * Day 3 Venture Studio — contextual coach feedback (AI + local heuristics).
 */
import { apiUrl } from '../apiClient.js';
import {
  buildVentureStudioCoachPayloadFields,
  evaluateVentureStudioStepLocally,
} from './ventureStudioCoachLocal.js';

/** @typedef {import('./ventureStudioCoachLocal.js').VentureStudioCoachFeedback} VentureStudioCoachFeedback */

/** @typedef {import('./ventureStudioTypes.js').VentureStudioState} VentureStudioContext */

export { evaluateVentureStudioStepLocally } from './ventureStudioCoachLocal.js';

/**
 * @param {number} stepIndex
 * @param {VentureStudioContext} ctx
 * @returns {Promise<VentureStudioCoachFeedback>}
 */
export async function requestVentureStudioCoachFeedback(stepIndex, ctx) {
  const local = evaluateVentureStudioStepLocally(stepIndex, ctx);

  if (import.meta.env.VITE_COACH_AI === 'false') {
    return local;
  }

  try {
    const res = await fetch(apiUrl('/api/coach/generate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task: 'venture_studio_coach',
        stepIndex,
        fields: buildVentureStudioCoachPayloadFields(stepIndex, ctx),
        localHint: { bias: local.bias, coach: local.coach },
      }),
    });

    const raw = await res.text();
    let data = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      return local;
    }

    if (!res.ok || data?.unavailable) {
      return local;
    }

    const coach = String(data.coach ?? data.text ?? '').trim();
    const bias = String(data.bias ?? data.note ?? '').trim();
    if (!coach) return local;

    return {
      bias: bias || local.bias,
      coach,
      evidenceScore: String(data.evidenceScore ?? local.evidenceScore),
      provider: data.provider ?? 'ai',
    };
  } catch {
    return local;
  }
}
