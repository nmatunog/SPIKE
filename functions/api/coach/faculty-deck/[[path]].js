import {
  coachDeckProtectedAssetPath,
  sanitizeCoachDeckRelativePath,
} from '../../../_shared/facultyDeckPaths.js';
import { verifyCoachMaterialAccess } from '../../../_shared/verifyStaff.js';
import { corsPreflight, json } from '../../../_shared/verifySuperuser.js';

/** @param {{ request: Request, env: Record<string, string>, params: { path?: string | string[] } }} ctx */
export async function onRequest(ctx) {
  const { request, env, params } = ctx;
  if (request.method === 'OPTIONS') return corsPreflight();
  if (request.method !== 'GET') return json({ message: 'Method not allowed.' }, 405);

  const actor = await verifyCoachMaterialAccess(env, request);
  if (!actor) return json({ message: 'Coach access required.' }, 403);

  const rawPath = Array.isArray(params.path) ? params.path.join('/') : String(params.path ?? '');
  const relPath = sanitizeCoachDeckRelativePath(rawPath);
  if (!relPath) return json({ message: 'Invalid deck path.' }, 400);

  const assetUrl = new URL(coachDeckProtectedAssetPath(relPath), request.url);
  const assetResponse = await env.ASSETS.fetch(assetUrl);
  if (!assetResponse.ok) {
    return json({ message: 'Coach deck not found.' }, 404);
  }

  const filename = relPath.split('/').pop() ?? 'faculty-deck';
  const headers = new Headers(assetResponse.headers);
  headers.set('Content-Disposition', `attachment; filename="${filename}"`);
  headers.set('Cache-Control', 'private, no-store');
  headers.set('X-Content-Type-Options', 'nosniff');

  return new Response(assetResponse.body, {
    status: 200,
    headers,
  });
}
