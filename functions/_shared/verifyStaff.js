import { createUserClient } from './supabaseAdmin.js';

const COACH_MATERIAL_ROLES = new Set(['FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER']);

/** @param {Record<string, string>} env @param {Request} request */
export async function verifyCoachMaterialAccess(env, request) {
  const client = createUserClient(env, request.headers.get('Authorization'));
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
