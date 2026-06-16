-- Intern portfolio file deliverables (research summaries, decks, etc.)

create table if not exists public.portfolio_deliverables (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  category text not null default 'other' check (
    category in (
      'research_summary',
      'presentation',
      'interview_notes',
      'worksheet',
      'business_plan',
      'other'
    )
  ),
  file_name text not null,
  mime_type text,
  file_size_bytes bigint not null default 0 check (file_size_bytes >= 0),
  storage_path text not null,
  notes text,
  week integer check (week is null or week between 1 and 12),
  day integer check (day is null or day between 1 and 7),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists portfolio_deliverables_user_idx on public.portfolio_deliverables(user_id);
create index if not exists portfolio_deliverables_category_idx on public.portfolio_deliverables(category);

drop trigger if exists portfolio_deliverables_set_updated_at on public.portfolio_deliverables;
create trigger portfolio_deliverables_set_updated_at
before update on public.portfolio_deliverables
for each row execute function public.set_updated_at();

alter table public.portfolio_deliverables enable row level security;

drop policy if exists portfolio_deliverables_select on public.portfolio_deliverables;
create policy portfolio_deliverables_select on public.portfolio_deliverables
for select
using (user_id = auth.uid() or public.is_staff());

drop policy if exists portfolio_deliverables_insert on public.portfolio_deliverables;
create policy portfolio_deliverables_insert on public.portfolio_deliverables
for insert
with check (user_id = auth.uid());

drop policy if exists portfolio_deliverables_update on public.portfolio_deliverables;
create policy portfolio_deliverables_update on public.portfolio_deliverables
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists portfolio_deliverables_delete on public.portfolio_deliverables;
create policy portfolio_deliverables_delete on public.portfolio_deliverables
for delete
using (user_id = auth.uid() or public.is_staff());

-- Storage bucket for deliverable files (private — signed URLs for download)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-deliverables',
  'portfolio-deliverables',
  false,
  15728640,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/plain'
  ]
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists portfolio_deliverables_storage_select on storage.objects;
create policy portfolio_deliverables_storage_select on storage.objects
for select
using (
  bucket_id = 'portfolio-deliverables'
  and (
    auth.uid()::text = (storage.foldername(name))[1]
    or public.is_staff()
  )
);

drop policy if exists portfolio_deliverables_storage_insert on storage.objects;
create policy portfolio_deliverables_storage_insert on storage.objects
for insert
with check (
  bucket_id = 'portfolio-deliverables'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists portfolio_deliverables_storage_update on storage.objects;
create policy portfolio_deliverables_storage_update on storage.objects
for update
using (
  bucket_id = 'portfolio-deliverables'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'portfolio-deliverables'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists portfolio_deliverables_storage_delete on storage.objects;
create policy portfolio_deliverables_storage_delete on storage.objects
for delete
using (
  bucket_id = 'portfolio-deliverables'
  and (
    auth.uid()::text = (storage.foldername(name))[1]
    or public.is_staff()
  )
);
