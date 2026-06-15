import { ApiError, apiFetch } from '../apiClient.js';
import { supabase } from '../supabaseClient.js';

const ADMIN_MANAGEABLE_ROLES = ['INTERN', 'FACULTY', 'MENTOR', 'ADMIN'];

const MIGRATION_CATCHUP_HINT =
  'Run supabase/migrations/20260710_admin_portal_catchup.sql in the Supabase SQL Editor, then run NOTIFY pgrst, \'reload schema\'; as a separate query.';

/** @param {{ code?: string; message?: string } | null | undefined} error */
function isSchemaMissingError(error) {
  if (!error) return false;
  const message = error.message || '';
  return (
    error.code === 'PGRST202' ||
    error.code === '42P01' ||
    /not find|404|schema cache/i.test(message)
  );
}

function formatSchemaMissingError(fallback) {
  return `${fallback} ${MIGRATION_CATCHUP_HINT}`;
}

/** @param {string | null | undefined} role */
function normalizePortalRole(role) {
  return String(role ?? '').trim().toUpperCase();
}

const SERVICE_KEY_HINT =
  'Add SUPABASE_SERVICE_ROLE_KEY to Cloudflare Pages → spike → Settings → Environment variables (Production), then redeploy.';

/** @param {unknown} err */
export function formatAuthEmailError(err) {
  const message = err instanceof Error ? err.message : String(err ?? '');
  if (!/rate limit|over_email_send_rate_limit|email.*limit/i.test(message)) {
    return message || 'Request failed.';
  }
  return [
    'Supabase email rate limit reached (usually ~4 emails/hour on the default mailer).',
    'Wait about an hour, or use Registered users → Change role on an existing account (no email sent).',
    `For new accounts without confirmation emails, set ${SERVICE_KEY_HINT}`,
  ].join(' ');
}

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
    || msg.includes('MISSING_SERVICE_KEY')
  ) {
    return new Error(`This action needs the server admin API. ${SERVICE_KEY_HINT}`);
  }
  return err;
}

async function fetchUserDirectoryViaApi(actorIsSuperuser) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error('Your session expired. Sign in again.');

  const res = await apiFetch('/api/admin/users', { method: 'GET', token });
  return {
    users: res.users ?? [],
    actorIsSuperuser: res.actorIsSuperuser ?? actorIsSuperuser,
    migrationNeeded: false,
  };
}

/** Load all auth users (with profile data) for the staff directory. */
export async function fetchUserDirectory() {
  const { actorIsSuperuser } = await getActorContext();

  const { data, error } = await supabase.rpc('list_portal_users');
  if (!error) {
    await supabase.rpc('sync_missing_portal_profiles').then(() => null, () => null);
    return {
      users: data ?? [],
      actorIsSuperuser,
      migrationNeeded: false,
    };
  }

  const migrationNeeded = isSchemaMissingError(error);

  if (migrationNeeded) {
    try {
      return await fetchUserDirectoryViaApi(actorIsSuperuser);
    } catch {
      // API unavailable — profiles-only fallback below.
    }
  }

  const { data: profiles, error: profileErr } = await supabase
    .from('profiles')
    .select('id, email, name, role, created_at, updated_at')
    .order('created_at', { ascending: false });
  if (profileErr) {
    if (isSchemaMissingError(profileErr)) {
      throw new Error(formatSchemaMissingError('Could not load users.'));
    }
    throw profileErr;
  }

  return {
    users: (profiles ?? []).map((row) => ({ ...row, has_profile: true })),
    actorIsSuperuser,
    migrationNeeded,
  };
}

async function runAdminDirectoryApi(payload) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error('Your session expired. Sign in again.');
  return apiFetch('/api/admin/users', {
    method: 'POST',
    token,
    body: payload,
  });
}

/**
 * Create a portal account without sending Supabase confirmation emails (service role API).
 * @param {{
 *   name: string,
 *   email: string,
 *   password: string,
 *   role: string,
 *   reason?: string,
 *   university?: string,
 *   squad?: string,
 * }} payload
 */
export async function createPortalUserViaApi(payload) {
  const role = normalizePortalRole(payload.role);
  if (!role) throw new Error('Select a role for the new account.');

  return runAdminDirectoryApi({
    action: 'create',
    reason: payload.reason?.trim() || 'Admin created account',
    name: payload.name.trim(),
    email: payload.email.trim().toLowerCase(),
    password: payload.password,
    role,
    university: payload.university,
    squad: payload.squad,
  });
}

async function updatePortalUser({ targetId, role, name, isSuperuser, target }) {
  assertClientTargetMutable(isSuperuser, target);
  const normalizedRole = role ? normalizePortalRole(role) : null;
  if (normalizedRole) assertClientRoleAllowed(isSuperuser, normalizedRole);

  await supabase.rpc('sync_missing_portal_profiles').then(() => null, () => null);

  const { data, error: rpcErr } = await supabase.rpc('admin_update_portal_user', {
    p_user_id: targetId,
    p_role: normalizedRole,
    p_name: name ?? null,
  });
  if (!rpcErr) return data;

  if (!isSchemaMissingError(rpcErr)) {
    throw rpcErr;
  }

  const patch = {};
  if (name) patch.name = name;
  if (normalizedRole) patch.role = normalizedRole;
  if (!Object.keys(patch).length) return;

  if (target?.has_profile === false) {
    throw new Error(
      formatSchemaMissingError(
        'Could not create a profile for this account. Run the admin portal migrations, then try again.',
      ),
    );
  }

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
    const role = normalizePortalRole(payload.role);
    if (!role) throw new Error('Select a role to assign.');
    const normalizedPayload = { ...payload, role };

    try {
      await updatePortalUser({
        targetId: payload.targetId,
        role,
        isSuperuser,
        target: resolvedTarget,
      });
      return { ok: true };
    } catch (rpcErr) {
      try {
        return (await runAdminDirectoryApi(normalizedPayload)) ?? { ok: true };
      } catch (apiErr) {
        if (rpcErr instanceof Error && rpcErr.message) throw rpcErr;
        throw wrapServiceKeyError(apiErr);
      }
    }
  }

  if (payload.action === 'edit') {
    const role = payload.role ? normalizePortalRole(payload.role) : undefined;
    const normalizedPayload = { ...payload, ...(role ? { role } : {}) };

    try {
      await updatePortalUser({
        targetId: payload.targetId,
        role,
        name: payload.name,
        isSuperuser,
        target: resolvedTarget,
      });
      return { ok: true };
    } catch (rpcErr) {
      try {
        return (await runAdminDirectoryApi(normalizedPayload)) ?? { ok: true };
      } catch (apiErr) {
        if (rpcErr instanceof Error && rpcErr.message) throw rpcErr;
        throw wrapServiceKeyError(apiErr);
      }
    }
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
