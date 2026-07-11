import { createRaSpikeServiceClient } from './supabaseAdmin.js';
import { corsPreflight, json } from './verifySuperuser.js';

const MAX_AVATAR_CHARS = 750_000;

/** @param {{ request: Request, env: Record<string, string> }} ctx */
export async function onRequest(ctx) {
  const { request, env } = ctx;
  if (request.method === 'OPTIONS') return corsPreflight();
  if (request.method !== 'POST') return json({ message: 'Method not allowed.' }, 405);

  const authHeader = request.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return json({ message: 'Sign in required.' }, 401);

  let admin;
  try {
    admin = createRaSpikeServiceClient(env);
  } catch (err) {
    return json(
      {
        message: `Onboarding API is not configured. ${err instanceof Error ? err.message : 'Missing service role key.'}`,
        code: 'MISSING_SERVICE_KEY',
      },
      503,
    );
  }

  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData?.user?.id) {
    return json({ message: 'Invalid or expired session.' }, 401);
  }
  const userId = userData.user.id;

  let body;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const avatarUrl = body?.avatarUrl ? String(body.avatarUrl).trim() : null;
  const skipPhoto = body?.skipPhoto === true;

  const { data: progress, error: progReadErr } = await admin
    .from('intern_progress')
    .select('program_slug, cohort_id, ra_spike_current_week')
    .eq('user_id', userId)
    .maybeSingle();
  if (progReadErr) return json({ message: progReadErr.message }, 400);

  let isRaSpike = progress?.program_slug === 'ra-spike' || Number(progress?.ra_spike_current_week) > 0;
  if (!isRaSpike && progress?.cohort_id) {
    const { data: cohort } = await admin
      .from('cohorts')
      .select('program_slug')
      .eq('id', progress.cohort_id)
      .maybeSingle();
    isRaSpike = cohort?.program_slug === 'ra-spike';
  }
  if (!isRaSpike) {
    return json({ message: 'Not an RA-SPIKE participant.' }, 403);
  }

  if (avatarUrl && avatarUrl.length > MAX_AVATAR_CHARS) {
    return json({ message: 'Photo is too large. Use a smaller image or skip for now.' }, 400);
  }

  if (avatarUrl && !skipPhoto) {
    const { error: avatarErr } = await admin
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId);
    if (avatarErr) return json({ message: avatarErr.message }, 400);
  }

  const welcomedAt = new Date().toISOString();
  const { error: progErr } = await admin
    .from('intern_progress')
    .update({
      onboarding_complete: true,
      onboarding_welcomed_at: welcomedAt,
      program_slug: 'ra-spike',
    })
    .eq('user_id', userId);
  if (progErr) return json({ message: progErr.message }, 400);

  return json({ ok: true, onboarding_complete: true, welcomedAt });
}
