# Versa PRO monthly renewal — options (do not build)

**Status:** design note only. No code. Frozen verifier remains `v1/versa-csv-schema-2` @ `f05d519`.

Nilo reversed lifetime access at **Nov 12, 2026, 1:48 PM**: a PRO code needs **monthly renewal**. That restores the D-series Gate 3 intent (₱500 per 30 days) for Versa PRO. Nilo is asking Versa whether they **reactivate the same code** or **issue a new one**. Until that answer lands, **do not implement renewal, expiry jobs, grace, or lapse**.

## Already true at f05d519 (unchanged)

- An imported `pro` row is payment proof. Redeeming it grants paid L2 (`financial-entrepreneurship` on `spike-interns` only). Not Literacy, FEP, RA-SPIKE, or any future L3.
- First verified account binds the code (`verified_user_id` written atomically at consume). A second account is denied. HTTP `paymentVerified` is ignored.
- The export header is locked. **`Status`, `PurchasedAt`, and `DurationDays` are currently blank** (Status `INACTIVE` / Inventory `Unsold` maps to an available code). Those columns are stored as metadata only.
- **Code expiry before redemption** is separate from entitlement length: an inventory row with Status `EXPIRED` (or `expires_at` in the past) is denied at redeem. After a successful redeem, f05d519 does **not** attach a term, renewal, or grace to the L2 entitlement.

## Open question for Versa

| | (A) Same code, reactivated | (B) New PRO code each month |
|---|---|---|
| What Versa sends | The same `Code` on the next monthly export, with Status (and likely dates) updated | A new `PRO-…` code for the same payer |
| What SPIKE does | Re-sync that digest; bound user keeps / extends L2 | Redeem the new code against the **existing** L2 entitlement for the same bound user |

Do not guess which one Versa uses. Both need fields that today’s export does not fill.

## (A) Same code renewed monthly

Versa’s monthly CSV re-export shows the code as **active** or **blocked**. SPIKE re-imports by digest (Code is hashed; the plaintext never changes).

**CSV fields needed (today blank).** `Status` has to become a real signal: one value for “paid / active this period” and one for “blocked / unpaid / cancelled”. `PurchasedAt` + `DurationDays` (or an explicit period end) are needed to compute the current window. Until Versa fills them, SPIKE cannot tell a renewed code from the current `INACTIVE`/`Unsold` snapshot.

**Repeat redemption by the bound user.** Today a same-user retry is `already_granted` and does **not** extend anything. Under (A), a re-sync that marks the code active would **extend** that user’s L2 to the new period end **without** burning a second code. The bound `verified_user_id` is the only identity that may receive the extension. An HTTP body must not set duration.

**Block revokes.** A later export with blocked/revoked/expired Status would re-sync the inventory row and **revoke** the L2 entitlement for that bound user (not for anyone else). Revoke is a server-side import, never a client flag.

**Expiry and grace.** Period end would come from Versa’s dates (`PurchasedAt` + `DurationDays`, or Status flipping to expired/blocked). No SPIKE-invented 30-day clock until those fields exist. Grace (if any) is a Versa product choice; do not add a SPIKE grace window in the meantime. Code-before-redeem expiry at f05d519 stays as-is.

**Anti-sharing.** Unchanged: first verified redeem binds the code. A different account stays denied (`wrong_identity` / generic 403). Re-sync must not re-bind or transfer. Sharing a code string cannot mint a second L2.

## (B) A new PRO code each month

Each paid month is a **new** `PRO-…` row. Redeeming it **extends** the existing L2 entitlement for the **same bound user**; it does not grant a second program, L3, or a second identity.

**CSV fields needed (today blank).** New codes still arrive as `Code` + `PlanSlug=pro`. To size the extension, Versa needs to fill `PurchasedAt` and `DurationDays` (or equivalent) on **each** new row. `Status` on the *old* code should show it is spent or superseded so it cannot be reused. Blank Status as today would leave last month’s code looking available.

**Same bound user.** Extension applies only if the new code is redeemed by the user who already holds that L2 (or is the first claimer of an unbound new code that Versa issued to them). A new unbound code claimed by a **different** verified account is a **new** L2 for that person, not an extension of someone else’s — same anti-sharing rule as f05d519. Do not auto-link codes by email; the export has no email.

**Repeat redemption.** The old code stays single-use. The new code is consumed once. Same-user retry of the new code is `already_granted`. Duration still comes from the import, not the HTTP body.

**Expiry and grace.** L2 stays valid through the latest extended period. When that period ends and no new code is redeemed, access lapses. Old codes do not stay live in parallel. Grace, if Versa wants it, is defined by overlap of `PurchasedAt`/`DurationDays` on consecutive codes — not by a SPIKE-only 30-day job. Code-before-redeem expiry remains the inventory Status/`expires_at` check on the **unredeemed** new code.

**Anti-sharing.** Each new code binds on first verified redeem. Passing last month’s code to another person does not work (already consumed + bound). Passing this month’s code to another person lets **them** bind it if they redeem first — Versa must issue the new code only to the payer. SPIKE will not share one monthly code across two `verified_user_id`s.

## Shared constraints (both options)

- Do not build until Versa picks (A) or (B) and says how `Status` / `PurchasedAt` / `DurationDays` will be filled.
- HTTP cannot set payment, duration, or level. L3 stays a future slug/code, not a “paid” flag on PRO.
- FREE codes stay as they are (no monthly term).
- No renewal cron, grace, or lapse job on this frozen stack.
