-- RA-SPIKE: superusers must read/write intern_progress (coach hub, week publish, gate eval).
-- Also add career_track_selected_at for client select parity with SPIKE Internship.

alter table public.intern_progress
  add column if not exists career_track_selected_at timestamptz;

drop policy if exists "intern_progress_select_self_or_staff" on public.intern_progress;
create policy "intern_progress_select_self_or_staff"
on public.intern_progress
for select
using (
  user_id = auth.uid()
  or public.current_role() in ('FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER')
);

drop policy if exists "intern_progress_modify_staff_only" on public.intern_progress;
create policy "intern_progress_modify_staff_only"
on public.intern_progress
for all
using (public.current_role() in ('FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER'))
with check (public.current_role() in ('FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER'));
