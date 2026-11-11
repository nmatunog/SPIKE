# Versa CSV identity verification (portable service)

Disabled-by-default **independent** module (`functions/_shared/versaCode/*`). It is **not** wired into intern signup, Welcome, or the intern dashboard. Final portal integration waits until Nilo picks the target architecture (issue #7, Nov 11 05:15 UTC and NEXO #32 / 05:23 UTC).

Repo SQL only. Synthetic data only. Do not enable in production from this PR.

## Owner direction this branch follows

- Nov 11 05:15: freeze irreversible portal commitments; portable CSV parser, validator, identity-contract, and synthetic tests; do not retrofit the intern `activation_codes` table by default.
- Nov 11 05:23 (NEXO #32): CSV/identity code-verification stays an independent portable service; portal integration comes after the target structure is chosen.

## Feature flag

| Env | Default | Meaning |
|---|---|---|
| `VERSA_CSV_CODE_GATE` | unset (off) | Enables the portable HTTP adapters under `/api/versa/*` |
| `VERSA_CODE_HMAC_SECRET` | required when flag on | HMAC-SHA-256 secret (**min 32 chars**) |
| `VERSA_L1_OFFERING_ID` | `financial-literacy` | Default L1 offering id |

Intern signup is **unchanged from main** (daily activation code on the server). The Versa flag never grants `profiles.role = INTERN`.

## Adapter contract

### IdentityProvider

A verified identity must come from:

1. The **chosen auth provider** (session `userId`; email only when that provider confirmed it, e.g. `email_confirmed_at`), or
2. A **Versa-verified handoff** payload (`versa_lead_ref` + `verified: true`).

A typed/unverified email is never proof. This module does **not** flip `emailConfirm: true` on portal signup.

Mocks: `createSessionIdentityProvider`, `createMockVersaHandoffIdentityProvider`.

### EntitlementGrantor

Grant runs **inside** the redeem transaction only after the identity match. Returning learners with an existing portable entitlement (`versa_entitlements`) **bypass** redemption.

Mocks: `createMockL1Grantor` (never sets intern role) and `createMockL2Grantor` (requires `paymentVerified` from the authorized provider — **never** from the CSV).

Host portals plug real grantors in later. Until then, the portable store is `versa_entitlements` only.

## CSV import

Configurable `columnMap` on `POST /api/versa/import`. Plain header `email` is **not** an alias for `verified_email`.

## Rate limit

Durable `versa_rate_limits`, keyed by `user:<id>` or `ip:<addr>`. Increment is atomic (`fail_count = fail_count + 1` / upsert RPC). **Fail closed** if the table is missing.

## Isolated UI

Neutral paste-friendly **Activate your SPIKE access** screen (`src/components/VersaCodeGate.jsx`):

- Heading: Activate your SPIKE access
- Action: Verify & Continue
- Continue: Continue to SPIKE Learning
- Help placeholder (no delivery-channel promises): `Access codes are issued through the SPIKE–Versa enrollment process. Delivery channel is pending the co-branded enrollment page.`

Demo (not intern flow):

- Dev-only route: `/dev/versa-activate`
- Static harness: `docs/versa-activate-harness.html`
- Screenshot: `docs/versa-activate-harness.png` (synthetic demo code only)

## F1 (kept; intern portal unchanged except fail-closed fallback)

- No client SELECT of `activation_codes`.
- `ensure_daily_activation_code()` is staff-gated.
- **Deliberate trade-off for Nilo:** if Pages Functions are down, intern signup **fails closed** instead of validating the daily code in the browser. This is not Versa coupling; it is the F1 leak remaining closed.

## Synthetic matrix (`npm run test:versa-code`)

Portable path (verified session unless noted):

1. valid verified session
2. wrong identity
3. wrong level/offering
4. unknown
5. reused
6. revoked
7. typed email only
8. wrong `program_route`
9. returning learner bypass

Plus Versa handoff identity, L2 `paymentVerified`, HMAC 32+, missing rate-limit table fail-closed, PGlite single-use and atomic increment.

## Still needing Nilo

- Target architecture (NEXO #32) before any live portal integration.
- Versa CSV headers / `columnMap`.
- Co-branded landing page and final help copy (open external dependency).
- Hosted SQL apply and Cloudflare flag + 32+ HMAC secret when enabling.
- Whether intern signup should regain a client fallback when Functions are down (current: fail closed / F1).
