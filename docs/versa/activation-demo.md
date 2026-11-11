# Portable Versa verifier — local activation demo

Standalone harness. It is **not** intern signup, RA-SPIKE signup, or Gate 1/2. It calls `verify()` / `redeem()` in `functions/_shared/versaCode/` through a Vite middleware that loads `docs/versa/synthetic-enrollment.csv` into an in-memory store.

## Run

```bash
SKIP_AUTO_SHIP=1 AUTO_SHIP=0 npm run demo:versa-verifier
```

Open http://127.0.0.1:4178/dev/versa-activate

`VERSA_DEMO_LOCAL=1` is required for the middleware. Default `npm run dev` does not install it.

## Screenshot every UI state

```bash
SKIP_AUTO_SHIP=1 AUTO_SHIP=0 npm run test:versa-verifier
```

Writes:

| File | State |
|---|---|
| `docs/versa/artifacts/success.png` | Valid intern L1 code |
| `docs/versa/artifacts/invalid.png` | Unknown code |
| `docs/versa/artifacts/expired.png` | Expired code |
| `docs/versa/artifacts/already-redeemed.png` | Already used |
| `docs/versa/artifacts/identity-mismatch.png` | Code linked to another learner |
| `docs/versa/artifacts/wrong-course-level.png` | Same learner, RA-route or L2 code on intern L1 (`SYN-L1-ROUTE-H8`) |
| `docs/versa/artifacts/free-no-code.png` | Free Financial Literacy / FEP — no code |

## Interface

```js
import { verify, redeem } from './functions/_shared/versaCode/index.js';

await verify(code, authenticatedIdentity, intendedCourse, intendedLevel, { env, admin, grantor });
await redeem(code, authenticatedIdentity, intendedCourse, intendedLevel, { env, admin, grantor });
```

- `intendedCourse`: `spike-interns` | `ra-spike` | offering id (`financial-literacy`, `fep`)
- `intendedLevel`: `L1` | `L2`
- Free L1 Financial Literacy and free FEP: pass an empty code
- Paid L2: code + `paymentVerified: true` from the authorized provider
- Injected `grantor` (`EntitlementGrantor`) owns existing-access / grant. The module never writes `intern_progress`.

CSV/xlsx import uses `columnMap` / `VERSA_CSV_COLUMN_MAP` (Versa schema still pending).
