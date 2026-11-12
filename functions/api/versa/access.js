import { createServiceClient, createUserClient } from '../../_shared/supabaseAdmin.js';
import {
  entitlementAccessState,
  isVersaCsvCodeGateEnabled,
  listEntitlementsForUser,
  versaProGraceDays,
} from '../../_shared/versaCode/index.js';
import { corsPreflight, json } from '../../_shared/verifySuperuser.js';

/** My Learning / Access — already-granted offerings. No codes. */
export async function handleVersaAccess(ctx, deps = {}) {
  const { request, env } = ctx;
  if (request.method === 'OPTIONS') return corsPreflight();
  if (request.method !== 'GET') return json({ message: 'Method not allowed.' }, 405);

  if (!isVersaCsvCodeGateEnabled(env)) {
    return json({ enabled: false, entitlements: [] });
  }

  const createUser = deps.createUserClient || createUserClient;
  const createService = deps.createServiceClient || createServiceClient;
  const listEntitlements = deps.listEntitlementsForUser || listEntitlementsForUser;

  const userClient = createUser(env, request.headers.get('Authorization'));
  if (!userClient) return json({ message: 'Authorization required.' }, 401);

  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user?.id) {
    return json({ message: 'Invalid or expired session.' }, 401);
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

  const entitlements = await listEntitlements(admin, userData.user.id);
  const now = Date.now();
  const graceDays = versaProGraceDays(env);
  return json({
    enabled: true,
    entitlements: entitlements.map((row) => ({
      ...row,
      access: entitlementAccessState(row, { now, graceDays }),
    })),
  });
}

export async function onRequest(ctx) {
  return handleVersaAccess(ctx);
}
