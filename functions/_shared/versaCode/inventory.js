/**
 * Inventory helpers against versa_code_inventory (service-role client).
 * Tests inject an in-memory admin with the same chainable surface.
 */

/** @param {import('@supabase/supabase-js').SupabaseClient} admin */
export async function findInventoryByDigest(admin, digest) {
  const { data, error } = await admin
    .from('versa_code_inventory')
    .select(
      'id, versa_lead_ref, verified_email, verified_user_id, level, offering_id, status, expires_at, payment_confirmation_ref, program_route, redeemed_by, redeemed_at, batch_id, external_code_id',
    )
    .eq('code_digest', digest)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ?? null;
}

/**
 * Atomic consume + entitlement grant. Rolls back consume if grant fails (RPC).
 * Retry: if this user already redeemed the row, ensure entitlement exists.
 * @param {import('@supabase/supabase-js').SupabaseClient} admin
 */
export async function consumeAndGrant(admin, { id, userId, grantIntern = false }) {
  const { data, error } = await admin.rpc('redeem_versa_code_and_grant', {
    p_id: id,
    p_user_id: userId,
    p_grant_intern: Boolean(grantIntern),
  });
  if (!error) {
    return data ?? { ok: false, reason: 'reused' };
  }

  const missingRpc =
    error.code === 'PGRST202' ||
    /could not find the function|schema cache|does not exist/i.test(error.message || '');
  if (!missingRpc) throw new Error(error.message);

  return consumeAndGrantFallback(admin, { id, userId, grantIntern });
}

/** In-memory / pre-RPC fallback — still serialized by the admin mock. */
async function consumeAndGrantFallback(admin, { id, userId, grantIntern }) {
  const { data: existing } = await admin
    .from('versa_code_inventory')
    .select(
      'id, versa_lead_ref, verified_email, verified_user_id, level, offering_id, status, program_route, redeemed_by, redeemed_at',
    )
    .eq('id', id)
    .maybeSingle();

  if (existing?.status === 'redeemed' && String(existing.redeemed_by) === String(userId)) {
    const entitlement = await upsertEntitlement(admin, {
      userId,
      inventoryId: existing.id,
      versaLeadRef: existing.versa_lead_ref,
      level: existing.level,
      offeringId: existing.offering_id,
      programRoute: existing.program_route,
    });
    if (grantIntern && existing.program_route === 'spike-interns' && existing.level === 'L1') {
      await ensureInternProgressRow(admin, userId);
    }
    return { ok: true, already_granted: true, row: existing, entitlement };
  }

  const { data: updated, error: updErr } = await admin
    .from('versa_code_inventory')
    .update({
      status: 'redeemed',
      redeemed_at: new Date().toISOString(),
      redeemed_by: userId,
    })
    .eq('id', id)
    .eq('status', 'available')
    .select(
      'id, versa_lead_ref, verified_email, verified_user_id, level, offering_id, status, program_route, redeemed_by, redeemed_at',
    )
    .maybeSingle();
  if (updErr) throw new Error(updErr.message);
  if (!updated) return { ok: false, reason: 'reused' };

  try {
    const entitlement = await upsertEntitlement(admin, {
      userId,
      inventoryId: updated.id,
      versaLeadRef: updated.versa_lead_ref,
      level: updated.level,
      offeringId: updated.offering_id,
      programRoute: updated.program_route,
    });
    if (grantIntern && updated.program_route === 'spike-interns' && updated.level === 'L1') {
      await ensureInternProgressRow(admin, userId);
    }
    return { ok: true, already_granted: false, row: updated, entitlement };
  } catch (grantErr) {
    await admin
      .from('versa_code_inventory')
      .update({
        status: 'available',
        redeemed_at: null,
        redeemed_by: null,
      })
      .eq('id', id)
      .eq('redeemed_by', userId);
    throw grantErr;
  }
}

async function ensureInternProgressRow(admin, userId) {
  const { data: existing } = await admin
    .from('intern_progress')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (existing) return;
  const { error } = await admin.from('intern_progress').insert({
    user_id: userId,
    segment: 1,
    hours: 0,
    licensed: false,
    program_slug: 'spike-internship',
  });
  if (error) throw new Error(error.message);
}

/** @deprecated use consumeAndGrant */
export async function consumeInventoryRow(admin, { id, userId }) {
  const result = await consumeAndGrant(admin, { id, userId, grantIntern: false });
  return result?.ok ? result.row : null;
}

/** @param {import('@supabase/supabase-js').SupabaseClient} admin */
export async function insertInventoryRow(admin, row) {
  const { data, error } = await admin
    .from('versa_code_inventory')
    .insert(row)
    .select('id, versa_lead_ref, level, offering_id, status')
    .maybeSingle();
  if (error) {
    if (/duplicate|unique/i.test(error.message || '')) {
      return { duplicate: true, error };
    }
    throw new Error(error.message);
  }
  return { duplicate: false, data };
}

/** @param {import('@supabase/supabase-js').SupabaseClient} admin */
export async function recordAttempt(admin, row) {
  const { error } = await admin.from('versa_code_attempts').insert({
    actor_user_id: row.actorUserId ?? null,
    inventory_id: row.inventoryId ?? null,
    reason: row.reason,
    offering_id: row.offeringId ?? null,
    level: row.level ?? null,
    program_route: row.programRoute ?? null,
  });
  if (error && !/schema cache|does not exist|42P01/i.test(error.message || '')) {
    throw new Error(error.message);
  }
}

/** @param {import('@supabase/supabase-js').SupabaseClient} admin */
export async function upsertEntitlement(admin, row) {
  const { data, error } = await admin
    .from('versa_entitlements')
    .upsert(
      {
        user_id: row.userId,
        inventory_id: row.inventoryId,
        versa_lead_ref: row.versaLeadRef,
        level: row.level,
        offering_id: row.offeringId,
        program_route: row.programRoute,
        granted_at: row.grantedAt ?? new Date().toISOString(),
      },
      { onConflict: 'user_id,offering_id' },
    )
    .select('id, user_id, offering_id, level, versa_lead_ref, program_route, granted_at')
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

/** @param {import('@supabase/supabase-js').SupabaseClient} admin */
export async function listEntitlementsForUser(admin, userId) {
  const { data, error } = await admin
    .from('versa_entitlements')
    .select('offering_id, level, versa_lead_ref, program_route, granted_at')
    .eq('user_id', userId)
    .order('granted_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}
