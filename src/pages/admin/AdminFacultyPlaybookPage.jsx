import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageContainer, PageTitle } from '../../components/layout/PageContainer.jsx';
import { loadAllFrameworkDays } from '../../lib/facultyMentorFrameworkService.js';
import { ROUTES } from '../../routes/paths.js';

export function AdminFacultyPlaybookPage() {
  const [days, setDays] = useState([]);
  const [source, setSource] = useState('seed');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await loadAllFrameworkDays('faculty');
      if (!cancelled) {
        setDays(result.days ?? []);
        setSource(result.source ?? 'seed');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageContainer wide>
      <PageTitle subtitle="Faculty delivery framework — edit templates in Supabase or Content Studio faculty guides.">
        Faculty Playbook Admin
      </PageTitle>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link to={ROUTES.facultyHome} className="spike-btn-secondary text-sm">
          Faculty dashboard
        </Link>
        <Link to={`${ROUTES.adminContentStudio}/faculty-guides`} className="spike-btn-secondary text-sm">
          Content Studio — Faculty Guides
        </Link>
        <Link to={ROUTES.facultyPlaybook} className="spike-btn-primary text-sm">
          Preview delivery view
        </Link>
      </div>

      <p className="mt-4 text-xs text-slate-500">Data source: {source}</p>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-2xs font-bold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="p-3">Segment</th>
              <th className="p-3">Week</th>
              <th className="p-3">Day</th>
              <th className="p-3">Theme</th>
              <th className="p-3">Objectives</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day.id} className="border-t border-slate-100">
                <td className="p-3">{day.segment}</td>
                <td className="p-3">{day.week}</td>
                <td className="p-3">{day.day}</td>
                <td className="p-3 font-semibold text-slate-900">{day.theme}</td>
                <td className="p-3 text-slate-600">{(day.learning_objectives ?? []).length}</td>
                <td className="p-3">{day.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageContainer>
  );
}
