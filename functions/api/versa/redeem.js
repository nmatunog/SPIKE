import { createServiceClient, createUserClient } from '../../_shared/supabaseAdmin.js';
import { createSessionIdentityProvider } from '../../_shared/versaCode/adapters.js';
import {
  enrollmentUiMessage,
  enrollmentUiState,
  isVersaCsvCodeGateEnabled,
  redeem as redeemVersa,
  versaHttpDeny,
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
  const redeemFn = deps.redeem || redeemVersa;

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
  const intendedLevel = String(body?.intendedLevel ?? body?.level ?? 'L1').toUpperCase() === 'L2' ? 'L2' : 'L1';
  const intendedCourse = String(body?.intendedCourse ?? body?.programRoute ?? '').trim();
  const clientSpecifiedOffering = Boolean(String(body?.offeringId ?? '').trim());
  const user = userData.user;

  const result = await redeemFn(
    submittedCode,
    createSessionIdentityProvider({
      userId: user.id,
      email: user.email,
      emailConfirmedAt: user.email_confirmed_at,
    }),
    intendedCourse,
    intendedLevel,
    {
      env,
      admin,
      request,
      offeringId: body?.offeringId,
      programRoute: body?.programRoute,
      // Infer L2 from the imported `pro` slug so a pasted PRO code works
      // without the client sending L2. Never take payment or a raised level
      // from the request body.
      inferFromPlanSlug: true,
      clientSpecifiedOffering,
      paymentVerified: false,
    },
  );

  if (!result.ok) {
    const deny = versaHttpDeny(result);
    return json(deny.body, deny.status);
  }

  const state = enrollmentUiState(result);

  const confirmation =
    state === 'free-no-code'
      ? enrollmentUiMessage('free-no-code')
      : result.row?.level === 'L1'
        ? 'Access verified — Financial Literacy (L1)'
        : `Access verified — ${result.row?.offering_id || result.offering?.label || 'approved offering'}`;

  return json({
    ok: true,
    state,
    alreadyGranted: Boolean(result.alreadyGranted),
    level: result.row?.level || result.offering?.level,
    offeringId: result.row?.offering_id || result.offering?.id,
    programRoute: result.row?.program_route,
    confirmation,
    message: enrollmentUiMessage(state),
    continueLabel: 'Continue to SPIKE Learning',
  });
}

export async function onRequest(ctx) {
  return handleVersaRedeem(ctx);
}
