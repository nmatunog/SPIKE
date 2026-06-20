import { useState } from 'react';
import { Trophy, Zap } from 'lucide-react';
import {
  getCoachRatingGamification,
  getSquadDayRating,
  saveSquadDayRating,
  SIMPLIFIED_PULSE_HINTS,
} from '../../lib/staff/squadRatingService.js';

/**
 * One-tap squad/day rating for mentors — scores over essays.
 * @param {{
 *   staffId: string,
 *   squadName: string,
 *   week?: number,
 *   day?: number,
 *   interns?: Array<{ id: string, name: string }>,
 *   role?: 'mentor' | 'faculty',
 *   showToast?: (message: string) => void,
 * }} props
 */
export function MentorSquadRatingPanel({
  staffId,
  squadName,
  week = 2,
  day = 1,
  interns = [],
  role = 'mentor',
  showToast,
}) {
  const existing = getSquadDayRating(staffId, squadName, week, day);
  const gamify = getCoachRatingGamification(staffId);
  const [score, setScore] = useState(existing?.overallScore ?? 0);
  const [standoutId, setStandoutId] = useState(existing?.standoutParticipantId ?? '');
  const [standoutNote, setStandoutNote] = useState(existing?.standoutNote ?? '');
  const [showNote, setShowNote] = useState(Boolean(existing?.standoutNote));
  const [saved, setSaved] = useState(Boolean(existing?.overallScore));

  function handleSave() {
    if (!score) {
      showToast?.('Tap a score 1–5 for the squad today.');
      return;
    }
    const result = saveSquadDayRating(staffId, squadName, week, day, {
      overallScore: score,
      standoutParticipantId: standoutId || undefined,
      standoutNote: showNote ? standoutNote : undefined,
      role,
    });
    setSaved(true);
    showToast?.(`+${result.rating.coachXp} Coach XP · ${gamify.level}`);
  }

  return (
    <section className="spike-surface space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="spike-label">Quick squad rating</p>
          <h3 className="text-base font-bold text-slate-900">{squadName}</h3>
          <p className="mt-1 text-xs text-slate-500">
            Week {week} · Day {day} — one score for the whole squad (about 30 seconds).
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900">
          <Trophy size={14} aria-hidden />
          {gamify.level} · {gamify.totalXp} XP
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-slate-800">Squad pulse today</p>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              title={SIMPLIFIED_PULSE_HINTS[n - 1]}
              onClick={() => {
                setScore(n);
                setSaved(false);
              }}
              className={`min-h-[48px] min-w-[48px] rounded-xl text-sm font-bold transition ${
                score === n ? 'bg-spike text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        {score > 0 ? (
          <p className="mt-1 text-xs text-slate-500">{SIMPLIFIED_PULSE_HINTS[score - 1]}</p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => setShowNote((v) => !v)}
        className="text-xs font-semibold text-spike hover:underline"
      >
        {showNote ? 'Hide' : 'Add'} standout note (optional)
      </button>

      {showNote ? (
        <div className="space-y-2 animate-spike-fade-in">
          <select
            value={standoutId}
            onChange={(e) => setStandoutId(e.target.value)}
            className="w-full rounded-xl border-0 bg-slate-50 px-3 py-2 text-sm"
          >
            <option value="">Standout intern (optional)</option>
            {interns.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={standoutNote}
            onChange={(e) => setStandoutNote(e.target.value)}
            placeholder="One line — extraordinary performance only"
            className="w-full rounded-xl border-0 bg-slate-50 px-3 py-2 text-sm"
          />
        </div>
      ) : null}

      <button type="button" onClick={handleSave} className="spike-btn-primary inline-flex gap-2">
        <Zap size={16} />
        {saved ? 'Update rating' : 'Save squad rating'}
      </button>
    </section>
  );
}

/**
 * Faculty cohort view — rate each squad once per day.
 * @param {{
 *   staffId: string,
 *   squads: Array<{ name: string, members?: Array<{ id: string, name: string }> }>,
 *   week?: number,
 *   day?: number,
 *   showToast?: (message: string) => void,
 * }} props
 */
export function FacultySquadRatingPanel({ staffId, squads, week = 2, day = 1, showToast }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-900">Squad pulse ratings</h3>
        <p className="mt-1 text-xs text-slate-500">
          Score each squad once — no per-intern essays required.
        </p>
      </div>
      {squads.map((squad) => (
        <MentorSquadRatingPanel
          key={squad.name}
          staffId={staffId}
          squadName={squad.name}
          week={week}
          day={day}
          interns={squad.members ?? []}
          role="faculty"
          showToast={showToast}
        />
      ))}
    </div>
  );
}
