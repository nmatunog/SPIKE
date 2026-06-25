import { useMemo, useState } from 'react';
import { Sparkles, Star, Trophy } from 'lucide-react';
import {
  COMMENDATION_TYPES,
  MENTOR_REVIEW_DIMENSIONS,
  STAGE_GATE_DECISIONS,
} from '../../lib/staff/squadXpConstants.js';
import {
  formatStarDisplay,
  generateSquadCoachingSummary,
  getSquadMentorReview,
  getSquadStageGateDecision,
  getSquadWeeklyXp,
  saveSquadMentorReview,
  saveSquadStageGateDecision,
} from '../../lib/staff/squadXpService.js';
import {
  getSquadCommendations,
  saveSquadCommendations,
} from '../../lib/staff/squadCommendationService.js';
import { SquadMemberNotesAppendix } from './SquadInternNotesPanel.jsx';

/**
 * End-of-week squad review — 4 star ratings, gate decision, up to 3 commendations (~1 min).
 * @param {{
 *   staffId: string,
 *   squadName: string,
 *   week?: number,
 *   interns?: Array<{ id: string, name: string }>,
 *   showToast?: (message: string) => void,
 * }} props
 */
export function SquadWeeklyReviewPanel({
  staffId,
  squadName,
  week = 2,
  interns: internsProp,
  showToast,
}) {
  const interns = Array.isArray(internsProp) ? internsProp : [];
  const memberIds = interns.map((i) => i.id);
  const existing = getSquadMentorReview(squadName, week);
  const existingGate = getSquadStageGateDecision(squadName, week);
  const existingCommendations = getSquadCommendations(squadName, week);
  const squadXp = useMemo(
    () => getSquadWeeklyXp(squadName, memberIds, week),
    [squadName, memberIds, week, existing, existingGate],
  );

  const [ratings, setRatings] = useState(() => existing?.ratings ?? {});
  const [gate, setGate] = useState(existingGate?.decision ?? '');
  const [commendations, setCommendations] = useState(() =>
    existingCommendations.length
      ? existingCommendations.map((c) => ({
          participantId: c.participantId,
          participantName: c.participantName,
          typeId: c.typeId,
        }))
      : [{ participantId: '', participantName: '', typeId: COMMENDATION_TYPES[0].id }],
  );
  const [summary, setSummary] = useState(existing?.aiSummary ?? '');
  const [saved, setSaved] = useState(Boolean(existing));

  function handleRating(dimId, value) {
    setRatings((prev) => ({ ...prev, [dimId]: value }));
    setSaved(false);
  }

  function handleSave() {
    const filled = MENTOR_REVIEW_DIMENSIONS.every((d) => (ratings[d.id] ?? 0) > 0);
    if (!filled) {
      showToast?.('Rate all four dimensions (1–5 stars).');
      return;
    }
    const aiSummary = summary.trim() || generateSquadCoachingSummary(ratings, squadName);
    saveSquadMentorReview(staffId, squadName, week, { ratings, aiSummary });
    setSummary(aiSummary);

    if (gate) {
      saveSquadStageGateDecision(staffId, squadName, week, gate);
    }

    const validCommendations = commendations.filter((c) => c.participantId && c.typeId);
    if (validCommendations.length) {
      saveSquadCommendations(staffId, squadName, week, validCommendations);
    }

    setSaved(true);
    showToast?.(`${squadName} review saved`);
  }

  return (
    <section className="spike-surface space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="spike-label">Weekly squad review</p>
          <h3 className="text-base font-bold text-slate-900">{squadName}</h3>
          <p className="mt-1 text-xs text-slate-500">Week {week} — about 1 minute. No individual scores.</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold tabular-nums text-spike">{squadXp.totalXp} XP</p>
          <p className="text-xs text-amber-600">{formatStarDisplay(squadXp.totalXp)}</p>
          <p className="mt-1 text-[10px] text-slate-400">
            Auto {squadXp.autoXp} + W1 {squadXp.week1PitchXp}
            {squadXp.week2PanelXp ? ` + W2 ${squadXp.week2PanelXp}` : ''}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {MENTOR_REVIEW_DIMENSIONS.map((dim) => (
          <div key={dim.id} className="rounded-xl bg-slate-50 px-3 py-3">
            <p className="text-xs font-semibold text-slate-700">{dim.label}</p>
            <div className="mt-2 flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleRating(dim.id, n)}
                  className={`min-h-[40px] min-w-[40px] rounded-lg text-sm ${
                    ratings[dim.id] === n ? 'bg-spike text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'
                  }`}
                  aria-label={`${n} stars`}
                >
                  <Star size={16} className={ratings[dim.id] >= n ? 'fill-current' : ''} />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <SquadMemberNotesAppendix members={interns} week={week} />

      <div>
        <p className="mb-2 text-xs font-semibold uppercase text-slate-400">Stage gate</p>
        <div className="flex flex-wrap gap-2">
          {STAGE_GATE_DECISIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setGate(opt.id)}
              className={`rounded-xl px-4 py-2 text-xs font-bold ${
                gate === opt.id
                  ? opt.color === 'green'
                    ? 'bg-emerald-600 text-white'
                    : opt.color === 'amber'
                      ? 'bg-amber-500 text-white'
                      : 'bg-red-600 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {opt.color === 'red' ? '🔴' : opt.color === 'amber' ? '🟡' : '🟢'} {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-600">
          Commendations <span className="text-slate-400">(optional, max 3 — no XP impact)</span>
        </p>
        {commendations.map((row, idx) => (
          <div key={idx} className="flex flex-wrap gap-2">
            <select
              value={row.participantId}
              onChange={(e) => {
                const id = e.target.value;
                const name = interns.find((i) => i.id === id)?.name ?? '';
                setCommendations((prev) =>
                  prev.map((r, i) => (i === idx ? { ...r, participantId: id, participantName: name } : r)),
                );
              }}
              className="min-h-[40px] flex-1 rounded-xl border-0 bg-slate-50 px-3 text-sm"
            >
              <option value="">Select member</option>
              {interns.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
            <select
              value={row.typeId}
              onChange={(e) =>
                setCommendations((prev) =>
                  prev.map((r, i) => (i === idx ? { ...r, typeId: e.target.value } : r)),
                )
              }
              className="min-h-[40px] flex-1 rounded-xl border-0 bg-slate-50 px-3 text-sm"
            >
              {COMMENDATION_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.emoji} {t.label}
                </option>
              ))}
            </select>
          </div>
        ))}
        {commendations.length < 3 ? (
          <button
            type="button"
            onClick={() =>
              setCommendations((prev) => [
                ...prev,
                { participantId: '', participantName: '', typeId: COMMENDATION_TYPES[0].id },
              ])
            }
            className="text-xs font-semibold text-spike"
          >
            + Add commendation
          </button>
        ) : null}
      </div>

      {summary ? (
        <div className="rounded-xl bg-spike-muted/40 px-4 py-3 text-sm text-slate-700">
          <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-spike">
            <Sparkles size={14} /> AI coaching summary
          </p>
          {summary}
        </div>
      ) : null}

      <button type="button" onClick={handleSave} className="spike-btn-primary inline-flex gap-2">
        <Trophy size={16} />
        {saved ? 'Update squad review' : 'Save squad review'}
      </button>
    </section>
  );
}

/** @param {{ staffId: string, squads?: Array<{ name: string, members?: Array<{ id: string, name: string }> }>, week?: number, showToast?: (m: string) => void }} props */
export function FacultySquadReviewPanel({ staffId, squads: squadsProp, week = 2, showToast }) {
  const squads = Array.isArray(squadsProp) ? squadsProp : [];
  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">Squad-first reviews — shared XP, no individual rubrics.</p>
      {squads.map((squad) => (
        <SquadWeeklyReviewPanel
          key={squad.name}
          staffId={staffId}
          squadName={squad.name}
          week={week}
          interns={squad.members ?? []}
          showToast={showToast}
        />
      ))}
    </div>
  );
}
