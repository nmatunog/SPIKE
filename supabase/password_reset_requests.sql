-- Password help queue: users request help while logged out; admins see pending rows.
-- Run in Supabase SQL Editor after schema.sql.
-- Admins still set the new password in Dashboard → Authentication → Users (or automate later with service role).

create table if not exists public.password_reset_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  note text,
  status text not null default 'pending' check (status in ('pending', 'resolved')),
  created_at timestamptz not null default now()
);

create index if not exists password_reset_requests_status_created_idx
  on public.password_reset_requests (status, created_at desc);

alter table public.password_reset_requests enable row level security;

drop policy if exists "password_reset_requests_anon_insert" on public.password_reset_requests;
create policy "password_reset_requests_anon_insert"
on public.password_reset_requests
for insert
to anon
with check (
  length(trim(email)) > 3
  and position('@' in trim(email)) > 1
);

drop policy if exists "password_reset_requests_admin_select" on public.password_reset_requests;
create policy "password_reset_requests_admin_select"
on public.password_reset_requests
for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'ADMIN'
  )
);

drop policy if exists "password_reset_requests_admin_update" on public.password_reset_requests;
create policy "password_reset_requests_admin_update"
on public.password_reset_requests
for update
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'ADMIN'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'ADMIN'
  )
);
