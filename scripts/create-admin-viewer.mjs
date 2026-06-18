#!/usr/bin/env node
/**
 * Create or reset the temporary read-only Admin01 viewer account.
 *
 * Sign in with username Admin01 or email admin01@viewer.1cma.online (password Admin01).
 *
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   node scripts/create-admin-viewer.mjs
 *
 * Optional overrides:
 *   ADMIN_VIEWER_EMAIL=admin01@viewer.1cma.online
 *   ADMIN_VIEWER_PASSWORD=Admin01
 *   ADMIN_VIEWER_NAME='Admin Viewer'
 */
import { createClient } from '@supabase/supabase-js';

const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(
  /\/(rest|auth|storage)\/v1\/?$/i,
  '',
);
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = String(process.env.ADMIN_VIEWER_EMAIL || 'admin01@viewer.1cma.online').trim().toLowerCase();
const password = process.env.ADMIN_VIEWER_PASSWORD || 'Admin01';
const name = String(process.env.ADMIN_VIEWER_NAME || 'Admin Viewer (read-only)').trim();

if (!url || !serviceKey) {
  console.error('Required: SUPABASE_URL (or VITE_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: existing } = await admin.from('profiles').select('id, role, read_only').eq('email', email).maybeSingle();

if (existing?.id) {
  const { error } = await admin
    .from('profiles')
    .update({ role: 'ADMIN', name, read_only: true })
    .eq('id', existing.id);
  if (error) {
    console.error('Failed to update profile:', error.message);
    process.exit(1);
  }
  const { error: pwErr } = await admin.auth.admin.updateUserById(existing.id, { password });
  if (pwErr) {
    console.error('Profile updated but password reset failed:', pwErr.message);
    process.exit(1);
  }
  console.log(`Reset read-only admin viewer: ${email} (${existing.id})`);
  console.log('Sign in with Admin01 or', email, '— password:', password);
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
    role: 'ADMIN',
    read_only: true,
  },
  { onConflict: 'id' },
);

if (profileErr) {
  console.error('Auth user created but profile upsert failed:', profileErr.message);
  console.error('User id:', userId);
  process.exit(1);
}

console.log(`Read-only admin viewer created: ${email} (${userId})`);
console.log('Sign in with Admin01 or', email, '— password:', password);
