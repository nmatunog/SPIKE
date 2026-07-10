import { createConfirmedPortalUser } from '../../_shared/confirmedSignup.js';
import { createServiceClient } from '../../_shared/supabaseAdmin.js';
import { corsPreflight, json } from '../../_shared/verifySuperuser.js';

/** @param {{ request: Request, env: Record<string, string> }} ctx */
export async function onRequest(ctx) {
  const { request, env } = ctx;
  if (request.method === 'OPTIONS') return corsPreflight();
  if (request.method !== 'POST') return json({ message: 'Method not allowed.' }, 405);

  let admin;
  try {
    admin = createServiceClient(env);
  } catch (err) {
    return json(
      {
        message: `Staff signup API is not configured. ${err instanceof Error ? err.message : 'Missing service role key.'}`,
        code: 'MISSING_SERVICE_KEY',
      },
      503,
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ message: 'Invalid JSON body.' }, 400);
  }

  const name = String(body?.name ?? '').trim();
  const email = String(body?.email ?? '').trim().toLowerCase();
  const password = String(body?.password ?? '');
  const role = String(body?.role ?? '').trim().toUpperCase();

  if (name.length < 2) return json({ message: 'Name is required.' }, 400);
  if (!email || !email.includes('@')) return json({ message: 'A valid email is required.' }, 400);
  if (password.length < 8) return json({ message: 'Password must be at least 8 characters.' }, 400);

  try {
    const { data: bootstrap, error: bootstrapErr } = await admin.rpc('needs_staff_bootstrap');
    if (bootstrapErr) return json({ message: bootstrapErr.message }, 400);

    let targetRole = role;
    if (bootstrap === true) {
      targetRole = 'SUPERUSER';
    } else {
      return json(
        {
          message:
            'Staff self-signup is disabled. Ask a superuser to create your coach account from Admin → Users.',
          code: 'STAFF_SELF_SIGNUP_DISABLED',
        },
        403,
      );
    }

    const userId = await createConfirmedPortalUser(admin, {
      email,
      password,
      name,
      mustChangePassword: true,
    });

    await admin.rpc('sync_missing_portal_profiles').catch(() => null);

    const { error: profileErr } = await admin.from('profiles').upsert(
      {
        id: userId,
        email,
        name,
        role: targetRole,
      },
      { onConflict: 'id' },
    );
    if (profileErr) return json({ message: profileErr.message }, 400);

    return json({ ok: true, userId, role: targetRole });
  } catch (err) {
    return json({ message: err instanceof Error ? err.message : 'Signup failed.' }, 400);
  }
}
