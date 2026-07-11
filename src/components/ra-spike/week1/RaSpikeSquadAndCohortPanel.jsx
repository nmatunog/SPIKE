import { useCallback, useEffect, useState } from 'react';
import { Check, Loader2, Users } from 'lucide-react';
import {
  fetchRaSpikeSquadSelfState,
  isRaSpikeSquadSelfComplete,
  raSpikeCreateSquad,
  raSpikeJoinSquad,
  raSpikeLeaveSquad,
  raSpikeNominateCohortName,
  raSpikeRenameSquad,
} from '../../../lib/raSpikeSquadSelfService.js';

const INPUT =
  'w-full rounded-2xl border border-slate-200/90 bg-white px-4 py-3 text-base leading-relaxed text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-spike focus:ring-4 focus:ring-spike/10';

/**
 * Rookie self-service: form/join/name squad + nominate cohort name.
 * @param {{
 *   participantId: string,
 *   internProgress?: object | null,
 *   locked?: boolean,
 *   onComplete: () => void | Promise<void>,
 * }} props
 */
export function RaSpikeSquadAndCohortPanel({
  participantId,
  internProgress,
  locked = false,
  onComplete,
}) {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [newSquadName, setNewSquadName] = useState('');
  const [renameValue, setRenameValue] = useState('');
  const [cohortName, setCohortName] = useState('');
  const [joinId, setJoinId] = useState('');

  const reload = useCallback(async () => {
    if (!participantId) return;
    const next = await fetchRaSpikeSquadSelfState(participantId, internProgress);
    setState(next);
    setRenameValue(next.squadName ?? '');
    setCohortName(next.cohortSuggestion ?? '');
  }, [participantId, internProgress]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    reload()
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load squads.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reload]);

  async function run(key, fn) {
    setBusy(key);
    setError('');
    try {
      await fn();
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy('');
    }
  }

  if (loading || !state) {
    return (
      <p className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
        <Loader2 size={18} className="animate-spin text-spike" /> Loading squads…
      </p>
    );
  }

  const complete = isRaSpikeSquadSelfComplete(state);
  const openToJoin = state.openSquads.filter((s) => s.open);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-spike">Squad &amp; cohort</p>
        <h3 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">Form your squad</h3>
        <p className="mt-1 text-sm text-slate-600">
          Create or join a squad, name it, then nominate a name for your cohort
          {state.cohortLabel ? ` (${state.cohortLabel})` : ''}.
        </p>
      </div>

      {error ? (
        <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
        <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <Users size={16} className="text-spike" aria-hidden />
          Your squad
        </p>

        {state.squadId ? (
          <div className="space-y-3">
            <p className="text-base font-semibold text-slate-900">
              {state.squadName}
              <span className="ml-2 text-xs font-medium text-slate-500">
                ({state.role} · {state.memberCount}/3)
              </span>
            </p>
            {state.isLeader ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  className={INPUT}
                  placeholder="Squad name"
                />
                <button
                  type="button"
                  disabled={Boolean(busy) || renameValue.trim().length < 2}
                  onClick={() =>
                    void run('rename', () => raSpikeRenameSquad(participantId, state.squadId, renameValue))
                  }
                  className="rounded-xl bg-spike px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
                >
                  {busy === 'rename' ? 'Saving…' : 'Save name'}
                </button>
              </div>
            ) : null}
            <button
              type="button"
              disabled={Boolean(busy)}
              onClick={() => {
                if (!window.confirm('Leave this squad?')) return;
                void run('leave', () => raSpikeLeaveSquad(participantId));
              }}
              className="text-xs font-semibold text-slate-600 hover:text-red-700"
            >
              Leave squad
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-800">Create a new squad</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={newSquadName}
                  onChange={(e) => setNewSquadName(e.target.value)}
                  className={INPUT}
                  placeholder="e.g. Orion, Phoenix, Horizon"
                />
                <button
                  type="button"
                  disabled={Boolean(busy) || newSquadName.trim().length < 2}
                  onClick={() =>
                    void run('create', async () => {
                      await raSpikeCreateSquad(participantId, newSquadName);
                      setNewSquadName('');
                    })
                  }
                  className="shrink-0 rounded-xl bg-spike px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
                >
                  {busy === 'create' ? 'Creating…' : 'Create & join'}
                </button>
              </div>
            </div>

            {openToJoin.length > 0 ? (
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-800">Or join an open squad</p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <select
                    value={joinId}
                    onChange={(e) => setJoinId(e.target.value)}
                    className={INPUT}
                  >
                    <option value="">Select squad…</option>
                    {openToJoin.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.memberCount}/{s.capacity})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={Boolean(busy) || !joinId}
                    onClick={() =>
                      void run('join', async () => {
                        await raSpikeJoinSquad(participantId, joinId);
                        setJoinId('');
                      })
                    }
                    className="shrink-0 rounded-xl border border-spike/30 bg-white px-4 py-3 text-sm font-bold text-spike disabled:opacity-60"
                  >
                    {busy === 'join' ? 'Joining…' : 'Join squad'}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">No open squads yet — create one and invite teammates.</p>
            )}
          </div>
        )}
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-sm font-bold text-slate-900">Nominate a cohort name</p>
        <p className="text-xs text-slate-600">
          Suggest a name for your whole RA-SPIKE cohort. Coaches review nominations.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={cohortName}
            onChange={(e) => setCohortName(e.target.value)}
            className={INPUT}
            placeholder="e.g. Rising Advisors · July 2026"
          />
          <button
            type="button"
            disabled={Boolean(busy) || cohortName.trim().length < 2}
            onClick={() =>
              void run('nominate', () => raSpikeNominateCohortName(participantId, cohortName))
            }
            className="shrink-0 rounded-xl bg-spike px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {busy === 'nominate' ? 'Saving…' : state.cohortSuggestion ? 'Update nomination' : 'Nominate'}
          </button>
        </div>
        {state.cohortSuggestion ? (
          <p className="text-sm text-emerald-800">
            <Check size={14} className="mr-1 inline" /> Your nomination: <strong>{state.cohortSuggestion}</strong>
          </p>
        ) : null}
        {state.peerSuggestions.length > 0 ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Peer nominations</p>
            <ul className="mt-1 flex flex-wrap gap-1.5">
              {state.peerSuggestions.slice(0, 8).map((p) => (
                <li
                  key={p.name}
                  className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                >
                  {p.name}
                  {p.count > 1 ? ` · ${p.count}` : ''}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <button
        type="button"
        disabled={!complete || Boolean(busy)}
        onClick={() => void onComplete()}
        className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-spike px-5 py-3 text-base font-bold text-white disabled:opacity-50"
      >
        {complete ? (
          <>
            <Check size={18} /> Squad &amp; cohort done
          </>
        ) : (
          'Join a squad and nominate a cohort name to continue'
        )}
      </button>
    </div>
  );
}
