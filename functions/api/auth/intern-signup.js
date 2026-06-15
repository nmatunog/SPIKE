import { findAuthUserByEmail } from '../../_shared/bootstrapSuperuser.js';
import { validateInternActivationCode } from '../../_shared/activationCode.js';
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
        message: `Intern signup API is not configured. ${err instanceof Error ? err.message : 'Missing service role key.'}`,
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
  const code = String(body?.code ?? '').trim();
  const university = body?.university ? String(body.university).trim() : null;
  const squad = body?.squad ? String(body.squad).trim() : null;

  if (name.length < 2) return json({ message: 'Name is required.' }, 400);
  if (!email || !email.includes('@')) return json({ message: 'A valid email is required.' }, 400);
  if (password.length < 8) return json({ message: 'Password must be at least 8 characters.' }, 400);
  if (!code) return json({ message: 'Daily activation code is required.' }, 400);

  try {
    await validateInternActivationCode(admin, code);

    const existing = await findAuthUserByEmail(admin, email);
    if (existing) {
      return json(
        { message: 'This email is already registered. Sign in instead, or ask an administrator for help.' },
        400,
      );
    }

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, must_change_password: false },
    });
    if (createErr) return json({ message: createErr.message }, 400);

    const userId = created.user.id;

    const { error: profileErr } = await admin.from('profiles').upsert(
      {
        id: userId,
        email,
        name,
        role: 'INTERN',
      },
      { onConflict: 'id' },
    );
    if (profileErr) return json({ message: profileErr.message }, 400);

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

    return json({ ok: true, userId });
  } catch (err) {
    return json({ message: err instanceof Error ? err.message : 'Signup failed.' }, 400);
  }
}
