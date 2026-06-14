import { useState, useEffect } from 'react';
import { ArrowRight, Clock, Loader2, Sparkles, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { useAuth } from '../../AuthContext.jsx';
import { useCohortOnboarding } from '../../hooks/useCohortOnboarding.js';
import { waitingMessage, waitingHint, isLiveWaitingStep } from '../../lib/cohortOnboardingMessages.js';
import { isMockUserId } from '../../lib/mockAuth.js';
import {
  COHORT_NAME_EXAMPLES,
  SQUAD_MOTTO_EXAMPLES,
  SQUAD_NAME_EXAMPLES,
  completeWelcome,
  finishOnboarding,
  hasAcknowledgedWelcome,
  registerSquad,
  submitCohortSuggestion,
  submitCohortVote,
  updateSquadSetup,
  uploadSquadPhoto,
} from '../../lib/cohortOnboardingService.js';
import { ROUTES, ONBOARDING_EXIT_HREF } from '../../routes/paths.js';
import { isSupabaseConfigured } from '../../supabaseClient.js';

/**
 * Build Challenge 0 — cohort-first onboarding (Option A single route).
 * @param {{ participantId: string }} props
 */
export function CohortIdentityPage({ participantId }) {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const { loading, error, cohort, step, suggestion, squad, finalists, tally, refresh } =
    useCohortOnboarding(participantId);

  const [name, setName] = useState('');
  const [reason, setReason] = useState('');
  const [squadName, setSquadName] = useState('');
  const [squadMotto, setSquadMotto] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [welcomedOverride, setWelcomedOverride] = useState(() =>
    hasAcknowledgedWelcome(participantId),
  );

  const displayStep =
    welcomedOverride && step === 'welcome' ? 'waiting' : step;

  useEffect(() => {
    setWelcomedOverride(hasAcknowledgedWelcome(participantId));
  }, [participantId]);

  async function runAction(fn) {
    setBusy(true);
    setActionError('');
    try {
      await fn();
      await refresh();
    } catch (err) {
      const supa = err && typeof err === 'object' ? err : null;
      const msg =
        (supa && 'message' in supa && String(supa.message))
        || (err instanceof Error ? err.message : 'Something went wrong.');
      setActionError(msg);
    } finally {
      setBusy(false);
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <PageContainer>
        <section className="mx-auto max-w-xl spike-card p-8 text-center">
          <h2 className="text-xl font-bold text-slate-900">Onboarding requires Supabase</h2>
          <p className="mt-2 text-sm text-slate-600">
            Connect VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to run the founding cohort flow.
          </p>
        </section>
      </PageContainer>
    );
  }

  if (loading) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center gap-3 py-16 text-slate-600">
          <Loader2 className="animate-spin text-spike" size={32} />
          <p className="text-sm font-medium">Loading onboarding…</p>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <section className="mx-auto max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <p className="text-sm text-amber-950">{error}</p>
          <button type="button" className="mt-3 spike-btn-primary" onClick={() => refresh()}>
            Retry
          </button>
        </section>
      </PageContainer>
    );
  }

  if (displayStep === 'complete') {
    return (
      <PageContainer>
        <section className="mx-auto max-w-xl rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <Sparkles className="mx-auto mb-3 text-emerald-600" size={32} />
          <h2 className="text-xl font-bold text-emerald-950">Onboarding complete</h2>
          <p className="mt-2 text-sm text-emerald-800">
            Your founding cohort is {cohort?.official_name ?? cohort?.name}. Continue to Build Challenge 1.
          </p>
          <button
            type="button"
            className="mt-6 spike-btn-primary inline-flex items-center gap-2"
            onClick={() => navigate(ONBOARDING_EXIT_HREF, { replace: true })}
          >
            Build Your Ambition <ArrowRight size={16} />
          </button>
        </section>
      </PageContainer>
    );
  }

  const phase = cohort?.onboarding_phase ?? 'suggestions_closed';
  const squadRow = squad?.squad;
  const squadId = squad?.membership?.squad_id;

  return (
    <PageContainer wide>
      <div className="mx-auto max-w-2xl">
        <header className="mb-6">
          <p className="spike-label text-spike">Build Challenge 0</p>
          <h1 className="text-2xl font-bold text-slate-900">{stepTitle(displayStep)}</h1>
          <p className="mt-2 text-sm text-slate-600">{stepSubtitle(displayStep, phase)}</p>
        </header>

        {actionError ? (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {actionError}
          </p>
        ) : null}

        {displayStep === 'welcome' ? (
          <section className="spike-card p-8 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Welcome to SPIKE</h2>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-slate-600">
              You are joining a founding cohort. First you will name your cohort together, then form squads of
              three, then begin your Venture Blueprint with Ambition.
            </p>
            <button
              type="button"
              disabled={busy}
              className="mt-8 spike-btn-primary inline-flex items-center gap-2"
              onClick={() =>
                runAction(async () => {
                  await completeWelcome(participantId);
                  setWelcomedOverride(true);
                  await refreshUser();
                })
              }
            >
              Begin <ArrowRight size={16} />
            </button>
          </section>
        ) : null}

        {displayStep === 'suggest' ? (
          <section className="spike-card space-y-4 p-6">
            <label className="block">
              <span className="spike-label">Cohort name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Catalyst"
                className="mt-1 w-full rounded-xl border px-4 py-3 text-lg font-semibold"
              />
            </label>
            <p className="text-xs text-slate-500">Examples: {COHORT_NAME_EXAMPLES.slice(0, 5).join(', ')}</p>
            <label className="block">
              <span className="spike-label">Why this name? (optional)</span>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-xl border px-4 py-3 text-sm"
                placeholder="What does this name represent for your class?"
              />
            </label>
            <button
              type="button"
              disabled={busy || name.trim().length < 2}
              className="spike-btn-primary w-full sm:w-auto"
              onClick={() =>
                runAction(() => submitCohortSuggestion(participantId, { name, reason }))
              }
            >
              Submit suggestion
            </button>
          </section>
        ) : null}

        {displayStep === 'waiting' ? (
          <section className="spike-card p-8 text-center">
            {isLiveWaitingStep(displayStep, phase) ? (
              <Loader2 className="mx-auto mb-4 animate-spin text-spike" size={28} />
            ) : (
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-spike-muted/40">
                <Clock className="text-spike" size={28} />
              </div>
            )}
            <p className="text-lg font-semibold text-slate-900">{waitingMessage(displayStep, phase)}</p>
            <p className="mx-auto mt-3 max-w-md text-sm text-slate-500">{waitingHint(displayStep, phase)}</p>
            {isMockUserId(participantId) ? (
              <p className="mx-auto mt-4 max-w-md text-xs text-amber-800">
                Sign in with a real intern account from Supabase Auth to continue the founding cohort
                flow with your Program Coach.
              </p>
            ) : null}
            {phase === 'voting_open' && tally.length > 0 ? (
              <ul className="mx-auto mt-6 max-w-sm space-y-2 text-left text-sm">
                {tally.map((row) => (
                  <li
                    key={row.finalistId}
                    className="flex justify-between rounded-lg bg-slate-50 px-3 py-2"
                  >
                    <span className="font-medium">{row.name}</span>
                    <span className="font-bold text-spike">{row.votes}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            {suggestion?.suggested_name ? (
              <p className="mt-4 text-xs text-slate-500">
                Your suggestion: <strong>{suggestion.suggested_name}</strong>
              </p>
            ) : null}
          </section>
        ) : null}

        {displayStep === 'vote' ? (
          <section className="spike-card space-y-3 p-6">
            <p className="text-sm text-slate-600">You have one vote. Choose your favorite finalist name.</p>
            {finalists.map((f) => {
              const count = tally.find((t) => t.finalistId === f.id)?.votes ?? 0;
              return (
                <button
                  key={f.id}
                  type="button"
                  disabled={busy}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-4 text-left transition hover:border-spike hover:bg-spike-muted/40"
                  onClick={() => runAction(() => submitCohortVote(participantId, f.id))}
                >
                  <span className="text-lg font-bold text-slate-900">{f.name}</span>
                  <span className="text-sm font-semibold text-spike">{count} votes</span>
                </button>
              );
            })}
          </section>
        ) : null}

        {displayStep === 'reveal' ? (
          <section className="spike-card p-8 text-center">
            <Sparkles className="mx-auto mb-3 text-spike" size={32} />
            <p className="spike-label text-spike">Founding cohort</p>
            <h2 className="mt-2 text-4xl font-black tracking-wide text-slate-900">
              {cohort?.official_name ?? '—'}
            </h2>
            <p className="mx-auto mt-6 max-w-md text-sm text-slate-600">
              {waitingMessage('cohort-photo', phase)}
            </p>
            {cohort?.photo_url ? (
              <img
                src={cohort.photo_url}
                alt=""
                className="mx-auto mt-6 h-48 w-full max-w-sm rounded-2xl object-cover"
              />
            ) : null}
          </section>
        ) : null}

        {displayStep === 'squad-wait' ? (
          <section className="spike-card p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-spike-muted/40">
              <Users className="text-spike" size={28} />
            </div>
            <p className="text-lg font-semibold text-slate-900">{waitingMessage('squad-wait', phase)}</p>
            <p className="mx-auto mt-3 max-w-md text-sm text-slate-500">{waitingHint('squad-wait', phase)}</p>
          </section>
        ) : null}

        {displayStep === 'squad-name' && squadId ? (
          <section className="spike-card space-y-4 p-6">
            <input
              value={squadName}
              onChange={(e) => setSquadName(e.target.value)}
              placeholder="Squad name"
              className="w-full rounded-xl border px-4 py-3 text-lg font-semibold"
            />
            <p className="text-xs text-slate-500">Examples: {SQUAD_NAME_EXAMPLES.slice(0, 4).join(', ')}</p>
            <button
              type="button"
              disabled={busy || squadName.trim().length < 2}
              className="spike-btn-primary"
              onClick={() =>
                runAction(() => updateSquadSetup(squadId, { name: squadName.trim() }))
              }
            >
              Save squad name
            </button>
          </section>
        ) : null}

        {displayStep === 'squad-motto' && squadId ? (
          <section className="spike-card space-y-4 p-6">
            <input
              value={squadMotto}
              onChange={(e) => setSquadMotto(e.target.value)}
              placeholder="Squad motto"
              className="w-full rounded-xl border px-4 py-3 text-lg font-semibold"
            />
            <p className="text-xs text-slate-500">{SQUAD_MOTTO_EXAMPLES.slice(0, 3).join(' · ')}</p>
            <button
              type="button"
              disabled={busy || squadMotto.trim().length < 2}
              className="spike-btn-primary"
              onClick={() =>
                runAction(() => updateSquadSetup(squadId, { motto: squadMotto.trim() }))
              }
            >
              Save squad motto
            </button>
          </section>
        ) : null}

        {displayStep === 'squad-register' && squadId && squadRow ? (
          <section className="spike-card space-y-4 p-6 text-center">
            <h3 className="text-2xl font-bold text-slate-900">{squadRow.name}</h3>
            <p className="text-lg italic text-slate-600">{squadRow.motto}</p>
            <p className="text-sm text-slate-500">Register your squad to continue.</p>
            <button
              type="button"
              disabled={busy}
              className="spike-btn-primary"
              onClick={() => runAction(() => registerSquad(squadId))}
            >
              Register squad
            </button>
          </section>
        ) : null}

        {displayStep === 'squad-photo' && squadId ? (
          <section className="spike-card space-y-4 p-6 text-center">
            <p className="text-sm text-slate-600">Take your official squad photo.</p>
            <SquadPhotoUpload
              disabled={busy}
              onUpload={(dataUrl) =>
                runAction(async () => {
                  await uploadSquadPhoto(squadId, dataUrl);
                  await finishOnboarding(participantId, squadId);
                  await refreshUser();
                })
              }
            />
          </section>
        ) : null}
      </div>
    </PageContainer>
  );
}

/** @param {string} step */
function stepTitle(step) {
  const titles = {
    welcome: 'Welcome',
    suggest: 'Suggest a cohort name',
    waiting: 'Please wait',
    vote: 'Vote for your cohort name',
    reveal: 'Your founding cohort',
    'cohort-photo': 'Cohort photo',
    'squad-wait': 'Squad formation',
    'squad-name': 'Choose your squad name',
    'squad-motto': 'Choose your squad motto',
    'squad-register': 'Register your squad',
    'squad-photo': 'Take your squad photo',
  };
  return titles[step] ?? 'Onboarding';
}

/** @param {string} step @param {string} phase */
function stepSubtitle(step, phase) {
  if (step === 'welcome') {
    return 'You are joining a founding cohort. Name it together, then form squads of three.';
  }
  if (step === 'suggest') return 'Submit one name and an optional reason for your founding cohort.';
  if (step === 'vote') return 'Live vote counts update as your classmates vote.';
  if (step === 'reveal') return 'This name is now official for your SPIKE cohort.';
  if (step === 'squad-name') return 'Name the squad your Program Coach assigned you to.';
  return waitingMessage(step, phase);
}

/** @param {{ disabled?: boolean, onUpload: (url: string) => Promise<void> }} props */
function SquadPhotoUpload({ disabled, onUpload }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  return (
    <div>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={disabled || busy}
        className="mx-auto block text-sm"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (file.size > 2_500_000) {
            setError('Image must be under 2.5 MB.');
            return;
          }
          setBusy(true);
          setError('');
          const reader = new FileReader();
          reader.onload = async () => {
            try {
              await onUpload(String(reader.result ?? ''));
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Upload failed.');
              setBusy(false);
            }
          };
          reader.readAsDataURL(file);
          e.target.value = '';
        }}
      />
      {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
