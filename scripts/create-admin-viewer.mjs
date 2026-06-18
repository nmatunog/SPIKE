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

async function upsertViewerProfile(id) {
  const withReadOnly = { id, email, name, role: 'ADMIN', read_only: true };
  const { error } = await admin.from('profiles').upsert(withReadOnly, { onConflict: 'id' });
  if (!error) return;
  if (/read_only/i.test(error.message)) {
    const { error: fallbackErr } = await admin.from('profiles').upsert(
      { id, email, name, role: 'ADMIN' },
      { onConflict: 'id' },
    );
    if (fallbackErr) throw fallbackErr;
    console.warn('Profile saved without read_only — apply migration 20260718_admin_viewer_read_only.sql');
    return;
  }
  throw error;
}

const { data: existing } = await admin.from('profiles').select('id').eq('email', email).maybeSingle();

let userId = existing?.id;

if (!userId) {
  const { data: listData, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listErr) {
    console.error('Could not list auth users:', listErr.message);
    process.exit(1);
  }
  const authUser = (listData?.users ?? []).find((u) => u.email?.toLowerCase() === email);
  if (authUser?.id) userId = authUser.id;
}

if (userId) {
  try {
    await upsertViewerProfile(userId);
  } catch (err) {
    console.error('Failed to upsert profile:', err instanceof Error ? err.message : err);
    process.exit(1);
  }
  const { error: pwErr } = await admin.auth.admin.updateUserById(userId, { password });
  if (pwErr) {
    console.error('Profile updated but password reset failed:', pwErr.message);
    process.exit(1);
  }
  console.log(`Reset read-only admin viewer: ${email} (${userId})`);
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

const newUserId = created.user.id;

try {
  await upsertViewerProfile(newUserId);
} catch (err) {
  console.error('Auth user created but profile upsert failed:', err instanceof Error ? err.message : err);
  console.error('User id:', newUserId);
  process.exit(1);
}

console.log(`Read-only admin viewer created: ${email} (${newUserId})`);
console.log('Sign in with Admin01 or', email, '— password:', password);
