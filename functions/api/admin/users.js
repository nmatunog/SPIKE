import { createServiceClient } from '../../_shared/supabaseAdmin.js';
import { corsPreflight, json, randomPassword, verifySuperuser } from '../../_shared/verifySuperuser.js';

/** @param {{ request: Request, env: Record<string, string> }} ctx */
export async function onRequest(ctx) {
  const { request, env } = ctx;
  if (request.method === 'OPTIONS') return corsPreflight();

  const actor = await verifySuperuser(env, request);
  if (!actor) return json({ message: 'Superuser access required.' }, 403);

  let admin;
  try {
    admin = createServiceClient(env);
  } catch (err) {
    return json({ message: err instanceof Error ? err.message : 'Server misconfigured.' }, 500);
  }

  if (request.method === 'GET') {
    const { data, error } = await admin
      .from('profiles')
      .select('id, email, name, role, created_at, updated_at')
      .order('created_at', { ascending: false });
    if (error) return json({ message: error.message }, 400);
    return json({ users: data ?? [] });
  }

  if (request.method !== 'POST') {
    return json({ message: 'Method not allowed.' }, 405);
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

  if (action === 'edit') {
    if (!targetId) return json({ message: 'targetId is required.' }, 400);
    const name = body?.name != null ? String(body.name).trim() : undefined;
    const email = body?.email != null ? String(body.email).trim().toLowerCase() : undefined;
    const role = body?.role != null ? String(body.role) : undefined;
    const allowedRoles = ['INTERN', 'FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER'];
    if (role && !allowedRoles.includes(role)) {
      return json({ message: 'Invalid role.' }, 400);
    }

    const patch = {};
    if (name) patch.name = name;
    if (role) patch.role = role;
    if (Object.keys(patch).length) {
      const { error } = await admin.from('profiles').update(patch).eq('id', targetId);
      if (error) return json({ message: error.message }, 400);
    }
    if (email) {
      const { error: authErr } = await admin.auth.admin.updateUserById(targetId, { email });
      if (authErr) return json({ message: authErr.message }, 400);
      await admin.from('profiles').update({ email }).eq('id', targetId);
    }

    await logAction(admin, actor.profile.id, targetId, 'edit', reason, { name, email, role });
    return json({ ok: true });
  }

  if (action === 'promote') {
    if (!targetId) return json({ message: 'targetId is required.' }, 400);
    const role = String(body?.role ?? '').trim();
    const allowedRoles = ['INTERN', 'FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER'];
    if (!allowedRoles.includes(role)) return json({ message: 'Invalid role.' }, 400);
    if (targetId === actor.profile.id && role !== 'SUPERUSER') {
      return json({ message: 'You cannot demote your own superuser account here.' }, 400);
    }

    const { error } = await admin.from('profiles').update({ role }).eq('id', targetId);
    if (error) return json({ message: error.message }, 400);
    await logAction(admin, actor.profile.id, targetId, 'promote', reason, { role });
    return json({ ok: true });
  }

  if (action === 'password_reset') {
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
    if (!targetId) return json({ message: 'targetId is required.' }, 400);
    if (targetId === actor.profile.id) {
      return json({ message: 'You cannot delete your own superuser account.' }, 400);
    }
    const confirmEmail = String(body?.confirmEmail ?? '').trim().toLowerCase();
    const { data: target, error: fetchErr } = await admin
      .from('profiles')
      .select('email')
      .eq('id', targetId)
      .maybeSingle();
    if (fetchErr) return json({ message: fetchErr.message }, 400);
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
