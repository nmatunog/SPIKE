import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, ChevronLeft, ChevronRight, Loader2, Lock, Upload } from 'lucide-react';
import { PageContainer } from '../../layout/PageContainer.jsx';
import { RaSpikeShell } from '../RaSpikeShell.jsx';
import { getRaSpikeWeekContent } from '../../../lib/raSpikeContentLoader.js';
import {
  WEEK1_CARD_ORDER,
  WEEK1_REFLECTION_PROMPTS,
  canSubmitWeek1Portfolio,
  emptyWeek1Portfolio,
  fetchWeek1Portfolio,
  isDreamBuilderComplete,
  isReflectionComplete,
  isVisionBlueprintComplete,
  isWeek1CardComplete,
  readImageAsDataUrl,
  saveWeek1Portfolio,
  submitWeek1Portfolio,
} from '../../../lib/raSpikeWeek1Portfolio.js';
import { setRaSpikeStepStatus } from '../../../lib/raSpikeWeekProgress.js';
import { ROUTES, raSpikePlaybookStepHref } from '../../../routes/paths.js';
import { useAuth } from '../../../AuthContext.jsx';

const STEPS = ['learn', 'workshop', 'reflection', 'assignment', 'portfolio'];
const INPUT =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-900 outline-none focus:border-spike focus:ring-2 focus:ring-spike/20';
const LABEL = 'mb-1 block text-sm font-semibold text-slate-800';

/**
 * @param {{ user?: { id?: string, internProgress?: object | null }, stepId?: string }} props
 */
export function RaSpikeWeek1Experience({ user, stepId = 'learn' }) {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const participantId = user?.id ?? '';
  const weekContent = getRaSpikeWeekContent(1);
  const activeStep = STEPS.includes(stepId) ? stepId : 'learn';

  const [portfolio, setPortfolio] = useState(emptyWeek1Portfolio);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [savedFlash, setSavedFlash] = useState(false);
  const [cardIndex, setCardIndex] = useState(0);
  const [dreamStep, setDreamStep] = useState(0);
  const [discover, setDiscover] = useState({ why_here: '', future_want: '', advisor_become: '' });

  const reload = useCallback(async () => {
    if (!participantId) return;
    const row = await fetchWeek1Portfolio(participantId);
    setPortfolio(row);
    const d = row.cardsCompleted?.discover_answers;
    if (d && typeof d === 'object') setDiscover({
      why_here: d.why_here ?? '',
      future_want: d.future_want ?? '',
      advisor_become: d.advisor_become ?? '',
    });
  }, [participantId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    reload()
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load Week 1.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reload]);

  async function autosave(patch) {
    if (!participantId || portfolio.locked) return;
    setError('');
    try {
      const next = await saveWeek1Portfolio(participantId, patch);
      setPortfolio(next);
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.');
    }
  }

  async function completeCard(cardId, extraPatch = {}) {
    if (!participantId || portfolio.locked) return;
    setBusy(true);
    try {
      const cardsCompleted = {
        ...portfolio.cardsCompleted,
        ...extraPatch.cardsCompleted,
        [cardId]: true,
      };
      const next = await saveWeek1Portfolio(participantId, { ...extraPatch, cardsCompleted });
      setPortfolio(next);
      if (cardId === 'welcome' || cardId === 'discover' || cardId === 'dream_builder' || cardId === 'squad' || cardId === 'reflection') {
        const allCards = WEEK1_CARD_ORDER.every((id) => next.cardsCompleted?.[id]);
        if (allCards) await setRaSpikeStepStatus(participantId, 1, 'learn', 'complete');
      }
      if (cardId === 'reflection') {
        await setRaSpikeStepStatus(participantId, 1, 'reflection', 'complete', {
          reflectionNotes: [
            next.reflectionAnswers?.inspired,
            next.reflectionAnswers?.fears,
            next.reflectionAnswers?.excites,
          ].filter(Boolean).join('\n\n'),
        });
      }
      if (cardId === 'dream_builder' && isDreamBuilderComplete(next) && isVisionBlueprintComplete(next)) {
        await setRaSpikeStepStatus(participantId, 1, 'assignment', 'complete');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update.');
    } finally {
      setBusy(false);
    }
  }

  const locked = Boolean(portfolio.locked);

  return (
    <RaSpikeShell user={user}>
      <PageContainer>
        <div className="mx-auto max-w-xl space-y-4">
          <header className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-spike">Week 1 · Discover</p>
            <h1 className="text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">
              {weekContent.title}
            </h1>
            <p className="text-sm text-slate-600 sm:text-base">{weekContent.theme}</p>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500">
              {savedFlash ? <span className="font-medium text-emerald-700">Saved</span> : null}
              {locked ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
                  <Lock size={12} /> Submitted
                </span>
              ) : null}
            </div>
          </header>

          <nav className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1" aria-label="Week 1 steps">
            {STEPS.map((id) => {
              const step = weekContent.steps?.[id];
              const active = id === activeStep;
              return (
                <Link
                  key={id}
                  to={raSpikePlaybookStepHref(id, 1)}
                  className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold sm:text-sm ${
                    active ? 'bg-white text-spike shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {step?.label ?? id}
                </Link>
              );
            })}
          </nav>

          {error ? (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}

          {loading ? (
            <p className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 size={16} className="animate-spin" /> Loading…
            </p>
          ) : activeStep === 'learn' ? (
            <LearnPanel
              portfolio={portfolio}
              discover={discover}
              setDiscover={setDiscover}
              cardIndex={cardIndex}
              setCardIndex={setCardIndex}
              dreamStep={dreamStep}
              setDreamStep={setDreamStep}
              locked={locked}
              busy={busy}
              onAutosave={autosave}
              onCompleteCard={completeCard}
            />
          ) : activeStep === 'workshop' ? (
            <WorkshopPanel
              participantId={participantId}
              locked={locked}
              onDone={async () => {
                await setRaSpikeStepStatus(participantId, 1, 'workshop', 'complete');
                navigate(raSpikePlaybookStepHref('reflection', 1));
              }}
            />
          ) : activeStep === 'reflection' ? (
            <ReflectionPanel
              portfolio={portfolio}
              locked={locked}
              busy={busy}
              onAutosave={autosave}
              onComplete={async () => {
                await completeCard('reflection');
                navigate(raSpikePlaybookStepHref('assignment', 1));
              }}
            />
          ) : activeStep === 'assignment' ? (
            <AssignmentPanel
              portfolio={portfolio}
              locked={locked}
              onAutosave={autosave}
              onContinue={() => navigate(raSpikePlaybookStepHref('portfolio', 1))}
            />
          ) : (
            <PortfolioPanel
              portfolio={portfolio}
              busy={busy}
              onSubmit={async () => {
                setBusy(true);
                setError('');
                try {
                  const next = await submitWeek1Portfolio(participantId);
                  setPortfolio(next);
                  await setRaSpikeStepStatus(participantId, 1, 'portfolio', 'complete');
                  await refreshUser?.();
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Submit failed.');
                } finally {
                  setBusy(false);
                }
              }}
            />
          )}
        </div>
      </PageContainer>
    </RaSpikeShell>
  );
}

function LearnPanel({
  portfolio,
  discover,
  setDiscover,
  cardIndex,
  setCardIndex,
  dreamStep,
  setDreamStep,
  locked,
  busy,
  onAutosave,
  onCompleteCard,
}) {
  const cards = WEEK1_CARD_ORDER;
  const cardId = cards[Math.min(cardIndex, cards.length - 1)];

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-500">
        <span>Card {cardIndex + 1} of {cards.length}</span>
        <div className="flex gap-1">
          {cards.map((id, i) => (
            <span
              key={id}
              className={`h-1.5 w-5 rounded-full ${i <= cardIndex || isWeek1CardComplete(portfolio, id) ? 'bg-spike' : 'bg-slate-200'}`}
            />
          ))}
        </div>
      </div>

      {cardId === 'welcome' ? (
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">Welcome to RA-SPIKE</h2>
          <ul className="space-y-2 text-sm leading-relaxed text-slate-700 sm:text-base">
            <li>An 8-week journey to build your business and master advising.</li>
            <li>We start with <strong>you</strong> — not product training.</li>
            <li>Mindset: Employee → Self-employed → Financial entrepreneur.</li>
            <li>Path: Discover (Weeks 1–4) → Advise (Weeks 5–8).</li>
          </ul>
          {!isWeek1CardComplete(portfolio, 'welcome') && !locked ? (
            <PrimaryButton disabled={busy} onClick={async () => {
              await onCompleteCard('welcome');
              setCardIndex(1);
            }}>
              Mark complete
            </PrimaryButton>
          ) : (
            <PrimaryButton onClick={() => setCardIndex(1)}>Next</PrimaryButton>
          )}
        </div>
      ) : null}

      {cardId === 'discover' ? (
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">Discover Yourself</h2>
          {[
            { id: 'why_here', label: 'Why am I here?' },
            { id: 'future_want', label: 'What kind of future do I want?' },
            { id: 'advisor_become', label: 'What kind of advisor do I want to become?' },
          ].map((p) => (
            <label key={p.id} className="block">
              <span className={LABEL}>{p.label}</span>
              <textarea
                rows={3}
                disabled={locked}
                className={INPUT}
                value={discover[p.id]}
                onChange={(e) => {
                  const next = { ...discover, [p.id]: e.target.value };
                  setDiscover(next);
                }}
                onBlur={() => onAutosave({
                  cardsCompleted: {
                    ...portfolio.cardsCompleted,
                    discover_answers: discover,
                  },
                })}
              />
            </label>
          ))}
          <div className="flex gap-2">
            <SecondaryButton onClick={() => setCardIndex(0)}>Back</SecondaryButton>
            <PrimaryButton
              disabled={locked || busy || !discover.why_here.trim() || !discover.future_want.trim() || !discover.advisor_become.trim()}
              onClick={async () => {
                await onCompleteCard('discover', {
                  cardsCompleted: {
                    ...portfolio.cardsCompleted,
                    discover_answers: discover,
                    discover: true,
                  },
                });
                setCardIndex(2);
                setDreamStep(0);
              }}
            >
              Next
            </PrimaryButton>
          </div>
        </div>
      ) : null}

      {cardId === 'dream_builder' ? (
        <DreamBuilder
          portfolio={portfolio}
          locked={locked}
          step={dreamStep}
          setStep={setDreamStep}
          onAutosave={onAutosave}
          onBack={() => setCardIndex(1)}
          onDone={async () => {
            await onCompleteCard('dream_builder');
            setCardIndex(3);
          }}
        />
      ) : null}

      {cardId === 'squad' ? (
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">Squad Formation</h2>
          <p className="text-sm text-slate-600">
            Your coach assigns accountability squads in class. View teammates on the Squad page — no chat, no scoring.
          </p>
          <Link to={ROUTES.raSpikeSquad} className="inline-flex text-sm font-semibold text-spike hover:underline">
            Open Squad
          </Link>
          <div className="flex gap-2">
            <SecondaryButton onClick={() => setCardIndex(2)}>Back</SecondaryButton>
            <PrimaryButton
              disabled={locked || busy}
              onClick={async () => {
                await onCompleteCard('squad');
                setCardIndex(4);
              }}
            >
              Mark complete
            </PrimaryButton>
          </div>
        </div>
      ) : null}

      {cardId === 'reflection' ? (
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">Reflection</h2>
          <p className="text-sm text-slate-600">You can also finish this under the Reflection step.</p>
          <div className="flex gap-2">
            <SecondaryButton onClick={() => setCardIndex(3)}>Back</SecondaryButton>
            <PrimaryButton onClick={() => setCardIndex(0)}>Back to start</PrimaryButton>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function DreamBuilder({ portfolio, locked, step, setStep, onAutosave, onBack, onDone }) {
  const screens = [
    {
      key: 'lifestyle',
      title: 'What lifestyle do you want to live in the next 5–10 years?',
      helper: 'Describe your ideal daily life, family, work-life balance, home, hobbies, and the freedom you want.',
      field: 'lifestyleAnswer',
    },
    {
      key: 'income',
      title: 'What monthly income do you want to achieve within the next 5–10 years?',
      helper: 'Enter your target in Philippine pesos.',
      field: 'incomePhp',
    },
    {
      key: 'travel',
      title: 'Which places do you dream of traveling to?',
      helper: 'List countries, cities, or destinations you hope to visit with family or loved ones.',
      field: 'travelAnswer',
    },
    {
      key: 'images',
      title: 'Add three vision images',
      helper: 'One image each for lifestyle, income/success, and destination.',
    },
  ];
  const screen = screens[step];

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-slate-500">Question {step + 1} of 4</p>
      <h2 className="text-xl font-bold leading-snug text-slate-900">{screen.title}</h2>
      <p className="text-sm text-slate-600">{screen.helper}</p>

      {screen.key === 'lifestyle' ? (
        <textarea
          rows={5}
          disabled={locked}
          className={INPUT}
          defaultValue={portfolio.lifestyleAnswer}
          onBlur={(e) => onAutosave({ lifestyleAnswer: e.target.value })}
        />
      ) : null}

      {screen.key === 'income' ? (
        <div className="space-y-3">
          <label className="block">
            <span className={LABEL}>Monthly income (PHP)</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-slate-500">₱</span>
              <input
                type="number"
                min="0"
                step="1000"
                disabled={locked}
                className={INPUT}
                placeholder="300000"
                defaultValue={portfolio.incomePhp ?? ''}
                onBlur={(e) => onAutosave({
                  incomePhp: e.target.value === '' ? null : Number(e.target.value),
                })}
              />
            </div>
          </label>
          <label className="block">
            <span className={LABEL}>Notes (optional)</span>
            <input
              disabled={locked}
              className={INPUT}
              defaultValue={portfolio.incomeNotes}
              onBlur={(e) => onAutosave({ incomeNotes: e.target.value })}
            />
          </label>
          {portfolio.incomePhp ? (
            <p className="rounded-xl bg-spike-muted/40 px-3 py-2 text-sm text-slate-800">
              Great goal! Throughout RA-SPIKE, you&apos;ll build a business plan to determine how many
              clients, appointments, and policies you&apos;ll need to reach this income target.
            </p>
          ) : null}
        </div>
      ) : null}

      {screen.key === 'travel' ? (
        <textarea
          rows={4}
          disabled={locked}
          className={INPUT}
          defaultValue={portfolio.travelAnswer}
          onBlur={(e) => onAutosave({ travelAnswer: e.target.value })}
        />
      ) : null}

      {screen.key === 'images' ? (
        <div className="grid gap-3">
          {[
            { key: 'lifestyleImageUrl', label: 'My Dream Lifestyle' },
            { key: 'incomeImageUrl', label: 'My Income or Success Vision' },
            { key: 'destinationImageUrl', label: 'My Dream Destination' },
          ].map((slot) => (
            <ImageSlot
              key={slot.key}
              label={slot.label}
              url={portfolio[slot.key]}
              locked={locked}
              onPick={async (file) => {
                const url = await readImageAsDataUrl(file);
                await onAutosave({ [slot.key]: url });
              }}
            />
          ))}
        </div>
      ) : null}

      <div className="flex gap-2 pt-1">
        <SecondaryButton onClick={() => (step === 0 ? onBack() : setStep(step - 1))}>
          <ChevronLeft size={16} /> Back
        </SecondaryButton>
        {step < 3 ? (
          <PrimaryButton onClick={() => setStep(step + 1)}>
            Next <ChevronRight size={16} />
          </PrimaryButton>
        ) : (
          <PrimaryButton
            disabled={locked || !isDreamBuilderComplete(portfolio)}
            onClick={onDone}
          >
            Mark Dream Builder complete
          </PrimaryButton>
        )}
      </div>
    </div>
  );
}

function ImageSlot({ label, url, locked, onPick }) {
  const [err, setErr] = useState('');
  return (
    <label className="block rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
      <span className="mb-2 block text-sm font-semibold text-slate-800">{label}</span>
      {url ? (
        <img src={url} alt={label} className="mb-2 h-28 w-full rounded-lg object-cover" />
      ) : (
        <div className="mb-2 flex h-28 items-center justify-center rounded-lg bg-white text-slate-400">
          <Upload size={20} />
        </div>
      )}
      {!locked ? (
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="block w-full text-xs text-slate-600"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setErr('');
            try {
              await onPick(file);
            } catch (ex) {
              setErr(ex instanceof Error ? ex.message : 'Upload failed.');
            }
          }}
        />
      ) : null}
      {err ? <p className="mt-1 text-xs text-red-600">{err}</p> : null}
    </label>
  );
}

function WorkshopPanel({ participantId, locked, onDone }) {
  const [busy, setBusy] = useState(false);
  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <h2 className="text-xl font-bold text-slate-900">Classroom workshop</h2>
      <p className="text-sm text-slate-600">
        Attend the 3-hour session with your coach. Mark complete when class ends.
      </p>
      <PrimaryButton
        disabled={locked || busy || !participantId}
        onClick={async () => {
          setBusy(true);
          try {
            await onDone();
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
        Mark workshop complete
      </PrimaryButton>
    </section>
  );
}

function ReflectionPanel({ portfolio, locked, busy, onAutosave, onComplete }) {
  const answers = portfolio.reflectionAnswers ?? {};
  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <h2 className="text-xl font-bold text-slate-900">Reflection journal</h2>
      {WEEK1_REFLECTION_PROMPTS.map((p) => (
        <label key={p.id} className="block">
          <span className={LABEL}>{p.label}</span>
          <textarea
            rows={3}
            disabled={locked}
            className={INPUT}
            value={answers[p.id] ?? ''}
            onChange={(e) => onAutosave({
              reflectionAnswers: { ...answers, [p.id]: e.target.value },
            })}
          />
        </label>
      ))}
      <PrimaryButton
        disabled={locked || busy || !isReflectionComplete(portfolio)}
        onClick={onComplete}
      >
        Save &amp; continue
      </PrimaryButton>
    </section>
  );
}

function AssignmentPanel({ portfolio, locked, onAutosave, onContinue }) {
  const goals = portfolio.blueprintGoals ?? ['', '', ''];
  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Vision &amp; Success Blueprint</h2>
        <p className="mt-1 text-sm text-slate-600">
          Finalize your Dream Board above, then complete this one-page vision package.
        </p>
      </div>

      <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
        Dream Builder: {isDreamBuilderComplete(portfolio) ? 'Complete' : 'Finish in Learn → Dream Builder'}
      </div>

      <label className="block">
        <span className={LABEL}>Personal Vision Statement</span>
        <p className="mb-1 text-xs text-slate-500">Why you choose this profession and the future you want to create.</p>
        <textarea
          rows={5}
          disabled={locked}
          className={INPUT}
          value={portfolio.personalVision}
          onChange={(e) => onAutosave({ personalVision: e.target.value })}
        />
      </label>

      <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
        <h3 className="text-sm font-bold text-slate-900">My Success Blueprint</h3>
        <label className="block">
          <span className={LABEL}>My why</span>
          <textarea rows={2} disabled={locked} className={INPUT} value={portfolio.blueprintWhy} onChange={(e) => onAutosave({ blueprintWhy: e.target.value })} />
        </label>
        {[0, 1, 2].map((i) => (
          <label key={i} className="block">
            <span className={LABEL}>3-year goal {i + 1}</span>
            <input
              disabled={locked}
              className={INPUT}
              value={goals[i] ?? ''}
              onChange={(e) => {
                const next = [...goals];
                next[i] = e.target.value;
                onAutosave({ blueprintGoals: next });
              }}
            />
          </label>
        ))}
        <label className="block">
          <span className={LABEL}>Expected monthly income target</span>
          <input disabled={locked} className={INPUT} value={portfolio.blueprintIncomeTarget} onChange={(e) => onAutosave({ blueprintIncomeTarget: e.target.value })} placeholder="₱300,000" />
        </label>
        <label className="block">
          <span className={LABEL}>People I want to impact</span>
          <textarea rows={2} disabled={locked} className={INPUT} value={portfolio.blueprintPeopleToImpact} onChange={(e) => onAutosave({ blueprintPeopleToImpact: e.target.value })} />
        </label>
        <label className="block">
          <span className={LABEL}>My commitment to complete RA-SPIKE</span>
          <textarea rows={2} disabled={locked} className={INPUT} value={portfolio.blueprintCommitment} onChange={(e) => onAutosave({ blueprintCommitment: e.target.value })} />
        </label>
      </div>

      <PrimaryButton
        disabled={!isDreamBuilderComplete(portfolio) || !isVisionBlueprintComplete(portfolio)}
        onClick={onContinue}
      >
        Continue to Portfolio
      </PrimaryButton>
    </section>
  );
}

function PortfolioPanel({ portfolio, busy, onSubmit }) {
  const ready = canSubmitWeek1Portfolio(portfolio);
  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <h2 className="text-xl font-bold text-slate-900">Week 1 portfolio</h2>
      <p className="text-sm text-slate-600">Review and submit. Editing locks after submit.</p>

      <Artifact title="Dream Board">
        <p className="text-sm text-slate-700"><strong>Lifestyle:</strong> {portfolio.lifestyleAnswer || '—'}</p>
        <p className="mt-1 text-sm text-slate-700">
          <strong>Income:</strong>{' '}
          {portfolio.incomePhp != null ? `₱${Number(portfolio.incomePhp).toLocaleString('en-PH')}` : '—'}
        </p>
        <p className="mt-1 text-sm text-slate-700"><strong>Travel:</strong> {portfolio.travelAnswer || '—'}</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {[portfolio.lifestyleImageUrl, portfolio.incomeImageUrl, portfolio.destinationImageUrl].map((url, i) => (
            url ? <img key={i} src={url} alt="" className="h-20 w-full rounded-lg object-cover" /> : (
              <div key={i} className="flex h-20 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">No image</div>
            )
          ))}
        </div>
      </Artifact>

      <Artifact title="Personal Vision & Success Blueprint">
        <p className="whitespace-pre-wrap text-sm text-slate-700">{portfolio.personalVision || '—'}</p>
        <div className="mt-2 space-y-1 text-sm text-slate-700">
          <p><strong>Why:</strong> {portfolio.blueprintWhy || '—'}</p>
          <p><strong>Goals:</strong> {(portfolio.blueprintGoals || []).filter(Boolean).join(' · ') || '—'}</p>
          <p><strong>Income:</strong> {portfolio.blueprintIncomeTarget || '—'}</p>
          <p><strong>Impact:</strong> {portfolio.blueprintPeopleToImpact || '—'}</p>
          <p><strong>Commitment:</strong> {portfolio.blueprintCommitment || '—'}</p>
        </div>
      </Artifact>

      <Artifact title="Reflection Journal">
        {WEEK1_REFLECTION_PROMPTS.map((p) => (
          <p key={p.id} className="mt-1 text-sm text-slate-700">
            <strong>{p.label}</strong> {portfolio.reflectionAnswers?.[p.id] || '—'}
          </p>
        ))}
      </Artifact>

      {portfolio.locked ? (
        <p className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
          <Lock size={16} /> Submitted — waiting for coach review
        </p>
      ) : (
        <PrimaryButton disabled={!ready || busy} onClick={onSubmit}>
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          Submit &amp; lock portfolio
        </PrimaryButton>
      )}
      {!ready && !portfolio.locked ? (
        <p className="text-xs text-slate-500">
          Complete all lesson cards, Dream Builder, Vision &amp; Blueprint, and Reflection first.
        </p>
      ) : null}
    </section>
  );
}

function Artifact({ title, children }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function PrimaryButton({ children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-spike px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-[48px] items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
