import { validateInternActivationCode } from '../../_shared/activationCode.js';
import { createConfirmedPortalUser } from '../../_shared/confirmedSignup.js';
import {
  INTERN_SIGNUP_GLOBAL_CEILING_ALERT,
  INTERN_SIGNUP_GLOBAL_WINDOW_MS,
  INTERN_SIGNUP_RATE_LIMITED_MESSAGE,
  INTERN_SIGNUP_UNAVAILABLE_MESSAGE,
  beginInternSignupAttempt,
  internSignupGlobalMax,
  internSignupGlobalRateKey,
  internSignupRateKey,
  internSignupRateMax,
  isFailedActivationCode,
  refundInternSignupAttempt,
} from '../../_shared/internSignupRateLimit.js';
import { createServiceClient } from '../../_shared/supabaseAdmin.js';
import { corsPreflight, json } from '../../_shared/verifySuperuser.js';

/**
 * @param {{ request: Request, env: Record<string, string> }} ctx
 * @param {{ createServiceClient?: typeof createServiceClient }} [deps]
 */
export async function handleInternSignup(ctx, deps = {}) {
  const { request, env } = ctx;
  if (request.method === 'OPTIONS') return corsPreflight();
  if (request.method !== 'POST') return json({ message: 'Method not allowed.' }, 405);

  const createService = deps.createServiceClient || createServiceClient;
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

  if (name.length < 2) return json({ message: 'Name is required.' }, 400);
  if (!email || !email.includes('@')) return json({ message: 'A valid email is required.' }, 400);
  if (password.length < 8) return json({ message: 'Password must be at least 8 characters.' }, 400);
  if (!code) return json({ message: 'Daily activation code is required.' }, 400);

  const rateKey = internSignupRateKey(request);
  const globalKey = internSignupGlobalRateKey();
  const maxFailures = internSignupRateMax(env);
  const reservedKeys = [];

  const gate = await beginInternSignupAttempt({ admin, key: rateKey, maxFailures });
  if (gate.unavailable) {
    return json({ message: INTERN_SIGNUP_UNAVAILABLE_MESSAGE }, 503);
  }
  if (!gate.ok) {
    return json({ message: INTERN_SIGNUP_RATE_LIMITED_MESSAGE }, 429);
  }
  if (gate.failOpen !== true) reservedKeys.push(rateKey);

  if (gate.failOpen !== true) {
    const globalGate = await beginInternSignupAttempt({
      admin,
      key: globalKey,
      windowMs: INTERN_SIGNUP_GLOBAL_WINDOW_MS,
      maxFailures: internSignupGlobalMax(env),
    });
    if (globalGate.unavailable) {
      const refunded = await refundInternSignupAttempt({ admin, key: rateKey });
      if (refunded.unavailable) {
        return json({ message: INTERN_SIGNUP_UNAVAILABLE_MESSAGE }, 503);
      }
      return json({ message: INTERN_SIGNUP_UNAVAILABLE_MESSAGE }, 503);
    }
    if (globalGate.failOpen !== true && !globalGate.ok) {
      const refunded = await refundInternSignupAttempt({ admin, key: rateKey });
      if (refunded.unavailable) {
        return json({ message: INTERN_SIGNUP_UNAVAILABLE_MESSAGE }, 503);
      }
      console.error(
        `${INTERN_SIGNUP_GLOBAL_CEILING_ALERT}: code-day ${globalKey} locked at ${globalGate.fail_count}; refusing further attempts`,
      );
      return json({ message: INTERN_SIGNUP_RATE_LIMITED_MESSAGE }, 429);
    }
    if (globalGate.failOpen !== true) reservedKeys.push(globalKey);
  }

  try {
    await validateInternActivationCode(admin, code);

    if (reservedKeys.length) {
      for (const key of reservedKeys) {
        const refunded = await refundInternSignupAttempt({ admin, key });
        if (refunded.unavailable) {
          return json({ message: INTERN_SIGNUP_UNAVAILABLE_MESSAGE }, 503);
        }
      }
      reservedKeys.length = 0;
    }

    const userId = await createConfirmedPortalUser(admin, {
      email,
      password,
      name,
      mustChangePassword: false,
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
    if (progErr) return json({ message: progErr.message }, 400);

    return json({ ok: true, userId });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Signup failed.';
    if (reservedKeys.length && !isFailedActivationCode(message)) {
      for (const key of reservedKeys) {
        const refunded = await refundInternSignupAttempt({ admin, key });
        if (refunded?.unavailable) {
          return json({ message: INTERN_SIGNUP_UNAVAILABLE_MESSAGE }, 503);
        }
      }
    }
    return json({ message }, 400);
  }
}

/** @param {{ request: Request, env: Record<string, string> }} ctx */
export async function onRequest(ctx) {
  return handleInternSignup(ctx);
}
