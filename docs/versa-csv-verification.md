# Versa CSV identity verification (portable service)

Disabled-by-default **independent** module (`functions/_shared/versaCode/*`). It is **not** wired into intern signup, Welcome, or the intern dashboard. Final portal integration waits until Nilo picks the target architecture (issue #7, Nov 11 05:15 UTC and NEXO #32 / 05:23 UTC).

Repo SQL only. Synthetic data only. Do not enable in production from this PR.

F1 intern `activation_codes` hardening lives on `sec1/f1-activation-codes`, not this branch. This branch stays portal-neutral against `main`.

## Owner direction this branch follows

- Nov 11 05:15: freeze irreversible portal commitments; portable CSV parser, validator, identity-contract, and synthetic tests; do not retrofit the intern `activation_codes` table by default.
- Nov 11 05:23 (NEXO #32): CSV/identity code-verification stays an independent portable service; portal integration comes after the target structure is chosen.
- Nov 12: Versa sent the real export header. **Lock the parser to it.** Nilo: "capture the code and the plan for our use."
- Nov 12, 1:14 PM: a **PRO code alone unlocks paid L2**, because Versa collects the payment. An imported `pro` row is the payment-confirmed signal (`VERSA_PRO_CODE_IMPLIES_PAID` defaults true).

## Locked Versa export schema

Exact header (strip a UTF-8 BOM on the first file):

`Code,Plan,PlanSlug,Owner,SiteName,Inventory,Status,PurchasedAt,DurationDays,UnitPriceTokens,CreatedAt`

Versa sends two files (either alone or concatenated; a repeated header row is skipped):

| Set | `Code` | `Plan` | `PlanSlug` |
|---|---|---|---|
| Free | `FREE-XXXXXXXX` (8 uppercase hex in production) | `CRM Free` | `free` |
| Paid | `PRO-XXXXXXXX` | `CRM Pro` | `pro` |

In the export, Owner, SiteName, PurchasedAt, DurationDays and UnitPriceTokens are empty. Inventory is `Unsold`, Status is `INACTIVE`, CreatedAt is an ISO timestamp. Empty optional columns are accepted.

Import stores:

- **Code** as HMAC-SHA-256 digest only (never plaintext, never in logs)
- **Plan** and **PlanSlug**
- other columns as optional raw metadata

Unknown `PlanSlug` values are rejected at import.

Synthetic fixtures only (`FREE-SYN00001`, `PRO-SYN00001`, …). Do not commit live Versa codes.

## PlanSlug map

One config table (`PLAN_SLUG_MAP`):

| Slug | Grants | Does not grant |
|---|---|---|
| `free` | Gate 1 Literacy (`financial-literacy`) **and** Gate 2 FEP Preview (`fep`) on `spike-interns` | RA-SPIKE, paid L2 |
| `pro` | Gate 3 / paid L2 (`financial-entrepreneurship`) on `spike-interns` | intern free pathway |
| anything else | rejected | — |

A code never auto-grants both intern and RA-SPIKE. Course/level checks use this map.

## Identity

The export has no email or owner identity. Binding happens at redemption: the first authenticated, **verified** account to redeem claims the code once (atomic, single-use). A typed/unverified email is never proof.

## Feature flags

| Env | Default | Meaning |
|---|---|---|
| `VERSA_CSV_CODE_GATE` | unset (off) | Enables the portable HTTP adapters under `/api/versa/*` |
| `VERSA_CODE_HMAC_SECRET` | required when flag on | HMAC-SHA-256 secret (**min 32 chars**) |
| `VERSA_L1_OFFERING_ID` | `financial-literacy` | Default L1 offering id |
| `VERSA_PRO_CODE_IMPLIES_PAID` | unset (**true**) | **Nilo, Nov 12 2026:** Versa collects payment, so a server-side import of a `pro` row is the payment-confirmed signal. Redeeming that code grants paid L2. Set `0` / `false` / `off` to revert. The HTTP body can never set this. |

Intern signup is **unchanged from main**. The Versa flag never grants `profiles.role = INTERN`.

## Adapter contract

### IdentityProvider

A verified identity must come from:

1. The **chosen auth provider** (session `userId`; email only when that provider confirmed it, e.g. `email_confirmed_at`), or
2. A **Versa-verified handoff** payload (`verified: true`).

Mocks: `createSessionIdentityProvider`, `createMockVersaHandoffIdentityProvider`.

### EntitlementGrantor

Grant runs **inside** the redeem transaction. A `free` slug grants Literacy + FEP Preview. Returning learners who already hold every offering in the slug bundle bypass consuming another code.

Mocks: `createMockL1Grantor` (never sets intern role) and `createMockL2Grantor` (payment proof is an imported `pro` row when `VERSA_PRO_CODE_IMPLIES_PAID` is on — **never** the HTTP body).

## HTTP denies

Every deny reason maps to one 403 + `GENERIC_DENY_MESSAGE`. Detailed reasons stay in redacted server logs.

## Rate limit

Durable `versa_rate_limits`, keyed by `user:<id>` or `ip:<addr>`. Increment is the SQL RPC `versa_rate_limit_record_fail`. **Fail closed** if the table or the RPC is missing.

## Isolated UI

`src/components/VersaCodeGate.jsx` is a **demo-only** component. Prefer `VersaActivateHarness` (`/dev/versa-activate`) for the local verifier.

## Synthetic matrix (`npm run test:versa-code`)

Locked export fixtures (BOM free file + non-BOM pro file), slug mapping, unknown slug rejection, duplicate codes, mixed files, first-claimer redemption, imported `pro` grants paid L2 once, unknown PRO-shaped codes denied, and HTTP `paymentVerified` ignored.

Plus HMAC 32+, missing rate-limit table/RPC fail-closed, PGlite single-use and atomic increment.

## Still needing Nilo

- Target architecture (NEXO #32) before any live portal integration.
- Co-branded landing page and final help copy (open external dependency).
- Hosted SQL apply and Cloudflare flag + 32+ HMAC secret when enabling.
- SEC-1 decision on intern `activation_codes` (separate branch `sec1/f1-activation-codes`).
