import { createServiceClient } from '../../_shared/supabaseAdmin.js';
import { handlePortalUsersAdmin } from '../../_shared/portalUserAdminHandler.js';
import { verifyAdminActor } from '../../_shared/verifySuperuser.js';

/** SPIKE Internship account directory — validates JWT against the main Supabase project. */
export async function onRequest(ctx) {
  return handlePortalUsersAdmin(ctx, {
    verifyActor: verifyAdminActor,
    createService: createServiceClient,
    getAnonKey: (env) => env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || '',
    internProgramSlug: null,
  });
}
