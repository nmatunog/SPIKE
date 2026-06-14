#!/usr/bin/env node
/**
 * One-time bootstrap: create SUPERUSER in Supabase Auth + profiles.
 *
 * Usage (never commit passwords):
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   SUPERUSER_EMAIL=you@example.com \
 *   SUPERUSER_PASSWORD='your-secure-password' \
 *   SUPERUSER_NAME='Your Name' \
 *   node scripts/create-superuser.mjs
 */
import { createClient } from '@supabase/supabase-js';

const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(
  /\/(rest|auth|storage)\/v1\/?$/i,
  '',
);
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = String(process.env.SUPERUSER_EMAIL || '').trim().toLowerCase();
const password = process.env.SUPERUSER_PASSWORD;
const name = String(process.env.SUPERUSER_NAME || 'SPIKE Superuser').trim();

if (!url || !serviceKey || !email || !password) {
  console.error(
    'Required: SUPABASE_URL (or VITE_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY, SUPERUSER_EMAIL, SUPERUSER_PASSWORD',
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: existing } = await admin.from('profiles').select('id, role').eq('email', email).maybeSingle();

if (existing?.id) {
  const { error } = await admin.from('profiles').update({ role: 'SUPERUSER', name }).eq('id', existing.id);
  if (error) {
    console.error('Failed to promote existing profile:', error.message);
    process.exit(1);
  }
  const { error: pwErr } = await admin.auth.admin.updateUserById(existing.id, { password });
  if (pwErr) {
    console.error('Promoted role but password update failed:', pwErr.message);
    process.exit(1);
  }
  console.log(`Promoted existing user ${email} to SUPERUSER (${existing.id}).`);
  process.exit(0);
}

const { data: created, error: createErr } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { name, must_change_password: false },
});

if (createErr || !created?.user?.id) {
  console.error('Failed to create auth user:', createErr?.message || 'unknown error');
  process.exit(1);
}

const userId = created.user.id;

const { error: profileErr } = await admin.from('profiles').upsert(
  {
    id: userId,
    email,
    name,
    role: 'SUPERUSER',
  },
  { onConflict: 'id' },
);

if (profileErr) {
  console.error('Auth user created but profile upsert failed:', profileErr.message);
  console.error('User id:', userId);
  process.exit(1);
}

console.log(`SUPERUSER created: ${email} (${userId})`);
