import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ContentStudioPanel, ContentStudioShell, StatusBadge } from './ContentStudioShell.jsx';
import { loadCurriculumTreeForStudio } from '../../../lib/contentStudioService.js';
import { ROUTES } from '../../../routes/paths.js';

export function ContentStudioHomePage() {
  const [tree, setTree] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCurriculumTreeForStudio()
      .then(setTree)
      .catch((err) => setError(String(err?.message ?? err)));
  }, []);

  if (error) {
    return (
      <ContentStudioShell>
        <ContentStudioPanel title="Curriculum" description="Could not load curriculum tree.">
          <p className="text-sm text-red-700">{error}</p>
          <p className="text-sm text-slate-600">
            Apply migration <code className="rounded bg-slate-100 px-1">20260627_sprint_06a_content_studio.sql</code>{' '}
            in Supabase, or continue with JSON fallback after reload.
          </p>
        </ContentStudioPanel>
      </ContentStudioShell>
    );
  }

  if (!tree) {
    return (
      <ContentStudioShell>
        <p className="text-sm text-slate-500">Loading curriculum…</p>
      </ContentStudioShell>
    );
  }

  const weeksBySegment = groupBy(tree.weeks, 'segment_id');
  const daysByWeek = groupBy(tree.days, 'week_id');

  return (
    <ContentStudioShell>
      <ContentStudioPanel
        title="Curriculum"
        description={`Hierarchy: Segment → Week → Day → Session. Source: ${tree.source}.`}
      >
        <div className="space-y-4">
          {tree.segments.map((segment) => (
            <div key={segment.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-slate-900">{segment.title}</h3>
                  <p className="text-sm text-slate-600">{segment.description}</p>
                </div>
                <StatusBadge status={segment.status ?? 'draft'} />
              </div>

              <ul className="mt-4 space-y-3 border-l-2 border-spike/20 pl-4">
                {(weeksBySegment[segment.id] ?? []).map((week) => (
                  <li key={week.id}>
                    <p className="font-medium text-slate-800">
                      {week.title}
                      {week.theme ? <span className="text-slate-500"> — {week.theme}</span> : null}
                    </p>
                    <ul className="mt-2 space-y-2">
                      {(daysByWeek[week.id] ?? []).map((day) => (
                        <li
                          key={day.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2"
                        >
                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              Day {day.day_number}: {day.theme || day.title}
                            </p>
                            <p className="text-xs text-slate-500">{day.slug}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={day.status ?? 'draft'} />
                            <Link
                              to={`${ROUTES.adminContentStudioDayBuilder}?day=${encodeURIComponent(day.slug ?? '')}`}
                              className="text-xs font-bold text-spike underline hover:no-underline"
                            >
                              Open in Day Builder
                            </Link>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </ContentStudioPanel>
    </ContentStudioShell>
  );
}

/** @template T @param {T[]} items @param {keyof T & string} key */
function groupBy(items, key) {
  return items.reduce((acc, item) => {
    const k = String(item[key]);
    acc[k] = acc[k] ?? [];
    acc[k].push(item);
    return acc;
  }, /** @type {Record<string, T[]>} */ ({}));
}
