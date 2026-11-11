# SEC-1 / F1 intern activation codes

Waits for **Nilo's SEC-1 decision**. Repo SQL only. **Do not apply** to SPIKE Interns (`lzbfjbtjropoaynbcxew`) or RA-SPIKE (`yruwfdjqigxxwbqsqhho`) from this branch.

F1 closes the client leak of live daily intern codes:

1. Drop `activation_codes_public_read` (anon + authenticated SELECT of unexpired rows).
2. Staff-only SELECT policy for faculty/mentor/admin/superuser dashboards.
3. Staff-gate `ensure_daily_activation_code()` so intern JWTs cannot load plaintext daily codes via SECURITY DEFINER.
4. Client signup no longer SELECTs `activation_codes`. If Pages Functions are down, intern signup **fails closed**.

This is a deliberate security trade-off for Nilo. It is independent of Versa CSV verification (`v1/l1-versa-csv-verification`).

## Files

| Path | Role |
|---|---|
| `src/SpikeMasterPortal.jsx` | Fail-closed intern signup when the Pages Function is unavailable |
| `src/lib/internSignupService.js` | `clientDailyActivationFallbackAllowed() === false` |
| `src/lib/activationCodeService.js` | `validateInternActivationCode` no longer SELECTs the table |
| `supabase/activation_codes.sql` | Baseline schema with staff-read policy |
| `supabase/migrations/20260827_restrict_activation_codes_anon_read.sql` | Interns DB policy |
| `supabase/migrations/20260829_gate_ensure_daily_activation_code.sql` | Interns DB staff-gated RPC |
| `supabase/ra-spike/migrations/20260827_restrict_activation_codes_anon_read.sql` | RA-SPIKE DB policy |
| `supabase/ra-spike/migrations/20260829_gate_ensure_daily_activation_code.sql` | RA-SPIKE DB staff-gated RPC |

## Rollback SQL note

Do not run these unless Nilo undoes an applied SEC-1 migration. Copies also live next to the forward migrations as `_rollback_*.sql` (underscore prefix so `db:migrate` skips them).

### Interns + RA-SPIKE: restore anon/authenticated public read

```sql
drop policy if exists "activation_codes_staff_read" on public.activation_codes;
drop policy if exists "activation_codes_public_read" on public.activation_codes;
create policy "activation_codes_public_read"
on public.activation_codes
for select
to anon, authenticated
using (expires_at > now());
```

### Interns + RA-SPIKE: restore ungated `ensure_daily_activation_code()`

```sql
create or replace function public.ensure_daily_activation_code()
returns public.activation_codes
language plpgsql
security definer
set search_path = public
as $$
declare
  today date := public.manila_today();
  row public.activation_codes;
begin
  insert into public.activation_codes (date_key, code, expires_at, generated_by)
  values (
    today,
    public.random_activation_code(),
    public.manila_end_of_day(today),
    auth.uid()
  )
  on conflict (date_key) do nothing;

  select * into row from public.activation_codes where date_key = today;
  return row;
end;
$$;

revoke all on function public.ensure_daily_activation_code() from public;
grant execute on function public.ensure_daily_activation_code() to authenticated, service_role;
```

Client rollback is `git revert` of this branch (restore the main signup fallback that SELECTs `activation_codes`).
