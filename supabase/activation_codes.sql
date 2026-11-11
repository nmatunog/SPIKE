-- Intern signup activation codes (run after schema.sql)

create table if not exists public.activation_codes (
  id bigint generated always as identity primary key,
  date_key date not null unique,
  code text not null,
  expires_at timestamptz not null,
  generated_by uuid references public.profiles(id) on delete set null,
  generated_at timestamptz not null default now()
);

alter table public.activation_codes enable row level security;

drop policy if exists "activation_codes_admin_manage" on public.activation_codes;
create policy "activation_codes_admin_manage"
on public.activation_codes
for all
using (public.current_role() = 'ADMIN')
with check (public.current_role() = 'ADMIN');

-- F1: do not grant anon/authenticated public read of live activation codes.
-- Intern signup validates via the service-role Pages Function.
-- Staff dashboards use this authenticated staff-read policy.
drop policy if exists "activation_codes_public_read" on public.activation_codes;
drop policy if exists "activation_codes_staff_read" on public.activation_codes;
create policy "activation_codes_staff_read"
on public.activation_codes
for select
to authenticated
using (public.current_role() in ('FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER'));
