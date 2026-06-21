import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { FrameworkBulletList, FrameworkSection } from '../../components/framework/FrameworkSections.jsx';
import { loadFacultyDayFramework } from '../../lib/facultyMentorFrameworkService.js';
import { ROUTES, parseFrameworkDayPath } from '../../routes/paths.js';

export function FacultyDayFrameworkPage() {
  const { pathname } = useLocation();
  const coords = parseFrameworkDayPath(pathname, ROUTES.programCoachPlaybook);
  const seg = coords?.segment;
  const wk = coords?.week;
  const dy = coords?.day;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (seg == null || wk == null || dy == null) {
      setData(null);
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const result = await loadFacultyDayFramework(seg, wk, dy);
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
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
          Use a path like <code className="rounded bg-slate-100 px-1">/program-coach-playbook/1/1/1</code>.
        </p>
        <Link
          to={ROUTES.programCoachPlaybook}
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-spike hover:underline"
        >
          <ArrowLeft size={16} /> Program Coach Playbook
        </Link>
      </PageContainer>
    );
  }

  const template = data?.template;

  if (loading) {
    return (
      <PageContainer>
        <p className="text-sm text-slate-500">Loading program coach day template…</p>
      </PageContainer>
    );
  }

  if (!template) {
    return (
      <PageContainer>
        <p className="text-sm font-medium text-slate-900">No framework guide for Week {wk} · Day {dy} yet.</p>
        <p className="mt-2 text-sm text-slate-600">
          Deliver Week {wk} from the cohort Playbook — squad missions and facilitator notes live there.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to={ROUTES.playbook} className="spike-btn-primary">
            Open Playbook
          </Link>
          <Link to={ROUTES.programCoachPlaybook} className="spike-btn-secondary text-sm">
            Program Coach Playbook index
          </Link>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Link
        to={ROUTES.programCoachPlaybook}
        className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-spike"
      >
        <ArrowLeft size={16} /> Program Coach Playbook
      </Link>

      <header className="mb-6">
        <p className="spike-label text-indigo-700">Program Coach Framework · Seg {seg} Week {wk} Day {dy}</p>
        <h1 className="text-2xl font-bold text-slate-900">{template.theme}</h1>
        {data?.weekTheme ? <p className="mt-1 text-sm text-slate-600">{data.weekTheme}</p> : null}
      </header>

      {template.speaker_notes ? (
        <FrameworkSection title="Speaker notes">
          <p className="whitespace-pre-wrap text-sm text-slate-700">{template.speaker_notes}</p>
        </FrameworkSection>
      ) : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <FrameworkBulletList title="Learning objectives" items={template.learning_objectives} />
        <FrameworkBulletList title="Key concepts" items={template.key_concepts} />
        <FrameworkBulletList title="Discussion questions" items={template.discussion_questions} />
        <FrameworkBulletList title="Activities" items={template.activities} />
        <FrameworkBulletList title="Worksheets" items={template.worksheets} />
        <FrameworkBulletList title="Assessments" items={template.assessments} />
        <FrameworkBulletList title="Rubrics" items={template.rubrics} />
        <FrameworkBulletList title="Expected outputs" items={template.expected_outputs} />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link to={ROUTES.playbook} className="inline-flex spike-btn-primary">
          Deliver in Playbook →
        </Link>
        <Link
          to={`${ROUTES.programCoachPlaybook}/${seg}/${wk}/${dy}`}
          className="inline-flex spike-btn-secondary text-sm"
        >
          Back to framework
        </Link>
      </div>
    </PageContainer>
  );
}
