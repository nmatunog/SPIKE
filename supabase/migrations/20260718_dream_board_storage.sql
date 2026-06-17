-- Dream board photos in Supabase Storage (public read for coach collage img tags)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'dream-board',
  'dream-board',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists dream_board_storage_select on storage.objects;
create policy dream_board_storage_select on storage.objects
for select
using (bucket_id = 'dream-board');

drop policy if exists dream_board_storage_insert on storage.objects;
create policy dream_board_storage_insert on storage.objects
for insert
with check (
  bucket_id = 'dream-board'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists dream_board_storage_update on storage.objects;
create policy dream_board_storage_update on storage.objects
for update
using (
  bucket_id = 'dream-board'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'dream-board'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists dream_board_storage_delete on storage.objects;
create policy dream_board_storage_delete on storage.objects
for delete
using (
  bucket_id = 'dream-board'
  and (
    auth.uid()::text = (storage.foldername(name))[1]
    or public.is_staff()
  )
);
