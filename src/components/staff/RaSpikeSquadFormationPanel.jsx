import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, Users } from 'lucide-react';
import {
  addSquadMember,
  createFormationSquad,
  deleteFormationSquad,
  fetchFormationSquads,
  removeSquadMember,
  updateFormationSquad,
} from '../../lib/supabase/cohortOnboarding.js';
import { fetchRaSpikeBatchesForStaff } from '../../lib/staffRaSpikeBatchService.js';
import { filterRaSpikeInterns } from '../../lib/raSpikeStaffGateService.js';
import { usePortalWriteAccess } from '../../hooks/usePortalWriteAccess.js';

const INPUT =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-spike focus:ring-2 focus:ring-spike/20';

/**
 * Coach tools — form and name RA-SPIKE squads for the active cohort.
 * @param {{
 *   interns: Array<object>,
 *   showToast?: (msg: string) => void,
 *   onChanged?: () => void,
 * }} props
 */
export function RaSpikeSquadFormationPanel({ interns, showToast, onChanged }) {
  const { canWrite } = usePortalWriteAccess();
  const rookies = useMemo(() => filterRaSpikeInterns(interns), [interns]);
  const [activeCohortId, setActiveCohortId] = useState(/** @type {number | null} */ (null));
  const [cohortLabel, setCohortLabel] = useState('');
  const [squads, setSquads] = useState(/** @type {Array<object>} */ ([]));
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [newSquadName, setNewSquadName] = useState('');
  const [pickIds, setPickIds] = useState(/** @type {string[]} */ (['', '', '']));
  const [renameId, setRenameId] = useState(/** @type {string | null} */ (null));
  const [renameValue, setRenameValue] = useState('');
  const [addSquadId, setAddSquadId] = useState('');
  const [addRookieId, setAddRookieId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const batches = await fetchRaSpikeBatchesForStaff();
      const active = batches.find((b) => b.is_active) ?? batches[0] ?? null;
      if (!active) {
        setActiveCohortId(null);
        setCohortLabel('');
        setSquads([]);
        return;
      }
      setActiveCohortId(active.id);
      setCohortLabel(active.official_name || active.batch_label || active.name || `Batch ${active.id}`);
      setSquads(await fetchFormationSquads(active.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load squads.');
      setSquads([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const assignedIds = useMemo(() => {
    const ids = new Set();
    for (const squad of squads) {
      for (const member of squad.formation_squad_members ?? []) {
        if (member.participant_id) ids.add(member.participant_id);
      }
    }
    return ids;
  }, [squads]);

  const unassigned = useMemo(
    () => rookies.filter((r) => !assignedIds.has(r.id)),
    [rookies, assignedIds],
  );

  const nameById = useMemo(() => {
    /** @type {Map<string, string>} */
    const map = new Map();
    for (const r of rookies) map.set(r.id, r.name || r.email || r.id.slice(0, 8));
    return map;
  }, [rookies]);

  async function run(key, fn) {
    if (!canWrite) {
      showToast?.('Read-only viewer — cannot edit squads.');
      return;
    }
    setBusy(key);
    setError('');
    try {
      await fn();
      await load();
      onChanged?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Squad update failed.';
      setError(message);
      showToast?.(message);
    } finally {
      setBusy('');
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-spike">Squads</p>
        <h2 className="mt-1 text-lg font-bold text-slate-900">Form &amp; name squads</h2>
        <p className="mt-1 text-sm text-slate-600">
          {cohortLabel
            ? `Active cohort: ${cohortLabel}. Create squads (up to 3 rookies each) and assign members.`
            : 'Create an active RA-SPIKE batch first, then form squads here.'}
        </p>
      </div>

      <div className="space-y-4 px-4 py-4 sm:px-5">
        {error ? (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        ) : null}

        {loading ? (
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 size={16} className="animate-spin" /> Loading squads…
          </p>
        ) : !activeCohortId ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-600">
            No active cohort. Use Enrollment above to create or activate a batch.
          </p>
        ) : (
          <>
            {canWrite ? (
              <div className="rounded-2xl border border-spike/20 bg-spike-muted/20 p-4">
                <p className="text-sm font-semibold text-slate-900">Create squad</p>
                <label className="mt-3 block text-sm">
                  <span className="mb-1 block font-medium text-slate-700">Squad name</span>
                  <input
                    value={newSquadName}
                    onChange={(e) => setNewSquadName(e.target.value)}
                    className={INPUT}
                    placeholder="e.g. Orion, Phoenix, Horizon"
                  />
                </label>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {[0, 1, 2].map((slot) => (
                    <label key={slot} className="block text-sm">
                      <span className="mb-1 block font-medium text-slate-700">
                        Member {slot + 1}{slot === 0 ? ' (leader)' : ''}
                      </span>
                      <select
                        value={pickIds[slot]}
                        onChange={(e) => {
                          const next = [...pickIds];
                          next[slot] = e.target.value;
                          setPickIds(next);
                        }}
                        className={INPUT}
                      >
                        <option value="">Unassigned…</option>
                        {unassigned.map((r) => (
                          <option
                            key={r.id}
                            value={r.id}
                            disabled={pickIds.some((id, i) => i !== slot && id === r.id)}
                          >
                            {r.name || r.email}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
                <button
                  type="button"
                  disabled={Boolean(busy) || !newSquadName.trim()}
                  onClick={() =>
                    void run('create', async () => {
                      const ids = pickIds.filter(Boolean);
                      await createFormationSquad(activeCohortId, newSquadName.trim(), ids);
                      setNewSquadName('');
                      setPickIds(['', '', '']);
                      showToast?.(`Squad created${ids.length ? ` with ${ids.length} member${ids.length === 1 ? '' : 's'}` : ''}.`);
                    })
                  }
                  className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-spike px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                >
                  {busy === 'create' ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  Create squad
                </button>
                {unassigned.length === 0 && rookies.length > 0 ? (
                  <p className="mt-2 text-xs text-slate-500">All enrolled rookies are already in a squad.</p>
                ) : null}
                {rookies.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-500">No rookies enrolled yet — share the batch invite code.</p>
                ) : null}
              </div>
            ) : null}

            {canWrite && unassigned.length > 0 && squads.length > 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Add rookie to existing squad</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <select value={addSquadId} onChange={(e) => setAddSquadId(e.target.value)} className={INPUT}>
                    <option value="">Select squad…</option>
                    {squads.map((s) => {
                      const count = (s.formation_squad_members ?? []).length;
                      return (
                        <option key={s.id} value={s.id} disabled={count >= 3}>
                          {s.name || 'Unnamed'} ({count}/3)
                        </option>
                      );
                    })}
                  </select>
                  <select value={addRookieId} onChange={(e) => setAddRookieId(e.target.value)} className={INPUT}>
                    <option value="">Select rookie…</option>
                    {unassigned.map((r) => (
                      <option key={r.id} value={r.id}>{r.name || r.email}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  disabled={Boolean(busy) || !addSquadId || !addRookieId}
                  onClick={() =>
                    void run('add', async () => {
                      await addSquadMember(addSquadId, addRookieId);
                      setAddRookieId('');
                      showToast?.('Rookie added to squad.');
                    })
                  }
                  className="mt-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 disabled:opacity-60"
                >
                  Add to squad
                </button>
              </div>
            ) : null}

            <ul className="space-y-3">
              {squads.length === 0 ? (
                <li className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-600">
                  No squads yet. Create one and assign rookies.
                </li>
              ) : (
                squads.map((squad) => {
                  const members = squad.formation_squad_members ?? [];
                  const editing = renameId === squad.id;
                  return (
                    <li key={squad.id} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          {editing ? (
                            <div className="flex flex-wrap gap-2">
                              <input
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                className={`${INPUT} max-w-xs`}
                              />
                              <button
                                type="button"
                                disabled={Boolean(busy) || !renameValue.trim()}
                                onClick={() =>
                                  void run(`rename-${squad.id}`, async () => {
                                    await updateFormationSquad(squad.id, { name: renameValue.trim() });
                                    setRenameId(null);
                                    showToast?.('Squad renamed.');
                                  })
                                }
                                className="rounded-xl bg-spike px-3 py-2 text-xs font-bold text-white"
                              >
                                Save name
                              </button>
                              <button
                                type="button"
                                onClick={() => setRenameId(null)}
                                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <>
                              <p className="flex items-center gap-2 font-bold text-slate-900">
                                <Users size={16} className="text-spike" aria-hidden />
                                {squad.name || 'Unnamed squad'}
                              </p>
                              <p className="mt-0.5 text-xs text-slate-500">{members.length}/3 members</p>
                            </>
                          )}
                        </div>
                        {canWrite && !editing ? (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setRenameId(squad.id);
                                setRenameValue(squad.name || '');
                              }}
                              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-800"
                            >
                              Rename
                            </button>
                            <button
                              type="button"
                              disabled={Boolean(busy)}
                              onClick={() => {
                                if (!window.confirm(`Delete squad "${squad.name || 'Unnamed'}"? Members become unassigned.`)) return;
                                void run(`del-${squad.id}`, async () => {
                                  await deleteFormationSquad(squad.id);
                                  showToast?.('Squad deleted.');
                                });
                              }}
                              className="rounded-xl border border-red-100 px-3 py-1.5 text-xs font-bold text-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        ) : null}
                      </div>
                      <ul className="mt-3 space-y-1.5">
                        {members.length === 0 ? (
                          <li className="text-xs text-slate-500">No members yet.</li>
                        ) : (
                          members.map((m) => (
                            <li
                              key={m.participant_id}
                              className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                            >
                              <span>
                                {nameById.get(m.participant_id) ?? m.participant_id.slice(0, 8)}
                                <span className="ml-1 text-xs text-slate-500">({m.role})</span>
                              </span>
                              {canWrite ? (
                                <button
                                  type="button"
                                  disabled={Boolean(busy)}
                                  onClick={() =>
                                    void run(`rm-${m.participant_id}`, async () => {
                                      await removeSquadMember(squad.id, m.participant_id);
                                      showToast?.('Rookie removed from squad.');
                                    })
                                  }
                                  className="text-xs font-semibold text-slate-600 hover:text-red-700"
                                >
                                  Remove
                                </button>
                              ) : null}
                            </li>
                          ))
                        )}
                      </ul>
                    </li>
                  );
                })
              )}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
