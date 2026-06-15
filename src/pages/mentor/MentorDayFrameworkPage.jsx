import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { FrameworkBulletList } from '../../components/framework/FrameworkSections.jsx';
import { loadMentorDayFramework } from '../../lib/facultyMentorFrameworkService.js';
import { ROUTES, parseFrameworkDayPath } from '../../routes/paths.js';

export function MentorDayFrameworkPage() {
  const { pathname } = useLocation();
  const coords = parseFrameworkDayPath(pathname, ROUTES.mentorPlaybook);
  const seg = coords?.segment;
  const wk = coords?.week;
  const dy = coords?.day;
  const [data, setData] = useState(null);

  useEffect(() => {
    if (seg == null || wk == null || dy == null) {
      setData(null);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      const result = await loadMentorDayFramework(seg, wk, dy);
      if (!cancelled) setData(result);
    })();
    return () => {
      cancelled = true;
    };
  }, [seg, wk, dy]);

  if (!coords) {
    return (
      <PageContainer>
        <p className="text-sm font-medium text-red-700">Invalid day URL.</p>
        <p className="mt-1 text-sm text-slate-600">
          Use a path like <code className="rounded bg-slate-100 px-1">/mentor-playbook/1/1/1</code>.
        </p>
        <Link
          to={ROUTES.mentorPlaybook}
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-spike hover:underline"
        >
          <ArrowLeft size={16} /> Mentor Playbook
        </Link>
      </PageContainer>
    );
  }

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
