import { createRaSpikeServiceClient } from '../../_shared/supabaseAdmin.js';
import { handlePortalUsersAdmin } from '../../_shared/portalUserAdminHandler.js';
import { verifyRaSpikeAdminActor } from '../../_shared/verifySuperuser.js';

/** RA-SPIKE account directory — validates JWT against the RA-SPIKE Supabase project. */
export async function onRequest(ctx) {
  return handlePortalUsersAdmin(ctx, {
    verifyActor: verifyRaSpikeAdminActor,
    createService: createRaSpikeServiceClient,
    getAnonKey: (env) =>
      env.VITE_RA_SPIKE_SUPABASE_ANON_KEY || env.RA_SPIKE_SUPABASE_ANON_KEY || '',
    missingAnonMessage:
      'RA-SPIKE admin API is not configured (missing anon key). Add RA_SPIKE_SUPABASE_ANON_KEY to the ra-spike Cloudflare Pages project.',
    internProgramSlug: 'ra-spike',
  });
}
