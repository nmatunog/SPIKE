import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { FrameworkBulletList, FrameworkSection } from '../../components/framework/FrameworkSections.jsx';
import { loadFacultyDayFramework } from '../../lib/facultyMentorFrameworkService.js';
import { ROUTES } from '../../routes/paths.js';

export function FacultyDayFrameworkPage() {
  const { segment = '1', week = '1', day = '1' } = useParams();
  const seg = Number(segment);
  const wk = Number(week);
  const dy = Number(day);
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await loadFacultyDayFramework(seg, wk, dy);
      if (!cancelled) setData(result);
    })();
    return () => {
      cancelled = true;
    };
  }, [seg, wk, dy]);

  const template = data?.template;

  if (!template) {
    return (
      <PageContainer>
        <p className="text-sm text-slate-500">Loading faculty day template…</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Link
        to={ROUTES.facultyPlaybook}
        className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-spike"
      >
        <ArrowLeft size={16} /> Faculty Playbook
      </Link>

      <header className="mb-6">
        <p className="spike-label text-indigo-700">Faculty Framework · Seg {seg} Week {wk} Day {dy}</p>
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

      <Link to={ROUTES.playbook} className="mt-6 inline-flex spike-btn-primary">
        Deliver in Playbook →
      </Link>
    </PageContainer>
  );
}
