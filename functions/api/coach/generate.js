import { generateCoachText } from '../../../shared/coachAi/generate.js';
import { resolveCoachApiKeys } from '../../../shared/coachAi/keys.js';

/** @param {{ request: Request, env: Record<string, string> }} context */
export async function onRequest(context) {
  const { request } = context;
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    });
  }
  if (request.method === 'POST') {
    return onRequestPost(context);
  }
  return json({ message: 'Method not allowed.' }, 405);
}

/** @param {{ request: Request, env: Record<string, string> }} ctx */
export async function onRequestPost(ctx) {
  const { request, env } = ctx;

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

  const result = await generateCoachText(body, resolveCoachApiKeys(task, env));

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
    coach: result.text,
    bias: result.bias,
    evidenceScore: result.evidenceScore,
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
