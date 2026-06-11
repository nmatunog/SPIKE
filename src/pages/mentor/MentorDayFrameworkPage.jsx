import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { FrameworkBulletList, FrameworkSection } from '../../components/framework/FrameworkSections.jsx';
import { loadMentorDayFramework } from '../../lib/facultyMentorFrameworkService.js';
import { ROUTES } from '../../routes/paths.js';

export function MentorDayFrameworkPage() {
  const { segment = '1', week = '1', day = '1' } = useParams();
  const seg = Number(segment);
  const wk = Number(week);
  const dy = Number(day);
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await loadMentorDayFramework(seg, wk, dy);
      if (!cancelled) setData(result);
    })();
    return () => {
      cancelled = true;
    };
  }, [seg, wk, dy]);

  const guide = data?.guide;

  if (!guide) {
    return (
      <PageContainer>
        <p className="text-sm text-slate-500">Loading mentor day guide…</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Link
        to={ROUTES.mentorPlaybook}
        className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-spike"
      >
        <ArrowLeft size={16} /> Mentor Playbook
      </Link>

      <header className="mb-6">
        <p className="spike-label text-sky-700">Mentor Framework · Seg {seg} Week {wk} Day {dy}</p>
        <h1 className="text-2xl font-bold text-slate-900">
          {guide.theme ? `${guide.theme}: ` : ''}
          {guide.coaching_objective}
        </h1>
        {data?.weekTheme ? <p className="mt-1 text-sm text-slate-600">Week theme — {data.weekTheme}</p> : null}
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <FrameworkBulletList title="Discussion questions" items={guide.discussion_questions} />
        <FrameworkBulletList title="Observation areas" items={guide.observation_areas ?? []} />
        <FrameworkBulletList title="Reflection prompts" items={guide.reflection_prompts} />
        <FrameworkBulletList title="Warning signs" items={guide.warning_signs} />
        <FrameworkBulletList title="Coaching tips" items={guide.coaching_tips} />
        <FrameworkBulletList title="Expected output" items={guide.expected_outcomes} />
      </div>

      <Link to={ROUTES.mentorVentureCoach} className="mt-6 inline-flex spike-btn-primary">
        Review participants →
      </Link>
    </PageContainer>
  );
}
