-- SEC-1 / F1: atomic intern-signup rate limit (classroom shared-IP).
-- Numbered above Versa 20261112080005 so it never interleaves with SEC-1 20260827/29.
-- begin_attempt checks and increments in one row lock. refund_success drops a
-- reserved slot after a valid code so only failed code attempts count.

create table if not exists public.intern_signup_rate_limits (
  rate_key text primary key,
  fail_count integer not null default 0,
  window_start timestamptz not null default now()
);

alter table public.intern_signup_rate_limits enable row level security;
revoke all on table public.intern_signup_rate_limits from public, anon, authenticated;
grant all on table public.intern_signup_rate_limits to service_role;

create or replace function public.intern_signup_rate_limit_begin_attempt(
  p_rate_key text,
  p_window_ms integer,
  p_max integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.intern_signup_rate_limits%rowtype;
  cap integer := greatest(coalesce(p_max, 20), 1);
  window_expired boolean;
begin
  insert into public.intern_signup_rate_limits (rate_key, fail_count, window_start)
  values (p_rate_key, 0, now())
  on conflict (rate_key) do nothing;

  select * into rec
    from public.intern_signup_rate_limits
   where rate_key = p_rate_key
   for update;

  window_expired := rec.window_start
    < now() - make_interval(secs => greatest(p_window_ms, 1) / 1000.0);

  if window_expired then
    update public.intern_signup_rate_limits
       set fail_count = 1,
           window_start = now()
     where rate_key = p_rate_key
     returning fail_count into rec.fail_count;
    return jsonb_build_object('allowed', true, 'fail_count', rec.fail_count);
  end if;

  if rec.fail_count >= cap then
    return jsonb_build_object('allowed', false, 'fail_count', rec.fail_count);
  end if;

  update public.intern_signup_rate_limits
     set fail_count = rec.fail_count + 1
   where rate_key = p_rate_key
   returning fail_count into rec.fail_count;

  return jsonb_build_object('allowed', true, 'fail_count', rec.fail_count);
end;
$$;

create or replace function public.intern_signup_rate_limit_refund_success(
  p_rate_key text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  update public.intern_signup_rate_limits
     set fail_count = greatest(fail_count - 1, 0)
   where rate_key = p_rate_key
   returning fail_count into new_count;
  return coalesce(new_count, 0);
end;
$$;

revoke all on function public.intern_signup_rate_limit_begin_attempt(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.intern_signup_rate_limit_begin_attempt(text, integer, integer)
  to service_role;

revoke all on function public.intern_signup_rate_limit_refund_success(text)
  from public, anon, authenticated;
grant execute on function public.intern_signup_rate_limit_refund_success(text)
  to service_role;
