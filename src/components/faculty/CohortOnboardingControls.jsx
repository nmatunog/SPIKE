import { useCallback, useEffect, useState } from 'react';
import { Loader2, Sparkles, Users } from 'lucide-react';
import {
  staffCloseSuggestions,
  staffCloseVoting,
  staffGenerateAndSaveFinalists,
  staffLoadDashboard,
  staffMarkSquadsAssigned,
  staffOpenSuggestions,
  staffPublishVoting,
  staffRevealWinner,
  staffSaveFinalists,
  staffUploadCohortPhoto,
} from '../../lib/cohortOnboardingService.js';
import { db } from '../../lib/cohortOnboardingService.js';
import { OnboardingPhotoCapture } from '../onboarding/OnboardingPhotoCapture.jsx';
import { isSupabaseConfigured } from '../../supabaseClient.js';

/**
 * Program Coach / Mentor controls for cohort-first onboarding.
 * @param {{ staffId: string, interns?: Array<{ id: string, name: string }>, canAssignSquads?: boolean, photoOnly?: boolean }} props
 */
export function CohortOnboardingControls({ staffId, interns = [], canAssignSquads = false, photoOnly = false }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [editFinalists, setEditFinalists] = useState([]);
  const [newSquadName, setNewSquadName] = useState('Squad');
  const [pickInterns, setPickInterns] = useState(['', '', '']);

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    try {
      const dash = await staffLoadDashboard();
      setData(dash);
      setEditFinalists((dash?.finalists ?? []).map((f) => f.name));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load onboarding.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function run(label, fn) {
    setBusy(label);
    setError('');
    try {
      await fn();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed.');
    } finally {
      setBusy('');
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <section className="spike-card p-4 text-sm text-slate-600">
        Connect Supabase to manage cohort onboarding.
      </section>
    );
  }

  if (loading) {
    return (
      <section className="spike-card flex items-center gap-2 p-4 text-sm text-slate-600">
        <Loader2 className="animate-spin" size={16} /> Loading onboarding controls…
      </section>
    );
  }

  if (!data?.cohort) {
    return (
      <section className="spike-card p-4 text-sm text-amber-800">
        No active cohort found. Run the onboarding migration and seed an active cohort.
      </section>
    );
  }

  const { cohort, suggestions, tally, squads } = data;
  const phase = cohort.onboarding_phase;
  const assignedIds = new Set(
    squads.flatMap((s) => (s.formation_squad_members ?? []).map((m) => m.participant_id)),
  );
  const unassigned = interns.filter((i) => !assignedIds.has(i.id));

  return (
    <section className="spike-card space-y-4 p-5" id="cohort-onboarding-controls">
      <div className="flex items-start gap-3">
        <Sparkles className="mt-1 text-spike" size={22} />
        <div>
          <p className="spike-label text-spike">Cohort onboarding</p>
          <h3 className="text-lg font-bold text-slate-900">Founding cohort controls</h3>
          <p className="mt-1 text-sm text-slate-600">
            Phase: <strong>{phase.replace(/_/g, ' ')}</strong>
            {cohort.official_name ? ` · Winner: ${cohort.official_name}` : ''}
          </p>
        </div>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : null}

      {!photoOnly ? (
      <div className="flex flex-wrap gap-2">
        <ControlButton
          label="Open suggestions"
          busy={busy}
          onClick={() => run('open', () => staffOpenSuggestions(cohort.id))}
        />
        <ControlButton
          label="Close suggestions"
          busy={busy}
          onClick={() => run('close', () => staffCloseSuggestions(cohort.id))}
        />
        <ControlButton
          label="Generate AI finalists"
          busy={busy}
          onClick={() => run('ai', () => staffGenerateAndSaveFinalists(cohort.id, staffId))}
        />
        <ControlButton
          label="Publish voting"
          busy={busy}
          onClick={() => run('vote', () => staffPublishVoting(cohort.id))}
        />
        <ControlButton
          label="Close voting"
          busy={busy}
          onClick={() => run('close-vote', () => staffCloseVoting(cohort.id))}
        />
        <ControlButton
          label="Reveal winner"
          busy={busy}
          onClick={() => run('reveal', () => staffRevealWinner(cohort.id))}
        />
      </div>
      ) : null}

      {!photoOnly ? (
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <h4 className="mb-2 text-sm font-semibold">Suggestions ({suggestions.length})</h4>
          <ul className="max-h-40 space-y-1 overflow-y-auto text-sm">
            {suggestions.map((s) => (
              <li key={s.id} className="rounded-lg bg-slate-50 px-3 py-2">
                <strong>{s.suggested_name}</strong>
                {s.reason ? <span className="text-slate-500"> — {s.reason}</span> : null}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-2 text-sm font-semibold">Finalists & live votes</h4>
          {editFinalists.map((name, idx) => (
            <input
              key={idx}
              value={name}
              onChange={(e) => {
                const next = [...editFinalists];
                next[idx] = e.target.value;
                setEditFinalists(next);
              }}
              className="mb-2 w-full rounded-lg border px-3 py-2 text-sm"
            />
          ))}
          <ControlButton
            label="Save finalists"
            busy={busy}
            onClick={() =>
              run('save-fin', () =>
                staffSaveFinalists(
                  cohort.id,
                  editFinalists.filter((n) => n.trim()).map((name) => ({ name: name.trim() })),
                  staffId,
                ),
              )
            }
          />
          <ul className="mt-3 space-y-1 text-sm">
            {tally.map((row) => (
              <li key={row.finalistId} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span>{row.name}</span>
                <span className="font-bold text-spike">{row.votes}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      ) : null}

      {photoOnly || phase === 'winner_revealed' || phase === 'cohort_photo_complete' ? (
        <div className="rounded-xl border border-slate-200 p-4">
          <h4 className="mb-2 text-sm font-semibold">Official cohort photo</h4>
          <p className="mb-3 text-xs text-slate-500">
            The group chooses the shot; upload the official photo here.
          </p>
          {cohort.photo_url ? (
            <img src={cohort.photo_url} alt="" className="mb-3 h-32 rounded-xl object-cover" />
          ) : null}
          <OnboardingPhotoCapture
            label="Upload cohort photo"
            onUpload={(url) => staffUploadCohortPhoto(cohort.id, url)}
          />
        </div>
      ) : null}

      {canAssignSquads ? (
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Users size={18} className="text-spike" />
            <h4 className="text-sm font-semibold">Assign squads (3 members)</h4>
          </div>
          <input
            value={newSquadName}
            onChange={(e) => setNewSquadName(e.target.value)}
            className="mb-2 w-full rounded-lg border px-3 py-2 text-sm"
            placeholder="Squad name"
          />
          <div className="grid gap-2 sm:grid-cols-3">
            {pickInterns.map((val, idx) => (
              <select
                key={idx}
                value={val}
                onChange={(e) => {
                  const next = [...pickInterns];
                  next[idx] = e.target.value;
                  setPickInterns(next);
                }}
                className="rounded-lg border px-2 py-2 text-sm"
              >
                <option value="">Member {idx + 1}…</option>
                {unassigned.map((i) => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
            ))}
          </div>
          <ControlButton
            label="Create squad"
            busy={busy}
            className="mt-3"
            onClick={() =>
              run('squad', async () => {
                const ids = pickInterns.filter(Boolean);
                if (ids.length !== 3) throw new Error('Select exactly 3 members.');
                await db.createFormationSquad(cohort.id, newSquadName, ids);
                setPickInterns(['', '', '']);
              })
            }
          />
          <ControlButton
            label="Mark squads assigned"
            busy={busy}
            className="mt-2"
            onClick={() => run('assigned', () => staffMarkSquadsAssigned(cohort.id))}
          />
          <ul className="mt-3 space-y-1 text-sm">
            {squads.map((s) => (
              <li key={s.id} className="rounded-lg bg-slate-50 px-3 py-2">
                <strong>{s.name || 'Unnamed squad'}</strong>
                <span className="text-slate-500">
                  {' '}
                  · {(s.formation_squad_members ?? []).length}/3 members
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

/** @param {{ label: string, busy: string, onClick: () => void, className?: string }} props */
function ControlButton({ label, busy, onClick, className = '' }) {
  return (
    <button
      type="button"
      disabled={Boolean(busy)}
      onClick={onClick}
      className={`rounded-lg bg-spike px-3 py-2 text-xs font-bold text-white disabled:opacity-50 ${className}`}
    >
      {busy ? 'Working…' : label}
    </button>
  );
}
