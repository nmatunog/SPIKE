# Versa PRO monthly renewal — options

**Chosen: (B) a new PRO code every month.** Relayed by Nilo, Nov 12, 2026, 1:57 PM. Versa: only the code and the plan are needed. SPIKE applies a 30-day period (+ 7-day grace) from **server config**, not from CSV `DurationDays` / `PurchasedAt` / `Status` (those columns stay blank).

Nilo reversed lifetime access at 1:48 PM. This supersedes any lifetime-entitlement idea. Frozen verifier before this work: `v1/versa-csv-schema-2` @ `f05d519`. Implementation: `v1/versa-pro-monthly`.

Do not implement (A). The CSV schema is unchanged.

## Already true at f05d519 (kept)

- An imported `pro` row is payment proof. Redeeming it grants paid L2 (`financial-entrepreneurship` on `spike-interns` only). Not Literacy, FEP, RA-SPIKE, or any future L3.
- First verified account binds the code (`verified_user_id` at consume). A second account is denied. HTTP `paymentVerified` is ignored.
- **Code expiry before redemption** (inventory Status `EXPIRED` / `expires_at`) is separate from entitlement length.

## Open question — answered

| | (A) Same code, reactivated | **(B) New PRO code each month — chosen** |
|---|---|---|
| What Versa sends | The same `Code` with Status updated | A new `PRO-…` code for the same payer |
| What SPIKE does | Re-sync that digest | Consume the new code; **extend** L2 for that bound user |

## (B) as built

`new_expiry = max(now, current_expiry) + VERSA_PRO_PERIOD_DAYS` (default 30), in the same consume transaction. Grace `VERSA_PRO_GRACE_DAYS` (default 7) after expiry; then L2 is denied until a new PRO code. Gate checks are **lazy** (no cron). FREE entitlements stay non-expiring.

**Anti-sharing.** Each new code binds on first verified redeem. Another user redeeming a different code gets **their** L2; it never extends yours. A reused code is denied. The HTTP body cannot set duration.

## (A) not built

Same-code monthly CSV re-export (active vs blocked) is documented only. Versa did not pick it.
