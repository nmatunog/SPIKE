-- Dream board per-card cloud sync + staff read for SUPERUSER

alter table public.dream_board_assets
  add column if not exists client_asset_id text;

create unique index if not exists dream_board_assets_user_client_idx
  on public.dream_board_assets(user_id, client_asset_id);

drop policy if exists day1_builder_progress_staff_read on public.day1_builder_progress;
create policy day1_builder_progress_staff_read on public.day1_builder_progress
for select using (public.is_staff());

drop policy if exists dream_board_assets_staff_read on public.dream_board_assets;
create policy dream_board_assets_staff_read on public.dream_board_assets
for select using (public.is_staff());

drop policy if exists vision_profiles_staff_read on public.vision_profiles;
create policy vision_profiles_staff_read on public.vision_profiles
for select using (public.is_staff());

drop policy if exists future_self_entries_staff_read on public.future_self_entries;
create policy future_self_entries_staff_read on public.future_self_entries
for select using (public.is_staff());
