import { generateCoachText } from '../../../shared/coachAi/generate.js';
import {
  buildCohortFinalistsPrompt,
  parseCohortFinalistsResponse,
} from '../../../shared/coachAi/cohortFinalistsPrompt.js';

/** @param {Request} request @param {Record<string, unknown>} env */
export async function onRequestPost({ request, env }) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ message: 'Invalid JSON body.' }, 400);
  }

  const suggestions = Array.isArray(body?.suggestions) ? body.suggestions : [];
  if (!suggestions.length) {
    return json({ message: 'suggestions array is required.' }, 400);
  }

  const prompt = buildCohortFinalistsPrompt(suggestions);
  const result = await generateCoachText(
    { task: 'generate_cohort_finalists', prompt, wordLimit: 800 },
    { geminiApiKey: env.GEMINI_API_KEY, openaiApiKey: env.OPENAI_API_KEY },
  );

  if (!result.ok) {
    return json(
      { message: 'AI unavailable.', reason: result.reason, failures: result.failures ?? [] },
      503,
    );
  }

  let finalists = parseCohortFinalistsResponse(result.text);
  if (!finalists.length) {
    finalists = fallbackFinalists(suggestions);
  }

  return json({ finalists, provider: result.provider });
}

/** @param {Array<{ suggested_name: string }>} suggestions */
function fallbackFinalists(suggestions) {
  const seen = new Set();
  const out = [];
  for (const s of suggestions) {
    const name = String(s.suggested_name ?? '').trim();
    const key = name.toLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    out.push({ name, mergedFrom: [name] });
    if (out.length >= 5) break;
  }
  return out;
}

/** @param {unknown} data @param {number} status */
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}
