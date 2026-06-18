import { createUserClient } from '../_shared/supabaseAdmin.js';

/** @param {Record<string, string>} env @param {Request} request */
export async function verifySuperuser(env, request) {
  const auth = request.headers.get('Authorization');
  const client = createUserClient(env, auth);
  if (!client) return null;

  const { data: userData, error: userErr } = await client.auth.getUser();
  if (userErr || !userData?.user) return null;

  const { data: profile, error: profErr } = await client
    .from('profiles')
    .select('id, role, email, name')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (profErr || profile?.role !== 'SUPERUSER') return null;
  return { user: userData.user, profile };
}

/** @param {Record<string, string>} env @param {Request} request */
export async function verifyAdminActor(env, request) {
  const auth = request.headers.get('Authorization');
  const client = createUserClient(env, auth);
  if (!client) return null;

  const { data: userData, error: userErr } = await client.auth.getUser();
  if (userErr || !userData?.user) return null;

  const { data: profile, error: profErr } = await client
    .from('profiles')
    .select('id, role, email, name, read_only')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (profErr || !profile?.role) return null;
  if (!['ADMIN', 'SUPERUSER'].includes(profile.role)) return null;

  const readOnly =
    profile.role === 'ADMIN'
    && (Boolean(profile.read_only) || String(profile.email ?? '').toLowerCase() === 'admin01@viewer.1cma.online');

  return {
    user: userData.user,
    profile,
    isSuperuser: profile.role === 'SUPERUSER',
    readOnly,
  };
}

/** Reject view-only admin accounts for mutation endpoints. */
export function assertAdminCanWrite(actor) {
  if (actor?.readOnly) {
    throw new Error('View-only administrator — cannot make changes.');
  }
}

/** @param {Record<string, unknown>} payload */
export function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, content-type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    },
  });
}

export function corsPreflight() {
  return json({}, 204);
}

function randomPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$';
  let out = '';
  for (let i = 0; i < 14; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${out}1a`;
}

export { randomPassword };
