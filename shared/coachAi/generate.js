import { callGemini, callOpenAI, shouldTryNextProvider } from './providers.js';

/**
 * Try Gemini first (default); venture_studio_coach prefers OpenAI.
 * On quota/rate limits try the other provider; return null if no provider succeeds.
 * @param {Record<string, unknown>} payload
 * @param {{ geminiApiKey?: string, openaiApiKey?: string }} keys
 */
export async function generateCoachText(payload, keys = {}) {
  const task = String(payload.task ?? '');
  const preferOpenAI = task === 'venture_studio_coach' || task === 'venture_design_coach';

  /** @type {Array<{ provider: string, run: () => Promise<Record<string, unknown>> }>} */
  const attempts = [];

  if (preferOpenAI) {
    if (keys.openaiApiKey) {
      attempts.push({
        provider: 'openai',
        run: () => callOpenAI(keys.openaiApiKey, payload),
      });
    }
    if (keys.geminiApiKey) {
      attempts.push({
        provider: 'gemini',
        run: () => callGemini(keys.geminiApiKey, payload),
      });
    }
  } else {
    if (keys.geminiApiKey) {
      attempts.push({
        provider: 'gemini',
        run: () => callGemini(keys.geminiApiKey, payload),
      });
    }
    if (keys.openaiApiKey) {
      attempts.push({
        provider: 'openai',
        run: () => callOpenAI(keys.openaiApiKey, payload),
      });
    }
  }

  if (!attempts.length) {
    return { ok: false, reason: 'no_providers' };
  }

  /** @type {Array<{ provider: string, error: string }>} */
  const failures = [];

  for (const attempt of attempts) {
    try {
      const result = await attempt.run();
    return {
      ok: true,
      provider: attempt.provider,
      text: result.text,
      bias: result.bias,
      evidenceScore: result.evidenceScore,
      note: result.note,
      variants: result.variants,
      summary: result.summary,
    };
    } catch (err) {
      failures.push({
        provider: attempt.provider,
        error: String(/** @type {Error} */ (err).message ?? err),
      });
      if (!shouldTryNextProvider(err)) break;
    }
  }

  return { ok: false, reason: 'providers_failed', failures };
}
