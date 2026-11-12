-- Locked Versa export schema (repo SQL only — do not apply to hosted DBs from this PR).
-- Export has no email/owner identity. Identity binds at first verified redeem.
-- Stores Plan + PlanSlug; other Versa columns are optional raw metadata.

alter table public.versa_code_inventory
  drop constraint if exists versa_code_inventory_identity_link;

alter table public.versa_code_inventory
  alter column versa_lead_ref drop not null;

alter table public.versa_code_inventory
  add column if not exists plan text,
  add column if not exists plan_slug text,
  add column if not exists owner text,
  add column if not exists site_name text,
  add column if not exists versa_inventory text,
  add column if not exists versa_status text,
  add column if not exists purchased_at text,
  add column if not exists duration_days text,
  add column if not exists unit_price_tokens text,
  add column if not exists versa_created_at text;

create index if not exists versa_code_inventory_plan_slug_idx
  on public.versa_code_inventory (plan_slug);
