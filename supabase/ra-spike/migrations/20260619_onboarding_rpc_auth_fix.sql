-- Harden onboarding RPCs: explicit user id + JWT claim fallback when auth.uid() is unset.

drop function if exists public.mark_onboarding_welcomed();
drop function if exists public.mark_onboarding_complete();

create or replace function public.mark_onboarding_welcomed(p_user_id uuid default null)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  welcomed timestamptz;
begin
  uid := coalesce(
    auth.uid(),
    nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  );

  if uid is null then
    raise exception 'Not authenticated. Sign out and sign in with your SPIKE account.';
  end if;

  if p_user_id is not null and p_user_id <> uid then
    raise exception 'User mismatch';
  end if;

  insert into public.intern_progress (user_id, onboarding_welcomed_at)
  values (uid, now())
  on conflict (user_id) do update
  set onboarding_welcomed_at = coalesce(public.intern_progress.onboarding_welcomed_at, now())
  returning onboarding_welcomed_at into welcomed;

  return welcomed;
end;
$$;

create or replace function public.mark_onboarding_complete(p_user_id uuid default null)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  done boolean;
begin
  uid := coalesce(
    auth.uid(),
    nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  );

  if uid is null then
    raise exception 'Not authenticated. Sign out and sign in with your SPIKE account.';
  end if;

  if p_user_id is not null and p_user_id <> uid then
    raise exception 'User mismatch';
  end if;

  update public.intern_progress
  set onboarding_complete = true
  where user_id = uid
  returning onboarding_complete into done;

  if done is null then
    raise exception 'No intern_progress row for this user.';
  end if;
  return done;
end;
$$;

grant execute on function public.mark_onboarding_welcomed(uuid) to authenticated;
grant execute on function public.mark_onboarding_complete(uuid) to authenticated;
