import { buildCoachPrompt, parseModelJson } from './prompts.js';

/** @param {unknown} err */
export function isProviderLimitError(err) {
  const status = /** @type {{ status?: number }} */ (err)?.status;
  if (status === 429 || status === 503) return true;
  const message = String(/** @type {{ message?: string }} */ (err)?.message ?? err ?? '');
  return /quota|rate limit|resource exhausted|too many requests|capacity|overloaded/i.test(message);
}

/** @param {unknown} err */
export function shouldTryNextProvider(err) {
  if (isProviderLimitError(err)) return true;
  const status = /** @type {{ status?: number }} */ (err)?.status;
  return status === 502;
}

/**
 * @param {Response} res
 * @param {string} provider
 */
async function readProviderError(res, provider) {
  const text = await res.text();
  let message = text;
  try {
    const data = JSON.parse(text);
    message = data?.error?.message ?? data?.message ?? text;
  } catch {
    // keep raw text
  }
  const err = new Error(`${provider}: ${message || res.statusText}`);
  /** @type {Error & { status?: number }} */ (err).status = res.status;
  throw err;
}

/**
 * @param {string} apiKey
 * @param {Record<string, unknown>} payload
 */
export async function callGemini(apiKey, payload) {
  const prompt = buildCoachPrompt(payload);
  const model = payload.model ?? 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.65,
        maxOutputTokens: 320,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!res.ok) await readProviderError(res, 'gemini');

  const data = await res.json();
  const raw =
    data?.candidates?.[0]?.content?.parts?.map((part) => part.text).join('') ?? '';
  const parsed = parseModelJson(raw);
  if (!parsed) {
    const err = new Error('gemini: Could not parse model response.');
    /** @type {Error & { status?: number }} */ (err).status = 502;
    throw err;
  }
  return parsed;
}

/**
 * @param {string} apiKey
 * @param {Record<string, unknown>} payload
 */
export async function callOpenAI(apiKey, payload) {
  const prompt = buildCoachPrompt(payload);
  const model = payload.openaiModel ?? 'gpt-4o-mini';

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are SPIKE Venture Coach. Reply with JSON only: {"text":"...","note":"..."}.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 320,
      temperature: 0.65,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) await readProviderError(res, 'openai');

  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content ?? '';
  const parsed = parseModelJson(raw);
  if (!parsed) {
    const err = new Error('openai: Could not parse model response.');
    /** @type {Error & { status?: number }} */ (err).status = 502;
    throw err;
  }
  return parsed;
}
