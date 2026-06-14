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
  if (!target) return;
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

/** Load all auth users (with profile data) for the staff directory. */
export async function fetchUserDirectory() {
  const { actorIsSuperuser } = await getActorContext();

  const { data, error } = await supabase.rpc('list_portal_users');
  if (!error) {
    return {
      users: data ?? [],
      actorIsSuperuser,
    };
  }

  const { data: profiles, error: profileErr } = await supabase
    .from('profiles')
    .select('id, email, name, role, created_at, updated_at')
    .order('created_at', { ascending: false });
  if (profileErr) throw profileErr;

  return {
    users: (profiles ?? []).map((row) => ({ ...row, has_profile: true })),
    actorIsSuperuser,
  };
}

async function updatePortalUser({ targetId, role, name, isSuperuser, target }) {
  assertClientTargetMutable(isSuperuser, target);
  if (role) assertClientRoleAllowed(isSuperuser, role);

  const { error: rpcErr } = await supabase.rpc('admin_update_portal_user', {
    p_user_id: targetId,
    p_role: role ?? null,
    p_name: name ?? null,
  });
  if (!rpcErr) return;

  if (!target?.has_profile && target?.has_profile !== undefined) {
    throw rpcErr;
  }

  const patch = {};
  if (name) patch.name = name;
  if (role) patch.role = role;
  if (!Object.keys(patch).length) return;

  const { error } = await supabase.from('profiles').update(patch).eq('id', targetId);
  if (error) throw error;
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
 * @param {{ isSuperuser: boolean, target?: object }} options
 */
export async function runUserDirectoryAction(payload, { isSuperuser, target = null }) {
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

  let resolvedTarget = target;
  if (!resolvedTarget) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', payload.targetId)
      .maybeSingle();
    if (error) throw error;
    resolvedTarget = data;
  }

  if (payload.action === 'promote') {
    await updatePortalUser({
      targetId: payload.targetId,
      role: payload.role,
      isSuperuser,
      target: resolvedTarget,
    });
    return { ok: true };
  }

  if (payload.action === 'edit') {
    await updatePortalUser({
      targetId: payload.targetId,
      role: payload.role,
      name: payload.name,
      isSuperuser,
      target: resolvedTarget,
    });
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
  const { users, actorIsSuperuser } = await fetchUserDirectory();
  const target = users.find((u) => u.id === payload.targetId) ?? null;
  return runUserDirectoryAction(payload, { isSuperuser: actorIsSuperuser, target });
}

export function userAdminApiAvailable() {
  return Boolean(supabase);
}

export { ADMIN_MANAGEABLE_ROLES, SERVICE_KEY_HINT };
