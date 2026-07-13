import { createRaSpikeServiceClient, createServiceClient } from './supabaseAdmin.js';
import { corsPreflight, json } from './verifySuperuser.js';

const STAFF_ROLES = new Set(['FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER']);

/** @param {string} email */
function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

/**
 * @param {Record<string, string>} env
 * @param {string} email
 * @returns {Promise<'ra-spike' | 'internship' | 'both' | 'unknown'>}
 */
export async function resolvePortalForEmail(env, email) {
  const normalized = normalizeEmail(email);
  if (!normalized.includes('@')) return 'unknown';

  let inInternship = false;
  let inRaSpike = false;
  let internshipStaff = false;
  let raSpikeStaff = false;

  try {
    const intern = createServiceClient(env);
    const { data, error } = await intern
      .from('profiles')
      .select('id, role')
      .eq('email', normalized)
      .maybeSingle();
    if (!error && data?.id) {
      inInternship = true;
      internshipStaff = STAFF_ROLES.has(String(data.role).toUpperCase());
    }
  } catch {
    /* internship DB not configured on this Pages project */
  }

  try {
    const ra = createRaSpikeServiceClient(env);
    const { data, error } = await ra
      .from('profiles')
      .select('id, role')
      .eq('email', normalized)
      .maybeSingle();
    if (!error && data?.id) {
      inRaSpike = true;
      raSpikeStaff = STAFF_ROLES.has(String(data.role).toUpperCase());
    }
  } catch {
    /* RA-SPIKE DB not configured on this Pages project */
  }

  if (internshipStaff && !raSpikeStaff) return 'internship';
  if (raSpikeStaff && !internshipStaff) return 'ra-spike';
  if (inRaSpike && !inInternship) return 'ra-spike';
  if (inInternship && !inRaSpike) return 'internship';
  if (inRaSpike && inInternship) return 'both';
  return 'unknown';
}

/** @param {{ request: Request, env: Record<string, string> }} ctx */
export async function onPortalHintRequest(ctx) {
  const { request, env } = ctx;
  if (request.method === 'OPTIONS') return corsPreflight();
  if (request.method !== 'POST') return json({ message: 'Method not allowed.' }, 405);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ message: 'Invalid JSON body.' }, 400);
  }

  const email = normalizeEmail(body?.email);
  if (!email.includes('@')) return json({ message: 'A valid email is required.' }, 400);

  const portal = await resolvePortalForEmail(env, email);
  return json({ portal });
}
