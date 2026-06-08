-- SPIKE Sprint 06B — Faculty & Mentor Framework System
-- Run AFTER 20260628_coach_training_rag.sql

-- ------------------------------
-- Faculty day templates (delivery framework)
-- ------------------------------
create table if not exists public.faculty_day_templates (
  id text primary key,
  segment integer not null check (segment between 1 and 3),
  week integer not null check (week between 1 and 15),
  day integer not null check (day between 1 and 5),
  theme text not null,
  learning_objectives jsonb not null default '[]'::jsonb,
  key_concepts jsonb not null default '[]'::jsonb,
  speaker_notes text,
  discussion_questions jsonb not null default '[]'::jsonb,
  activities jsonb not null default '[]'::jsonb,
  worksheets jsonb not null default '[]'::jsonb,
  assessments jsonb not null default '[]'::jsonb,
  rubrics jsonb not null default '[]'::jsonb,
  expected_outputs jsonb not null default '[]'::jsonb,
  status text not null default 'published'
    check (status in ('draft', 'review', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (segment, week, day)
);

create index if not exists faculty_day_templates_lookup_idx
  on public.faculty_day_templates (segment, week, day);

-- ------------------------------
-- Mentor day guides (coaching framework)
-- ------------------------------
create table if not exists public.mentor_day_guides (
  id text primary key,
  segment integer not null check (segment between 1 and 3),
  week integer not null check (week between 1 and 15),
  day integer not null check (day between 1 and 5),
  coaching_objective text not null,
  discussion_questions jsonb not null default '[]'::jsonb,
  reflection_prompts jsonb not null default '[]'::jsonb,
  warning_signs jsonb not null default '[]'::jsonb,
  coaching_tips jsonb not null default '[]'::jsonb,
  expected_outcomes jsonb not null default '[]'::jsonb,
  status text not null default 'published'
    check (status in ('draft', 'review', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (segment, week, day)
);

create index if not exists mentor_day_guides_lookup_idx
  on public.mentor_day_guides (segment, week, day);

drop trigger if exists faculty_day_templates_set_updated_at on public.faculty_day_templates;
create trigger faculty_day_templates_set_updated_at before update on public.faculty_day_templates
for each row execute function public.set_updated_at();

drop trigger if exists mentor_day_guides_set_updated_at on public.mentor_day_guides;
create trigger mentor_day_guides_set_updated_at before update on public.mentor_day_guides
for each row execute function public.set_updated_at();

-- ------------------------------
-- Extend coaching_sessions (Sprint 06B coaching log)
-- ------------------------------
alter table public.coaching_sessions
  add column if not exists week integer,
  add column if not exists day integer,
  add column if not exists discussion_summary text,
  add column if not exists strengths text,
  add column if not exists growth_areas text,
  add column if not exists concern_flagged boolean not null default false;

-- ------------------------------
-- RLS
-- ------------------------------
alter table public.faculty_day_templates enable row level security;
alter table public.mentor_day_guides enable row level security;

drop policy if exists faculty_day_templates_read on public.faculty_day_templates;
create policy faculty_day_templates_read on public.faculty_day_templates
for select using (auth.uid() is not null);

drop policy if exists faculty_day_templates_staff_write on public.faculty_day_templates;
create policy faculty_day_templates_staff_write on public.faculty_day_templates
for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists mentor_day_guides_read on public.mentor_day_guides;
create policy mentor_day_guides_read on public.mentor_day_guides
for select using (auth.uid() is not null);

drop policy if exists mentor_day_guides_staff_write on public.mentor_day_guides;
create policy mentor_day_guides_staff_write on public.mentor_day_guides
for all using (public.is_staff()) with check (public.is_staff());

-- ------------------------------
-- Week 1 seed — Faculty (Segment 1, Week 1)
-- Theme: Dream • Discover • Decide
-- ------------------------------
insert into public.faculty_day_templates (
  id, segment, week, day, theme, learning_objectives, key_concepts,
  speaker_notes, discussion_questions, activities, worksheets, assessments,
  rubrics, expected_outputs, status
) values
(
  'faculty-s1-w1-d1', 1, 1, 1, 'Discover Yourself',
  '["Understand SPIKE","Create Venture Identity","Define Ambition","Define Impact","Define Values","Join a Squad"]'::jsonb,
  '["SPIKE Philosophy","Venture Blueprint™","Ambition","Impact","Values","Future Self","Research Squads"]'::jsonb,
  'Facilitate identity discovery. Coach participants to articulate ambition and impact in their own words before squad formation.',
  '["What does success look like for you in SPIKE?","How do ambition and impact differ?","Which values will you never compromise?"]'::jsonb,
  '["SPIKE orientation","Venture Coach™ identity flow","Squad formation workshop"]'::jsonb,
  '["Ambition builder","Impact builder","Values profile","Dream board"]'::jsonb,
  '["Identity readiness check"]'::jsonb,
  '["Participation rubric","Venture identity rubric"]'::jsonb,
  '["Ambition","Impact","Values","Future Self Narrative","Dream Board","Squad Charter"]'::jsonb,
  'published'
),
(
  'faculty-s1-w1-d2', 1, 1, 2, 'Discover The Industry',
  '["Understand financial services landscape","Explore insurance and protection","Connect industry to personal ambition"]'::jsonb,
  '["Financial Services","Insurance","Protection","Financial Planning","Career Opportunities"]'::jsonb,
  'Use industry immersion to link market reality with participant ambition statements from Day 1.',
  '["What surprised you about the industry today?","Where do you see yourself adding value?"]'::jsonb,
  '["Industry immersion session","Practitioner interview prep"]'::jsonb,
  '["Interview notes template","Industry insights worksheet"]'::jsonb,
  '["Industry comprehension check"]'::jsonb,
  '["Interview preparation rubric"]'::jsonb,
  '["Interview Notes","Industry Insights","Research Plan"]'::jsonb,
  'published'
),
(
  'faculty-s1-w1-d3', 1, 1, 3, 'Discover The Market',
  '["Identify customer problems","Build personas","Map unmet needs to opportunity"]'::jsonb,
  '["Problems","Needs","Customer Segments","Personas","Opportunity Identification"]'::jsonb,
  'Guide squads from observation to structured market insight — problems before solutions.',
  '["What problems did you hear repeatedly?","Who is most affected and why?"]'::jsonb,
  '["Market observation","Persona workshop","Squad research planning"]'::jsonb,
  '["Customer persona canvas","Market insight log"]'::jsonb,
  '["Persona presentation assessment"]'::jsonb,
  '["Research quality rubric"]'::jsonb,
  '["Customer Persona","Market Insights"]'::jsonb,
  'published'
),
(
  'faculty-s1-w1-d4', 1, 1, 4, 'Financial Entrepreneurship',
  '["Compare advisor vs entrepreneur paths","Introduce agency builder and specialist tracks","Draft Financial Entrepreneurship Canvas v1"]'::jsonb,
  '["Advisor vs Entrepreneur","Agency Builder","Specialist Consultant","Financial Entrepreneurship Canvas"]'::jsonb,
  'Facilitate pathway exploration without prescribing — participants choose direction with evidence.',
  '["Which pathway energizes you today?","What would you build first on your canvas?"]'::jsonb,
  '["Canvas workshop","Track exploration clinic"]'::jsonb,
  '["Financial Entrepreneurship Canvas v1"]'::jsonb,
  '["Canvas completeness check"]'::jsonb,
  '["Canvas presentation rubric"]'::jsonb,
  '["Canvas v1","Career Direction"]'::jsonb,
  'published'
),
(
  'faculty-s1-w1-d5', 1, 1, 5, 'My Venture Direction',
  '["Articulate 3-year vision","Map opportunities to goals","Commit to venture direction"]'::jsonb,
  '["3-Year Vision","Opportunity Mapping","Goals","Commitment"]'::jsonb,
  'Close Week 1 with squad presentations and a published Venture Blueprint draft.',
  '["What are you building?","Who do you serve?","What will success look like in 3 years?"]'::jsonb,
  '["Venture direction presentations","Squad pitch rehearsal"]'::jsonb,
  '["Venture Blueprint draft checklist"]'::jsonb,
  '["Week 1 venture board readiness"]'::jsonb,
  '["Presentation rubric","Venture direction rubric"]'::jsonb,
  '["Venture Blueprint Draft","Squad Presentation"]'::jsonb,
  'published'
)
on conflict (id) do update set
  theme = excluded.theme,
  learning_objectives = excluded.learning_objectives,
  key_concepts = excluded.key_concepts,
  speaker_notes = excluded.speaker_notes,
  discussion_questions = excluded.discussion_questions,
  activities = excluded.activities,
  worksheets = excluded.worksheets,
  assessments = excluded.assessments,
  rubrics = excluded.rubrics,
  expected_outputs = excluded.expected_outputs,
  status = excluded.status,
  updated_at = now();

-- Week 1 seed — Mentor (Identity • Confidence • Direction)
insert into public.mentor_day_guides (
  id, segment, week, day, coaching_objective, discussion_questions,
  reflection_prompts, warning_signs, coaching_tips, expected_outcomes, status
) values
(
  'mentor-s1-w1-d1', 1, 1, 1,
  'Help participants connect with their ambitions.',
  '["What brought you to SPIKE?","What excites you most?","What are you hoping to achieve?","What surprised you today?"]'::jsonb,
  '["Write one sentence that captures who you are becoming.","What fear showed up today?"]'::jsonb,
  '["Copying facilitator language verbatim","Unable to articulate personal ambition","Withdrawal from squad activity"]'::jsonb,
  '["Listen for authentic voice, not perfect words","Celebrate specificity over polish"]'::jsonb,
  '["Participant demonstrates ownership of Ambition and Impact"]'::jsonb,
  'published'
),
(
  'mentor-s1-w1-d2', 1, 1, 2,
  'Connect industry opportunity to participant ambition.',
  '["What did you learn today?","What opportunities did you discover?","What misconceptions changed?"]'::jsonb,
  '["How does today change your 3-year picture?"]'::jsonb,
  '["Dismissing industry as irrelevant","Overconfidence without evidence"]'::jsonb,
  '["Link industry facts to their Day 1 ambition statement"]'::jsonb,
  '["Participant understands industry relevance"]'::jsonb,
  'published'
),
(
  'mentor-s1-w1-d3', 1, 1, 3,
  'Develop market awareness.',
  '["What problems did people talk about?","What concerns appeared repeatedly?","What opportunities do you see?"]'::jsonb,
  '["Who is one person you want to help and why?"]'::jsonb,
  '["Generic personas with no real observation","Solution-first thinking before problem clarity"]'::jsonb,
  '["Push for evidence from conversations and observation"]'::jsonb,
  '["Participant recognizes unmet needs"]'::jsonb,
  'published'
),
(
  'mentor-s1-w1-d4', 1, 1, 4,
  'Explore venture pathways.',
  '["What business excites you?","Would you rather build a practice or a team?","Why?"]'::jsonb,
  '["Which track feels most like you today — and what would change your mind?"]'::jsonb,
  '["Choosing a track to please others","Avoiding commitment entirely"]'::jsonb,
  '["Use canvas gaps as coaching prompts, not grades"]'::jsonb,
  '["Participant begins identifying preferred track"]'::jsonb,
  'published'
),
(
  'mentor-s1-w1-d5', 1, 1, 5,
  'Create commitment.',
  '["What are you building?","Who do you want to help?","What will success look like in 3 years?"]'::jsonb,
  '["What is one commitment you will keep this week?"]'::jsonb,
  '["Vague vision with no measurable outcome","Fear of presenting to squad"]'::jsonb,
  '["End with accountability: one action before next session"]'::jsonb,
  '["Participant commits to a venture direction"]'::jsonb,
  'published'
)
on conflict (id) do update set
  coaching_objective = excluded.coaching_objective,
  discussion_questions = excluded.discussion_questions,
  reflection_prompts = excluded.reflection_prompts,
  warning_signs = excluded.warning_signs,
  coaching_tips = excluded.coaching_tips,
  expected_outcomes = excluded.expected_outcomes,
  status = excluded.status,
  updated_at = now();
