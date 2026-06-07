import { generateCoachText } from '../../../shared/coachAi/generate.js';

/** @param {Request} request @param {Record<string, unknown>} env */
export async function onRequestPost({ request, env }) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ message: 'Invalid JSON body.' }, 400);
  }

  const task = String(body?.task ?? '');
  if (!task) {
    return json({ message: 'task is required.' }, 400);
  }

  const result = await generateCoachText(body, {
    geminiApiKey: env.GEMINI_API_KEY,
    openaiApiKey: env.OPENAI_API_KEY,
  });

  if (!result.ok) {
    return json(
      {
        message: 'AI coach unavailable.',
        reason: result.reason,
        failures: result.failures ?? [],
      },
      503,
    );
  }

  return json({
    text: result.text,
    note: result.note,
    provider: result.provider,
    variants: result.variants,
    summary: result.summary,
  });
}

/** @param {unknown} data @param {number} status */
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(),
    },
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}
