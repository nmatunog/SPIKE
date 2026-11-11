-- F1 (RA-SPIKE copy): intern JWTs must not receive plaintext daily codes.
-- Repo-only. Do not apply to hosted projects from this PR.

create or replace function public.ensure_daily_activation_code()
returns public.activation_codes
language plpgsql
security definer
set search_path = public
as $$
declare
  today date := public.manila_today();
  row public.activation_codes;
  role text;
begin
  if auth.uid() is not null then
    role := public.current_role();
    if role is distinct from 'FACULTY'
       and role is distinct from 'MENTOR'
       and role is distinct from 'ADMIN'
       and role is distinct from 'SUPERUSER' then
      raise exception 'Only staff can load daily activation codes';
    end if;
  end if;

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

revoke all on function public.ensure_daily_activation_code() from public, anon;
grant execute on function public.ensure_daily_activation_code() to authenticated, service_role;
