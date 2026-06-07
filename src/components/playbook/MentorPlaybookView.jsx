import { Users } from 'lucide-react';
import { summarizeInternPlaybookProgress } from '../../lib/playbookProgress.js';

/**
 * @typedef {import('../../lib/contentLoader.js').DayContentBundle} DayContentBundle
 */

/**
 * @param {{
 *   bundle: DayContentBundle | null,
 *   interns: Array<{ id: string, name: string }>,
 * }} props
 */
export function MentorPlaybookView({ bundle, interns }) {
  const summaries = interns.map((intern) =>
    summarizeInternPlaybookProgress(intern.id, intern.name, bundle),
  );

  return (
    <div className="space-y-6">
      <header className="border-b border-gray-100 pb-4">
        <h3 className="inline-flex items-center gap-2 text-lg font-bold text-gray-900">
          <Users size={20} className="text-sky-700" />
          Mentor view — Playbook progress
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          {bundle
            ? `Submissions and completion for ${bundle.day.title}.`
            : 'Select a published day to review intern progress.'}
        </p>
      </header>

      {!bundle ? (
        <p className="text-sm text-gray-500">No content bundle loaded for the selected day.</p>
      ) : summaries.length === 0 ? (
        <p className="text-sm text-gray-500">No interns in cohort yet.</p>
      ) : (
        <div className="space-y-4">
          {summaries.map((row) => (
            <MentorInternCard key={row.participantId} row={row} />
          ))}
        </div>
      )}
    </div>
  );
}

/** @param {{ row: ReturnType<typeof summarizeInternPlaybookProgress> }} props */
function MentorInternCard({ row }) {
  const subs = row.submissions;
  const worksheetEntries = subs.worksheets ?? [];

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h4 className="font-bold text-gray-900">{row.participantName || row.participantId}</h4>
        <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-800">
          {row.completionPct}% complete
        </span>
      </div>

      <p className="mb-3 text-sm text-gray-600">
        {row.completedItems}/{row.totalItems} items · {row.dayTitle}
      </p>

      {worksheetEntries.length > 0 ? (
        <div>
          <h5 className="mb-2 text-xs font-bold uppercase text-gray-500">Worksheet submissions</h5>
          <ul className="space-y-2">
            {worksheetEntries.map((ws) => (
              <li key={ws.worksheetId} className="rounded-lg bg-gray-50 px-3 py-2 text-sm">
                <span className="font-semibold text-gray-800">{ws.worksheetId}</span>
                <span className="text-gray-500"> — {ws.completedAt?.slice(0, 10) ?? 'submitted'}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-gray-500">No worksheet submissions yet.</p>
      )}

      {Object.keys(subs.reflections ?? {}).length > 0 ? (
        <p className="mt-3 text-xs font-semibold text-emerald-700">
          {Object.keys(subs.reflections).length} reflection(s) saved
        </p>
      ) : null}

      <label className="mt-4 block">
        <span className="mb-1 block text-xs font-bold uppercase text-gray-500">
          Coaching notes (local)
        </span>
        <textarea
          rows={2}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          placeholder="Notes for next coaching session…"
        />
      </label>
    </article>
  );
}
