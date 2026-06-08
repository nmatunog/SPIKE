import { apiUrl } from '../apiClient.js';
import {
  AMBITION_MOTIVATOR_CARDS,
  COACH_VALUE_CARDS,
  FUTURE_SELF_GOALS,
  IMPACT_AUDIENCES,
  INCOME_SLIDER_LABELS,
  WORD_LIMITS,
} from './ventureCoachConstants.js';
import {
  generateAmbitionVariants,
  generateFutureSelfNarrative,
  generateFutureSelfSummary,
  generateImpactDraft,
  generateTagline,
  generateValuesProfile,
  labelFor,
  refineTextWithFeedback,
} from './ventureCoachEngine.js';

/** @typedef {'generate_ambition' | 'generate_impact' | 'generate_tagline' | 'generate_values' | 'generate_future_self' | 'regenerate_ambition' | 'regenerate_impact' | 'regenerate_purpose' | 'regenerate_tagline' | 'refine_statement'} CoachAiTask */

/** @typedef {'ambition' | 'impact' | 'purpose' | 'tagline' | 'values' | 'future-self'} CoachStatementType */

/**
 * @param {CoachStatementType | undefined} statementType
 * @param {CoachAiTask} task
 */
function resolveWordLimits(statementType, task) {
  if (task === 'generate_future_self' || statementType === 'future-self') {
    return { wordLimit: WORD_LIMITS.futureSelf.max, wordMin: WORD_LIMITS.futureSelf.min };
  }
  if (statementType === 'ambition' || task === 'generate_ambition' || task === 'regenerate_ambition') {
    return { wordLimit: WORD_LIMITS.ambition.max, wordMin: 0 };
  }
  if (statementType === 'impact' || statementType === 'purpose' || task === 'generate_impact') {
    return { wordLimit: WORD_LIMITS.impact.max, wordMin: 0 };
  }
  if (statementType === 'tagline' || task === 'generate_tagline' || task === 'regenerate_tagline') {
    return { wordLimit: WORD_LIMITS.tagline.max, wordMin: 0 };
  }
  if (statementType === 'values' || task === 'generate_values') {
    return { wordLimit: WORD_LIMITS.valuesProfile.max, wordMin: 0 };
  }
  return { wordLimit: WORD_LIMITS.ambition.max, wordMin: 0 };
}

/** @param {{ reason?: string, failures?: Array<{ provider: string, error: string }> }} info */
export function formatAiUnavailableMessage(info) {
  if (!info) return 'AI coach unavailable — using built-in templates.';
  if (info.reason === 'no_providers') {
    return 'AI coach is not configured on the server. Add GEMINI_API_KEY in Cloudflare (Production secrets).';
  }
  if (info.reason === 'endpoint_missing') {
    return 'Coach API endpoint not found. Redeploy with Pages Functions enabled.';
  }
  const detail = info.failures?.[0]?.error ?? '';
  if (/quota|rate limit/i.test(detail)) {
    return 'AI quota reached — using built-in coach. Check Gemini billing or wait a few minutes.';
  }
  if (/country|region|territory/i.test(detail)) {
    return 'OpenAI blocked this region from Cloudflare. Set GEMINI_API_KEY in Cloudflare secrets (primary provider).';
  }
  if (detail) return `AI unavailable (${detail.slice(0, 120)}) — using built-in coach.`;
  return 'AI coach unavailable — using built-in templates.';
}

/**
 * @param {{
 *   task: CoachAiTask,
 *   variant?: 'short' | 'balanced' | 'inspirational',
 *   fields?: Record<string, string>,
 *   statementType?: CoachStatementType,
 *   currentDraft?: string,
 *   refineAction?: string,
 *   wordLimit?: number,
 *   wordMin?: number,
 * }} input
 * @returns {Promise<{ text?: string, note?: string, provider?: string, variants?: object, summary?: string, unavailable?: boolean, reason?: string, failures?: Array<{ provider: string, error: string }> } | null>}
 */
export async function requestCoachAiGeneration(input) {
  if (import.meta.env.VITE_COACH_AI === 'false') {
    return { unavailable: true, reason: 'disabled' };
  }

  const limits = resolveWordLimits(input.statementType, input.task);

  try {
    const res = await fetch(apiUrl('/api/coach/generate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task: input.task,
        variant: input.variant,
        fields: input.fields,
        wordLimit: input.wordLimit ?? limits.wordLimit,
        wordMin: input.wordMin ?? limits.wordMin,
        statementType: input.statementType,
        currentDraft: input.currentDraft,
        refineAction: input.refineAction,
      }),
    });

    const raw = await res.text();
    if (/^\s*<(!DOCTYPE|html)/i.test(raw)) {
      return {
        unavailable: true,
        reason: 'endpoint_missing',
        failures: [{ provider: 'api', error: 'Received HTML instead of JSON from /api/coach/generate.' }],
      };
    }

    let data = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      return {
        unavailable: true,
        reason: 'bad_response',
        failures: [{ provider: 'api', error: raw.slice(0, 120) || res.statusText }],
      };
    }

    if (res.status === 503) {
      return {
        unavailable: true,
        reason: data?.reason ?? 'providers_failed',
        failures: data?.failures ?? [],
      };
    }

    if (!res.ok || (!data?.text && !data?.variants)) {
      return {
        unavailable: true,
        reason: 'request_failed',
        failures: [{ provider: 'api', error: data?.message ?? res.statusText }],
      };
    }

    return {
      text: data.text ? String(data.text) : String(data.variants?.balanced ?? ''),
      note: String(data.note ?? 'Draft updated.'),
      provider: data.provider ?? 'ai',
      variants: data.variants ?? null,
      summary: data.summary ? String(data.summary) : '',
    };
  } catch (err) {
    return {
      unavailable: true,
      reason: 'network',
      failures: [{ provider: 'api', error: String(/** @type {Error} */ (err).message ?? err) }],
    };
  }
}

/**
 * @param {'ambition' | 'impact' | 'purpose' | 'tagline'} statementType
 */
export function coachAiTaskForStatementType(statementType) {
  if (statementType === 'ambition') return 'regenerate_ambition';
  if (statementType === 'impact' || statementType === 'purpose') return 'regenerate_impact';
  return 'regenerate_tagline';
}

/**
 * @param {Record<string, unknown>} data
 */
export async function generateAmbitionVariantsWithAi(data) {
  const ids = /** @type {string[]} */ (data.rankedMotivators ?? data.selectedMotivators ?? []).slice(0, 3);
  const labels = ids.map((id) => labelFor(id, AMBITION_MOTIVATOR_CARDS)).join(', ');

  const ai = await requestCoachAiGeneration({
    task: 'generate_ambition',
    fields: { motivators: labels },
    statementType: 'ambition',
  });

  if (ai?.variants?.balanced) {
    return {
      variants: ai.variants,
      note: ai.note,
      provider: ai.provider,
    };
  }
  if (ai?.text && !ai.unavailable) {
    const single = ai.text;
    return {
      variants: { short: single, balanced: single, inspirational: single },
      note: ai.note,
      provider: ai.provider,
    };
  }

  return {
    variants: generateAmbitionVariants(data),
    note: formatAiUnavailableMessage(ai ?? undefined),
    provider: 'local',
  };
}

/**
 * @param {Record<string, unknown>} data
 */
export async function generateImpactDraftWithAi(data) {
  const audiences = /** @type {string[]} */ (data.audiences ?? data.drivers ?? []).slice(0, 2);
  const labels = audiences.map((id) => labelFor(id, IMPACT_AUDIENCES)).join(', ');

  const ai = await requestCoachAiGeneration({
    task: 'generate_impact',
    fields: { audiences: labels },
    statementType: 'impact',
  });

  if (ai?.text && !ai.unavailable) {
    return { text: ai.text, note: ai.note, provider: ai.provider };
  }

  return {
    text: generateImpactDraft(data),
    note: formatAiUnavailableMessage(ai ?? undefined),
    provider: 'local',
  };
}

/**
 * @param {{ ambition?: string, impact?: string, topThree?: string[] }} data
 */
export async function generateTaglineWithAi(data) {
  const values = labelsForValues(data.topThree ?? []);

  const ai = await requestCoachAiGeneration({
    task: 'generate_tagline',
    fields: {
      ambition: String(data.ambition ?? ''),
      impact: String(data.impact ?? ''),
      values: values.join(', '),
    },
    statementType: 'tagline',
  });

  if (ai?.text) {
    return { text: ai.text, note: ai.note, provider: ai.provider };
  }

  return { text: generateTagline(data), note: '', provider: 'local' };
}

/**
 * @param {string[]} topThree
 */
export async function generateValuesProfileWithAi(topThree) {
  const labels = topThree.map((id, i) => `${i + 1}. ${labelFor(id, COACH_VALUE_CARDS)}`).join(', ');

  const ai = await requestCoachAiGeneration({
    task: 'generate_values',
    fields: { values: labels },
    statementType: 'values',
  });

  const ranked = topThree.map((id, i) => `${i + 1}. ${labelFor(id, COACH_VALUE_CARDS)}`).join('\n');
  if (ai?.text) {
    return { profile: `${ranked}\n\n${ai.text}`, note: ai.note, provider: ai.provider };
  }

  const narrative = generateValuesProfile(topThree);
  return { profile: `${ranked}\n\n${narrative}`, note: '', provider: 'local' };
}

/**
 * @param {Record<string, unknown>} data
 */
export async function generateFutureSelfWithAi(data) {
  const goals = /** @type {string[]} */ (data.goals ?? []);
  const goalLabels = goals.map((id) => labelFor(id, FUTURE_SELF_GOALS)).join(', ');
  const income =
    INCOME_SLIDER_LABELS.find((l) => l.value === data.incomeLevel)?.label ?? 'High performer';

  const ai = await requestCoachAiGeneration({
    task: 'generate_future_self',
    fields: {
      goals: goalLabels,
      income,
      impact: String(data.impact ?? ''),
      successVision: String(data.successVision ?? ''),
    },
    statementType: 'future-self',
  });

  if (ai?.text) {
    const summary = ai.summary || generateFutureSelfSummary(ai.text, { goals });
    return { text: ai.text, summary, note: ai.note, provider: ai.provider };
  }

  const narrative = generateFutureSelfNarrative(data);
  return {
    text: narrative,
    summary: generateFutureSelfSummary(narrative, { goals }),
    note: '',
    provider: 'local',
  };
}

/**
 * @param {string} draft
 * @param {string} actionId
 * @param {{ label: string, tooltip?: string }} action
 * @param {number} maxWords
 * @param {CoachStatementType} statementType
 * @param {number} [wordMin]
 */
export async function refineStatementWithAi(draft, actionId, action, maxWords, statementType, wordMin = 0) {
  const ai = await requestCoachAiGeneration({
    task: 'refine_statement',
    currentDraft: draft,
    refineAction: `${action.label}: ${action.tooltip ?? action.label}`,
    statementType,
    wordLimit: maxWords,
    wordMin,
  });

  if (ai?.text && !ai.unavailable) {
    return { text: ai.text, note: ai.note, provider: ai.provider };
  }

  const local = refineTextWithFeedback(draft, actionId, maxWords, statementType);
  if (ai?.unavailable) {
    return {
      ...local,
      note: `${local.note} ${formatAiUnavailableMessage(ai)}`.trim(),
      provider: 'local',
    };
  }

  return { ...local, provider: 'local' };
}

/** @param {string[]} topThree */
function labelsForValues(topThree) {
  return topThree.map((id) => labelFor(id, COACH_VALUE_CARDS));
}
