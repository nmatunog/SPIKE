/**
 * Venture Design Studio — coach feedback (Day 4 FEC only; prototype + optional OpenAI).
 */
import { apiUrl } from '../apiClient.js';
import { buildUvpSentence } from './ventureDesignStudioService.js';
import { assessVentureDesignCoachReadiness } from './ventureDesignCoachReadiness.js';
import { acceptVentureDesignCoachResponse } from './ventureDesignCoachValidation.js';
import { VENTURE_DESIGN_STEPS } from './ventureDesignStudioConstants.js';

/** @typedef {{ title: string, coach: string, bias?: string, keywords?: string[], provider?: string }} VentureDesignCoachFeedback */

/** @param {number} stepIndex @param {import('./ventureDesignStudioService.js').VentureDesignIndividualDraft} draft @param {string} [squadName] */
function buildCoachPayloadFields(stepIndex, draft, squadName = '') {
  return {
    step: String(stepIndex),
    squadName,
    programDay: 'Day 4 — Venture Design Studio (FEC)',
    targetSegment: draft.step1.customer,
    customerProblem: draft.step1.problem,
    opportunity: draft.step1.opportunity,
    beforeFeeling: draft.step2.beforeFeeling,
    afterFeeling: draft.step2.afterFeeling,
    uvp: buildUvpSentence(draft),
    whoServe: draft.step3.whoServe,
    transformation: draft.step3.transformation,
    whyUs: draft.step3.whyUs,
    mechanism: draft.step3.different,
    ventureName: draft.step4.name,
    tagline: draft.step4.tagline,
    clientExperience: draft.step4.clientFeeling,
    coachStepTitle: VENTURE_DESIGN_STEPS[stepIndex - 1]?.coachTitle ?? 'Venture Design',
  };
}

/** @param {number} stepIndex @param {import('./ventureDesignStudioService.js').VentureDesignIndividualDraft} draft @param {string} [squadName] */
export function getVentureDesignCoachFeedback(stepIndex, draft, squadName = '') {
  const segment = draft.step1.customer || squadName || 'your target segment';
  const problem = draft.step1.problem || 'the core problem';
  const uvp = buildUvpSentence(draft);
  const stepMeta = VENTURE_DESIGN_STEPS[stepIndex - 1];

  /** @type {Record<number, VentureDesignCoachFeedback>} */
  const byStep = {
    1: {
      title: stepMeta?.coachTitle ?? 'Venture Review',
      bias: 'Urgency check — is this a bleeding-neck problem for your client?',
      coach: `For ${segment}, your problem statement focuses on "${problem.slice(0, 80)}${problem.length > 80 ? '…' : ''}". Stress why this is urgent for them today — not a minor inconvenience. Coach reviews your client’s pain, not your personal internship goals.`,
      keywords: ['urgent', 'daily stress', 'income volatility', 'unprotected'],
    },
    2: {
      title: stepMeta?.coachTitle ?? 'Psychology Check',
      bias: 'Sell the emotional shift, not the product.',
      coach: `Strong ventures name a before-state (${draft.step2.beforeFeeling || 'anxiety'}) and an after-state (${draft.step2.afterFeeling || 'empowerment'}) for ${segment}. Your squad should consolidate one emotional promise the whole team can defend.`,
      keywords: ['anxious', 'empowered', 'relieved', 'in control'],
    },
    3: {
      title: stepMeta?.coachTitle ?? 'UVP Polish',
      bias: 'Mechanism vs transformation balance.',
      coach: `Your draft UVP: "${uvp}" — simplify until a 10-year-old understands the transformation for ${segment}. De-emphasize jargon; lead with the life change.`,
      keywords: ['simple', 'trusted', 'affordable', 'habit-based'],
    },
    4: {
      title: stepMeta?.coachTitle ?? 'Brand Cohesion',
      bias: 'Personality must match the after-feeling.',
      coach: `Brand "${draft.step4.name || 'your venture'}" should feel ${draft.step2.afterFeeling || 'empowering'} to ${segment}. Do your personality traits and tagline "${draft.step4.tagline || '…'}" reinforce that same promise?`,
      keywords: ['approachable', 'expert', 'community', 'premium'],
    },
    5: {
      title: stepMeta?.coachTitle ?? 'Canvas Snapshot',
      bias: 'UVP is the anchor — everything else builds around it.',
      coach: `Your UVP is the core of the Financial Entrepreneurship Canvas. In coming weeks you will add partners, resources, and scorecard metrics — but every box must strengthen: ${uvp}`,
      keywords: ['operating model', 'scorecard', 'roadmap'],
    },
  };

  return { ...byStep[stepIndex], provider: 'prototype' };
}

/**
 * @param {number} stepIndex
 * @param {import('./ventureDesignStudioService.js').VentureDesignIndividualDraft} draft
 * @param {string} [squadName]
 * @returns {Promise<VentureDesignCoachFeedback>}
 */
export async function requestVentureDesignCoachFeedback(stepIndex, draft, squadName = '') {
  const readiness = assessVentureDesignCoachReadiness(stepIndex, draft);
  if (!readiness.ready && readiness.feedback) {
    return readiness.feedback;
  }

  const fields = buildCoachPayloadFields(stepIndex, draft, squadName);
  const fallback = getVentureDesignCoachFeedback(stepIndex, draft, squadName);
  if (import.meta.env.VITE_COACH_AI === 'false') return fallback;

  try {
    const res = await fetch(apiUrl('/api/coach/generate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task: 'venture_design_coach',
        stepIndex,
        fields,
        localHint: { coach: fallback.coach, bias: fallback.bias },
      }),
    });

    const raw = await res.text();
    if (/^\s*<(!DOCTYPE|html)/i.test(raw)) return fallback;

    let data = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      return fallback;
    }

    if (!res.ok || data?.unavailable) return fallback;

    const coach = String(data.coach ?? data.text ?? '').trim();
    const bias = String(data.bias ?? '').trim();
    if (!coach) return fallback;

    const accepted = acceptVentureDesignCoachResponse(coach, fallback, fields);
    return {
      ...accepted,
      bias: bias || accepted.bias,
      provider: accepted.coach === coach ? (data.provider ?? 'openai') : 'prototype',
    };
  } catch {
    return fallback;
  }
}

export const VENTURE_DESIGN_COACH_THINK_MS = 650;
