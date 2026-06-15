-- Single source of truth: formation_squad_members + formation_squads.name
-- Backfill denormalized intern_progress.squad for staff dashboards.

update public.intern_progress ip
set squad = s.name
from public.formation_squad_members m
join public.formation_squads s on s.id = m.squad_id
where ip.user_id = m.participant_id
  and (ip.squad is null or btrim(ip.squad) = '' or ip.squad is distinct from s.name);

-- Keep intern_progress.squad in sync when squad name changes.
create or replace function public.sync_intern_progress_squad_from_formation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.name is distinct from old.name then
    update public.intern_progress ip
    set squad = new.name
    from public.formation_squad_members m
    where m.squad_id = new.id and ip.user_id = m.participant_id;
  end if;
  return new;
end;
$$;

drop trigger if exists formation_squads_sync_intern_progress_squad on public.formation_squads;
create trigger formation_squads_sync_intern_progress_squad
after update of name on public.formation_squads
for each row execute function public.sync_intern_progress_squad_from_formation();

create or replace function public.sync_intern_progress_squad_on_member_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  squad_name text;
  target_user uuid;
begin
  if tg_op = 'DELETE' then
    update public.intern_progress set squad = '' where user_id = old.participant_id;
    return old;
  end if;

  select s.name into squad_name from public.formation_squads s where s.id = new.squad_id;
  target_user := new.participant_id;
  update public.intern_progress set squad = coalesce(squad_name, '') where user_id = target_user;
  return new;
end;
$$;

drop trigger if exists formation_squad_members_sync_intern_progress on public.formation_squad_members;
create trigger formation_squad_members_sync_intern_progress
after insert or update on public.formation_squad_members
for each row execute function public.sync_intern_progress_squad_on_member_change();

drop trigger if exists formation_squad_members_clear_intern_progress on public.formation_squad_members;
create trigger formation_squad_members_clear_intern_progress
after delete on public.formation_squad_members
for each row execute function public.sync_intern_progress_squad_on_member_change();
