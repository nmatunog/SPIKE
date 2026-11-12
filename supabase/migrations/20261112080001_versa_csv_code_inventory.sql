-- SPIKE #7 Checkpoint 01 — Versa CSV inventory, entitlements, attempt log.
-- Stores HMAC/SHA-256 digests, never plaintext codes.
-- Repo-only. Do NOT apply to any hosted Supabase project from this PR.
-- SPIKE for Interns database only. Do not copy onto RA-SPIKE until L2 is approved.

create table if not exists public.versa_code_inventory (
  id bigint generated always as identity primary key,
  code_digest text not null unique,
  versa_lead_ref text not null,
  verified_email text,
  verified_user_id uuid,
  level text not null check (level in ('L1', 'L2')),
  offering_id text not null,
  status text not null default 'available' check (status in ('available', 'redeemed', 'revoked', 'expired')),
  batch_id text,
  external_code_id text,
  issued_at timestamptz,
  expires_at timestamptz,
  payment_confirmation_ref text,
  program_route text not null default 'spike-interns' check (program_route in ('spike-interns', 'ra-spike')),
  imported_at timestamptz not null default now(),
  imported_by uuid references public.profiles(id) on delete set null,
  redeemed_at timestamptz,
  redeemed_by uuid references public.profiles(id) on delete set null,
  constraint versa_code_inventory_identity_link
    check (verified_email is not null or verified_user_id is not null)
);

create unique index if not exists versa_code_inventory_external_code_id_uidx
  on public.versa_code_inventory (external_code_id)
  where external_code_id is not null;

create index if not exists versa_code_inventory_lead_ref_idx
  on public.versa_code_inventory (versa_lead_ref);

create table if not exists public.versa_entitlements (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  inventory_id bigint not null references public.versa_code_inventory(id),
  versa_lead_ref text not null,
  level text not null,
  offering_id text not null,
  program_route text not null,
  granted_at timestamptz not null default now(),
  unique (user_id, offering_id)
);

create table if not exists public.versa_code_attempts (
  id bigint generated always as identity primary key,
  actor_user_id uuid,
  inventory_id bigint,
  reason text not null,
  offering_id text,
  level text,
  program_route text,
  created_at timestamptz not null default now()
);

alter table public.versa_code_inventory enable row level security;
alter table public.versa_entitlements enable row level security;
alter table public.versa_code_attempts enable row level security;

drop policy if exists "versa_code_inventory_staff_read" on public.versa_code_inventory;
create policy "versa_code_inventory_staff_read"
on public.versa_code_inventory
for select
to authenticated
using (public.current_role() in ('ADMIN', 'SUPERUSER'));

drop policy if exists "versa_entitlements_select_self_or_staff" on public.versa_entitlements;
create policy "versa_entitlements_select_self_or_staff"
on public.versa_entitlements
for select
to authenticated
using (
  user_id = auth.uid()
  or public.current_role() in ('FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER')
);

drop policy if exists "versa_code_attempts_staff_read" on public.versa_code_attempts;
create policy "versa_code_attempts_staff_read"
on public.versa_code_attempts
for select
to authenticated
using (public.current_role() in ('ADMIN', 'SUPERUSER'));

-- Atomic single-use consume. Pages Functions call this with the service role.
create or replace function public.redeem_versa_code_row(p_id bigint, p_user_id uuid)
returns public.versa_code_inventory
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.versa_code_inventory;
begin
  update public.versa_code_inventory
     set status = 'redeemed',
         redeemed_at = now(),
         redeemed_by = p_user_id
   where id = p_id
     and status = 'available'
  returning * into row;
  return row;
end;
$$;

revoke all on function public.redeem_versa_code_row(bigint, uuid) from public, anon, authenticated;
grant execute on function public.redeem_versa_code_row(bigint, uuid) to service_role;
