import { findAuthUserByEmail } from './bootstrapSuperuser.js';

/**
 * Create an auth user with email pre-confirmed (no Supabase confirmation email).
 * @param {import('@supabase/supabase-js').SupabaseClient} admin
 * @param {{
 *   email: string,
 *   password: string,
 *   name: string,
 *   mustChangePassword?: boolean,
 * }} input
 */
export async function createConfirmedPortalUser(admin, input) {
  const email = String(input.email).trim().toLowerCase();
  const password = String(input.password ?? '');
  const name = String(input.name ?? '').trim();

  const existing = await findAuthUserByEmail(admin, email);
  if (existing) {
    throw new Error('This email is already registered. Sign in instead, or ask an administrator for help.');
  }

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name,
      must_change_password: Boolean(input.mustChangePassword),
    },
  });
  if (createErr) throw new Error(createErr.message);
  return created.user.id;
}
