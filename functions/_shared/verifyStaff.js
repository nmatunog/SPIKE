import { createRaSpikeUserClient, createUserClient } from './supabaseAdmin.js';

const COACH_MATERIAL_ROLES = new Set(['FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER']);

/**
 * @param {import('@supabase/supabase-js').SupabaseClient | null} client
 */
async function verifyCoachProfile(client) {
  if (!client) return null;

  const { data: userData, error: userErr } = await client.auth.getUser();
  if (userErr || !userData?.user?.id) return null;

  const { data: profile, error: profErr } = await client
    .from('profiles')
    .select('id, role, email, name')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (profErr || !profile?.role) return null;
  if (!COACH_MATERIAL_ROLES.has(String(profile.role).toUpperCase())) return null;

  return { user: userData.user, profile };
}

/**
 * @param {Record<string, string>} env
 * @param {Request} request
 * @param {string} [relPath] Deck path — RA-SPIKE decks prefer the RA-SPIKE JWT first.
 */
export async function verifyCoachMaterialAccess(env, request, relPath = '') {
  const auth = request.headers.get('Authorization') ?? '';
  const isRaSpikeDeck = String(relPath).startsWith('ra-spike/');
  const factories = isRaSpikeDeck
    ? [createRaSpikeUserClient, createUserClient]
    : [createUserClient, createRaSpikeUserClient];

  for (const factory of factories) {
    const actor = await verifyCoachProfile(factory(env, auth));
    if (actor) return actor;
  }

  return null;
}
