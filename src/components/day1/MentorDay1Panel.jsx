import { MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { saveMentorCoachingNote } from '../../lib/coachingService.js';
import { getDay1MissionProgress } from '../../lib/day1BuilderService.js';
import { getParticipantDay1Outputs } from '../../lib/day1Outputs.js';
import { useCohortHydration } from '../../hooks/useParticipantHydration.js';
import { ROUTES } from '../../routes/paths.js';

/**
 * @param {{
 *   interns: Array<{ id: string, name: string }>,
 *   mentorId?: string,
 *   showToast?: (message: string, type?: string) => void,
 * }} props
 */
export function MentorDay1Panel({ interns, mentorId, showToast }) {
  const ids = interns.map((i) => i.id);
  const { ready, version } = useCohortHydration(ids, { interns });
  void version;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">Day 1 coaching notes</h3>
        <Link to={ROUTES.playbook} className="text-sm font-semibold text-spike hover:underline">
          Open Playbook →
        </Link>
      </div>
      {!ready ? (
        <p className="text-sm text-slate-500">Loading participant work from the server…</p>
      ) : null}
      {interns.map((intern) => (
        <MentorInternDay1Card
          key={intern.id}
          intern={intern}
          mentorId={mentorId}
          showToast={showToast}
        />
      ))}
    </div>
  );
}

/**
 * @param {{
 *   intern: { id: string, name: string },
 *   mentorId?: string,
 *   showToast?: (message: string, type?: string) => void,
 * }} props
 */
function MentorInternDay1Card({ intern, mentorId, showToast }) {
  const progress = getDay1MissionProgress(intern.id);
  const outputs = getParticipantDay1Outputs(intern.id);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSaveComment() {
    if (!comment.trim() || !mentorId) return;
    setSaving(true);
    try {
      await saveMentorCoachingNote(mentorId, intern.id, comment.trim(), {
        topic: 'Day 1 builder coaching note',
      });
      setSaved(true);
      setComment('');
      showToast?.(`Coaching note saved for ${intern.name}.`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="spike-card">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="font-semibold text-slate-900">{intern.name}</h4>
          <Link
            to={`${ROUTES.mentorVentureCoach}/${intern.id}`}
            className="text-xs font-semibold text-spike hover:underline"
          >
            Venture Coach review →
          </Link>
        </div>
        <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-800">
          Day 1: {progress.percent}%
        </span>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="spike-label">My Ambition</p>
          <p className="mt-1 line-clamp-3 text-sm text-slate-700">
            {outputs.ambition || 'Not started'}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="spike-label">My Impact</p>
          <p className="mt-1 line-clamp-3 text-sm text-slate-700">
            {outputs.impact || 'Not started'}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="spike-label">My Values</p>
          <p className="mt-1 line-clamp-3 text-sm text-slate-700">
            {outputs.values || 'Not started'}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="spike-label">Dream board</p>
          <p className="mt-1 text-sm text-slate-700">
            {outputs.dreamBoardDone
              ? `${outputs.dreamBoardCount} dream card(s)`
              : 'Not started'}
          </p>
        </div>
      </div>

      {outputs.charterSquadName ? (
        <p className="mb-3 text-xs text-slate-600">
          Squad charter: <strong>{outputs.charterSquadName}</strong>
          {outputs.charterDone ? ' · Signed' : ' · Draft'}
        </p>
      ) : null}

      <label className="block">
        <span className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-600">
          <MessageSquare size={14} /> Leave a comment
        </span>
        <textarea
          rows={2}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={comment}
          placeholder="Coaching note on Day 1 builders…"
          onChange={(e) => {
            setComment(e.target.value);
            setSaved(false);
          }}
        />
      </label>
      <button
        type="button"
        disabled={!comment.trim() || !mentorId || saving}
        onClick={() => void handleSaveComment()}
        className="mt-2 spike-btn-secondary text-sm disabled:opacity-50"
      >
        {saving ? 'Saving…' : saved ? 'Comment saved' : 'Post comment'}
      </button>
    </article>
  );
}
