create or replace function public.fetch_pitch_panel_squads(p_pin text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_names text[];
begin
  if not public._pitch_panel_pin_ok(p_pin) then
    raise exception 'Invalid access PIN';
  end if;

  select array_agg(name order by sort_key, name)
  into v_names
  from (
    select distinct
      fs.name as name,
      case lower(trim(fs.name))
        when 'cassiopeia' then 1
        when 'pegasus' then 2
        when 'argo navis' then 3
        else 99
      end as sort_key
    from public.formation_squads fs
    join public.cohorts c on c.id = fs.cohort_id and c.is_active = true
  ) squads;

  if v_names is null or array_length(v_names, 1) is null then
    v_names := array['Cassiopeia', 'Pegasus', 'Argo Navis'];
  end if;

  return jsonb_build_object('squads', to_jsonb(v_names));
end;
$$;

grant execute on function public.fetch_pitch_panel_squads(text) to anon, authenticated;
NOTIFY pgrst, 'reload schema';
