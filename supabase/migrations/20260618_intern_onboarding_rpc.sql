-- Interns may not UPDATE intern_progress (staff-only policy) — use security definer RPCs.

create or replace function public.mark_onboarding_welcomed()
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare welcomed timestamptz;
begin
  insert into public.intern_progress (user_id, onboarding_welcomed_at)
  values (auth.uid(), now())
  on conflict (user_id) do update
  set onboarding_welcomed_at = coalesce(public.intern_progress.onboarding_welcomed_at, now())
  returning onboarding_welcomed_at into welcomed;

  return welcomed;
end;
$$;

create or replace function public.mark_onboarding_complete()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare done boolean;
begin
  update public.intern_progress
  set onboarding_complete = true
  where user_id = auth.uid()
  returning onboarding_complete into done;

  if done is null then
    raise exception 'No intern_progress row for this user.';
  end if;
  return done;
end;
$$;

grant execute on function public.mark_onboarding_welcomed() to authenticated;
grant execute on function public.mark_onboarding_complete() to authenticated;
