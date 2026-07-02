import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, Loader2, Sparkles, Users } from 'lucide-react';
import {
  staffCloseSuggestions,
  staffCloseVoting,
  staffGenerateAndSaveFinalists,
  staffLoadDashboard,
  staffEnsureActiveCohort,
  staffAddInternToSquad,
  staffDeleteFormationSquad,
  staffMarkSquadsAssigned,
  staffOpenSuggestions,
  staffPublishVoting,
  staffRemoveInternFromSquad,
  staffRevealWinner,
  staffSaveFinalists,
  staffUpdateCohortStartDate,
  staffUpdateCohortProgram,
  staffUploadCohortPhoto,
} from '../../lib/cohortOnboardingService.js';
import { listProgramDefinitions } from '../../lib/programs/index.js';
import { db } from '../../lib/cohortOnboardingService.js';
import { isMockUserId } from '../../lib/mockAuth.js';
import { OnboardingPhotoCapture } from '../onboarding/OnboardingPhotoCapture.jsx';
import { isSupabaseConfigured } from '../../supabaseClient.js';
import { usePortalWriteAccess } from '../../hooks/usePortalWriteAccess.js';
import {
  DEFAULT_COHORT_START_DATE,
  resolveStaffProgramDay,
} from '../../lib/programCalendar.js';

/**
 * Program Coach / Mentor controls for cohort-first onboarding.
 * @param {{ staffId: string, interns?: Array<{ id: string, name: string }>, canAssignSquads?: boolean, photoOnly?: boolean, onSquadChanged?: () => void }} props
 */
export function CohortOnboardingControls({ staffId, interns = [], canAssignSquads = false, photoOnly = false, onSquadChanged }) {
  const { canWrite } = usePortalWriteAccess();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [editFinalists, setEditFinalists] = useState([]);
  const [newSquadName, setNewSquadName] = useState('Squad');
  const [pickInterns, setPickInterns] = useState(['', '', '']);
  const [addToSquadId, setAddToSquadId] = useState('');
  const [addInternId, setAddInternId] = useState('');
  const [startDateEdit, setStartDateEdit] = useState(DEFAULT_COHORT_START_DATE);
  const [programSlugEdit, setProgramSlugEdit] = useState('spike-internship');
  const programOptions = useMemo(() => listProgramDefinitions(), []);

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

  const cohortStartRaw = data?.cohort?.start_date?.slice?.(0, 10) ?? data?.cohort?.start_date ?? null;
  const todayProgram = useMemo(
    () => resolveStaffProgramDay(cohortStartRaw),
    [cohortStartRaw],
  );

  useEffect(() => {
    if (cohortStartRaw) setStartDateEdit(cohortStartRaw);
  }, [cohortStartRaw]);

  useEffect(() => {
    if (data?.cohort?.program_slug) setProgramSlugEdit(data.cohort.program_slug);
  }, [data?.cohort?.program_slug]);

  async function run(label, fn) {
    if (!canWrite) {
      setError('View-only account — you cannot make changes.');
      return;
    }
    setBusy(label);
    setError('');
    try {
      await fn();
      await refresh();
      if (canAssignSquads) onSquadChanged?.();
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
    const demoStaff = isMockUserId(staffId);
    return (
      <section className="spike-card space-y-3 p-5" id="cohort-onboarding-controls">
        <div>
          <p className="spike-label text-spike">Cohort onboarding</p>
          <h3 className="text-lg font-bold text-slate-900">Founding cohort controls</h3>
        </div>
        {demoStaff ? (
          <p className="text-sm text-amber-900">
            Stale demo session detected. Sign out, hard-refresh, and sign in with your real Program
            Coach Supabase account.
          </p>
        ) : (
          <p className="text-sm text-amber-900">
            No founding cohort is set up yet. Click below to create one, or run migrations{' '}
            <code className="text-xs">20260702</code> and <code className="text-xs">20260708</code>{' '}
            in Supabase SQL Editor.
          </p>
        )}
        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
        ) : null}
        {!demoStaff ? (
          <button
            type="button"
            disabled={Boolean(busy)}
            className="spike-btn-primary"
            onClick={() => run('setup', () => staffEnsureActiveCohort())}
          >
            {busy === 'setup' ? 'Setting up…' : 'Set up founding cohort'}
          </button>
        ) : null}
      </section>
    );
  }

  const { cohort, suggestions, tally, squads } = data;
  const phase = cohort.onboarding_phase;
  const assignedIds = new Set(
    squads.flatMap((s) => (s.formation_squad_members ?? []).map((m) => m.participant_id)),
  );
  const unassigned = interns.filter((i) => !assignedIds.has(i.id));
  const internNameById = new Map(interns.map((i) => [i.id, i.name]));

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

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-start gap-3">
          <CalendarDays className="mt-0.5 shrink-0 text-spike" size={20} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900">Program calendar</p>
            <p className="mt-1 text-sm text-slate-600">
              Today resolves to{' '}
              <strong>
                Week {todayProgram.week} · Day {todayProgram.day}
              </strong>
              {cohortStartRaw ? '' : ' (using default start until saved in Supabase)'}
            </p>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <label className="text-sm text-slate-700">
                <span className="mb-1 block font-medium">Week 1 · Day 1 starts</span>
                <input
                  type="date"
                  value={startDateEdit}
                  onChange={(event) => setStartDateEdit(event.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  disabled={!canWrite}
                />
              </label>
              {canWrite ? (
                <button
                  type="button"
                  disabled={Boolean(busy) || startDateEdit === (cohortStartRaw || DEFAULT_COHORT_START_DATE)}
                  className="spike-btn-secondary text-sm"
                  onClick={() => run('calendar', () => staffUpdateCohortStartDate(cohort.id, startDateEdit))}
                >
                  {busy === 'calendar' ? 'Saving…' : 'Save start date'}
                </button>
              ) : null}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Mon 2026-06-15 → Fri 2026-06-19 is Week 1 · Day 5 (Commitment).
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-sm font-semibold text-slate-900">Cohort program</p>
        <p className="mt-1 text-sm text-slate-600">
          New interns inherit this program when enrolled into the active cohort.
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="text-sm text-slate-700">
            <span className="mb-1 block font-medium">Program</span>
            <select
              value={programSlugEdit}
              onChange={(event) => setProgramSlugEdit(event.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              disabled={!canWrite}
            >
              {programOptions.map((program) => (
                <option key={program.slug} value={program.slug}>
                  {program.title}
                </option>
              ))}
            </select>
          </label>
          {canWrite ? (
            <button
              type="button"
              disabled={Boolean(busy) || programSlugEdit === (cohort.program_slug || 'spike-internship')}
              className="spike-btn-secondary text-sm"
              onClick={() => run('program', () => staffUpdateCohortProgram(cohort.id, programSlugEdit))}
            >
              {busy === 'program' ? 'Saving…' : 'Save program'}
            </button>
          ) : null}
        </div>
      </div>

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

          <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-white p-3">
            <p className="mb-2 text-xs font-semibold text-slate-700">Add intern to existing squad</p>
            <p className="mb-2 text-xs text-slate-500">
              Use this when someone re-registered (new account) or was removed from a squad. Pick the
              original squad — not a new one.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <select
                value={addToSquadId}
                onChange={(e) => setAddToSquadId(e.target.value)}
                className="rounded-lg border px-2 py-2 text-sm"
              >
                <option value="">Select squad…</option>
                {squads.map((s) => {
                  const count = (s.formation_squad_members ?? []).length;
                  return (
                    <option key={s.id} value={s.id} disabled={count >= 3}>
                      {s.name || 'Unnamed squad'} ({count}/3)
                    </option>
                  );
                })}
              </select>
              <select
                value={addInternId}
                onChange={(e) => setAddInternId(e.target.value)}
                className="rounded-lg border px-2 py-2 text-sm"
              >
                <option value="">Select unassigned intern…</option>
                {unassigned.map((i) => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
            </div>
            <ControlButton
              label="Add to squad"
              busy={busy}
              className="mt-2"
              onClick={() =>
                run('add-member', async () => {
                  if (!addToSquadId || !addInternId) {
                    throw new Error('Select a squad and an intern.');
                  }
                  await staffAddInternToSquad(addToSquadId, addInternId);
                  setAddInternId('');
                })
              }
            />
          </div>

          <ul className="mt-4 space-y-3 text-sm">
            {squads.map((s) => {
              const members = s.formation_squad_members ?? [];
              return (
                <li key={s.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <strong>{s.name || 'Unnamed squad'}</strong>
                      <span className="text-slate-500"> · {members.length}/3 members</span>
                    </div>
                    <button
                      type="button"
                      disabled={Boolean(busy)}
                      className="text-xs font-semibold text-red-700 hover:underline disabled:opacity-50"
                      onClick={() => {
                        const label = s.name || 'this squad';
                        const msg =
                          members.length > 0
                            ? `Delete "${label}"? Members will become unassigned.`
                            : `Delete empty duplicate squad "${label}"?`;
                        if (!window.confirm(msg)) return;
                        run('delete-squad', () => staffDeleteFormationSquad(s.id));
                      }}
                    >
                      Delete squad
                    </button>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {members.length ? (
                      members.map((m) => (
                        <li
                          key={m.participant_id}
                          className="flex items-center justify-between rounded-md bg-white px-2 py-1.5"
                        >
                          <span>
                            {internNameById.get(m.participant_id) ?? m.participant_id.slice(0, 8)}
                            <span className="ml-1 text-xs text-slate-500">({m.role})</span>
                          </span>
                          <button
                            type="button"
                            disabled={Boolean(busy)}
                            className="text-xs font-semibold text-slate-600 hover:text-red-700 disabled:opacity-50"
                            onClick={() =>
                              run('remove-member', () =>
                                staffRemoveInternFromSquad(s.id, m.participant_id),
                              )
                            }
                          >
                            Remove
                          </button>
                        </li>
                      ))
                    ) : (
                      <li className="text-xs text-slate-500">No members — safe to delete if duplicate.</li>
                    )}
                  </ul>
                </li>
              );
            })}
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
