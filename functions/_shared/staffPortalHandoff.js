import { createRaSpikeServiceClient, createRaSpikeUserClient, createServiceClient, createUserClient } from './supabaseAdmin.js';
import { corsPreflight, json } from './verifySuperuser.js';

const STAFF_ROLES = new Set(['FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER']);
const HANDOFF_TTL_MS = 2 * 60 * 1000;

/** @param {Record<string, string>} env */
function handoffSecret(env) {
  return String(env.SETUP_SECRET || env.CROSS_PORTAL_HANDOFF_SECRET || '').trim();
}

/** @param {string} email */
function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

/**
 * @param {Record<string, string>} env
 * @param {'internship' | 'ra-spike'} portal
 * @param {Request} request
 */
async function verifyStaffActor(env, portal, request) {
  const auth = request.headers.get('Authorization');
  const client =
    portal === 'ra-spike'
      ? createRaSpikeUserClient(env, auth)
      : createUserClient(env, auth);
  if (!client) return null;

  const { data: userData, error: userErr } = await client.auth.getUser();
  if (userErr || !userData?.user?.id) return null;

  const { data: profile, error: profErr } = await client
    .from('profiles')
    .select('id, role, email, name')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (profErr || !profile?.role) return null;
  if (!STAFF_ROLES.has(String(profile.role).toUpperCase())) return null;

  return { user: userData.user, profile };
}

/** @param {string} bodyB64 @param {string} sigB64 @param {string} secret */
async function verifySignature(bodyB64, sigB64, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  const bodyBytes = encoder.encode(bodyB64);
  const sigBytes = Uint8Array.from(atob(sigB64), (c) => c.charCodeAt(0));
  return crypto.subtle.verify('HMAC', key, sigBytes, bodyBytes);
}

/** @param {object} payload @param {string} secret */
async function signPayload(payload, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const bodyB64 = btoa(JSON.stringify(payload));
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(bodyB64));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return `${bodyB64}.${sigB64}`;
}

/**
 * @param {Record<string, string>} env
 * @param {'internship' | 'ra-spike'} target
 * @param {string} email
 */
async function staffProfileOnPortal(env, target, email) {
  const normalized = normalizeEmail(email);
  const admin = target === 'ra-spike' ? createRaSpikeServiceClient(env) : createServiceClient(env);
  const { data, error } = await admin
    .from('profiles')
    .select('id, role, email')
    .eq('email', normalized)
    .maybeSingle();
  if (error || !data?.id) return null;
  if (!STAFF_ROLES.has(String(data.role).toUpperCase())) return null;
  return data;
}

/**
 * @param {Record<string, string>} env
 * @param {'internship' | 'ra-spike'} target
 * @param {string} email
 */
async function mintTargetSessionToken(env, target, email) {
  const admin = target === 'ra-spike' ? createRaSpikeServiceClient(env) : createServiceClient(env);
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: normalizeEmail(email),
  });
  if (error) throw error;
  const tokenHash = data?.properties?.hashed_token;
  if (!tokenHash) throw new Error('Could not mint portal session.');
  return tokenHash;
}

/**
 * @param {{ env: Record<string, string>, request: Request, sourcePortal: 'internship' | 'ra-spike' }} ctx
 */
export async function onStaffPortalHandoffRequest(ctx) {
  const { env, request, sourcePortal } = ctx;
  if (request.method === 'OPTIONS') return corsPreflight();
  if (request.method !== 'POST') return json({ message: 'Method not allowed.' }, 405);

  const secret = handoffSecret(env);
  if (!secret) {
    return json({ message: 'Portal handoff is not configured (SETUP_SECRET).' }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ message: 'Invalid JSON body.' }, 400);
  }

  const action = String(body?.action || '').trim();

  if (action === 'create') {
    const target = body?.target === 'ra-spike' ? 'ra-spike' : body?.target === 'internship' ? 'internship' : null;
    if (!target || target === sourcePortal) {
      return json({ message: 'Invalid handoff target.' }, 400);
    }

    const actor = await verifyStaffActor(env, sourcePortal, request);
    if (!actor) return json({ message: 'Staff sign-in required.' }, 401);

    const email = normalizeEmail(actor.profile.email || actor.user.email);
    const targetProfile = await staffProfileOnPortal(env, target, email);
    if (!targetProfile) {
      return json({
        message:
          target === 'internship'
            ? 'No SPIKE Internship staff account exists for this email. Ask a superuser to create one on the internship portal.'
            : 'No RA-SPIKE staff account exists for this email. Ask a superuser to create one on the RA-SPIKE portal.',
      }, 404);
    }

    const token = await signPayload(
      {
        email,
        target,
        source: sourcePortal,
        exp: Date.now() + HANDOFF_TTL_MS,
      },
      secret,
    );

    return json({ token });
  }

  if (action === 'consume') {
    const token = String(body?.token || '').trim();
    const dot = token.indexOf('.');
    if (!dot) return json({ message: 'Invalid handoff token.' }, 400);

    const bodyB64 = token.slice(0, dot);
    const sigB64 = token.slice(dot + 1);
    const valid = await verifySignature(bodyB64, sigB64, secret);
    if (!valid) return json({ message: 'Invalid handoff token.' }, 400);

    let payload;
    try {
      payload = JSON.parse(atob(bodyB64));
    } catch {
      return json({ message: 'Invalid handoff token.' }, 400);
    }

    if (!payload?.email || !payload?.target || payload.exp < Date.now()) {
      return json({ message: 'Handoff token expired. Try switching portals again.' }, 400);
    }

    const target = payload.target === 'ra-spike' ? 'ra-spike' : 'internship';
    const expectedSource = target === 'ra-spike' ? 'internship' : 'ra-spike';
    if (payload.source !== expectedSource) {
      return json({ message: 'Invalid handoff source.' }, 400);
    }

    const targetProfile = await staffProfileOnPortal(env, target, payload.email);
    if (!targetProfile) {
      return json({ message: 'Staff account not found on this portal.' }, 404);
    }

    try {
      const token_hash = await mintTargetSessionToken(env, target, payload.email);
      return json({ token_hash, email: normalizeEmail(payload.email) });
    } catch (err) {
      return json({ message: err?.message || 'Could not start session on this portal.' }, 500);
    }
  }

  return json({ message: 'Unknown action.' }, 400);
}
