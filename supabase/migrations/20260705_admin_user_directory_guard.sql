-- Only SUPERUSER may assign or modify SUPERUSER accounts.

create or replace function public.profiles_guard_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'UPDATE' and new.role is distinct from old.role then
    if current_setting('spike.allow_role_change', true) = '1' then
      return new;
    end if;
    if new.role = 'SUPERUSER' and public.current_role() is distinct from 'SUPERUSER' then
      raise exception 'Only superusers can assign the SUPERUSER role';
    end if;
    if old.role = 'SUPERUSER' and public.current_role() is distinct from 'SUPERUSER' then
      raise exception 'Only superusers can change superuser accounts';
    end if;
    if public.current_role() not in ('ADMIN', 'SUPERUSER') then
      raise exception 'Only administrators can change account roles';
    end if;
  end if;
  return new;
end;
$$;
