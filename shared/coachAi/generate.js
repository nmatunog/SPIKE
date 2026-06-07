import { callGemini, callOpenAI, shouldTryNextProvider } from './providers.js';

/**
 * Try Gemini first; on quota/rate limits try OpenAI; return null if no provider succeeds.
 * @param {Record<string, unknown>} payload
 * @param {{ geminiApiKey?: string, openaiApiKey?: string }} keys
 */
export async function generateCoachText(payload, keys = {}) {
  const attempts = [];

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
        note: result.note,
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
