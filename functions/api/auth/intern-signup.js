import { validateInternActivationCode } from '../../_shared/activationCode.js';
import { createConfirmedPortalUser } from '../../_shared/confirmedSignup.js';
import { createServiceClient } from '../../_shared/supabaseAdmin.js';
import { isVersaCsvCodeGateEnabled } from '../../_shared/versaCode/index.js';
import { corsPreflight, json } from '../../_shared/verifySuperuser.js';

const defaultDeps = {
  createServiceClient,
  createConfirmedPortalUser,
  validateInternActivationCode,
};

async function grantExistingInternEntitlement(admin, { userId, email, name, university, squad }) {
  const { error: profileErr } = await admin.from('profiles').upsert(
    {
      id: userId,
      email,
      name,
      role: 'INTERN',
    },
    { onConflict: 'id' },
  );
  if (profileErr) return { error: profileErr };

  const { error: progErr } = await admin.from('intern_progress').upsert(
    {
      user_id: userId,
      segment: 1,
      hours: 0,
      licensed: false,
      university,
      squad,
      program_slug: 'spike-internship',
    },
    { onConflict: 'user_id' },
  );
  return { error: progErr };
}

/**
 * SPIKE for Interns signup.
 * Flag off: daily intern activation code (unchanged).
 * Flag on: create account only — do not consume a Versa code or grant from a typed email.
 * Redemption is POST /api/versa/redeem after a verified session.
 *
 * @param {{ request: Request, env: Record<string, string> }} ctx
 * @param {typeof defaultDeps} [deps]
 */
export async function handleInternSignup(ctx, deps = {}) {
  const createService = deps.createServiceClient || defaultDeps.createServiceClient;
  const createUser = deps.createConfirmedPortalUser || defaultDeps.createConfirmedPortalUser;
  const validateDaily = deps.validateInternActivationCode || defaultDeps.validateInternActivationCode;
  const { request, env } = ctx;
  if (request.method === 'OPTIONS') return corsPreflight();
  if (request.method !== 'POST') return json({ message: 'Method not allowed.' }, 405);

  let admin;
  try {
    admin = createService(env);
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
  const versaEnabled = isVersaCsvCodeGateEnabled(env);

  if (name.length < 2) return json({ message: 'Name is required.' }, 400);
  if (!email || !email.includes('@')) return json({ message: 'A valid email is required.' }, 400);
  if (password.length < 8) return json({ message: 'Password must be at least 8 characters.' }, 400);
  if (!versaEnabled && !code) {
    return json({ message: 'Daily activation code is required.' }, 400);
  }

  try {
    if (versaEnabled) {
      const userId = await createUser(admin, {
        email,
        password,
        name,
        mustChangePassword: false,
        emailConfirm: false,
      });

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

      return json({
        ok: true,
        userId,
        versaRedeemRequired: true,
        message: 'Account created. Confirm your email, sign in, then activate access.',
      });
    }

    await validateDaily(admin, code);

    const userId = await createUser(admin, {
      email,
      password,
      name,
      mustChangePassword: false,
    });

    const grant = await grantExistingInternEntitlement(admin, {
      userId,
      email,
      name,
      university,
      squad,
    });
    if (grant.error) return json({ message: grant.error.message }, 400);

    return json({ ok: true, userId });
  } catch (err) {
    return json({ message: err instanceof Error ? err.message : 'Signup failed.' }, 400);
  }
}

/** @param {{ request: Request, env: Record<string, string> }} ctx */
export async function onRequest(ctx) {
  return handleInternSignup(ctx);
}
