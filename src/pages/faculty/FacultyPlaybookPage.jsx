import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CalendarDays } from 'lucide-react';
import { PageContainer, PageTitle } from '../../components/layout/PageContainer.jsx';
import { loadFacultyWeekFramework } from '../../lib/facultyMentorFrameworkService.js';
import { ROUTES } from '../../routes/paths.js';

/** @param {{ segment?: number, week?: number }} props */
export function FacultyPlaybookPage({ segment = 1, week = 1 }) {
  const [framework, setFramework] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const data = await loadFacultyWeekFramework(segment, week);
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
      <Link to={ROUTES.facultyHome} className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-spike">
        <ArrowLeft size={16} /> Program Coach home
      </Link>

      <PageTitle subtitle="Segment → Week → Day → Session delivery framework.">
        Program Coach Playbook
      </PageTitle>

      {framework?.weekTheme ? (
        <p className="mt-2 text-sm font-semibold text-indigo-800">Week theme: {framework.weekTheme}</p>
      ) : null}

      {loading ? (
        <p className="mt-6 text-sm text-slate-500">Loading program coach framework…</p>
      ) : (
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {(framework?.days ?? []).map((day) => (
            <li key={day.id} className="spike-card">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-indigo-100 p-2 text-indigo-800">
                  <CalendarDays size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Day {day.day}</p>
                  <h2 className="font-semibold text-slate-900">{day.theme}</h2>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                    {(day.learning_objectives ?? []).slice(0, 2).join(' · ')}
                  </p>
                  <Link
                    to={`${ROUTES.facultyPlaybook}/${segment}/${week}/${day.day}`}
                    className="mt-3 inline-flex text-sm font-semibold text-spike hover:underline"
                  >
                    Open day framework →
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
