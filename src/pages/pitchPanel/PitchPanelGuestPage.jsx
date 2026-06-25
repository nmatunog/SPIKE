import { useEffect, useMemo, useState } from 'react';
import { CheckCircle, Loader2, Star } from 'lucide-react';
import {
  PITCH_PANEL_ACCESS_PIN,
  PITCH_PANEL_DIMENSIONS,
  PITCH_PANEL_TOKEN_STORAGE_KEY,
} from '../../lib/staff/pitchPanelConstants.js';
import { fetchPitchPanelSquads, submitPitchPanelScoreRemote } from '../../lib/supabase/pitchPanel.js';
import { isSupabaseConfigured } from '../../supabaseClient.js';

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

/** @param {{ label: string, hint: string, value: number, onChange: (n: number) => void }} props */
function StarRow({ label, hint, value, onChange }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-sm font-semibold text-slate-900">{label}</p>
      <p className="mt-0.5 text-xs text-slate-500">{hint}</p>
      <div className="mt-3 flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex h-11 w-11 items-center justify-center rounded-lg text-lg ${
              value === n ? 'bg-spike text-white' : 'bg-slate-100 text-slate-500'
            }`}
            aria-label={`${label} ${n} stars`}
          >
            ★
          </button>
        ))}
      </div>
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const token = useMemo(() => readToken(), []);

  useEffect(() => {
    document.title = 'SPIKE Pitch Panel';
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
      });
      setSaved(true);
      setRatings({ evidence: 0, validation: 0, presentation: 0, team: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save score.');
    } finally {
      setBusy(false);
    }
  }

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-4 py-10">
        <div className="mx-auto max-w-md">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-spike">SPIKE · Week 2</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Pitch panel scoring</h1>
          <p className="mt-2 text-sm text-slate-600">
            Guest panelists — enter the access PIN from your invite, then score each squad after they pitch.
          </p>
          <form onSubmit={handleUnlock} className="mt-8 space-y-4 spike-card p-5">
            <label className="block text-sm font-semibold text-slate-700">
              Access PIN
              <input
                type="text"
                value={pin}
                onChange={(e) => setPin(e.target.value.toUpperCase())}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-lg tracking-widest"
                placeholder="W2PITCH"
                autoComplete="off"
              />
            </label>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-spike py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {busy ? 'Checking…' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-4 py-8 pb-16">
      <div className="mx-auto max-w-lg space-y-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-spike">Pitch panel</p>
          <h1 className="mt-1 text-xl font-bold text-slate-900">Score a squad</h1>
          <p className="mt-1 text-sm text-slate-600">Rate evidence and delivery — squad-first, not individual.</p>
        </div>

        {saved ? (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <CheckCircle size={18} className="mt-0.5 shrink-0" />
            Score saved. You can score another squad or update this squad by submitting again.
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700">
              Your name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                required
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Organization (optional)
              <input
                value={org}
                onChange={(e) => setOrg(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
          </div>

          <label className="block text-sm font-semibold text-slate-700">
            Squad
            <select
              value={squadName}
              onChange={(e) => {
                setSquadName(e.target.value);
                setSaved(false);
              }}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              {squads.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>

          {PITCH_PANEL_DIMENSIONS.map((dim) => (
            <StarRow
              key={dim.id}
              label={dim.label}
              hint={dim.hint}
              value={ratings[dim.id]}
              onChange={(n) => {
                setRatings((prev) => ({ ...prev, [dim.id]: n }));
                setSaved(false);
              }}
            />
          ))}

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-spike py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Star size={16} />}
            Submit score
          </button>
        </form>
      </div>
    </div>
  );
}
