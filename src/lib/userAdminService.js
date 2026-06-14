import { ApiError, apiFetch } from '../apiClient.js';
import { supabase } from '../supabaseClient.js';

const ADMIN_MANAGEABLE_ROLES = ['INTERN', 'FACULTY', 'MENTOR', 'ADMIN'];

async function getAccessToken() {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const token = data.session?.access_token;
  if (!token) throw new Error('Your session expired. Sign in again.');
  return token;
}

/** @param {boolean} isSuperuser */
function assertClientRoleAllowed(isSuperuser, role) {
  if (!role) return;
  if (isSuperuser) return;
  if (!ADMIN_MANAGEABLE_ROLES.includes(role)) {
    throw new Error('Administrators cannot assign that role.');
  }
}

/** @param {boolean} isSuperuser @param {{ role?: string } | null | undefined} target */
function assertClientTargetMutable(isSuperuser, target) {
  if (!target) throw new Error('User not found.');
  if (!isSuperuser && target.role === 'SUPERUSER') {
    throw new Error('Only superusers can modify superuser accounts.');
  }
}

/** Load all portal users (API with Supabase fallback). */
export async function fetchUserDirectory() {
  if (!supabase) throw new Error('Supabase is not configured.');

  try {
    const token = await getAccessToken();
    const data = await apiFetch('/api/admin/users', { token });
    return {
      users: data?.users ?? [],
      actorIsSuperuser: data?.actorIsSuperuser === true,
    };
  } catch (err) {
    const canFallback =
      err instanceof ApiError && (err.status === 403 || err.status === 503 || err.status === 502);
    if (!canFallback) throw err;

    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, name, role, created_at, updated_at')
      .order('created_at', { ascending: false });
    if (error) throw error;

    const { data: authData } = await supabase.auth.getUser();
    const { data: selfProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user?.id ?? '')
      .maybeSingle();

    return {
      users: data ?? [],
      actorIsSuperuser: selfProfile?.role === 'SUPERUSER',
    };
  }
}

/**
 * @param {{
 *   action: 'promote' | 'edit' | 'password_reset' | 'delete',
 *   targetId: string,
 *   reason: string,
 *   role?: string,
 *   name?: string,
 *   email?: string,
 *   confirmEmail?: string,
 * }} payload
 * @param {{ isSuperuser: boolean }} options
 */
export async function runUserDirectoryAction(payload, { isSuperuser }) {
  if (!supabase) throw new Error('Supabase is not configured.');

  if (payload.action === 'password_reset' || payload.action === 'delete') {
    if (!isSuperuser) {
      throw new Error('Only superusers can reset passwords or remove accounts.');
    }
    const token = await getAccessToken();
    return apiFetch('/api/admin/users', {
      method: 'POST',
      token,
      body: payload,
    });
  }

  const { data: target, error: targetErr } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', payload.targetId)
    .maybeSingle();
  if (targetErr) throw targetErr;
  assertClientTargetMutable(isSuperuser, target);

  if (payload.action === 'promote') {
    assertClientRoleAllowed(isSuperuser, payload.role);
    const { error } = await supabase
      .from('profiles')
      .update({ role: payload.role })
      .eq('id', payload.targetId);
    if (error) throw error;
    return { ok: true };
  }

  if (payload.action === 'edit') {
    assertClientRoleAllowed(isSuperuser, payload.role);
    const patch = {};
    if (payload.name) patch.name = payload.name;
    if (payload.role) patch.role = payload.role;
    if (Object.keys(patch).length) {
      const { error } = await supabase.from('profiles').update(patch).eq('id', payload.targetId);
      if (error) throw error;
    }
    if (payload.email) {
      const token = await getAccessToken();
      return apiFetch('/api/admin/users', {
        method: 'POST',
        token,
        body: payload,
      });
    }
    return { ok: true };
  }

  throw new Error('Unknown action.');
}

/** @deprecated Use fetchUserDirectory */
export async function fetchAllUsersForSuperuser() {
  const { users } = await fetchUserDirectory();
  return users;
}

/** @deprecated Use runUserDirectoryAction */
export async function runSuperuserUserAction(payload) {
  const { actorIsSuperuser } = await fetchUserDirectory();
  return runUserDirectoryAction(payload, { isSuperuser: actorIsSuperuser });
}

export function userAdminApiAvailable() {
  return Boolean(supabase);
}

export { ADMIN_MANAGEABLE_ROLES };
