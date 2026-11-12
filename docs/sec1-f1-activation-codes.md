# SEC-1 / F1 intern activation codes (hardening)

Waits for **Nilo's SEC-1 decision**. Repo SQL only. **Do not apply** to SPIKE Interns (`lzbfjbtjropoaynbcxew`) or RA-SPIKE (`yruwfdjqigxxwbqsqhho`) from this branch.

Frozen parent: `sec1/f1-hardening-4` @ `338ba4f`. This tree is `sec1/f1-hardening-5`.

Live (read-only check, 11 Nov 2026), both projects:

- Policy `activation_codes_public_read` (`FOR SELECT TO anon, authenticated USING (expires_at > now())`) **is live**.
- Migrations `20260827`, `20260829`, `20260828`, `20260830` are **not** applied live.
- Live `anon` has `EXECUTE` on `ensure_daily_activation_code()` (SECURITY DEFINER, no role check).
- Live `anon` has **every** table privilege on `activation_codes`, including `TRUNCATE`.
- `pg_cron` job `spike-daily-activation-code` runs `select public.ensure_daily_activation_code()` at 16:00 UTC (midnight Manila) with a null `auth.uid()`.

This branch hardens repo SQL against that live state. It does not write hosted DBs.

F1 closes the client leak of live daily intern codes and keeps midnight minting working:

1. Drop `activation_codes_public_read`. Staff-only `activation_codes_staff_read` (FACULTY / MENTOR / ADMIN / SUPERUSER).
2. `REVOKE ALL ON public.activation_codes FROM anon`. Revoke `TRUNCATE`, `REFERENCES`, `TRIGGER` from `authenticated`.
3. `ensure_daily_activation_code()` raises for **anon / a null `auth.uid()`** and for non-staff roles. Only staff get a row back (RPC).
4. Internal `mint_daily_activation_code()` returns void, is not granted to anon / authenticated / PUBLIC, and is what pg_cron calls.
5. `regenerate_daily_activation_code()` is fail-closed on a null `current_role()` (`IS DISTINCT FROM`, plus a null-uid raise). `REVOKE EXECUTE` from anon and PUBLIC.
6. Client signup no longer SELECTs `activation_codes`. If Pages Functions are down, intern signup **fails closed**. Service-role `functions/api/auth/intern-signup.js` still validates codes against the minted row.

Prove RA copies survive `sync-ra-spike-migrations.sh` with `bash scripts/check-sec1-f1-ra-spike-sync.sh` (temp copy only; never hosted). Intern and RA rollback SQL must be byte-identical.

Local tests: `SKIP_AUTO_SHIP=1 AUTO_SHIP=0 npm run test:sec1-f1` (PGlite), `bash scripts/check-sec1-f1-ra-spike-sync.sh`, `bash scripts/check-ship-migrations-opt-in.sh`.

## Intern signup rate limit

Durable per-IP limiter (`intern_signup_rate_limits`), classroom-safe default **20 failed code attempts / 10 minutes** (`INTERN_SIGNUP_RATE_MAX`). Only invalid/expired/missing daily codes consume a slot. A valid code refunds the reservation.

`intern_signup_rate_limit_begin_attempt` checks and increments in one row lock **before** code validation (closes the burst race). Missing table/function **fails open**: log `INTERN SIGNUP RATE LIMIT UNAVAILABLE` and continue normal code validation — never 429 a legitimate signup because the limiter is absent. Any other `rpc.error` **fails closed** with a generic HTTP 503.

## Migration ordering (SEC-1 first)

Keep the original SEC-1 pair at `20260827` and `20260829`. The atomic limiter follow-up is `20261112070001`, which sorts after those two and **before** Versa `20261112080001`–`05`. Apply the full SEC-1 series to Interns and RA-SPIKE **before** any Versa file. Do not number SEC-1 follow-ups above Versa — that makes a SEC-1-first apply, then Versa, fail out-of-order.

The runner applies local files whose version is **not** in remote `schema_migrations`. Mixed 8–14 digit stamps are compared by right-padding to 14 digits. Pending files below the live max fail loudly (named in stderr) unless `ALLOW_OUT_OF_ORDER=1`. `npm run db:migrate` is a no-op without `APPLY_DB_MIGRATIONS=1`.

`npm run build` / `scripts/ship-after-build.sh` never apply SQL unless `APPLY_DB_MIGRATIONS=1` **and** the branch is `main`. Prove with `bash scripts/check-ship-migrations-opt-in.sh`.

After a hosted apply, run the read-only probe (`bash scripts/probe-sec1-f1-grants.sh`; `PROBE_LINKED=1` only against an already-linked project). It checks anon SELECT / EXECUTE and `activation_codes_public_read`, not `schema_migrations`.

## Files

| Path | Role |
|---|---|
| `src/SpikeMasterPortal.jsx` | Fail-closed intern signup when the Pages Function is unavailable |
| `src/lib/internSignupService.js` | `clientDailyActivationFallbackAllowed() === false` |
| `src/lib/activationCodeService.js` | `validateInternActivationCode` no longer SELECTs the table |
| `supabase/activation_codes.sql` | Baseline schema with staff-read policy + table revokes |
| `supabase/migrations/20260827_restrict_activation_codes_anon_read.sql` | Interns: drop public-read, staff-read, revoke anon ALL / authenticated TRUNCATE |
| `supabase/migrations/20260829_gate_ensure_daily_activation_code.sql` | Interns: staff RPC, internal mint, fail-closed regenerate, cron reschedule |
| `supabase/migrations/20261112070001_intern_signup_rate_limit_atomic.sql` | Interns: atomic begin/refund limiter RPCs (before Versa) |
| `supabase/rollbacks/20260827_*.sql` | Interns safe-partial piece (policy); byte-identical to RA copy |
| `supabase/rollbacks/20260829_*.sql` | Interns safe-partial piece (ungated fn, drop mint, cron → ensure) |
| `supabase/rollbacks/sec1_f1_safe_partial.sql` | Interns umbrella **safe-partial** (byte-identical to RA) |
| `supabase/rollbacks/sec1_f1_exact_restore.sql` | Interns **exact-restore** (byte-identical to RA) |
| `scripts/probe-sec1-f1-grants.sh` | Read-only post-apply grant/policy probe |
| `scripts/check-ship-migrations-opt-in.sh` | Proves ship-after-build never migrates off main / without the flag |
| `supabase/ra-spike/migrations/20260827_*.sql` | RA copy (allowlisted; sync from intern) |
| `supabase/ra-spike/migrations/20260829_*.sql` | RA copy (allowlisted; sync from intern) |
| `supabase/ra-spike/rollbacks/` | RA rollback copies (not on the allowlist) |

`scripts/sync-ra-spike-migrations.sh` copies allowlisted intern files into `supabase/ra-spike/migrations/` after `rm -f migrations/*.sql`. F1 forwards are on `supabase/ra-spike/migrations-allowlist.txt`. Rollback SQL is **not** on the allowlist.

## Two rollback flavors

Do not run these unless Nilo undoes an applied SEC-1 migration. Both drop `mint_daily_activation_code()` and point pg_cron back at `ensure()`.

### `safe-partial` (current branch rollback)

Restores `activation_codes_public_read` and the ungated `ensure_daily_activation_code()` from main. Revokes the function from `public` only (does **not** give `anon` EXECUTE or table ALL/TRUNCATE). Restores the live `regenerate()` body.

### `exact-restore` (match live)

Same as safe-partial, then re-grants what live actually had: `GRANT ALL ON TABLE public.activation_codes TO anon`, `GRANT TRUNCATE, REFERENCES, TRIGGER` back to `authenticated`, `GRANT EXECUTE` on `ensure_daily_activation_code()` **and** `regenerate_daily_activation_code()` to `anon`.

Client rollback is `git revert` of this branch (restore the main signup fallback that SELECTs `activation_codes`).
