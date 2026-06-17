/**
 * Venture Design Studio — coach feedback (prototype + optional OpenAI).
 */
import { apiUrl } from '../apiClient.js';
import { buildUvpSentence } from './ventureDesignStudioService.js';

/** @typedef {{ title: string, coach: string, bias?: string, keywords?: string[], provider?: string }} VentureDesignCoachFeedback */

/** @param {number} stepIndex @param {import('./ventureDesignStudioService.js').VentureDesignIndividualDraft} draft @param {string} [squadName] */
export function getVentureDesignCoachFeedback(stepIndex, draft, squadName = '') {
  const segment = draft.step1.customer || squadName || 'your target segment';
  const problem = draft.step1.problem || 'the core problem';
  const uvp = buildUvpSentence(draft);

  /** @type {Record<number, VentureDesignCoachFeedback>} */
  const byStep = {
    1: {
      title: 'Venture Review',
      bias: 'Urgency check — is this a bleeding-neck problem?',
      coach: `Your problem focuses on "${problem.slice(0, 80)}${problem.length > 80 ? '…' : ''}". For ${segment}, stress why this is urgent today — not a minor inconvenience. If it is not urgent, they will not buy.`,
      keywords: ['urgent', 'daily stress', 'income volatility', 'unprotected'],
    },
    2: {
      title: 'Psychology Check',
      bias: 'Sell the emotional shift, not the product.',
      coach: `Strong ventures name a before-state (${draft.step2.beforeFeeling || 'anxiety'}) and an after-state (${draft.step2.afterFeeling || 'empowerment'}). Your squad should consolidate one emotional promise the whole team can defend.`,
      keywords: ['anxious', 'empowered', 'relieved', 'in control'],
    },
    3: {
      title: 'UVP Polish',
      bias: 'Mechanism vs transformation balance.',
      coach: `Your draft UVP: "${uvp}" — simplify until a 10-year-old understands the transformation. De-emphasize jargon; lead with the life change for ${segment}.`,
      keywords: ['simple', 'trusted', 'affordable', 'habit-based'],
    },
    4: {
      title: 'Brand Cohesion',
      bias: 'Personality must match the after-feeling.',
      coach: `Brand "${draft.step4.name || 'your venture'}" should feel ${draft.step2.afterFeeling || 'empowering'} to clients. Do your personality traits and tagline "${draft.step4.tagline || '…'}" reinforce that same promise?`,
      keywords: ['approachable', 'expert', 'community', 'premium'],
    },
    5: {
      title: 'Canvas Snapshot',
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
  const fallback = getVentureDesignCoachFeedback(stepIndex, draft, squadName);
  if (import.meta.env.VITE_COACH_AI === 'false') return fallback;

  try {
    const res = await fetch(apiUrl('/api/coach/generate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task: 'venture_design_coach',
        stepIndex,
        fields: {
          segment: draft.step1.customer,
          problem: draft.step1.problem,
          opportunity: draft.step1.opportunity,
          before: draft.step2.beforeFeeling,
          after: draft.step2.afterFeeling,
          uvp: buildUvpSentence(draft),
          brand: draft.step4.name,
          tagline: draft.step4.tagline,
        },
        localHint: { coach: fallback.coach, bias: fallback.bias },
      }),
    });
    if (!res.ok) return fallback;
    const data = await res.json();
    const coach = String(data.coach ?? data.reply ?? '').trim();
    if (!coach) return fallback;
    return { ...fallback, coach, provider: data.provider ?? 'openai' };
  } catch {
    return fallback;
  }
}

export const VENTURE_DESIGN_COACH_THINK_MS = 650;
