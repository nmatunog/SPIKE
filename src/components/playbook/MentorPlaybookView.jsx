import { useState } from 'react';
import { MessageSquare, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { summarizeInternPlaybookProgress } from '../../lib/playbookProgress.js';
import { saveMentorCoachingNote } from '../../lib/coachingService.js';
import { MentorDay1Panel } from '../day1/MentorDay1Panel.jsx';
import { MentorGuidePanel } from './MentorGuidePanel.jsx';
import { getDay1MissionProgress } from '../../lib/day1BuilderStorage.js';
import { useCohortHydration } from '../../hooks/useParticipantHydration.js';
import { ROUTES } from '../../routes/paths.js';
import { dayNumberFromBundle } from '../../lib/dayClosingReflection.js';

/**
 * @typedef {import('../../lib/contentLoader.js').DayContentBundle} DayContentBundle
 */

/** @param {DayContentBundle | null} bundle */
function bundleDayMeta(bundle) {
  const match = String(bundle?.day?.id ?? '').match(/segment-(\d+)-week-(\d+)-day-(\d+)/);
  return {
    week: match ? Number(match[2]) : 1,
    day: dayNumberFromBundle(bundle ?? {}) ?? (match ? Number(match[3]) : 1),
  };
}

/**
 * @param {{
 *   bundle: DayContentBundle | null,
 *   interns: Array<{ id: string, name: string }>,
 *   mentorId?: string,
 * }} props
 */
export function MentorPlaybookView({ bundle, interns, mentorId }) {
  const ids = interns.map((intern) => intern.id);
  const { ready } = useCohortHydration(ids, { interns });
  const summaries = interns.map((intern) =>
    summarizeInternPlaybookProgress(intern.id, intern.name, bundle),
  );
  const dayMeta = bundleDayMeta(bundle);

  return (
    <div className="space-y-6">
      <header className="border-b border-gray-100 pb-4">
        <h3 className="inline-flex items-center gap-2 text-lg font-bold text-gray-900">
          <Users size={20} className="text-sky-700" />
          Comments — one card per intern
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          {bundle
            ? `Leave a coaching comment for each intern on ${bundle.day.title}. Notes save to their timeline.`
            : 'Select a published day to comment on intern progress.'}
        </p>
        {!ready ? (
          <p className="mt-2 text-sm text-slate-500">Loading participant work from the server…</p>
        ) : null}
      </header>

      {!bundle ? (
        <p className="text-sm text-gray-500">No content bundle loaded for the selected day.</p>
      ) : !interns.length ? (
        <p className="text-sm text-gray-500">No interns assigned to you yet.</p>
      ) : bundle.day.id === 'day-segment-1-week-1-day-1' ? (
        <>
          {bundle.mentorGuide ? <MentorGuidePanel guide={bundle.mentorGuide} /> : null}
          <MentorDay1Panel interns={interns} mentorId={mentorId} />
        </>
      ) : (
        <div className="space-y-4">
          {summaries.map((row) => (
            <MentorInternCard
              key={row.participantId}
              row={row}
              mentorId={mentorId}
              dayMeta={dayMeta}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * @param {{
 *   row: ReturnType<typeof summarizeInternPlaybookProgress>,
 *   mentorId?: string,
 *   dayMeta: { week: number, day: number },
 * }} props
 */
function MentorInternCard({ row, mentorId, dayMeta }) {
  const subs = row.submissions;
  const worksheetEntries = subs.worksheets ?? [];
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSaveCoaching() {
    if (!mentorId || !notes.trim()) return;
    setSaving(true);
    try {
      await saveMentorCoachingNote(mentorId, row.participantId, notes.trim(), {
        topic: `${row.dayTitle ?? `Week ${dayMeta.week} Day ${dayMeta.day}`} — mentor comment`,
        week: dayMeta.week,
        day: dayMeta.day,
      });
      setSaved(true);
      setNotes('');
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="font-bold text-gray-900">{row.participantName || row.participantId}</h4>
          <Link
            to={`${ROUTES.mentorVentureCoach}/${row.participantId}`}
            className="text-xs font-semibold text-spike hover:underline"
          >
            Venture Coach review →
          </Link>
        </div>
        <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-800">
          {getDay1MissionProgress(row.participantId).percent || row.completionPct}% complete
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

      {(subs.surveys ?? []).length > 0 ? (
        <div className="mt-3">
          <h5 className="mb-2 text-xs font-bold uppercase text-gray-500">Survey submissions</h5>
          <ul className="space-y-1 text-sm text-gray-700">
            {subs.surveys.map((s) => (
              <li key={s.surveyId}>
                {s.surveyId} — {s.completedAt?.slice(0, 10) ?? 'submitted'}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {Object.keys(subs.reflections ?? {}).length > 0 ? (
        <p className="mt-3 text-xs font-semibold text-emerald-700">
          {Object.keys(subs.reflections).length} reflection(s) saved
        </p>
      ) : null}

      {mentorId ? (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <label className="block">
            <span className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-600">
              <MessageSquare size={14} /> Leave a comment
            </span>
            <textarea
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-spike focus:outline-none focus:ring-2 focus:ring-spike/20"
              placeholder={`Comment on ${row.dayTitle ?? 'this day'}…`}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setSaved(false);
              }}
              maxLength={4000}
            />
          </label>
          <button
            type="button"
            disabled={saving || !notes.trim()}
            onClick={() => void handleSaveCoaching()}
            className="mt-2 spike-btn-secondary text-sm disabled:opacity-50"
          >
            {saving ? 'Saving…' : saved ? 'Comment saved' : 'Post comment'}
          </button>
          {saved ? (
            <p className="mt-2 text-xs font-semibold text-emerald-700">
              Saved — appears on the intern&apos;s timeline.
            </p>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
