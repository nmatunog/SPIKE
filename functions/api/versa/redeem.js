import { createServiceClient, createUserClient } from '../../_shared/supabaseAdmin.js';
import { createSessionIdentityProvider } from '../../_shared/versaCode/adapters.js';
import {
  GENERIC_DENY_MESSAGE,
  isVersaCsvCodeGateEnabled,
  verifyVersaCode,
} from '../../_shared/versaCode/index.js';
import { corsPreflight, json } from '../../_shared/verifySuperuser.js';

/**
 * Portable authenticated redeem. Not wired into intern signup.
 * Identity comes from the auth provider session; email is proven only when
 * the provider confirmed it. Does not set profiles.role.
 */
export async function handleVersaRedeem(ctx, deps = {}) {
  const { request, env } = ctx;
  if (request.method === 'OPTIONS') return corsPreflight();
  if (request.method !== 'POST') return json({ message: 'Method not allowed.' }, 405);

  if (!isVersaCsvCodeGateEnabled(env)) {
    return json({ message: 'Versa code gate is not enabled.', enabled: false }, 404);
  }

  const createUser = deps.createUserClient || createUserClient;
  const createService = deps.createServiceClient || createServiceClient;
  const verify = deps.verifyVersaCode || verifyVersaCode;

  const userClient = createUser(env, request.headers.get('Authorization'));
  if (!userClient) return json({ message: 'Sign in to verify your access code.' }, 401);

  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user?.id) {
    return json({ message: 'Sign in to verify your access code.' }, 401);
  }

  let admin;
  try {
    admin = createService(env);
  } catch (err) {
    return json(
      {
        message: err instanceof Error ? err.message : 'Service role not configured.',
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

  const submittedCode = String(body?.code ?? body?.accessCode ?? '').trim();
  const expectedLevel = String(body?.level ?? 'L1').toUpperCase() === 'L2' ? 'L2' : 'L1';
  const programRoute = body?.programRoute ? String(body.programRoute) : undefined;
  const user = userData.user;

  const result = await verify({
    env,
    admin,
    request,
    submittedCode,
    identityProvider: createSessionIdentityProvider({
      userId: user.id,
      email: user.email,
      emailConfirmedAt: user.email_confirmed_at,
    }),
    expected: {
      level: expectedLevel,
      programRoute,
    },
    paymentVerified: false,
    consume: true,
  });

  if (!result.ok) {
    return json({ message: result.message || GENERIC_DENY_MESSAGE }, 403);
  }

  const confirmation =
    result.row?.level === 'L1'
      ? 'Access verified — Financial Literacy (L1)'
      : `Access verified — ${result.row?.offering_id || 'approved L2 offering'}`;

  return json({
    ok: true,
    alreadyGranted: Boolean(result.alreadyGranted),
    level: result.row?.level,
    offeringId: result.row?.offering_id,
    programRoute: result.row?.program_route,
    confirmation,
    continueLabel: 'Continue to SPIKE Learning',
  });
}

export async function onRequest(ctx) {
  return handleVersaRedeem(ctx);
}
