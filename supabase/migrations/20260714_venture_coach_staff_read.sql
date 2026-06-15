-- Venture Coach tables — staff read policies for mentor / program-coach review

drop policy if exists ambition_profiles_staff_read on public.ambition_profiles;
create policy ambition_profiles_staff_read on public.ambition_profiles
for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER'))
);

drop policy if exists participant_values_staff_read on public.participant_values;
create policy participant_values_staff_read on public.participant_values
for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER'))
);

drop policy if exists venture_coach_progress_staff_read on public.venture_coach_progress;
create policy venture_coach_progress_staff_read on public.venture_coach_progress
for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('FACULTY', 'MENTOR', 'ADMIN', 'SUPERUSER'))
);

drop policy if exists ambition_profiles_own on public.ambition_profiles;
create policy ambition_profiles_own on public.ambition_profiles
for all using (auth.uid() = participant_id) with check (auth.uid() = participant_id);

drop policy if exists participant_values_own on public.participant_values;
create policy participant_values_own on public.participant_values
for all using (auth.uid() = participant_id) with check (auth.uid() = participant_id);

drop policy if exists venture_coach_progress_own on public.venture_coach_progress;
create policy venture_coach_progress_own on public.venture_coach_progress
for all using (auth.uid() = participant_id) with check (auth.uid() = participant_id);
