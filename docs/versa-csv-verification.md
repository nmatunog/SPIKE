# Versa CSV code verification (SPIKE #7 Checkpoint 01)

Disabled-by-default portable module (`functions/_shared/versaCode/*`). **Do not enable in production** until Nilo confirms the L1 hook, Versa column names, HMAC secret, and hosted SQL apply. Migrations in this change are **repo-only** — do not apply them to hosted Supabase projects from this PR.

Nov 8 owner correction still governs gate logic (existing L1 free / L2 paid; CSV is the code source). Nov 11 owner comments: park Versa landing-page UI as an **OPEN EXTERNAL DEPENDENCY**; keep this module portable; do not retrofit deeply into the intern `activation_codes` table.

## Feature flag

| Env | Default | Meaning |
|---|---|---|
| `VERSA_CSV_CODE_GATE` | unset (off) | `1` / `true` / `on` enables CSV verification |
| `VERSA_CODE_HMAC_SECRET` | required when flag on | HMAC-SHA-256 secret for code digests (**min 32 chars**) |
| `VERSA_L1_OFFERING_ID` | `financial-literacy` | Expected L1 offering id when redeem omits one |

When the flag is **off**, intern signup is unchanged: daily intern activation code (server-only) → profile + `intern_progress`.

When the flag is **on**:

1. `POST /api/auth/intern-signup` creates an **unconfirmed** account and profile. It does **not** consume a Versa code, does **not** grant `intern_progress`, and ignores any typed code/email as identity.
2. The learner confirms email with the auth provider, signs in, then redeems via authenticated `POST /api/versa/redeem`.
3. Welcome/guest UI does not redeem. Signed-in intern UI (`VersaAccessCard` / My Learning / Access) calls redeem with the session.

## Identity (HIGH 1)

A typed/unverified email is never proof. Redemption binds to an authenticated session:

- CSV `verified_user_id` equals session `user.id`, or
- auth-provider-confirmed email (`email_confirmed_at`) matches CSV `verified_email`, or
- a server-side Versa-verified handoff flag plus matching verified link.

Plain CSV header `email` is **not** an alias for `verified_email`.

## Assumed CSV schema (not yet agreed with Versa)

Importer column mapping is configurable via `columnMap` on `POST /api/versa/import`. Defaults:

| Logical field | Assumed header | Required |
|---|---|---|
| `code` | `code` | yes (hashed, never stored) |
| `versaLeadRef` | `versa_lead_ref` | yes (reporting / inventory key, **not** identity proof) |
| `verifiedEmail` | `verified_email` | one of email or user id |
| `verifiedUserId` | `verified_user_id` | one of email or user id |
| `level` | `level` | yes (`L1` / `L2`) |
| `offeringId` | `offering_id` | defaulted from level if omitted |
| `status` | `status` | default `available` |
| `batchId` | `batch_id` | no |
| `externalCodeId` | `external_code_id` | no (unique when present) |
| `issuedAt` | `issued_at` | no |
| `expiresAt` | `expires_at` | no |
| `paymentConfirmationRef` | `payment_confirmation_ref` | L2 reconciliation only; **never payment proof** |
| `programRoute` | `program_route` | default `spike-interns` for L1, `ra-spike` for L2 |

Intern path (`expected.programRoute = spike-interns`) only grants `spike-internship` from **spike-interns** L1 rows.

## Where the L1 gate is hooked (needs Nilo confirmation)

Main today has **no** named L1-free / L2-paid Versa gate:

- SPIKE for Interns: daily shared `activation_codes` check in `functions/api/auth/intern-signup.js` when the flag is **off**
- RA-SPIKE: open signup, no code (`20260812_ra_spike_open_signup_no_code.sql`)

Flag **on**: intern-signup is account creation only. Existing intern entitlement (`profiles.role = INTERN` + `intern_progress.program_slug = spike-internship`) is granted inside `redeem_versa_code_and_grant` when the intern path matches.

L2 later: same `verifyVersaCode` + `evaluateExistingOfferingGate`. A CSV match is never payment proof; L2 is denied unless a future caller sets `paymentVerified: true` from the real paid gate.

## Endpoints (flag off → 404 except status)

- `GET /api/versa/status` — `{ enabled }`
- `POST /api/versa/import` — staff CSV intake
- `POST /api/versa/redeem` — authenticated, verified-identity redeem
- `GET /api/versa/access` — already-granted offerings (no codes)

Codes are never placed in URLs, logs, or acknowledgments. Attempts store reason + ids only.

## F1

- `activation_codes_public_read` (anon + authenticated SELECT on live codes) is dropped in repo SQL. Staff-only SELECT remains for faculty/mentor dashboards.
- Client `validateInternActivationCode` no longer SELECTs `activation_codes`. Intern validation is the Pages Function only.
- `ensure_daily_activation_code()` stays SECURITY DEFINER but raises unless the caller is FACULTY/MENTOR/ADMIN/SUPERUSER (or `auth.uid()` is null for cron). Granted to `authenticated` + `service_role`; intern JWTs cannot load plaintext daily codes.
- When the Versa flag is on, the intern-signup **client** daily-code fallback is disabled (fail closed). The helper always returns false so F1 cannot reopen.

## Consume + grant / rate limit

- Durable rate limit: `versa_rate_limits` keyed by `user:<id>` or `ip:<addr>`.
- Atomic consume + grant: `redeem_versa_code_and_grant` (service_role). Same-learner retry is `already_granted` and re-upserts entitlement / intern progress. JS fallback rolls consume back if grant throws.
- `versa_entitlements` SELECT is learner-self or ADMIN/SUPERUSER only (faculty/mentor no longer read all rows).

## UI (Nov 11 owner comments)

- Heading: Activate your SPIKE access. Action: Verify & Continue. Success continue: Continue to SPIKE Learning.
- Generic deny (no coordinator / delivery channel): `We couldn't verify this code for your account. Check the code or use the enrollment help link.`
- “Where do I find my code?” uses a **neutral placeholder** until Versa supplies the co-branded landing page. Do not hard-code email/on-screen delivery.
- Co-branded Versa landing page remains an **OPEN EXTERNAL DEPENDENCY**.

## Synthetic matrix (`npm run test:versa-code`)

6-case through authenticated `/api/versa/redeem` with a **verified session identity**:

1. valid
2. wrong identity
3. wrong level/offering
4. unknown
5. reused
6. revoked/invalid

Added cases: typed/unverified email, daily-code fallback bypass, wrong `program_route`. PGlite covers SQL single-use + recoverable grant retry.

## Still needing Nilo

- Confirm assumed CSV headers / `columnMap` with Versa.
- Confirm L1 intern hook (this branch uses authenticated redeem, not intern-signup consume).
- Co-branded Versa landing page, code-delivery channel, and final “Where do I find my code?” copy.
- Hosted SQL apply (interns DB; RA-SPIKE only gets the `ensure_daily_activation_code` gate).
- Cloudflare `VERSA_CSV_CODE_GATE` + 32+ char `VERSA_CODE_HMAC_SECRET` when enabling.
- Email confirmation delivery so flag-on signup can become a verified session.
- Architecture reevaluation (Nov 11 05:15) is a separate checkpoint — this PR stays a portable CSV/validator/identity module, draft only.
