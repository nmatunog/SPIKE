import { ApiError, apiFetch } from '../apiClient.js';
import { supabase } from '../supabaseClient.js';

const ADMIN_MANAGEABLE_ROLES = ['INTERN', 'FACULTY', 'MENTOR', 'ADMIN'];

const SERVICE_KEY_HINT =
  'Add SUPABASE_SERVICE_ROLE_KEY to Cloudflare Pages → spike → Settings → Environment variables (Production), then redeploy.';

async function getActorContext() {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr || !authData.user) throw new Error('Your session expired. Sign in again.');

  const { data: selfProfile, error: profileErr } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .maybeSingle();
  if (profileErr) throw profileErr;

  if (!selfProfile?.role || !['ADMIN', 'SUPERUSER'].includes(selfProfile.role)) {
    throw new Error('Administrator access is required to view the user directory.');
  }

  return {
    userId: authData.user.id,
    actorIsSuperuser: selfProfile.role === 'SUPERUSER',
  };
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

function wrapServiceKeyError(err) {
  if (!(err instanceof ApiError)) return err;
  const msg = String(err.message || '');
  if (
    err.status === 503
    || err.status === 500
    || msg.includes('SUPABASE_SERVICE_ROLE_KEY')
    || msg.includes('Server misconfigured')
  ) {
    return new Error(`This action needs the server admin API. ${SERVICE_KEY_HINT}`);
  }
  return err;
}

/** Load all portal users via Supabase (no service-role API required). */
export async function fetchUserDirectory() {
  const { actorIsSuperuser } = await getActorContext();

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, name, role, created_at, updated_at')
    .order('created_at', { ascending: false });
  if (error) throw error;

  return {
    users: data ?? [],
    actorIsSuperuser,
  };
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
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('Your session expired. Sign in again.');
      return await apiFetch('/api/admin/users', {
        method: 'POST',
        token,
        body: payload,
      });
    } catch (err) {
      throw wrapServiceKeyError(err);
    }
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
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) throw new Error('Your session expired. Sign in again.');
        return await apiFetch('/api/admin/users', {
          method: 'POST',
          token,
          body: payload,
        });
      } catch (err) {
        throw wrapServiceKeyError(err);
      }
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

export { ADMIN_MANAGEABLE_ROLES, SERVICE_KEY_HINT };
