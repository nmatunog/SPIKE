import {
  countSuperusers,
  ensureSuperuserAccount,
  getSuperuserProfileByEmail,
  setupSecretMatches,
  setupSecretRequired,
} from '../../_shared/bootstrapSuperuser.js';
import { createServiceClient } from '../../_shared/supabaseAdmin.js';
import { corsPreflight, json } from '../../_shared/verifySuperuser.js';

function normalizeEmail(email) {
  return String(email ?? '').trim().toLowerCase();
}

function validateBootstrapBody(body) {
  const name = String(body?.name ?? '').trim();
  const email = normalizeEmail(body?.email);
  const password = String(body?.password ?? '');
  if (name.length < 2) return { error: 'Name must be at least 2 characters.' };
  if (!email || !email.includes('@')) return { error: 'A valid email is required.' };
  if (password.length < 8) return { error: 'Password must be at least 8 characters.' };
  return { name, email, password, setupSecret: body?.setupSecret };
}

/** @param {{ request: Request, env: Record<string, string> }} ctx */
export async function onRequest(ctx) {
  const { request, env } = ctx;
  if (request.method === 'OPTIONS') return corsPreflight();

  let admin;
  try {
    admin = createServiceClient(env);
  } catch {
    return json(
      {
        configured: false,
        needsBootstrap: null,
        secretRequired: setupSecretRequired(env),
        message:
          'Superuser bootstrap API is not configured. Add SUPABASE_SERVICE_ROLE_KEY to Cloudflare Pages environment variables.',
        code: 'MISSING_SERVICE_KEY',
      },
      503,
    );
  }

  if (request.method === 'GET') {
    try {
      const superuserCount = await countSuperusers(admin);
      return json({
        configured: true,
        needsBootstrap: superuserCount === 0,
        secretRequired: setupSecretRequired(env),
      });
    } catch (err) {
      return json(
        { message: err instanceof Error ? err.message : 'Could not read bootstrap status.' },
        500,
      );
    }
  }

  if (request.method !== 'POST') {
    return json({ message: 'Method not allowed.' }, 405);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ message: 'Invalid JSON body.' }, 400);
  }

  const parsed = validateBootstrapBody(body);
  if (parsed.error) return json({ message: parsed.error }, 400);

  const { name, email, password, setupSecret } = parsed;

  try {
    const superuserCount = await countSuperusers(admin);

    if (superuserCount === 0) {
      if (setupSecretRequired(env) && !setupSecretMatches(env, setupSecret)) {
        return json({ message: 'Invalid setup secret.' }, 403);
      }
      const userId = await ensureSuperuserAccount(admin, { name, email, password });
      return json({ ok: true, userId, mode: 'bootstrap' }, 201);
    }

    if (!setupSecretMatches(env, setupSecret)) {
      return json(
        {
          message:
            'Initial setup is already complete. Sign in with your superuser account, or provide the setup secret to reset a superuser password.',
          code: 'BOOTSTRAP_COMPLETE',
        },
        409,
      );
    }

    const superuser = await getSuperuserProfileByEmail(admin, email);
    if (!superuser) {
      return json(
        { message: 'No superuser account matches that email. Use the superuser email on file.' },
        404,
      );
    }

    const userId = await ensureSuperuserAccount(admin, { name, email, password });
    return json({ ok: true, userId, mode: 'repair' });
  } catch (err) {
    return json(
      { message: err instanceof Error ? err.message : 'Bootstrap failed.' },
      400,
    );
  }
}
