/**
 * Day 3 Venture Studio — deterministic prototype coach copy per step.
 * Pre-coded for UI/UX flow testing: same educational prompt every intern sees on each step.
 * Only `{segment}` is interpolated so feedback names their target market.
 */

/** @typedef {{ bias: string, coach: string, evidenceScore: string, provider?: 'prototype' | 'openai' | 'gemini' | string }} VentureStudioCoachFeedback */

/** @typedef {import('./ventureStudioTypes.js').VentureStudioState} VentureStudioContext */

/** @type {Record<number, { bias: string, coach: string, evidenceScore: string }>} */
export const VENTURE_STUDIO_COACH_BY_STEP = {
  1: {
    bias: 'Demographic bias risk — you described who they are, not how they live with money.',
    coach:
      'I notice your description of "{segment}" lacks behavioral insight. How exactly do they interact with money daily? What is the very first thing they do when a paycheck or client payment clears? Dig into behaviors.',
    evidenceScore: '4/10',
  },
  2: {
    bias: 'Emotion before logic — goals may be assumed, not evidenced.',
    coach:
      'For "{segment}", which goals did your squad hear twice in the field — not what you think they should want? Pick one priority and explain the fear behind it in their own words.',
    evidenceScore: '5/10',
  },
  3: {
    bias: 'Pain without proof — problems need customer language.',
    coach:
      'Name one financial pain for "{segment}" that keeps them awake. Start with a verbatim quote from observation or interview, then ask: is this the root problem or just a symptom?',
    evidenceScore: '6/10',
  },
  4: {
    bias: 'Workarounds named — gap and inertia still unclear.',
    coach:
      'How is "{segment}" coping with their top problem today — app, family, loan, or avoidance? Where does that workaround break down, and what would actually make them switch?',
    evidenceScore: '7/10',
  },
  5: {
    bias: 'Product pitch risk — lead with life change, not policy language.',
    coach:
      'State your opportunity for "{segment}" in one sentence a customer would say after 30 days. No product jargon — what stress disappears and what peace of mind feels like?',
    evidenceScore: '8/10',
  },
};

const FALLBACK_SEGMENT = 'your segment';

/**
 * @param {number} stepIndex
 * @param {VentureStudioContext} ctx
 * @returns {VentureStudioCoachFeedback}
 */
export function getVentureStudioCoachFeedback(stepIndex, ctx) {
  const template = VENTURE_STUDIO_COACH_BY_STEP[stepIndex] ?? {
    bias: 'Review your squad answers together before moving on.',
    coach:
      'What is the single most surprising thing your evidence revealed about "{segment}"?',
    evidenceScore: '5/10',
  };

  const segment = ctx.targetSegment.trim() || FALLBACK_SEGMENT;
  const coach = template.coach.replaceAll('{segment}', segment);

  return {
    bias: template.bias,
    coach,
    evidenceScore: template.evidenceScore,
    provider: 'prototype',
  };
}

/** Brief pause so the coach panel feels responsive without a real API. */
export const VENTURE_STUDIO_COACH_THINK_MS = 650;
