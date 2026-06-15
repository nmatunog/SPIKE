-- FEC Canvas v2 schema (Phase 1) — extends canvas_summary + canvas_entries engine keys.
-- Run AFTER 20260607_sprint_05c_canvas_summary.sql

alter table public.canvas_summary
  add column if not exists canvas_schema_version text not null default 'v1'
    check (canvas_schema_version in ('v1', 'v2'));

alter table public.canvas_summary
  add column if not exists migrated_at timestamptz;

alter table public.canvas_summary
  add column if not exists unified_venture_proposition text not null default '';

alter table public.canvas_summary
  add column if not exists uvp_is_auto boolean not null default true;

alter table public.canvas_summary
  add column if not exists roadmap_12mo text not null default '';

alter table public.canvas_summary
  add column if not exists roadmap_24mo text not null default '';

alter table public.canvas_summary
  add column if not exists roadmap_36mo text not null default '';

alter table public.canvas_summary
  add column if not exists success_narrative text not null default '';

alter table public.canvas_summary
  add column if not exists success_revenue text not null default '';

alter table public.canvas_summary
  add column if not exists success_customers text not null default '';

alter table public.canvas_summary
  add column if not exists success_families_protected text not null default '';

alter table public.canvas_summary
  add column if not exists success_jobs text not null default '';

alter table public.canvas_summary
  add column if not exists success_annual_profit text not null default '';

alter table public.canvas_summary
  add column if not exists scorecard_manual_overrides jsonb not null default '{}'::jsonb;

-- Expand canvas_entries engine_key for FEC v2 pillars + agency extensions.
alter table public.canvas_entries drop constraint if exists canvas_entries_engine_key_check;

alter table public.canvas_entries add constraint canvas_entries_engine_key_check check (
  engine_key in (
    'client_growth',
    'talent_growth',
    'leadership_growth',
    'foundation',
    'create_value',
    'capture_value',
    'enable_value',
    'prove_value',
    'agency_talent',
    'agency_leadership'
  )
);

comment on column public.canvas_summary.canvas_schema_version is 'FEC layout version: v1 (legacy engines) or v2 (pillar canvas)';
comment on column public.canvas_summary.unified_venture_proposition is 'FEC center — Unified Venture Proposition (replaces strategy_statement in v2 UI)';
