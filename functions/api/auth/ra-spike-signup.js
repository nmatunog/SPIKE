import { createConfirmedPortalUser } from '../../_shared/confirmedSignup.js';
import {
  assignRaSpikeSquad,
  resolveRaSpikeCohort,
} from '../../_shared/raSpikeEnrollment.js';
import { createServiceClient } from '../../_shared/supabaseAdmin.js';
import { corsPreflight, json } from '../../_shared/verifySuperuser.js';

/** @param {{ request: Request, env: Record<string, string> }} ctx */
export async function onRequest(ctx) {
  const { request, env } = ctx;
  if (request.method === 'OPTIONS') return corsPreflight();
  if (request.method !== 'POST') return json({ message: 'Method not allowed.' }, 405);

  let admin;
  try {
    admin = createServiceClient(env);
  } catch (err) {
    return json(
      {
        message: `RA-SPIKE signup API is not configured. ${err instanceof Error ? err.message : 'Missing service role key.'}`,
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

  const name = String(body?.name ?? '').trim();
  const mobile = String(body?.mobile ?? '').trim();
  const email = String(body?.email ?? '').trim().toLowerCase();
  const password = String(body?.password ?? '');
  const inviteCode = body?.batchInviteCode
    ? String(body.batchInviteCode).trim().replace(/\s+/g, '').toUpperCase()
    : '';
  const cohortId = body?.cohortId != null ? Number(body.cohortId) : null;
  const homeAgency = String(body?.homeAgency ?? '').trim();
  const homeUnit = String(body?.homeUnit ?? '').trim();

  if (name.length < 2) return json({ message: 'Full name is required.' }, 400);
  if (!mobile || mobile.replace(/\D/g, '').length < 10) {
    return json({ message: 'A valid mobile number is required.' }, 400);
  }
  if (!email || !email.includes('@')) return json({ message: 'A valid email is required.' }, 400);
  if (password.length < 8) return json({ message: 'Password must be at least 8 characters.' }, 400);
  if (!inviteCode && !Number.isFinite(cohortId)) {
    return json({ message: 'Select a batch or enter your batch invite code.' }, 400);
  }
  if (!homeAgency || !homeUnit) {
    return json({ message: 'Select your home agency and unit.' }, 400);
  }

  try {
    const cohort = await resolveRaSpikeCohort(admin, {
      inviteCode: inviteCode || null,
      cohortId: Number.isFinite(cohortId) ? cohortId : null,
    });

    const userId = await createConfirmedPortalUser(admin, {
      email,
      password,
      name,
      mustChangePassword: false,
    });

    const { error: profileErr } = await admin.from('profiles').upsert(
      {
        id: userId,
        email,
        name,
        role: 'INTERN',
        mobile,
      },
      { onConflict: 'id' },
    );
    if (profileErr) return json({ message: profileErr.message }, 400);

    const squadName = await assignRaSpikeSquad(admin, cohort.id, userId);

    const { error: progErr } = await admin.from('intern_progress').upsert(
      {
        user_id: userId,
        cohort_id: cohort.id,
        segment: 1,
        hours: 0,
        licensed: false,
        squad: squadName,
        university: homeAgency,
        home_unit: homeUnit,
        program_slug: 'ra-spike',
        ra_spike_segment: 1,
        ra_spike_current_week: 1,
        onboarding_complete: false,
      },
      { onConflict: 'user_id' },
    );
    if (progErr) return json({ message: progErr.message }, 400);

    return json({
      ok: true,
      userId,
      cohort: {
        id: cohort.id,
        batchLabel: cohort.batch_label || cohort.name,
      },
      homeAgency,
      homeUnit,
      squad: squadName,
    });
  } catch (err) {
    return json({ message: err instanceof Error ? err.message : 'Signup failed.' }, 400);
  }
}
