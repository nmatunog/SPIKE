/** @param {import('@supabase/supabase-js').SupabaseClient} admin */
export async function findAuthUserByEmail(admin, email) {
  const normalized = email.trim().toLowerCase();
  let page = 1;
  const perPage = 200;

  while (page <= 10) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data?.users ?? [];
    const match = users.find((u) => String(u.email ?? '').toLowerCase() === normalized);
    if (match) return match;
    if (users.length < perPage) break;
    page += 1;
  }
  return null;
}

/** @param {import('@supabase/supabase-js').SupabaseClient} admin */
export async function countSuperusers(admin) {
  const { count, error } = await admin
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'SUPERUSER');
  if (error) throw error;
  return count ?? 0;
}

/** @param {import('@supabase/supabase-js').SupabaseClient} admin */
export async function getSuperuserProfileByEmail(admin, email) {
  const normalized = email.trim().toLowerCase();
  const { data, error } = await admin
    .from('profiles')
    .select('id, email, role')
    .eq('role', 'SUPERUSER')
    .ilike('email', normalized)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Create or repair Supabase Auth + profiles row for the superuser.
 * @param {import('@supabase/supabase-js').SupabaseClient} admin
 */
export async function ensureSuperuserAccount(admin, { name, email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const displayName = String(name || 'SPIKE Superuser').trim() || 'SPIKE Superuser';

  const { data: existingProfile } = await admin
    .from('profiles')
    .select('id, email, role')
    .ilike('email', normalizedEmail)
    .maybeSingle();

  let userId = existingProfile?.id ?? null;

  if (userId) {
    const { error: pwErr } = await admin.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
      user_metadata: { name: displayName, must_change_password: false },
    });
    if (pwErr) throw pwErr;
  } else {
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: { name: displayName, must_change_password: false },
    });

    if (createErr) {
      const existingAuth = await findAuthUserByEmail(admin, normalizedEmail);
      if (!existingAuth) throw createErr;
      userId = existingAuth.id;
      const { error: pwErr } = await admin.auth.admin.updateUserById(userId, {
        password,
        email_confirm: true,
        user_metadata: { name: displayName, must_change_password: false },
      });
      if (pwErr) throw pwErr;
    } else {
      userId = created.user.id;
    }
  }

  const { error: profileErr } = await admin.rpc('service_upsert_superuser_profile', {
    p_id: userId,
    p_email: normalizedEmail,
    p_name: displayName,
  });
  if (profileErr) throw profileErr;

  return userId;
}

/** @param {Record<string, string>} env @param {string | undefined} setupSecret */
export function setupSecretMatches(env, setupSecret) {
  const configured = String(env.SETUP_SECRET ?? '').trim();
  if (!configured) return false;
  return String(setupSecret ?? '').trim() === configured;
}

export function setupSecretRequired(env) {
  return Boolean(String(env.SETUP_SECRET ?? '').trim());
}
