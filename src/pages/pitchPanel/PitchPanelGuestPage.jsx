import { useEffect, useMemo, useState } from 'react';
import { CheckCircle, ChevronRight, Loader2, Star } from 'lucide-react';
import {
  PITCH_PANEL_ACCESS_PIN,
  PITCH_PANEL_DIMENSIONS,
  PITCH_PANEL_FEEDBACK_FIELDS,
  PITCH_PANEL_FEEDBACK_MIN_CHARS,
  PITCH_PANEL_TOKEN_STORAGE_KEY,
  pitchPanelFeedbackFieldComplete,
} from '../../lib/staff/pitchPanelConstants.js';
import { fetchPitchPanelSquads, submitPitchPanelScoreRemote } from '../../lib/supabase/pitchPanel.js';
import { isSupabaseConfigured } from '../../supabaseClient.js';

const INPUT_CLASS =
  'mt-1.5 w-full min-h-[48px] rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 outline-none focus:border-spike focus:ring-2 focus:ring-spike/20';
const BTN_PRIMARY =
  'flex min-h-[52px] w-full touch-manipulation items-center justify-center gap-2 rounded-xl bg-spike px-4 text-base font-bold text-white transition active:scale-[0.98] disabled:opacity-60';

function readToken() {
  try {
    let token = localStorage.getItem(PITCH_PANEL_TOKEN_STORAGE_KEY);
    if (!token) {
      token = crypto.randomUUID();
      localStorage.setItem(PITCH_PANEL_TOKEN_STORAGE_KEY, token);
    }
    return token;
  } catch {
    return crypto.randomUUID();
  }
}

/** @param {{ label: string, hint: string, value: number, onChange: (n: number) => void, index: number }} props */
function StarRow({ label, hint, value, onChange, index }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-spike/10 text-sm font-bold text-spike">
          {index}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold leading-snug text-slate-900">{label}</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">{hint}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-5 gap-2" role="group" aria-label={label}>
        {[1, 2, 3, 4, 5].map((n) => {
          const selected = value === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={`touch-manipulation flex min-h-[52px] flex-col items-center justify-center rounded-xl text-lg font-bold transition active:scale-95 sm:min-h-[56px] sm:text-xl ${
                selected
                  ? 'bg-spike text-white shadow-md ring-2 ring-spike ring-offset-2'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
              aria-label={`${label}: ${n} of 5`}
              aria-pressed={selected}
            >
              <span aria-hidden>★</span>
              <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide opacity-80">{n}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** @param {{ squads: string[], value: string, onChange: (name: string) => void }} props */
function SquadPicker({ squads, value, onChange }) {
  if (squads.length <= 4) {
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        {squads.map((s) => {
          const selected = value === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => onChange(s)}
              className={`touch-manipulation min-h-[52px] rounded-xl border px-4 py-3 text-left text-base font-semibold transition active:scale-[0.98] ${
                selected
                  ? 'border-spike bg-spike/5 text-spike ring-2 ring-spike/30'
                  : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
              }`}
              aria-pressed={selected}
            >
              {s}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {squads.map((s) => {
        const selected = value === s;
        return (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            className={`touch-manipulation shrink-0 rounded-full border px-5 py-3 text-sm font-bold transition active:scale-95 sm:text-base ${
              selected
                ? 'border-spike bg-spike text-white shadow-md'
                : 'border-slate-200 bg-white text-slate-700'
            }`}
            aria-pressed={selected}
          >
            {s}
          </button>
        );
      })}
    </div>
  );
}

/** Public guest scoring — PIN W2PITCH */
export function PitchPanelGuestPage() {
  const [pin, setPin] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [name, setName] = useState('');
  const [org, setOrg] = useState('');
  const [squads, setSquads] = useState([]);
  const [squadName, setSquadName] = useState('');
  const [ratings, setRatings] = useState({ evidence: 0, validation: 0, presentation: 0, team: 0 });
  const [feedback, setFeedback] = useState({ keep: '', improve: '', explore: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const token = useMemo(() => readToken(), []);

  const ratedCount = PITCH_PANEL_DIMENSIONS.filter((d) => ratings[d.id] > 0).length;
  const allRated = ratedCount === PITCH_PANEL_DIMENSIONS.length;
  const feedbackComplete = PITCH_PANEL_FEEDBACK_FIELDS.every((f) =>
    pitchPanelFeedbackFieldComplete(feedback[f.id]),
  );
  const canSubmit = Boolean(name.trim() && squadName && allRated && !busy);

  useEffect(() => {
    document.title = 'SPIKE Pitch Panel';
    document.documentElement.classList.add('pitch-panel-guest');
    return () => document.documentElement.classList.remove('pitch-panel-guest');
  }, []);

  async function handleUnlock(e) {
    e.preventDefault();
    setError('');
    if (!isSupabaseConfigured) {
      setError('Cloud sync is not available. Ask the program coach to enter scores on the faculty tablet.');
      return;
    }
    if (pin.trim().toUpperCase() !== PITCH_PANEL_ACCESS_PIN) {
      setError('Invalid access PIN.');
      return;
    }
    setBusy(true);
    try {
      const list = await fetchPitchPanelSquads(pin.trim());
      setSquads(list);
      setSquadName(list[0] ?? '');
      setUnlocked(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load squads.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Enter your name.');
      return;
    }
    if (!squadName) {
      setError('Select a squad.');
      return;
    }
    const missing = PITCH_PANEL_DIMENSIONS.some((d) => !ratings[d.id]);
    if (missing) {
      setError('Rate all four dimensions (1–5 stars).');
      return;
    }
    setBusy(true);
    try {
      await submitPitchPanelScoreRemote({
        pin: PITCH_PANEL_ACCESS_PIN,
        panelistToken: token,
        panelistName: name.trim(),
        panelistOrg: org.trim(),
        squadName,
        ratings,
        feedback: {
          keep: feedback.keep,
          improve: feedback.improve,
          explore: feedback.explore,
        },
      });
      setSaved(true);
      setRatings({ evidence: 0, validation: 0, presentation: 0, team: 0 });
      setFeedback({ keep: '', improve: '', explore: '' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save score.');
    } finally {
      setBusy(false);
    }
  }

  function handleScoreAnother() {
    setSaved(false);
    setRatings({ evidence: 0, validation: 0, presentation: 0, team: 0 });
    setFeedback({ keep: '', improve: '', explore: '' });
    setError('');
  }

  if (!unlocked) {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-b from-slate-50 to-white px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2.5rem,env(safe-area-inset-top))]">
        <div className="mx-auto w-full max-w-md">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-spike">SPIKE · Week 2</p>
          <h1 className="mt-2 text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">Pitch panel scoring</h1>
          <p className="mt-3 text-base leading-relaxed text-slate-600">
            Enter the PIN from your invite, then score each squad after they pitch. Works best on your phone.
          </p>
          <form onSubmit={handleUnlock} className="mt-8 space-y-4 spike-card p-5 sm:p-6">
            <label className="block text-sm font-semibold text-slate-700">
              Access PIN
              <input
                type="text"
                inputMode="text"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                value={pin}
                onChange={(e) => setPin(e.target.value.toUpperCase())}
                className={`${INPUT_CLASS} text-center text-xl font-bold tracking-[0.25em]`}
                placeholder="W2PITCH"
                autoComplete="off"
              />
            </label>
            {error ? (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-700" role="alert">
                {error}
              </p>
            ) : null}
            <button type="submit" disabled={busy || !pin.trim()} className={BTN_PRIMARY}>
              {busy ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Checking…
                </>
              ) : (
                <>
                  Continue
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/90 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-spike">Pitch panel</p>
            <h1 className="truncate text-lg font-bold text-slate-900 sm:text-xl">
              {squadName || 'Score a squad'}
            </h1>
          </div>
          <div className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
            {ratedCount}/{PITCH_PANEL_DIMENSIONS.length} rated
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-4 px-4 py-4 pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] sm:space-y-5 sm:py-6 sm:pb-8">
        {saved ? (
          <div
            className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-base text-emerald-900"
            role="status"
          >
            <CheckCircle size={22} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Score saved for {squadName}</p>
              <p className="mt-1 text-sm leading-relaxed text-emerald-800">
                Pick another squad below or update by submitting again.
              </p>
              <button
                type="button"
                onClick={handleScoreAnother}
                className="mt-3 min-h-[44px] touch-manipulation rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white active:scale-[0.98]"
              >
                Score next squad
              </button>
            </div>
          </div>
        ) : null}

        <form id="pitch-panel-form" onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Your details</h2>
            <div className="mt-3 space-y-3 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0">
              <label className="block text-sm font-semibold text-slate-700">
                Your name
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={INPUT_CLASS}
                  autoComplete="name"
                  enterKeyHint="next"
                  required
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Organization <span className="font-normal text-slate-400">(optional)</span>
                <input
                  value={org}
                  onChange={(e) => setOrg(e.target.value)}
                  className={INPUT_CLASS}
                  autoComplete="organization"
                  enterKeyHint="done"
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Squad pitching now</h2>
            <p className="mt-1 text-sm text-slate-500">Tap the squad you are scoring.</p>
            <div className="mt-3">
              <SquadPicker
                squads={squads}
                value={squadName}
                onChange={(s) => {
                  setSquadName(s);
                  setSaved(false);
                }}
              />
            </div>
          </section>

          <section className="space-y-3 sm:space-y-4">
            <h2 className="px-1 text-sm font-bold uppercase tracking-wide text-slate-500">Rate 1–5 stars each</h2>
            {PITCH_PANEL_DIMENSIONS.map((dim, i) => (
              <StarRow
                key={dim.id}
                index={i + 1}
                label={dim.label}
                hint={dim.hint}
                value={ratings[dim.id]}
                onChange={(n) => {
                  setRatings((prev) => ({ ...prev, [dim.id]: n }));
                  setSaved(false);
                }}
              />
            ))}
          </section>

          <section className="space-y-3 rounded-2xl border border-spike/20 bg-spike/5 p-4 sm:p-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-spike">Coaching notes</h2>
            <p className="text-sm text-slate-600">
              One line each — saved to intern portfolios for Week 2 Day 5. Write at least{' '}
              {PITCH_PANEL_FEEDBACK_MIN_CHARS} characters per field; shorter or blank fields save as
              &ldquo;none&rdquo;.
            </p>
            {PITCH_PANEL_FEEDBACK_FIELDS.map((field) => {
              const trimmed = String(feedback[field.id] ?? '').trim();
              const complete = pitchPanelFeedbackFieldComplete(feedback[field.id]);
              return (
                <label key={field.id} className="block text-sm font-semibold text-slate-800">
                  <span className="flex items-baseline justify-between gap-2">
                    <span>{field.label}</span>
                    <span
                      className={`text-xs font-medium ${complete ? 'text-emerald-700' : 'text-slate-500'}`}
                    >
                      {complete
                        ? 'Ready'
                        : `${trimmed.length}/${PITCH_PANEL_FEEDBACK_MIN_CHARS} chars · saves as "none"`}
                    </span>
                  </span>
                  <textarea
                    value={feedback[field.id]}
                    onChange={(e) => {
                      setFeedback((prev) => ({ ...prev, [field.id]: e.target.value }));
                      setSaved(false);
                    }}
                    rows={2}
                    placeholder={field.placeholder}
                    className={`${INPUT_CLASS} min-h-[72px] resize-y text-sm`}
                  />
                </label>
              );
            })}
          </section>

          {error ? (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-700" role="alert">
              {error}
            </p>
          ) : null}
        </form>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/90 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:static sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
        <div className="mx-auto max-w-2xl">
          <button
            type="submit"
            form="pitch-panel-form"
            disabled={!canSubmit}
            className={`${BTN_PRIMARY} shadow-lg sm:shadow-none`}
          >
            {busy ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Star size={18} fill="currentColor" />
                Submit score card{squadName ? ` · ${squadName}` : ''}
              </>
            )}
          </button>
          {!allRated && name.trim() ? (
            <p className="mt-2 text-center text-xs text-slate-500">
              {PITCH_PANEL_DIMENSIONS.length - ratedCount} dimension
              {PITCH_PANEL_DIMENSIONS.length - ratedCount === 1 ? '' : 's'} left to rate
            </p>
          ) : allRated && !feedbackComplete ? (
            <p className="mt-2 text-center text-xs text-slate-500">
              Coaching notes under {PITCH_PANEL_FEEDBACK_MIN_CHARS} characters will save as
              &ldquo;none&rdquo;
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
