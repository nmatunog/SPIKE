# Versa CSV code verification (SPIKE #7 Checkpoint 01)

Disabled-by-default module. **Do not enable in production** until Nilo confirms the L1 hook and Versa column names. Migrations in this change are repo-only — do not apply them to hosted Supabase projects from this PR.

## Feature flag

| Env | Default | Meaning |
|---|---|---|
| `VERSA_CSV_CODE_GATE` | unset (off) | `1` / `true` / `on` enables CSV verification |
| `VERSA_CODE_HMAC_SECRET` | required when flag on | HMAC-SHA-256 secret for code digests (min 16 chars) |
| `VERSA_L1_OFFERING_ID` | `financial-literacy` | Expected L1 offering id when intern-signup/redeem omit one |

When the flag is **off**, intern signup is unchanged: daily intern activation code → profile + `intern_progress`.

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

A typed name or an unverified email typed into the form is not identity proof. Match is: authenticated (or just-created) learner `userId` / session email **against the imported verified link**.

## Where the L1 gate is hooked (needs Nilo confirmation)

Main today has **no** named L1-free / L2-paid Versa gate:

- SPIKE for Interns: daily shared `activation_codes` check in `functions/api/auth/intern-signup.js`
- RA-SPIKE: open signup, no code (`20260812_ra_spike_open_signup_no_code.sql`)

This checkpoint wires the module at intern-signup **only when the flag is on**, treating the existing `code` field as the Versa code for **L1 / spike-interns**, then granting the **existing** intern entitlement (`profiles.role = INTERN` + `intern_progress.program_slug = spike-internship`).

Preferred identity-safe path (also shipped, flag-gated): authenticated `POST /api/versa/redeem`.

L2 later: same `verifyVersaCode` + `evaluateExistingOfferingGate`. A CSV match is never payment proof; L2 is denied unless a future caller sets `paymentVerified: true` from the real paid gate.

## Endpoints (flag off → 404 except status)

- `GET /api/versa/status` — `{ enabled }`
- `POST /api/versa/import` — staff CSV intake
- `POST /api/versa/redeem` — authenticated redeem
- `GET /api/versa/access` — already-granted offerings (no codes)

Codes are never placed in URLs, logs, or acknowledgments. Attempts store reason + ids only.

## F1

`activation_codes_public_read` (anon + authenticated SELECT on live codes) is dropped in repo SQL. Staff-only SELECT remains for faculty/mentor dashboards. Intern validation stays on the service-role function.
