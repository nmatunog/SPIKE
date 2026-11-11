import { createServiceClient } from '../../_shared/supabaseAdmin.js';
import { importVersaCsv, isVersaCsvCodeGateEnabled } from '../../_shared/versaCode/index.js';
import {
  assertAdminCanWrite,
  corsPreflight,
  json,
  verifyAdminActor,
} from '../../_shared/verifySuperuser.js';

/** Staff-authenticated Versa CSV intake. Response never includes raw codes. */
export async function handleVersaImport(ctx, deps = {}) {
  const { request, env } = ctx;
  if (request.method === 'OPTIONS') return corsPreflight();
  if (request.method !== 'POST') return json({ message: 'Method not allowed.' }, 405);

  if (!isVersaCsvCodeGateEnabled(env)) {
    return json({ message: 'Versa code gate is not enabled.', enabled: false }, 404);
  }

  const verifyActor = deps.verifyAdminActor || verifyAdminActor;
  const createService = deps.createServiceClient || createServiceClient;
  const importer = deps.importVersaCsv || importVersaCsv;

  const actor = await verifyActor(env, request);
  if (!actor) return json({ message: 'Administrator sign-in required.' }, 401);
  try {
    assertAdminCanWrite(actor);
  } catch (err) {
    return json({ message: err instanceof Error ? err.message : 'Read-only administrator.' }, 403);
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

  const csvText = String(body?.csv ?? body?.csvText ?? '');
  const columnMap = body?.columnMap && typeof body.columnMap === 'object' ? body.columnMap : {};
  if (!csvText.trim()) {
    return json({ message: 'CSV text is required.' }, 400);
  }

  const result = await importer({
    env,
    admin,
    csvText,
    columnMap,
    importedBy: actor.profile?.id ?? actor.user?.id ?? null,
  });

  if (!result.ok) {
    return json({ message: result.error || 'Import failed.', rejected: result.rejected || [] }, 400);
  }

  return json({
    ok: true,
    imported: result.imported,
    rejected: result.rejected,
    acknowledgments: result.acknowledgments,
  });
}

export async function onRequest(ctx) {
  return handleVersaImport(ctx);
}
