import { createServiceClient, createUserClient } from '../../_shared/supabaseAdmin.js';
import { corsPreflight, json } from '../../_shared/verifySuperuser.js';

/** @param {import('@supabase/supabase-js').SupabaseClient} admin */
async function resolveActiveCohortId(admin) {
  const { data: active } = await admin
    .from('cohorts')
    .select('id')
    .eq('is_active', true)
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (active?.id) return active.id;

  const { data: anyCohort } = await admin
    .from('cohorts')
    .select('id')
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle();
  return anyCohort?.id ?? null;
}

/** @param {{ request: Request, env: Record<string, string> }} ctx */
export async function onRequest(ctx) {
  const { request, env } = ctx;
  if (request.method === 'OPTIONS') return corsPreflight();
  if (request.method !== 'POST') return json({ message: 'Method not allowed.' }, 405);

  const userClient = createUserClient(env, request.headers.get('Authorization'));
  if (!userClient) return json({ message: 'Authorization required.' }, 401);

  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user?.id) {
    return json({ message: 'Invalid or expired session.' }, 401);
  }

  let admin;
  try {
    admin = createServiceClient(env);
  } catch (err) {
    return json(
      {
        message: err instanceof Error ? err.message : 'Service role not configured.',
        code: 'MISSING_SERVICE_KEY',
      },
      503,
    );
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const action = String(body?.action ?? 'ensure');
  const userId = userData.user.id;
  const cohortId = await resolveActiveCohortId(admin);
  const now = new Date().toISOString();

  const { data: existing } = await admin
    .from('intern_progress')
    .select(
      'user_id, segment, hours, licensed, squad, university, career_track, career_track_selected_at, current_week, current_day, onboarding_complete, onboarding_welcomed_at, cohort_id',
    )
    .eq('user_id', userId)
    .maybeSingle();

  const row = {
    user_id: userId,
    segment: existing?.segment ?? 1,
    hours: existing?.hours ?? 0,
    licensed: existing?.licensed ?? false,
    university: body?.university ? String(body.university).trim() : existing?.university ?? null,
    squad: body?.squad ? String(body.squad).trim() : existing?.squad ?? null,
    cohort_id: existing?.cohort_id ?? cohortId,
    onboarding_welcomed_at: existing?.onboarding_welcomed_at ?? null,
    onboarding_complete: existing?.onboarding_complete ?? false,
  };

  if (action === 'welcome') {
    row.onboarding_welcomed_at = row.onboarding_welcomed_at ?? now;
  } else if (action === 'complete') {
    row.onboarding_welcomed_at = row.onboarding_welcomed_at ?? now;
    row.onboarding_complete = true;
  }

  const { data, error } = await admin
    .from('intern_progress')
    .upsert(row, { onConflict: 'user_id' })
    .select(
      'user_id, segment, hours, licensed, squad, university, career_track, career_track_selected_at, current_week, current_day, onboarding_complete, onboarding_welcomed_at, cohort_id',
    )
    .single();

  if (error) return json({ message: error.message }, 400);
  return json({ ok: true, progress: data });
}
