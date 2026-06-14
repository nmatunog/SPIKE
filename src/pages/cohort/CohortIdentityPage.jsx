import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, Sparkles, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import {
  COHORT_NAME_EXAMPLES,
  SQUAD_MOTTO_EXAMPLES,
  SQUAD_NAME_EXAMPLES,
  castCohortVote,
  createFormingSquad,
  finalizeCohortFromVotes,
  getBuildChallenge0Step,
  getCohortVoteProgress,
  getCohortVoteTally,
  getOfficialCohort,
  getParticipantSquad,
  hasCompletedBuildChallenge0,
  joinFormingSquad,
  listOpenSquads,
  submitSquadCohortProposal,
  updateSquadProfile,
} from '../../lib/cohortFormationService.js';
import { ROUTES } from '../../routes/paths.js';

const STEP_ORDER = ['join', 'squad-name', 'squad-motto', 'cohort-name', 'vote', 'reveal'];

const STEP_LABELS = {
  join: 'Join Squad',
  'squad-name': 'Squad Name',
  'squad-motto': 'Squad Motto',
  'cohort-name': 'Cohort Name',
  vote: 'Vote',
  reveal: 'Reveal',
};

/**
 * Build Challenge 0 — squad first, then cohort name per squad, then live vote.
 * @param {{ participantId: string }} props
 */
export function CohortIdentityPage({ participantId }) {
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((n) => n + 1), []);
  // tick drives re-read from localStorage-backed service
  void tick;

  const step = getBuildChallenge0Step(participantId);
  const squad = getParticipantSquad(participantId);
  const progress = getCohortVoteProgress();
  const tally = getCohortVoteTally();
  const official = getOfficialCohort();
  const stepIndex = STEP_ORDER.indexOf(step);

  useEffect(() => {
    if (step !== 'reveal' && step !== 'vote') return undefined;
    const id = setInterval(() => refresh(), 2500);
    return () => clearInterval(id);
  }, [step, refresh]);

  useEffect(() => {
    if (progress.allVoted && !official) {
      finalizeCohortFromVotes();
      refresh();
    }
  }, [progress.allVoted, official, refresh]);

  if (hasCompletedBuildChallenge0(participantId) && progress.allVoted) {
    const winner = tally[0];
    return (
      <PageContainer>
        <section className="mx-auto max-w-xl rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <Sparkles className="mx-auto mb-3 text-emerald-600" size={32} />
          <h2 className="text-xl font-bold text-emerald-950">Build Challenge 0 complete</h2>
          <p className="mt-2 text-sm text-emerald-800">
            {official
              ? `Your founding cohort is ${official.name}.`
              : 'Votes are in — your program coach will confirm the official cohort name.'}
          </p>
          {winner ? (
            <p className="mt-3 text-2xl font-black tracking-wide text-spike">{winner.cohortName}</p>
          ) : null}
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link to={ROUTES.ventureBlueprint} className="spike-btn-primary">
              Continue to Build Studio <ArrowRight size={16} />
            </Link>
            {squad ? (
              <Link to={ROUTES.squad} className="spike-btn-secondary">
                Squad dashboard
              </Link>
            ) : null}
          </div>
        </section>
      </PageContainer>
    );
  }

  return (
    <PageContainer wide>
      <div className="mx-auto max-w-2xl">
        <header className="mb-6">
          <p className="spike-label text-spike">Build Challenge 0</p>
          <h1 className="text-2xl font-bold text-slate-900">Form your squad, then name your cohort</h1>
          <p className="mt-2 text-sm text-slate-600">
            Join or create a squad, name it together, then propose one cohort name for the whole founding
            class.
          </p>
        </header>

        <div className="mb-6 flex gap-1">
          {STEP_ORDER.map((id, idx) => (
            <div key={id} className="flex-1 text-center">
              <div
                className={`mx-auto mb-1 h-1.5 rounded-full ${idx <= stepIndex ? 'bg-spike' : 'bg-slate-200'}`}
              />
              <span className="text-2xs font-semibold uppercase tracking-wide text-slate-500">
                {STEP_LABELS[id]}
              </span>
            </div>
          ))}
        </div>

        {step === 'join' ? (
          <JoinSquadStep
            participantId={participantId}
            onCreate={() => {
              createFormingSquad(participantId);
              refresh();
            }}
            onJoin={(squadId) => {
              joinFormingSquad(squadId, participantId);
              refresh();
            }}
          />
        ) : null}

        {step === 'squad-name' && squad ? (
          <BuilderStep
            stepLabel="Step 2 of 6"
            title="Choose Squad Name"
            question="What will your research squad be called?"
            value={squad.name ?? ''}
            examples={SQUAD_NAME_EXAMPLES}
            onSave={(value) => {
              updateSquadProfile(squad.id, { name: value });
              refresh();
            }}
          />
        ) : null}

        {step === 'squad-motto' && squad ? (
          <BuilderStep
            stepLabel="Step 3 of 6"
            title="Choose Squad Motto"
            question="What phrase will guide your squad this week?"
            value={squad.motto ?? ''}
            examples={SQUAD_MOTTO_EXAMPLES}
            onSave={(value) => {
              updateSquadProfile(squad.id, { motto: value });
              refresh();
            }}
          />
        ) : null}

        {step === 'cohort-name' && squad ? (
          <BuilderStep
            stepLabel="Step 4 of 6"
            title="Represent Your Squad"
            promptLabel="Prompt"
            question="Every Squad will propose one name that represents the identity and aspirations of this founding cohort."
            value={squad.cohortNameProposal?.suggested_name ?? ''}
            examples={COHORT_NAME_EXAMPLES}
            onSave={(value) => {
              submitSquadCohortProposal(squad.id, participantId, value);
              refresh();
            }}
            hint={`One entry for ${squad.name || 'your squad'} — the first submission locks your squad's proposal.`}
          />
        ) : null}

        {step === 'vote' ? (
          <VoteStep
            participantId={participantId}
            tally={tally}
            progress={progress}
            onVote={(squadId) => {
              castCohortVote(participantId, squadId);
              refresh();
            }}
          />
        ) : null}

        {step === 'reveal' ? (
          <RevealStep tally={tally} progress={progress} official={official} />
        ) : null}
      </div>
    </PageContainer>
  );
}

/** @param {{ participantId: string, onCreate: () => void, onJoin: (id: string) => void }} props */
function JoinSquadStep({ participantId, onCreate, onJoin }) {
  const openSquads = listOpenSquads().filter(
    (s) => !s.members?.some((m) => m.participantId === participantId),
  );
  const [error, setError] = useState('');

  function tryAction(fn) {
    setError('');
    try {
      fn();
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    }
  }

  return (
    <section className="spike-card space-y-4">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Step 1 of 6</p>
      <h2 className="text-xl font-semibold text-slate-900">Join or create your squad</h2>
      <p className="text-slate-600">
        Form your research squad before proposing a cohort name. Squads hold up to 6 members.
      </p>
      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      <button type="button" onClick={() => tryAction(onCreate)} className="spike-btn-primary w-full">
        <Users size={18} className="mr-2 inline" />
        Create a new squad
      </button>
      {openSquads.length ? (
        <div className="space-y-2">
          <p className="spike-label">Open squads</p>
          {openSquads.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => tryAction(() => onJoin(s.id))}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-spike"
            >
              <span className="font-semibold text-slate-900">{s.name?.trim() || 'New squad forming…'}</span>
              <span className="text-xs text-slate-500">
                {s.members?.length ?? 0}/{s.capacity ?? 6} members
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">No open squads yet — create one and invite others to join.</p>
      )}
    </section>
  );
}

/**
 * @param {{
 *   stepLabel: string,
 *   title: string,
 *   promptLabel?: string,
 *   question: string,
 *   value: string,
 *   examples: string[],
 *   onSave: (value: string) => void,
 *   hint?: string,
 * }} props
 */
function BuilderStep({ stepLabel, title, promptLabel, question, value, examples, onSave, hint }) {
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState('');

  function handleSave() {
    setError('');
    try {
      onSave(draft);
    } catch (err) {
      setError(err.message || 'Could not save.');
    }
  }

  return (
    <section className="spike-card space-y-4">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{stepLabel}</p>
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      {promptLabel ? (
        <div>
          <p className="spike-label text-slate-500">{promptLabel}</p>
          <p className="mt-1 text-slate-700">{question}</p>
        </div>
      ) : (
        <p className="text-slate-600">{question}</p>
      )}
      {hint ? <p className="text-xs text-amber-800">{hint}</p> : null}
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-lg font-semibold focus:border-spike focus:outline-none focus:ring-2 focus:ring-spike/20"
        placeholder="Your answer…"
      />
      <div className="flex flex-wrap gap-2">
        {examples.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => setDraft(ex)}
            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-spike hover:text-spike"
          >
            {ex}
          </button>
        ))}
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button
        type="button"
        disabled={draft.trim().length < 2}
        onClick={handleSave}
        className="spike-btn-primary disabled:opacity-50"
      >
        Save & continue
      </button>
    </section>
  );
}

/** @param {{ participantId: string, tally: Array<object>, progress: object, onVote: (squadId: string) => void }} props */
function VoteStep({ tally, progress, onVote }) {
  const [error, setError] = useState('');

  if (!tally.length) {
    return (
      <section className="spike-card">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Step 5 of 6</p>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">Waiting for squad proposals</h2>
        <p className="mt-2 text-sm text-slate-600">
          Each squad must submit one cohort name before voting opens ({progress.voted}/{progress.total}{' '}
          ready).
        </p>
      </section>
    );
  }

  return (
    <section className="spike-card space-y-4">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Step 5 of 6</p>
      <h2 className="text-xl font-semibold text-slate-900">Vote for your founding cohort name</h2>
      <p className="text-sm text-slate-600">
        Pick the proposal that best represents this class. {progress.voted}/{progress.total} have voted.
      </p>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <div className="space-y-2">
        {tally.map((row) => (
          <button
            key={row.squadId}
            type="button"
            onClick={() => {
              setError('');
              try {
                onVote(row.squadId);
              } catch (err) {
                setError(err.message || 'Vote failed.');
              }
            }}
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-4 text-left transition hover:border-spike hover:bg-spike-muted/30"
          >
            <div>
              <p className="text-lg font-bold text-slate-900">{row.cohortName}</p>
              <p className="text-xs text-slate-500">Proposed by {row.squadName}</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
              {row.votes} votes
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

/** @param {{ tally: Array<object>, progress: object, official: object | null }} props */
function RevealStep({ tally, progress, official }) {
  const leader = tally[0];
  return (
    <section className="spike-card space-y-4">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Step 6 of 6</p>
      <h2 className="text-xl font-semibold text-slate-900">Cohort reveal</h2>
      <p className="text-sm text-slate-600">
        {progress.allVoted
          ? 'Everyone has voted — here are the live results.'
          : `Waiting for remaining votes (${progress.voted}/${progress.total})…`}
      </p>
      <ul className="space-y-2">
        {tally.map((row, idx) => (
          <li
            key={row.squadId}
            className={`flex items-center justify-between rounded-xl px-4 py-3 ${
              idx === 0 && progress.allVoted ? 'bg-spike-muted ring-2 ring-spike/30' : 'bg-slate-50'
            }`}
          >
            <div>
              <p className="font-bold text-slate-900">{row.cohortName}</p>
              <p className="text-xs text-slate-500">{row.squadName}</p>
            </div>
            <span className="text-lg font-black text-spike">{row.votes}</span>
          </li>
        ))}
      </ul>
      {progress.allVoted && leader ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">Winning cohort name</p>
          <p className="mt-2 text-3xl font-black text-spike">{official?.name ?? leader.cohortName}</p>
        </div>
      ) : null}
    </section>
  );
}
