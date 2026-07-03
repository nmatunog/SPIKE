import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Compass,
  ImagePlus,
  Loader2,
  Lock,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';
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

const STEPS = [
  { id: 'learn', label: 'Learn', short: '1' },
  { id: 'workshop', label: 'Workshop', short: '2' },
  { id: 'reflection', label: 'Reflect', short: '3' },
  { id: 'assignment', label: 'Vision', short: '4' },
  { id: 'portfolio', label: 'Portfolio', short: '5' },
];

const INPUT =
  'w-full rounded-2xl border border-slate-200/90 bg-white px-4 py-3 text-base leading-relaxed text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-spike focus:ring-4 focus:ring-spike/10';
const LABEL = 'mb-1.5 block text-sm font-semibold tracking-tight text-slate-800';

/**
 * @param {{ user?: { id?: string, internProgress?: object | null }, stepId?: string }} props
 */
export function RaSpikeWeek1Experience({ user, stepId = 'learn' }) {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const participantId = user?.id ?? '';
  const weekContent = getRaSpikeWeekContent(1);
  const activeStep = STEPS.some((s) => s.id === stepId) ? stepId : 'learn';

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
    if (d && typeof d === 'object') {
      setDiscover({
        why_here: d.why_here ?? '',
        future_want: d.future_want ?? '',
        advisor_become: d.advisor_become ?? '',
      });
    }
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

  const progressPct = useMemo(() => {
    const cardsDone = WEEK1_CARD_ORDER.filter((id) => isWeek1CardComplete(portfolio, id)).length;
    const parts = [
      cardsDone / WEEK1_CARD_ORDER.length,
      isDreamBuilderComplete(portfolio) ? 1 : 0,
      isVisionBlueprintComplete(portfolio) ? 1 : 0,
      isReflectionComplete(portfolio) ? 1 : 0,
      portfolio.submittedAt ? 1 : 0,
    ];
    return Math.round((parts.reduce((a, b) => a + b, 0) / parts.length) * 100);
  }, [portfolio]);

  async function autosave(patch) {
    if (!participantId || portfolio.locked) return;
    setError('');
    try {
      const next = await saveWeek1Portfolio(participantId, patch);
      setPortfolio(next);
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 1400);
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
      const allCards = WEEK1_CARD_ORDER.every((id) => next.cardsCompleted?.[id]);
      if (allCards) await setRaSpikeStepStatus(participantId, 1, 'learn', 'complete');
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
        <div className="mx-auto max-w-lg space-y-4 pb-6">
          <header className="overflow-hidden rounded-3xl bg-gradient-to-br from-spike via-spike-dark to-slate-900 p-5 text-white shadow-lg shadow-spike/20 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-red-100/90">
                  Week 1 · Discover
                </p>
                <h1 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
                  {weekContent.title}
                </h1>
                <p className="text-sm leading-snug text-red-50/90 sm:text-base">
                  {weekContent.theme}
                </p>
              </div>
              <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-white/15 text-center backdrop-blur">
                <span className="text-lg font-bold leading-none">{progressPct}%</span>
                <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-100">done</span>
              </div>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-red-100">
              {savedFlash ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 px-2 py-0.5 font-semibold text-emerald-100">
                  <Check size={12} /> Saved
                </span>
              ) : (
                <span>Autosaves as you go</span>
              )}
              {locked ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 font-semibold">
                  <Lock size={12} /> Submitted
                </span>
              ) : null}
            </div>
          </header>

          <nav
            className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-sm"
            aria-label="Week 1 steps"
          >
            {STEPS.map((step, index) => {
              const active = step.id === activeStep;
              return (
                <Link
                  key={step.id}
                  to={raSpikePlaybookStepHref(step.id, 1)}
                  className={`flex min-w-[4.25rem] flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-center transition ${
                    active
                      ? 'bg-spike text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className={`text-[10px] font-bold ${active ? 'text-red-100' : 'text-slate-400'}`}>
                    {index + 1}
                  </span>
                  <span className="text-[11px] font-bold leading-tight sm:text-xs">{step.label}</span>
                </Link>
              );
            })}
          </nav>

          {error ? (
            <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          {loading ? (
            <Panel>
              <p className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
                <Loader2 size={18} className="animate-spin text-spike" /> Loading your Week 1…
              </p>
            </Panel>
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
    <Panel>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-spike">Learn</p>
          <p className="text-sm font-semibold text-slate-700">
            Card {cardIndex + 1} of {cards.length}
          </p>
        </div>
        <div className="flex gap-1.5">
          {cards.map((id, i) => {
            const done = isWeek1CardComplete(portfolio, id);
            const current = i === cardIndex;
            return (
              <button
                key={id}
                type="button"
                aria-label={`Card ${i + 1}`}
                onClick={() => setCardIndex(i)}
                className={`h-2.5 w-2.5 rounded-full transition ${
                  done ? 'bg-emerald-500' : current ? 'bg-spike scale-125' : 'bg-slate-200'
                }`}
              />
            );
          })}
        </div>
      </div>

      {cardId === 'welcome' ? (
        <div className="space-y-4">
          <SectionTitle
            icon={Sparkles}
            title="Welcome to RA-SPIKE"
            subtitle="Your 8-week journey starts with you."
          />
          <div className="grid gap-2.5">
            {[
              { icon: Compass, title: 'Start with you', body: 'Not product training — identity first.' },
              { icon: Target, title: 'Think like an owner', body: 'Employee → entrepreneur mindset.' },
              { icon: BookOpen, title: 'Discover → Advise', body: 'Weeks 1–4 build. Weeks 5–8 advise.' },
            ].map((item) => {
              const ItemIcon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex gap-3 rounded-2xl border border-spike/10 bg-gradient-to-r from-spike-muted/50 to-white px-3.5 py-3"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-spike text-white">
                    <ItemIcon size={18} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900">{item.title}</p>
                    <p className="text-sm text-slate-600">{item.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <ActionRow>
            {!isWeek1CardComplete(portfolio, 'welcome') && !locked ? (
              <PrimaryButton
                disabled={busy}
                onClick={async () => {
                  await onCompleteCard('welcome');
                  setCardIndex(1);
                }}
              >
                I&apos;m ready — let&apos;s begin
              </PrimaryButton>
            ) : (
              <PrimaryButton onClick={() => setCardIndex(1)}>
                Continue <ChevronRight size={18} />
              </PrimaryButton>
            )}
          </ActionRow>
        </div>
      ) : null}

      {cardId === 'discover' ? (
        <div className="space-y-4">
          <SectionTitle
            icon={Compass}
            title="Discover Yourself"
            subtitle="Three questions. Honest answers. No wrong ones."
          />
          {[
            { id: 'why_here', label: 'Why am I here?', hint: 'What brought you to this profession?' },
            { id: 'future_want', label: 'What kind of future do I want?', hint: 'Paint the life you are building toward.' },
            { id: 'advisor_become', label: 'What kind of advisor do I want to become?', hint: 'How do you want clients to describe you?' },
          ].map((p) => (
            <label key={p.id} className="block">
              <span className={LABEL}>{p.label}</span>
              <span className="mb-1.5 block text-xs text-slate-500">{p.hint}</span>
              <textarea
                rows={3}
                disabled={locked}
                className={INPUT}
                placeholder="Write freely…"
                value={discover[p.id]}
                onChange={(e) => setDiscover({ ...discover, [p.id]: e.target.value })}
                onBlur={() => onAutosave({
                  cardsCompleted: {
                    ...portfolio.cardsCompleted,
                    discover_answers: discover,
                  },
                })}
              />
            </label>
          ))}
          <ActionRow>
            <SecondaryButton onClick={() => setCardIndex(0)}>
              <ChevronLeft size={16} /> Back
            </SecondaryButton>
            <PrimaryButton
              disabled={
                locked
                || busy
                || !discover.why_here.trim()
                || !discover.future_want.trim()
                || !discover.advisor_become.trim()
              }
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
              Next <ChevronRight size={18} />
            </PrimaryButton>
          </ActionRow>
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
        <div className="space-y-4">
          <SectionTitle
            icon={Users}
            title="Squad Formation"
            subtitle="You are not building alone."
          />
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm leading-relaxed text-slate-700">
            Your coach forms accountability squads in class. Open Squad to see your teammates —
            view only, no chat or scoring.
          </div>
          <Link
            to={ROUTES.raSpikeSquad}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-spike/20 bg-spike-muted/40 px-4 py-2 text-sm font-bold text-spike"
          >
            <Users size={16} /> View my squad
          </Link>
          <ActionRow>
            <SecondaryButton onClick={() => setCardIndex(2)}>
              <ChevronLeft size={16} /> Back
            </SecondaryButton>
            <PrimaryButton
              disabled={locked || busy}
              onClick={async () => {
                await onCompleteCard('squad');
                setCardIndex(4);
              }}
            >
              Mark complete
            </PrimaryButton>
          </ActionRow>
        </div>
      ) : null}

      {cardId === 'reflection' ? (
        <div className="space-y-4">
          <SectionTitle
            icon={BookOpen}
            title="Reflection is next"
            subtitle="Capture what moved you today in the Reflect step."
          />
          <ActionRow>
            <SecondaryButton onClick={() => setCardIndex(3)}>
              <ChevronLeft size={16} /> Back
            </SecondaryButton>
            <PrimaryButton onClick={() => setCardIndex(0)}>Review from start</PrimaryButton>
          </ActionRow>
        </div>
      ) : null}
    </Panel>
  );
}

function DreamBuilder({ portfolio, locked, step, setStep, onAutosave, onBack, onDone }) {
  const [incomeDraft, setIncomeDraft] = useState(
    portfolio.incomePhp != null ? String(portfolio.incomePhp) : '',
  );

  const screens = [
    {
      key: 'lifestyle',
      title: 'What lifestyle do you want in 5–10 years?',
      helper: 'Daily life, family, balance, home, hobbies, and freedom.',
    },
    {
      key: 'income',
      title: 'What monthly income do you want in 5–10 years?',
      helper: 'Be specific. This becomes your business target.',
    },
    {
      key: 'travel',
      title: 'Where do you dream of traveling?',
      helper: 'Countries, cities, or places with people you love.',
    },
    {
      key: 'images',
      title: 'Three pictures of your future',
      helper: 'Lifestyle · Success · Destination',
    },
  ];
  const screen = screens[step];

  return (
    <div className="space-y-4">
      <SectionTitle
        icon={Sparkles}
        title="Dream Builder"
        subtitle={`Question ${step + 1} of 4 · about 15 minutes`}
      />
      <div className="flex gap-1.5">
        {screens.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-spike' : 'bg-slate-200'}`}
          />
        ))}
      </div>
      <h3 className="text-lg font-bold leading-snug text-slate-900 sm:text-xl">{screen.title}</h3>
      <p className="text-sm text-slate-600">{screen.helper}</p>

      {screen.key === 'lifestyle' ? (
        <textarea
          rows={5}
          disabled={locked}
          className={INPUT}
          placeholder="In 5–10 years, my days look like…"
          defaultValue={portfolio.lifestyleAnswer}
          onBlur={(e) => onAutosave({ lifestyleAnswer: e.target.value })}
        />
      ) : null}

      {screen.key === 'income' ? (
        <div className="space-y-3">
          <label className="block">
            <span className={LABEL}>Monthly income (PHP)</span>
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm focus-within:border-spike focus-within:ring-4 focus-within:ring-spike/10">
              <span className="text-xl font-bold text-spike">₱</span>
              <input
                type="number"
                min="0"
                step="1000"
                disabled={locked}
                className="w-full border-0 bg-transparent py-2 text-lg font-semibold text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400"
                placeholder="300,000"
                value={incomeDraft}
                onChange={(e) => setIncomeDraft(e.target.value)}
                onBlur={() => onAutosave({
                  incomePhp: incomeDraft === '' ? null : Number(incomeDraft),
                })}
              />
            </div>
          </label>
          <label className="block">
            <span className={LABEL}>Notes (optional)</span>
            <input
              disabled={locked}
              className={INPUT}
              placeholder="What does this income make possible?"
              defaultValue={portfolio.incomeNotes}
              onBlur={(e) => onAutosave({ incomeNotes: e.target.value })}
            />
          </label>
          {(incomeDraft || portfolio.incomePhp) ? (
            <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-orange-50 px-4 py-3 text-sm leading-relaxed text-amber-950">
              <p className="font-bold text-amber-900">Great goal.</p>
              <p className="mt-1">
                Throughout RA-SPIKE, you&apos;ll build a business plan to determine how many clients,
                appointments, and policies you&apos;ll need to reach this income target.
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      {screen.key === 'travel' ? (
        <textarea
          rows={4}
          disabled={locked}
          className={INPUT}
          placeholder="Japan in spring, Italy with family…"
          defaultValue={portfolio.travelAnswer}
          onBlur={(e) => onAutosave({ travelAnswer: e.target.value })}
        />
      ) : null}

      {screen.key === 'images' ? (
        <div className="grid gap-3">
          {[
            { key: 'lifestyleImageUrl', label: 'Dream Lifestyle', hint: 'Home, family, freedom' },
            { key: 'incomeImageUrl', label: 'Income / Success', hint: 'What success looks like' },
            { key: 'destinationImageUrl', label: 'Dream Destination', hint: 'Where you will go' },
          ].map((slot) => (
            <ImageSlot
              key={slot.key}
              label={slot.label}
              hint={slot.hint}
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

      <ActionRow>
        <SecondaryButton onClick={() => (step === 0 ? onBack() : setStep(step - 1))}>
          <ChevronLeft size={16} /> Back
        </SecondaryButton>
        {step < 3 ? (
          <PrimaryButton onClick={() => setStep(step + 1)}>
            Next <ChevronRight size={18} />
          </PrimaryButton>
        ) : (
          <PrimaryButton
            disabled={locked || !isDreamBuilderComplete(portfolio)}
            onClick={onDone}
          >
            <Check size={18} /> Dream Board done
          </PrimaryButton>
        )}
      </ActionRow>
    </div>
  );
}

function ImageSlot({ label, hint, url, locked, onPick }) {
  const [err, setErr] = useState('');
  return (
    <label className="group block cursor-pointer overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 transition hover:border-spike/40 hover:bg-spike-muted/20">
      <div className="flex items-center justify-between gap-2 px-3.5 pt-3">
        <div>
          <p className="text-sm font-bold text-slate-900">{label}</p>
          <p className="text-xs text-slate-500">{hint}</p>
        </div>
        {url ? (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-800">
            Added
          </span>
        ) : null}
      </div>
      {url ? (
        <img src={url} alt={label} className="mt-2 h-32 w-full object-cover" />
      ) : (
        <div className="mt-2 flex h-32 flex-col items-center justify-center gap-1 text-slate-400">
          <ImagePlus size={22} className="text-spike/70" />
          <span className="text-xs font-semibold">Tap to upload</span>
          <span className="text-[10px]">JPG, PNG, WEBP · max 5 MB</span>
        </div>
      )}
      {!locked ? (
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
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
      {err ? <p className="px-3.5 py-2 text-xs text-red-600">{err}</p> : null}
      {url && !locked ? (
        <p className="px-3.5 py-2 text-center text-xs font-semibold text-spike">Tap to replace</p>
      ) : null}
    </label>
  );
}

function WorkshopPanel({ participantId, locked, onDone }) {
  const [busy, setBusy] = useState(false);
  return (
    <Panel>
      <SectionTitle
        icon={Users}
        title="Classroom workshop"
        subtitle="3 hours with your coach and squad."
      />
      <div className="rounded-2xl bg-gradient-to-br from-spike-muted/60 to-white px-4 py-4 text-sm leading-relaxed text-slate-700">
        Be present. Participate. When class ends, mark this complete so you can finish Reflection
        and your portfolio.
      </div>
      <ActionRow>
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
          {busy ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
          I attended — mark complete
        </PrimaryButton>
      </ActionRow>
    </Panel>
  );
}

function ReflectionPanel({ portfolio, locked, busy, onAutosave, onComplete }) {
  const answers = portfolio.reflectionAnswers ?? {};
  return (
    <Panel>
      <SectionTitle
        icon={BookOpen}
        title="Reflection journal"
        subtitle="Three prompts. Capture the day while it is fresh."
      />
      {WEEK1_REFLECTION_PROMPTS.map((p, i) => (
        <label key={p.id} className="mt-4 block first:mt-0">
          <span className={LABEL}>
            <span className="mr-1.5 text-spike">{i + 1}.</span>
            {p.label}
          </span>
          <textarea
            rows={3}
            disabled={locked}
            className={INPUT}
            placeholder="Write a few honest sentences…"
            value={answers[p.id] ?? ''}
            onChange={(e) => onAutosave({
              reflectionAnswers: { ...answers, [p.id]: e.target.value },
            })}
          />
        </label>
      ))}
      <ActionRow className="mt-4">
        <PrimaryButton
          disabled={locked || busy || !isReflectionComplete(portfolio)}
          onClick={onComplete}
        >
          Save &amp; continue to Vision
        </PrimaryButton>
      </ActionRow>
    </Panel>
  );
}

function AssignmentPanel({ portfolio, locked, onAutosave, onContinue }) {
  const goals = portfolio.blueprintGoals ?? ['', '', ''];
  const dreamReady = isDreamBuilderComplete(portfolio);
  const visionReady = isVisionBlueprintComplete(portfolio);

  return (
    <Panel>
      <SectionTitle
        icon={Target}
        title="Vision & Success Blueprint"
        subtitle="Your first portfolio cornerstone."
      />

      <div
        className={`flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-sm font-semibold ${
          dreamReady
            ? 'bg-emerald-50 text-emerald-900'
            : 'bg-amber-50 text-amber-950'
        }`}
      >
        {dreamReady ? <Check size={16} /> : <Sparkles size={16} />}
        {dreamReady ? 'Dream Board ready' : 'Finish Dream Builder in Learn first'}
      </div>

      <label className="mt-4 block">
        <span className={LABEL}>Personal Vision Statement</span>
        <span className="mb-1.5 block text-xs text-slate-500">
          Why you choose this profession and the future you want to create.
        </span>
        <textarea
          rows={4}
          disabled={locked}
          className={INPUT}
          placeholder="I choose financial advising because…"
          value={portfolio.personalVision}
          onChange={(e) => onAutosave({ personalVision: e.target.value })}
        />
      </label>

      <div className="mt-4 space-y-3 rounded-2xl border border-spike/10 bg-gradient-to-b from-spike-muted/30 to-white p-4">
        <p className="text-sm font-bold text-slate-900">My Success Blueprint</p>
        <Field
          label="My why"
          locked={locked}
          value={portfolio.blueprintWhy}
          onChange={(v) => onAutosave({ blueprintWhy: v })}
          rows={2}
        />
        {[0, 1, 2].map((i) => (
          <Field
            key={i}
            label={`3-year goal ${i + 1}`}
            locked={locked}
            value={goals[i] ?? ''}
            onChange={(v) => {
              const next = [...goals];
              next[i] = v;
              onAutosave({ blueprintGoals: next });
            }}
          />
        ))}
        <Field
          label="Monthly income target"
          locked={locked}
          value={portfolio.blueprintIncomeTarget}
          onChange={(v) => onAutosave({ blueprintIncomeTarget: v })}
          placeholder="₱300,000"
        />
        <Field
          label="People I want to impact"
          locked={locked}
          value={portfolio.blueprintPeopleToImpact}
          onChange={(v) => onAutosave({ blueprintPeopleToImpact: v })}
          rows={2}
        />
        <Field
          label="My commitment to finish RA-SPIKE"
          locked={locked}
          value={portfolio.blueprintCommitment}
          onChange={(v) => onAutosave({ blueprintCommitment: v })}
          rows={2}
        />
      </div>

      <ActionRow className="mt-4">
        <PrimaryButton disabled={!dreamReady || !visionReady} onClick={onContinue}>
          Review portfolio <ChevronRight size={18} />
        </PrimaryButton>
      </ActionRow>
    </Panel>
  );
}

function PortfolioPanel({ portfolio, busy, onSubmit }) {
  const ready = canSubmitWeek1Portfolio(portfolio);
  return (
    <Panel>
      <SectionTitle
        icon={Sparkles}
        title="Your Week 1 portfolio"
        subtitle="Review once. Submit locks editing."
      />

      <Artifact
        eyebrow="Artifact 1"
        title="Dream Board"
        ready={isDreamBuilderComplete(portfolio)}
      >
        <p className="text-sm leading-relaxed text-slate-700">
          <span className="font-semibold text-slate-900">Lifestyle. </span>
          {portfolio.lifestyleAnswer || '—'}
        </p>
        <p className="mt-2 text-sm text-slate-700">
          <span className="font-semibold text-slate-900">Income. </span>
          {portfolio.incomePhp != null
            ? `₱${Number(portfolio.incomePhp).toLocaleString('en-PH')} / month`
            : '—'}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          <span className="font-semibold text-slate-900">Travel. </span>
          {portfolio.travelAnswer || '—'}
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[portfolio.lifestyleImageUrl, portfolio.incomeImageUrl, portfolio.destinationImageUrl].map((url, i) => (
            url ? (
              <img key={i} src={url} alt="" className="aspect-square w-full rounded-xl object-cover shadow-sm" />
            ) : (
              <div key={i} className="flex aspect-square items-center justify-center rounded-xl bg-slate-100 text-[10px] font-semibold text-slate-400">
                Missing
              </div>
            )
          ))}
        </div>
      </Artifact>

      <Artifact
        eyebrow="Artifact 2"
        title="Vision & Success Blueprint"
        ready={isVisionBlueprintComplete(portfolio)}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
          {portfolio.personalVision || '—'}
        </p>
        <dl className="mt-3 space-y-1.5 text-sm text-slate-700">
          <div><dt className="inline font-semibold text-slate-900">Why · </dt><dd className="inline">{portfolio.blueprintWhy || '—'}</dd></div>
          <div><dt className="inline font-semibold text-slate-900">Goals · </dt><dd className="inline">{(portfolio.blueprintGoals || []).filter(Boolean).join(' · ') || '—'}</dd></div>
          <div><dt className="inline font-semibold text-slate-900">Income · </dt><dd className="inline">{portfolio.blueprintIncomeTarget || '—'}</dd></div>
          <div><dt className="inline font-semibold text-slate-900">Impact · </dt><dd className="inline">{portfolio.blueprintPeopleToImpact || '—'}</dd></div>
          <div><dt className="inline font-semibold text-slate-900">Commitment · </dt><dd className="inline">{portfolio.blueprintCommitment || '—'}</dd></div>
        </dl>
      </Artifact>

      <Artifact
        eyebrow="Artifact 3"
        title="Reflection Journal"
        ready={isReflectionComplete(portfolio)}
      >
        {WEEK1_REFLECTION_PROMPTS.map((p) => (
          <p key={p.id} className="mt-2 text-sm leading-relaxed text-slate-700 first:mt-0">
            <span className="font-semibold text-slate-900">{p.label} </span>
            {portfolio.reflectionAnswers?.[p.id] || '—'}
          </p>
        ))}
      </Artifact>

      {portfolio.locked ? (
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
          <Lock size={18} /> Submitted — your coach will review
        </div>
      ) : (
        <ActionRow className="mt-4">
          <PrimaryButton disabled={!ready || busy} onClick={onSubmit}>
            {busy ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
            Submit &amp; lock portfolio
          </PrimaryButton>
        </ActionRow>
      )}
      {!ready && !portfolio.locked ? (
        <p className="mt-2 text-center text-xs text-slate-500">
          Finish Learn cards, Dream Builder, Vision &amp; Blueprint, and Reflection first.
        </p>
      ) : null}
    </Panel>
  );
}

function Panel({ children }) {
  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
      {children}
    </section>
  );
}

function SectionTitle({ icon, title, subtitle }) {
  const TitleIcon = icon;
  return (
    <div className="flex gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-spike text-white shadow-sm shadow-spike/20">
        <TitleIcon size={20} />
      </span>
      <div className="min-w-0">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-sm text-slate-600">{subtitle}</p> : null}
      </div>
    </div>
  );
}

function Artifact({ eyebrow, title, ready, children }) {
  return (
    <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50/90 p-3.5 first:mt-0">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-spike">{eyebrow}</p>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        </div>
        {ready ? (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-800">
            Ready
          </span>
        ) : (
          <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
            Incomplete
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, locked, rows, placeholder }) {
  const shared = {
    disabled: locked,
    className: INPUT,
    placeholder,
    value,
    onChange: (e) => onChange(e.target.value),
  };
  return (
    <label className="block">
      <span className={LABEL}>{label}</span>
      {rows ? <textarea rows={rows} {...shared} /> : <input {...shared} />}
    </label>
  );
}

function ActionRow({ children, className = '' }) {
  return <div className={`flex gap-2 ${className}`}>{children}</div>;
}

function PrimaryButton({ children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl bg-spike px-4 py-3 text-sm font-bold text-white shadow-md shadow-spike/20 transition hover:bg-spike-dark disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none ${className}`}
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
      className={`inline-flex min-h-[52px] items-center justify-center gap-1 rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
