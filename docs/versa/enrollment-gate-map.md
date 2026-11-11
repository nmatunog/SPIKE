# SPIKE × Versa enrollment gate map (analysis)

**Status:** analysis only. The portable Versa verifier does **not** attach to intern or RA-SPIKE portal routes, signup, or onboarding. Hosts can call `verify()` / `redeem()` later; this document records *where that would attach* and *what not to confuse with L1/L2*.

Owner (Nilo, 11 Nov 2026): V1 builds a **portable** Versa verification module, not coupled to the current portals. RA-SPIKE **Gate 1 / Gate 2 are internal program progression**, not external free L1 / paid L2 enrollment. A Versa code entitles only the course and level it was issued for. Never auto-grant both programs.

CSV/Excel column names and learner-identity format are **provisional** (Versa expected 11–12 Nov). Mapping is a config layer (`columnMap` + optional `VERSA_CSV_COLUMN_MAP` JSON). Do not lock production field names.

## Programs vs Versa course/level

| Surface | Today’s `intern_progress.program_slug` | Portable `intendedCourse` (`program_route`) | Free L1 (no code) | Paid L2 (code + payment proof) |
|---|---|---|---|---|
| SPIKE for Interns | `spike-internship` | `spike-interns` | Financial Literacy (`financial-literacy`); free FEP (`fep`) | `financial-entrepreneurship` — `paymentVerified` from the authorized provider, never the CSV |
| RA-SPIKE | `ra-spike` | `ra-spike` | Same offering ids, **separate entitlement** keyed by course | Same L2 rule, **separate entitlement** |

Interns and RA-SPIKE use **different databases**. Do not mix `user_id` or entitlements across projects.

## SPIKE for Interns — where L1/L2 *would* attach (not implemented in the portal)

```
WelcomePage → InternSignupPanel
  POST /api/auth/intern-signup
    daily activation_codes → profiles.role=INTERN
    intern_progress.program_slug = spike-internship
Auth → SpikeMasterPortal intern branch
  shouldGateInternOnboarding → /cohort-identity   (formation)
  learning → /venture-blueprint, /playbook, /dashboard
```

| Step | Files | Routes | Tables |
|---|---|---|---|
| Intern signup UI | `src/pages/WelcomePage.jsx`, `src/components/InternSignupPanel.jsx` | `/` | — |
| Account + intern-cohort enrollment | `functions/api/auth/intern-signup.js` | `POST /api/auth/intern-signup` | `activation_codes`, `profiles`, `intern_progress` |
| Post-auth shell | `src/SpikeMasterPortal.jsx` intern branch | intern paths in `src/routes/paths.js` | `intern_progress` |
| Formation | `src/lib/cohortOnboardingService.js` | `/cohort-identity` | onboarding fields |
| Learning | Venture Blueprint / Playbook | `/venture-blueprint`, `/playbook` | curriculum |

**Where intern enrollment is granted today:** daily staff `activation_codes` in `intern-signup.js`. That is intern-cohort access, not Versa L1/L2. `intern-signup.js` must stay Versa-free.

**Where a future host would call the portable verifier:** after an authenticated intern session, **before** formation/learning. Pass `intendedCourse: "spike-interns"` and `intendedLevel: "L1"` or `"L2"`. Do not grant RA-SPIKE from an intern code.

## RA-SPIKE — where L1/L2 *would* attach (not implemented in the portal)

```
WelcomePage (raSpikeApp) → RaSpikeSignupPanel
  POST /api/ra-spike/signup   (open signup, no invite)
    intern_progress.program_slug = ra-spike, onboarding_complete = true
Auth → RaSpikeApp renderRookieRoutes
  learning → /ra-spike/home
  progression → /ra-spike/stage-gate   (Gate 1 / Gate 2 — internal)
```

| Step | Files | Routes | Tables / RPCs |
|---|---|---|---|
| RA signup UI | `src/components/ra-spike/RaSpikeSignupPanel.jsx` | `/` on RA app | — |
| Account + RA-cohort enrollment | `functions/_shared/raSpikeSignupHandler.js` | `POST /api/ra-spike/signup` | `profiles`, `intern_progress`, `resolve_ra_spike_cohort` |
| Post-auth shell | `src/apps/ra-spike/RaSpikeApp.jsx` | `/ra-spike/home`, playbook, squad, profile | `intern_progress` |
| Onboarding | `shouldGateRaSpikeOnboarding()` is **false** | `/ra-spike/onboarding` | already complete at signup |

**Where RA enrollment is granted today:** open signup in `raSpikeSignupHandler.js`. No Versa.

**Where a future host would call the portable verifier:** after an authenticated RA intern session, **before** `/ra-spike/home`. Pass `intendedCourse: "ra-spike"`. Do not grant intern L1 from an RA code.

## Why Gate 1 / Gate 2 are not external L1 / L2

| Gate | Meaning | Files | Persistence |
|---|---|---|---|
| Gate 1 | Week-4 pitch **inside** RA-SPIKE | `src/lib/raSpikeGateService.js`, `/ra-spike/stage-gate?gate=1` | `intern_progress.gate_1_status`; `submit_ra_spike_week` (week 4); `evaluate_ra_spike_gate` |
| Gate 2 | Week-8 revalida **inside** RA-SPIKE | `/ra-spike/stage-gate?gate=2`, revalida pages | `intern_progress.gate_2_status`; week 8; `evaluate_ra_spike_gate` |

SQL: `supabase/migrations/20260727_ra_spike_week_progress.sql`, `20260728_ra_spike_gates_graduation.sql` (RA copies under `supabase/ra-spike/migrations/`).

These are program-progression milestones after RA-SPIKE enrollment. They are not Versa Financial Literacy (L1) or paid Financial Entrepreneurship (L2). Do not hook Versa into `submit_ra_spike_week`, `evaluate_ra_spike_gate`, or `gate_*` columns.

## Portable verifier (this work)

Self-contained module: `functions/_shared/versaCode/`.

```
verify(code, authenticatedIdentity, intendedCourse, intendedLevel) → result
redeem(...)  // single-use, server-side consume
```

Injected **entitlement adapter** (`EntitlementGrantor`) decides existing access / grant. The module never writes `profiles.role` or `intern_progress`.

Rules (offering catalog, not hardcoded host flows):

- Free L1 **Financial Literacy** and free **FEP** → no code required.
- Approved paid L2 → code + `paymentVerified` from the authorized provider (CSV is not payment proof).
- Future offering-specific codes register on the catalog (`requiresCode: true`) and flow through the same verify/redeem path.
- Course/level mismatch → deny. Program X never grants program Y.

Standalone local demo (not intern/RA portal): `/dev/versa-activate` with `VERSA_DEMO_LOCAL=1`. See `docs/versa/activation-demo.md`.

## Explicitly not in this work

- Versa landing page / code-delivery UX.
- Edits to intern signup, RA signup, SpikeMasterPortal intern routing, RaSpikeApp rookie routing, Gate 1/2.
- Hosted Supabase writes; production CSV column lock-in.
