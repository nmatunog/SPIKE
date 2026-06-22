-- Interns cannot UPDATE intern_progress directly (staff-only RLS).
-- Career track selection at Week 2 uses a security definer RPC.

create or replace function public.save_intern_career_track(p_track public.career_track)
returns public.intern_progress
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.intern_progress;
begin
  if p_track is null then
    raise exception 'Career track is required.';
  end if;

  insert into public.intern_progress (user_id, career_track, career_track_selected_at)
  values (auth.uid(), p_track, now())
  on conflict (user_id) do update
  set
    career_track = excluded.career_track,
    career_track_selected_at = coalesce(public.intern_progress.career_track_selected_at, now())
  returning * into row;

  return row;
end;
$$;

grant execute on function public.save_intern_career_track(public.career_track) to authenticated;
