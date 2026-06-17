/**
 * Day 3 Venture Studio — prototype coach (pre-coded prompts, simulated think time).
 */
import {
  getVentureStudioCoachFeedback,
  VENTURE_STUDIO_COACH_THINK_MS,
} from './ventureStudioCoachPrompts.js';

/** @typedef {import('./ventureStudioCoachPrompts.js').VentureStudioCoachFeedback} VentureStudioCoachFeedback */

/** @typedef {import('./ventureStudioTypes.js').VentureStudioState} VentureStudioContext */

export { getVentureStudioCoachFeedback, VENTURE_STUDIO_COACH_BY_STEP } from './ventureStudioCoachPrompts.js';

/**
 * @param {number} stepIndex
 * @param {VentureStudioContext} ctx
 * @returns {Promise<VentureStudioCoachFeedback>}
 */
export async function requestVentureStudioCoachFeedback(stepIndex, ctx) {
  await new Promise((resolve) => {
    setTimeout(resolve, VENTURE_STUDIO_COACH_THINK_MS);
  });
  return getVentureStudioCoachFeedback(stepIndex, ctx);
}
