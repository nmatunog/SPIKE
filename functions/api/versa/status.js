import { isVersaCsvCodeGateEnabled } from '../../_shared/versaCode/index.js';
import { corsPreflight, json } from '../../_shared/verifySuperuser.js';

/** Public flag probe — no inventory, no codes. */
export async function onRequest(ctx) {
  const { request, env } = ctx;
  if (request.method === 'OPTIONS') return corsPreflight();
  if (request.method !== 'GET') return json({ message: 'Method not allowed.' }, 405);
  return json({
    enabled: isVersaCsvCodeGateEnabled(env),
    program: 'spike-interns',
  });
}
