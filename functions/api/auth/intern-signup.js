import { validateInternActivationCode } from '../../_shared/activationCode.js';
import { createConfirmedPortalUser } from '../../_shared/confirmedSignup.js';
import { createServiceClient } from '../../_shared/supabaseAdmin.js';
import { GENERIC_DENY_MESSAGE, isVersaCsvCodeGateEnabled, verifyVersaCode } from '../../_shared/versaCode/index.js';
import { corsPreflight, json } from '../../_shared/verifySuperuser.js';

const defaultDeps = {
  createServiceClient,
  createConfirmedPortalUser,
  validateInternActivationCode,
  verifyVersaCode,
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
 * SPIKE for Interns signup. When VERSA_CSV_CODE_GATE is off, behavior is unchanged
 * (daily intern activation code). When on, the `code` field is verified against
 * imported Versa CSV rows + handed-off identity instead of the daily intern code.
 *
 * @param {{ request: Request, env: Record<string, string> }} ctx
 * @param {typeof defaultDeps} [deps]
 */
export async function handleInternSignup(ctx, deps = {}) {
  const createService = deps.createServiceClient || defaultDeps.createServiceClient;
  const createUser = deps.createConfirmedPortalUser || defaultDeps.createConfirmedPortalUser;
  const validateDaily = deps.validateInternActivationCode || defaultDeps.validateInternActivationCode;
  const verifyCode = deps.verifyVersaCode || defaultDeps.verifyVersaCode;
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
  if (!code) {
    return json(
      { message: versaEnabled ? 'Access code is required.' : 'Daily activation code is required.' },
      400,
    );
  }

  try {
    if (versaEnabled) {
      const preview = await verifyCode({
        env,
        admin,
        request,
        submittedCode: code,
        identity: { email },
        expected: { level: 'L1' },
        consume: false,
      });
      if (!preview.ok) {
        return json({ message: preview.message || GENERIC_DENY_MESSAGE }, 403);
      }

      const userId = await createUser(admin, {
        email,
        password,
        name,
        mustChangePassword: false,
      });

      const redeemed = await verifyCode({
        env,
        admin,
        request,
        submittedCode: code,
        identity: { userId, email },
        expected: { level: 'L1' },
        consume: true,
      });
      if (!redeemed.ok) {
        return json({ message: redeemed.message || GENERIC_DENY_MESSAGE }, 403);
      }

      const grant = await grantExistingInternEntitlement(admin, {
        userId,
        email,
        name,
        university,
        squad,
      });
      if (grant.error) return json({ message: grant.error.message }, 400);

      const offeringLabel =
        redeemed.row?.level === 'L1'
          ? 'Access verified — Financial Literacy (L1)'
          : `Access verified — ${redeemed.row?.offering_id || 'program'}`;

      return json({
        ok: true,
        userId,
        versa: {
          granted: true,
          level: redeemed.row?.level,
          offeringId: redeemed.row?.offering_id,
          confirmation: offeringLabel,
        },
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
