import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Edit3, MessageCircle, Save, Users } from 'lucide-react';
import {
  loadWeek3Day3Portfolio,
  saveWeek3Day3Portfolio,
  isWeek3Day3PortfolioComplete,
  WEEK3_DAY3_FEC_EDIT_SLUGS,
} from '../../../lib/week3Day3PortfolioService.js';
import { buildFecLayoutParticipantContent } from '../../../lib/fecCanvasLayoutContent.js';

const REFLECTION_FIELDS = [
  {
    key: 'whatWorked',
    label: 'What worked?',
    hint: 'What felt natural in your FNA conversation as agent or client?',
  },
  {
    key: 'whatAwkward',
    label: 'What felt awkward?',
    hint: 'Where did the flow break down or feel forced?',
  },
  {
    key: 'whatBuildsTrust',
    label: 'What builds trust?',
    hint: 'Which questions, tone, or moments made the client open up?',
  },
  {
    key: 'clientExperienceVision',
    label: 'What should your client experience look like?',
    hint: 'Describe the journey from first contact through ongoing advice.',
  },
];

/**
 * Week 3 Day 3 portfolio output — FNA role-play reflections + FEC Box 4/5 improvement.
 * @param {{
 *   participantId: string,
 *   onSaved?: () => void,
 *   onEditFecBox?: (slug: string) => void,
 *   staffPreview?: boolean,
 * }} props
 */
export function Week3Day3PortfolioMission({
  participantId,
  onSaved,
  onEditFecBox,
  staffPreview = false,
}) {
  const [draft, setDraft] = useState(() => loadWeek3Day3Portfolio(participantId));
  const [saveState, setSaveState] = useState('idle');
  const draftRef = useRef(draft);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    setDraft(loadWeek3Day3Portfolio(participantId));
  }, [participantId]);

  const fecContent = useMemo(
    () => buildFecLayoutParticipantContent(participantId),
    [participantId, draft.updatedAt],
  );

  const box4Text = fecContent.boxContents?.client_experience ?? 'Not drafted yet — edit FEC Box 4.';
  const box5Text = fecContent.boxContents?.winning_strategy ?? 'Not drafted yet — edit FEC Box 5.';

  function persist(patch) {
    const next = { ...draftRef.current, ...patch };
    draftRef.current = next;
    setDraft(next);
    if (!staffPreview && participantId) {
      saveWeek3Day3Portfolio(participantId, patch);
    }
  }

  function saveNow({ notify = false } = {}) {
    if (staffPreview || !participantId) return;
    saveWeek3Day3Portfolio(participantId, draftRef.current);
    setSaveState('saved');
    window.setTimeout(() => setSaveState('idle'), 2000);
    if (notify) onSaved?.();
  }

  useEffect(() => {
    if (staffPreview || !participantId) return undefined;
    const saveLocal = () => saveWeek3Day3Portfolio(participantId, draftRef.current);
    window.addEventListener('pagehide', saveLocal);
    const onHide = () => {
      if (document.visibilityState === 'hidden') saveLocal();
    };
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('pagehide', saveLocal);
      document.removeEventListener('visibilitychange', onHide);
      saveLocal();
    };
  }, [participantId, staffPreview]);

  const complete = !staffPreview && isWeek3Day3PortfolioComplete(participantId);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm sm:p-6">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-800">
          <Users size={16} aria-hidden />
          Morning activity
        </p>
        <h2 className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">FNA Role Play — Agent &amp; Client</h2>
        <p className="mt-2 text-sm text-slate-700 sm:text-base">
          Pair up with a squad mate. Take turns being the <strong>advisor</strong> and the{' '}
          <strong>client</strong> going through FNA discovery questions — no product pitch, diagnosis only.
        </p>
        <ol className="mt-4 space-y-2 text-sm text-slate-700">
          <li className="flex gap-2">
            <span className="font-bold text-spike">1.</span>
            <span>8 minutes — one person leads the FNA questions as the agent.</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-spike">2.</span>
            <span>4 minutes — partner shares what felt real vs. awkward.</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-spike">3.</span>
            <span>Swap roles and repeat.</span>
          </li>
        </ol>
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-amber-100 bg-white/80 px-3 py-2 text-sm text-slate-600">
          <MessageCircle size={16} className="mt-0.5 shrink-0 text-amber-700" aria-hidden />
          Use your Week 1 persona or Week 2 validated segment. Capture notes below for your portfolio.
        </p>
      </section>

      <section className="spike-surface space-y-4">
        <div>
          <p className="spike-label">Week 3 Day 3 Portfolio</p>
          <h2 className="text-xl font-bold text-slate-900">Today&apos;s mission</h2>
          <p className="mt-1 text-sm text-slate-600">
            Improve <strong>FEC Box 4 — Client Experience</strong> using what you learned in role play.
          </p>
        </div>

        <div className="space-y-4">
          {REFLECTION_FIELDS.map((field) => (
            <label key={field.key} className="block space-y-1.5">
              <span className="text-sm font-semibold text-slate-900">{field.label}</span>
              <span className="block text-xs text-slate-500">{field.hint}</span>
              <textarea
                value={draft[field.key] ?? ''}
                onChange={(event) => persist({ [field.key]: event.target.value })}
                onBlur={() => saveNow()}
                rows={3}
                disabled={staffPreview}
                placeholder={staffPreview ? 'Interns complete this after FNA role play.' : 'Write your reflection…'}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-spike focus:outline-none focus:ring-2 focus:ring-spike/20 disabled:bg-slate-50"
              />
            </label>
          ))}
        </div>

        <div className="rounded-xl border border-spike/15 bg-spike/5 p-4">
          <p className="text-sm font-bold text-slate-900">Improve FEC Box 4 — Client Experience</p>
          <p className="mt-1 text-sm text-slate-600">{box4Text}</p>
          {onEditFecBox ? (
            <button
              type="button"
              onClick={() => onEditFecBox(WEEK3_DAY3_FEC_EDIT_SLUGS.box4)}
              className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-spike/30 bg-white px-4 py-2 text-sm font-semibold text-spike shadow-sm transition hover:bg-spike/5"
            >
              <Edit3 size={16} aria-hidden />
              Edit FEC Box 4
            </button>
          ) : null}
        </div>

        <div className="space-y-3 border-t border-slate-100 pt-4">
          <p className="text-sm font-bold text-slate-900">Improve FEC Box 5 — Winning Strategy</p>
          <p className="text-sm text-slate-600">
            Why will clients choose your advisory practice instead of another? (Based on experience,
            understanding, and trust.)
          </p>
          <label className="block space-y-1.5">
            <span className="sr-only">Why choose your practice</span>
            <textarea
              value={draft.whyChoosePractice ?? ''}
              onChange={(event) => persist({ whyChoosePractice: event.target.value })}
              onBlur={() => saveNow()}
              rows={4}
              disabled={staffPreview}
              placeholder={
                staffPreview
                  ? 'Interns articulate their differentiation after role play.'
                  : 'Describe what makes your client experience and approach uniquely trustworthy…'
              }
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-spike focus:outline-none focus:ring-2 focus:ring-spike/20 disabled:bg-slate-50"
            />
          </label>
          <div className="rounded-xl border border-spike/15 bg-spike/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Current FEC Box 5</p>
            <p className="mt-1 text-sm text-slate-700">{box5Text}</p>
            {onEditFecBox ? (
              <button
                type="button"
                onClick={() => onEditFecBox(WEEK3_DAY3_FEC_EDIT_SLUGS.box5)}
                className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-spike/30 bg-white px-4 py-2 text-sm font-semibold text-spike shadow-sm transition hover:bg-spike/5"
              >
                <Edit3 size={16} aria-hidden />
                Edit FEC Box 5
              </button>
            ) : null}
          </div>
        </div>

        {!staffPreview ? (
          <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => saveNow({ notify: true })}
              className="spike-btn-primary inline-flex min-h-[44px] items-center gap-2"
            >
              {saveState === 'saved' ? <Check size={16} aria-hidden /> : <Save size={16} aria-hidden />}
              {saveState === 'saved' ? 'Saved' : 'Save portfolio'}
            </button>
            {complete ? (
              <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                <Check size={16} aria-hidden />
                Portfolio mission complete
              </p>
            ) : (
              <p className="text-xs text-slate-500">Complete all reflections (20+ characters each).</p>
            )}
          </div>
        ) : null}
      </section>
    </div>
  );
}
