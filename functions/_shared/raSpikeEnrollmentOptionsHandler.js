import { listRaSpikeEnrollmentOptions } from './raSpikeEnrollment.js';
import { createRaSpikeServiceClient } from './supabaseAdmin.js';
import { corsPreflight, json } from './verifySuperuser.js';

/** @param {{ request: Request, env: Record<string, string> }} ctx */
export async function onRequest(ctx) {
  const { request, env } = ctx;
  if (request.method === 'OPTIONS') return corsPreflight();
  if (request.method !== 'GET') return json({ message: 'Method not allowed.' }, 405);

  let admin;
  try {
    admin = createRaSpikeServiceClient(env);
  } catch (err) {
    return json(
      {
        message: `RA-SPIKE enrollment API is not configured. ${err instanceof Error ? err.message : 'Missing service role key.'}`,
        code: 'MISSING_SERVICE_KEY',
      },
      503,
    );
  }

  try {
    const options = await listRaSpikeEnrollmentOptions(admin);
    return json(options);
  } catch (err) {
    return json({ message: err instanceof Error ? err.message : 'Could not load batches.' }, 400);
  }
}
