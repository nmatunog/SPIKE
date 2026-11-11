# SEC-1 / F1 intern activation codes (hardening)

Waits for **Nilo's SEC-1 decision**. Repo SQL only. **Do not apply** to SPIKE Interns (`lzbfjbtjropoaynbcxew`) or RA-SPIKE (`yruwfdjqigxxwbqsqhho`) from this branch.

Live (read-only check, 11 Nov 2026), both projects:

- Policy `activation_codes_public_read` (`FOR SELECT TO anon, authenticated USING (expires_at > now())`) **is live**.
- Migrations `20260827`, `20260829`, `20260828`, `20260830` are **not** applied live.
- Live `anon` has `EXECUTE` on `ensure_daily_activation_code()` (SECURITY DEFINER, no role check).
- Live `anon` has **every** table privilege on `activation_codes`, including `TRUNCATE`.

This branch hardens repo SQL against that live state. It does not write hosted DBs.

F1 closes the client leak of live daily intern codes:

1. Drop `activation_codes_public_read`. Staff-only `activation_codes_staff_read` (FACULTY / MENTOR / ADMIN / SUPERUSER).
2. `REVOKE ALL ON public.activation_codes FROM anon`. Revoke `TRUNCATE`, `REFERENCES`, `TRIGGER` from `authenticated`.
3. `ensure_daily_activation_code()` raises for **anon / a null `auth.uid()`** and for non-staff roles. Only staff get a row back.
4. `REVOKE EXECUTE ON FUNCTION public.regenerate_daily_activation_code() FROM anon` (no-arg signature from `20260614` / `20260709` / `20260710` / `20260718`).
5. Client signup no longer SELECTs `activation_codes`. If Pages Functions are down, intern signup **fails closed**. Service-role `functions/api/auth/intern-signup.js` still validates codes.

Prove RA copies survive `sync-ra-spike-migrations.sh` with `bash scripts/check-sec1-f1-ra-spike-sync.sh` (temp copy only; never hosted).

Local tests: `SKIP_AUTO_SHIP=1 AUTO_SHIP=0 npm run test:sec1-f1` (PGlite).

## Files

| Path | Role |
|---|---|
| `src/SpikeMasterPortal.jsx` | Fail-closed intern signup when the Pages Function is unavailable |
| `src/lib/internSignupService.js` | `clientDailyActivationFallbackAllowed() === false` |
| `src/lib/activationCodeService.js` | `validateInternActivationCode` no longer SELECTs the table |
| `supabase/activation_codes.sql` | Baseline schema with staff-read policy + table revokes |
| `supabase/migrations/20260827_restrict_activation_codes_anon_read.sql` | Interns: drop public-read, staff-read, revoke anon ALL / authenticated TRUNCATE |
| `supabase/migrations/20260829_gate_ensure_daily_activation_code.sql` | Interns: fail-closed RPC + revoke regenerate from anon |
| `supabase/migrations/_rollback_20260827_*.sql` | Interns safe-partial piece (policy) |
| `supabase/migrations/_rollback_20260829_*.sql` | Interns safe-partial piece (ungated fn; revoke `public` only) |
| `supabase/rollbacks/sec1_f1_safe_partial.sql` | Interns umbrella **safe-partial** |
| `supabase/rollbacks/sec1_f1_exact_restore.sql` | Interns **exact-restore** (re-grants live anon ALL + EXECUTE) |
| `supabase/ra-spike/migrations/20260827_*.sql` | RA copy (allowlisted; sync from intern) |
| `supabase/ra-spike/migrations/20260829_*.sql` | RA copy (allowlisted; sync from intern) |
| `supabase/ra-spike/rollbacks/20260827_*.sql` | RA safe-partial piece |
| `supabase/ra-spike/rollbacks/20260829_*.sql` | RA safe-partial piece |
| `supabase/ra-spike/rollbacks/sec1_f1_safe_partial.sql` | RA umbrella **safe-partial** |
| `supabase/ra-spike/rollbacks/sec1_f1_exact_restore.sql` | RA **exact-restore** |

`scripts/sync-ra-spike-migrations.sh` copies allowlisted intern files into `supabase/ra-spike/migrations/` after `rm -f migrations/*.sql`. F1 forwards are on `supabase/ra-spike/migrations-allowlist.txt`. Rollback SQL is **not** on the allowlist.

## Two rollback flavors

Do not run these unless Nilo undoes an applied SEC-1 migration.

### `safe-partial` (current branch rollback)

Restores `activation_codes_public_read` and the ungated `ensure_daily_activation_code()` from main. Revokes the function from `public` only (does **not** give `anon` EXECUTE or table ALL/TRUNCATE).

- Interns: `supabase/rollbacks/sec1_f1_safe_partial.sql` (pieces: `_rollback_20260827_*`, `_rollback_20260829_*`)
- RA-SPIKE: `supabase/ra-spike/rollbacks/sec1_f1_safe_partial.sql`

### `exact-restore` (match live)

Same as safe-partial, then re-grants what live actually had: `GRANT ALL ON TABLE public.activation_codes TO anon`, `GRANT TRUNCATE, REFERENCES, TRIGGER` back to `authenticated`, `GRANT EXECUTE` on `ensure_daily_activation_code()` **and** `regenerate_daily_activation_code()` to `anon`.

- Interns: `supabase/rollbacks/sec1_f1_exact_restore.sql`
- RA-SPIKE: `supabase/ra-spike/rollbacks/sec1_f1_exact_restore.sql`

Client rollback is `git revert` of this branch (restore the main signup fallback that SELECTs `activation_codes`).
