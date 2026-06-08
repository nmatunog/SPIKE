import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { PageContainer, PageTitle } from '../../components/layout/PageContainer.jsx';
import { loadMentorWeekFramework } from '../../lib/facultyMentorFrameworkService.js';
import { ROUTES } from '../../routes/paths.js';

/** @param {{ segment?: number, week?: number }} props */
export function MentorPlaybookPage({ segment = 1, week = 1 }) {
  const [framework, setFramework] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const data = await loadMentorWeekFramework(segment, week);
      if (!cancelled) {
        setFramework(data);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [segment, week]);

  return (
    <PageContainer>
      <Link to={ROUTES.mentorHome} className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-spike">
        <ArrowLeft size={16} /> Mentor home
      </Link>

      <PageTitle subtitle="Segment → Week → Day coaching guides for consistent mentor conversations.">
        Mentor Playbook
      </PageTitle>

      {framework?.weekTheme ? (
        <p className="mt-2 text-sm font-semibold text-sky-800">Week theme: {framework.weekTheme}</p>
      ) : null}

      {loading ? (
        <p className="mt-6 text-sm text-slate-500">Loading mentor framework…</p>
      ) : (
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {(framework?.days ?? []).map((day) => (
            <li key={day.id} className="spike-card">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-sky-100 p-2 text-sky-800">
                  <MessageCircle size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Day {day.day}</p>
                  <h2 className="font-semibold text-slate-900">{day.coaching_objective}</h2>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                    {(day.expected_outcomes ?? [])[0] ?? 'Review coaching guide'}
                  </p>
                  <Link
                    to={`${ROUTES.mentorPlaybook}/${segment}/${week}/${day.day}`}
                    className="mt-3 inline-flex text-sm font-semibold text-spike hover:underline"
                  >
                    Open day guide →
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}
