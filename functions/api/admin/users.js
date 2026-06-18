import { createServiceClient } from '../../_shared/supabaseAdmin.js';
import { findAuthUserByEmail } from '../../_shared/bootstrapSuperuser.js';
import { corsPreflight, json, randomPassword, verifyAdminActor, assertAdminCanWrite } from '../../_shared/verifySuperuser.js';

const ALL_ROLES = ['INTERN', 'FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER'];
const ADMIN_MANAGEABLE_ROLES = ['INTERN', 'FACULTY', 'MENTOR', 'ADMIN'];

/** @param {import('@supabase/supabase-js').SupabaseClient} admin */
async function listAllAuthUsers(admin) {
  const users = [];
  let page = 1;
  while (page < 50) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);
    const batch = data?.users ?? [];
    users.push(...batch);
    if (batch.length < 200) break;
    page += 1;
  }
  return users;
}

/** @param {import('@supabase/supabase-js').SupabaseClient} admin */
async function backfillMissingProfiles(admin, authUsers) {
  const { data: profiles, error } = await admin
    .from('profiles')
    .select('id');
  if (error) throw new Error(error.message);

  const existing = new Set((profiles ?? []).map((row) => row.id));
  const missing = authUsers.filter((user) => !existing.has(user.id));

  for (const user of missing) {
    const name =
      (typeof user.user_metadata?.name === 'string' && user.user_metadata.name.trim()) ||
      user.email?.split('@')[0] ||
      'User';
    const { error: insertErr } = await admin.from('profiles').insert({
      id: user.id,
      email: user.email ?? '',
      name,
      role: 'INTERN',
    });
    if (insertErr) throw new Error(insertErr.message);
  }
}

/** @param {import('@supabase/supabase-js').SupabaseClient} admin */
async function loadPortalUserDirectory(admin) {
  const authUsers = await listAllAuthUsers(admin);
  await backfillMissingProfiles(admin, authUsers);

  const { data: profiles, error } = await admin
    .from('profiles')
    .select('id, email, name, role, created_at, updated_at')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);

  const profileById = new Map((profiles ?? []).map((row) => [row.id, row]));

  const users = authUsers
    .map((authUser) => {
      const profile = profileById.get(authUser.id);
      const fallbackName =
        (typeof authUser.user_metadata?.name === 'string' && authUser.user_metadata.name.trim()) ||
        authUser.email?.split('@')[0] ||
        'User';
      return {
        id: authUser.id,
        email: profile?.email || authUser.email || '',
        name: profile?.name || fallbackName,
        role: profile?.role || 'INTERN',
        created_at: profile?.created_at || authUser.created_at,
        updated_at: profile?.updated_at ?? null,
        has_profile: Boolean(profile),
      };
    })
    .sort(
      (a, b) =>
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
    );

  return users;
}

/** @param {import('@supabase/supabase-js').SupabaseClient} admin @param {string | null} targetId */
async function getTargetProfile(admin, targetId) {
  const { data, error } = await admin
    .from('profiles')
    .select('id, email, name, role')
    .eq('id', targetId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

/** @param {import('@supabase/supabase-js').SupabaseClient} admin @param {string} targetId */
async function ensureTargetProfile(admin, targetId) {
  const existing = await getTargetProfile(admin, targetId);
  if (existing) return existing;

  const { data: authData, error: authErr } = await admin.auth.admin.getUserById(targetId);
  if (authErr || !authData?.user) throw new Error('Auth user not found.');

  const authUser = authData.user;
  const name =
    (typeof authUser.user_metadata?.name === 'string' && authUser.user_metadata.name.trim()) ||
    authUser.email?.split('@')[0] ||
    'User';
  const { error: insertErr } = await admin.from('profiles').insert({
    id: targetId,
    email: authUser.email ?? '',
    name,
    role: 'INTERN',
  });
  if (insertErr) throw new Error(insertErr.message);

  return getTargetProfile(admin, targetId);
}

/** @param {{ isSuperuser: boolean }} actor @param {string | undefined} role */
function assertRoleAllowed(actor, role) {
  if (!role) return;
  if (!ALL_ROLES.includes(role)) throw new Error('Invalid role.');
  if (!actor.isSuperuser && !ADMIN_MANAGEABLE_ROLES.includes(role)) {
    throw new Error('Administrators cannot assign that role.');
  }
}

/** @param {{ role?: string } | null} target */
function assertTargetMutable(actor, target) {
  if (!target) throw new Error('User not found.');
  if (!actor.isSuperuser && target.role === 'SUPERUSER') {
    throw new Error('Only superusers can modify superuser accounts.');
  }
}

/** @param {{ request: Request, env: Record<string, string> }} ctx */
export async function onRequest(ctx) {
  const { request, env } = ctx;
  if (request.method === 'OPTIONS') return corsPreflight();

  const actor = await verifyAdminActor(env, request);
  if (!actor) return json({ message: 'Administrator access required.' }, 403);

  let admin;
  try {
    admin = createServiceClient(env);
  } catch (err) {
    return json(
      {
        message: `Server admin API is not configured. ${err instanceof Error ? err.message : 'Missing service role key.'}`,
        code: 'MISSING_SERVICE_KEY',
      },
      503,
    );
  }

  if (request.method === 'GET') {
    try {
      const users = await loadPortalUserDirectory(admin);
      return json({ users, actorIsSuperuser: actor.isSuperuser });
    } catch (err) {
      return json({ message: err instanceof Error ? err.message : 'Could not load users.' }, 400);
    }
  }

  if (request.method !== 'POST') {
    return json({ message: 'Method not allowed.' }, 405);
  }

  try {
    assertAdminCanWrite(actor);
  } catch (err) {
    return json({ message: err instanceof Error ? err.message : 'View-only account.' }, 403);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ message: 'Invalid JSON body.' }, 400);
  }

  const action = String(body?.action ?? '');
  const reason = String(body?.reason ?? '').trim();
  const targetId = body?.targetId ? String(body.targetId) : null;

  if (!reason || reason.length < 3) {
    return json({ message: 'A reason (min 3 characters) is required.' }, 400);
  }

  try {
    if (action === 'create') {
      const name = String(body?.name ?? '').trim();
      const email = String(body?.email ?? '').trim().toLowerCase();
      const password = String(body?.password ?? '');
      const role = String(body?.role ?? 'INTERN').trim().toUpperCase();
      assertRoleAllowed(actor, role);

      if (name.length < 2) return json({ message: 'Name is required.' }, 400);
      if (!email) return json({ message: 'Email is required.' }, 400);
      if (password.length < 8) {
        return json({ message: 'Password must be at least 8 characters.' }, 400);
      }

      let userId = null;
      const existingAuth = await findAuthUserByEmail(admin, email);

      if (existingAuth) {
        userId = existingAuth.id;
        const { error: pwErr } = await admin.auth.admin.updateUserById(userId, {
          password,
          email_confirm: true,
          user_metadata: { name, must_change_password: true },
        });
        if (pwErr) return json({ message: pwErr.message }, 400);
      } else {
        const { data: created, error: createErr } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { name, must_change_password: true },
        });
        if (createErr) return json({ message: createErr.message }, 400);
        userId = created.user.id;
      }

      const { error: profileErr } = await admin.from('profiles').upsert(
        {
          id: userId,
          email,
          name,
          role,
        },
        { onConflict: 'id' },
      );
      if (profileErr) return json({ message: profileErr.message }, 400);

      if (role === 'INTERN') {
        const university = body?.university ? String(body.university).trim() : null;
        const squad = body?.squad ? String(body.squad).trim() : null;
        const { error: progErr } = await admin.from('intern_progress').upsert(
          {
            user_id: userId,
            segment: 1,
            hours: 0,
            licensed: false,
            university,
            squad,
          },
          { onConflict: 'user_id' },
        );
        if (progErr) return json({ message: progErr.message }, 400);
      }

      await logAction(admin, actor.profile.id, userId, 'create', reason, { email, role, name }).catch(
        () => null,
      );
      return json({ ok: true, userId });
    }

    if (action === 'edit') {
      if (!targetId) return json({ message: 'targetId is required.' }, 400);
      const target = await getTargetProfile(admin, targetId);
      assertTargetMutable(actor, target);

      const name = body?.name != null ? String(body.name).trim() : undefined;
      const email = body?.email != null ? String(body.email).trim().toLowerCase() : undefined;
      const role = body?.role != null ? String(body.role).trim().toUpperCase() : undefined;
      assertRoleAllowed(actor, role);

      const patch = {};
      if (name) patch.name = name;
      if (role) patch.role = role;
      if (Object.keys(patch).length) {
        const { error } = await admin.from('profiles').update(patch).eq('id', targetId);
        if (error) return json({ message: error.message }, 400);
      }
      if (email && email !== String(target.email ?? '').toLowerCase()) {
        const { error: authErr } = await admin.auth.admin.updateUserById(targetId, {
          email,
          email_confirm: true,
        });
        if (authErr) return json({ message: authErr.message }, 400);
        await admin.from('profiles').update({ email }).eq('id', targetId);
      }

      await logAction(admin, actor.profile.id, targetId, 'edit', reason, { name, email, role });
      return json({ ok: true });
    }

    if (action === 'promote') {
      if (!targetId) return json({ message: 'targetId is required.' }, 400);
      const target = await ensureTargetProfile(admin, targetId);
      assertTargetMutable(actor, target);

      const role = String(body?.role ?? '').trim().toUpperCase();
      assertRoleAllowed(actor, role);
      if (targetId === actor.profile.id && actor.isSuperuser && role !== 'SUPERUSER') {
        return json({ message: 'You cannot demote your own superuser account here.' }, 400);
      }

      const { error } = await admin.from('profiles').upsert(
        {
          id: targetId,
          email: target.email ?? '',
          name: target.name ?? 'User',
          role,
        },
        { onConflict: 'id' },
      );
      if (error) return json({ message: error.message }, 400);
      await logAction(admin, actor.profile.id, targetId, 'promote', reason, { role }).catch(() => null);
      return json({ ok: true });
    }

    if (action === 'password_reset') {
      if (!actor.isSuperuser) {
        return json({ message: 'Only superusers can reset passwords from the directory.' }, 403);
      }
      if (!targetId) return json({ message: 'targetId is required.' }, 400);
      const tempPassword = randomPassword();
      const { error } = await admin.auth.admin.updateUserById(targetId, {
        password: tempPassword,
        user_metadata: { must_change_password: true },
      });
      if (error) return json({ message: error.message }, 400);
      await logAction(admin, actor.profile.id, targetId, 'password_reset', reason, {});
      return json({ ok: true, temporaryPassword: tempPassword });
    }

    if (action === 'delete') {
      if (!actor.isSuperuser) {
        return json({ message: 'Only superusers can remove accounts from the directory.' }, 403);
      }
      if (!targetId) return json({ message: 'targetId is required.' }, 400);
      if (targetId === actor.profile.id) {
        return json({ message: 'You cannot delete your own superuser account.' }, 400);
      }
      const confirmEmail = String(body?.confirmEmail ?? '').trim().toLowerCase();
      const target = await getTargetProfile(admin, targetId);
      if (!target) return json({ message: 'User not found.' }, 404);
      if (confirmEmail !== String(target.email).toLowerCase()) {
        return json({ message: 'confirmEmail must match the account email.' }, 400);
      }

      const { error: delErr } = await admin.auth.admin.deleteUser(targetId);
      if (delErr) return json({ message: delErr.message }, 400);
      await logAction(admin, actor.profile.id, targetId, 'delete', reason, { email: target.email });
      return json({ ok: true });
    }

    return json({ message: 'Unknown action.' }, 400);
  } catch (err) {
    return json({ message: err instanceof Error ? err.message : 'Action failed.' }, 400);
  }
}

/** @param {import('@supabase/supabase-js').SupabaseClient} admin */
async function logAction(admin, actorId, targetId, action, reason, payload) {
  await admin.from('user_admin_actions').insert({
    actor_id: actorId,
    target_id: targetId,
    action,
    reason,
    payload,
  });
}
