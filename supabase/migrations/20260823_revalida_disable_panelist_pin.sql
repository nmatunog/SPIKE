-- RA-SPIKE Revalida — open guest panelist access (no PIN required)

create or replace function public._revalida_pin_ok(p_pin text)
returns boolean
language sql
immutable
as $$
  select true;
$$;
