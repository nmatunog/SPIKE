import { apiUrl } from '../apiClient.js';
import { WORD_LIMITS } from './ventureCoachConstants.js';

/** @typedef {'regenerate_ambition' | 'regenerate_impact' | 'regenerate_purpose' | 'regenerate_tagline' | 'refine_statement'} CoachAiTask */

/**
 * @param {{
 *   task: CoachAiTask,
 *   variant?: 'short' | 'balanced' | 'inspirational',
 *   fields?: Record<string, string>,
 *   statementType?: 'ambition' | 'impact' | 'purpose' | 'tagline',
 *   currentDraft?: string,
 *   refineAction?: string,
 * }} input
 */
export async function requestCoachAiGeneration(input) {
  if (import.meta.env.VITE_COACH_AI === 'false') {
    return null;
  }

  const wordLimit =
    input.statementType === 'ambition'
      ? WORD_LIMITS.ambition.max
      : input.statementType === 'impact' || input.statementType === 'purpose'
        ? WORD_LIMITS.impact.max
        : input.statementType === 'tagline'
          ? WORD_LIMITS.tagline.max
          : WORD_LIMITS.futureSelf.max;

  try {
    const res = await fetch(apiUrl('/api/coach/generate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task: input.task,
        variant: input.variant,
        fields: input.fields,
        wordLimit,
        currentDraft: input.currentDraft,
        refineAction: input.refineAction,
      }),
    });

    if (res.status === 503) return null;

    const data = await res.json();
    if (!res.ok || !data?.text) return null;

    return {
      text: String(data.text),
      note: String(data.note ?? 'Draft updated.'),
      provider: data.provider ?? 'ai',
    };
  } catch {
    return null;
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
