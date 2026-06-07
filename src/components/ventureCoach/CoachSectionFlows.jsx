import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AMBITION_MOTIVATOR_CARDS,
  COACH_VALUE_CARDS,
  FUTURE_SELF_GOALS,
  INCOME_SLIDER_LABELS,
  PURPOSE_DRIVERS,
  VENTURE_DIRECTION_CARDS,
} from '../../lib/ventureCoachConstants.js';
import {
  generateAmbitionDraft,
  generateFutureSelfNarrative,
  generatePurposeDraft,
  generateValuesProfile,
  getAmbitionFollowUps,
  labelFor,
} from '../../lib/ventureCoachEngine.js';
import {
  acceptCoachSection,
  getCoachSection,
  saveCoachSectionDraft,
} from '../../lib/ventureCoachService.js';
import { CoachCardGrid, CoachMessage, CoachRadioList } from './CoachMessage.jsx';
import { CoachDraftPanel } from './CoachDraftPanel.jsx';
import { ROUTES } from '../../routes/paths.js';

/** @param {(() => void) | undefined} onSectionComplete @param {ReturnType<typeof useNavigate>} navigate @param {string} nextPath */
function afterSectionAccept(onSectionComplete, navigate, nextPath) {
  if (onSectionComplete) {
    onSectionComplete();
  } else {
    navigate(nextPath);
  }
}

/**
 * @param {{ participantId: string, onProgress: () => void, onSectionComplete?: () => void }} props
 */
export function AmbitionCoachFlow({ participantId, onProgress, onSectionComplete }) {
  const navigate = useNavigate();
  const stored = getCoachSection(participantId, 'ambition');
  const [step, setStep] = useState(stored.data.step ?? 1);
  const [selected, setSelected] = useState(/** @type {string[]} */ (stored.data.selectedMotivators ?? []));
  const [followUpAnswers, setFollowUpAnswers] = useState(
    /** @type {Record<string, string>} */ (stored.data.followUpAnswers ?? {}),
  );
  const [draft, setDraft] = useState(String(stored.data.draft ?? ''));

  const followUps = useMemo(() => getAmbitionFollowUps(selected), [selected]);
  const followUpIndex = step - 2;

  function persist(data) {
    saveCoachSectionDraft(participantId, 'ambition', { ...stored.data, ...data, step });
  }

  function toggleMotivator(id) {
    const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
    setSelected(next);
    persist({ selectedMotivators: next });
  }

  function handleGenerateDraft() {
    const text = generateAmbitionDraft({ selectedMotivators: selected, followUpAnswers });
    const draftStep = 2 + followUps.length;
    setDraft(text);
    setStep(draftStep);
    saveCoachSectionDraft(participantId, 'ambition', {
      selectedMotivators: selected,
      followUpAnswers,
      draft: text,
      step: draftStep,
    });
  }

  function handleAccept() {
    acceptCoachSection(participantId, 'ambition', draft.trim(), { selectedMotivators: selected, followUpAnswers });
    onProgress();
    afterSectionAccept(onSectionComplete, navigate, `${ROUTES.ventureBlueprint}/coach/purpose`);
  }

  if (stored.completedAt) {
    return (
      <CoachMessage>
        <p className="font-semibold">My Ambition — complete ✓</p>
        <p className="mt-2 whitespace-pre-wrap text-slate-600">{stored.data.finalText}</p>
      </CoachMessage>
    );
  }

  return (
    <div className="space-y-6">
      {step === 1 ? (
        <>
          <CoachMessage>
            <p className="font-semibold">What excites you most about your future?</p>
            <p className="mt-2 text-slate-600">Select everything that resonates — there are no wrong answers.</p>
          </CoachMessage>
          <CoachCardGrid options={AMBITION_MOTIVATOR_CARDS} selected={selected} onToggle={toggleMotivator} />
          <button
            type="button"
            disabled={selected.length === 0}
            onClick={() => {
              if (followUps.length === 0) {
                handleGenerateDraft();
              } else {
                setStep(2);
                persist({ selectedMotivators: selected, step: 2 });
              }
            }}
            className="spike-btn-primary disabled:opacity-50"
          >
            Continue
          </button>
        </>
      ) : null}

      {step >= 2 && followUpIndex >= 0 && followUpIndex < followUps.length ? (
        <>
          <CoachMessage>
            <p className="whitespace-pre-wrap font-semibold">{followUps[followUpIndex].prompt}</p>
          </CoachMessage>
          <CoachRadioList
            options={followUps[followUpIndex].options}
            value={followUpAnswers[followUps[followUpIndex].id] ?? ''}
            onChange={(id) => {
              const next = { ...followUpAnswers, [followUps[followUpIndex].id]: id };
              setFollowUpAnswers(next);
              persist({ followUpAnswers: next });
            }}
          />
          <button
            type="button"
            disabled={!followUpAnswers[followUps[followUpIndex].id]}
            onClick={() => {
              if (followUpIndex + 1 >= followUps.length) handleGenerateDraft();
              else setStep(step + 1);
            }}
            className="spike-btn-primary disabled:opacity-50"
          >
            Continue
          </button>
        </>
      ) : null}

      {step >= 2 + followUps.length && draft ? (
        <>
          <CoachMessage>
            <p>Based on what you shared, here is a draft ambition statement. Edit it until it feels like yours.</p>
          </CoachMessage>
          <CoachDraftPanel
            title="Draft Ambition Statement"
            draft={draft}
            onDraftChange={(text) => {
              setDraft(text);
              persist({ draft: text });
            }}
            onAccept={handleAccept}
          />
        </>
      ) : null}
    </div>
  );
}

/**
 * @param {{ participantId: string, onProgress: () => void, onSectionComplete?: () => void }} props
 */
export function PurposeCoachFlow({ participantId, onProgress, onSectionComplete }) {
  const navigate = useNavigate();
  const stored = getCoachSection(participantId, 'purpose');
  const [step, setStep] = useState(stored.data.step ?? 1);
  const [drivers, setDrivers] = useState(/** @type {string[]} */ (stored.data.drivers ?? []));
  const [whyDetail, setWhyDetail] = useState(String(stored.data.whyDetail ?? ''));
  const [draft, setDraft] = useState(String(stored.data.draft ?? ''));

  function persist(data) {
    saveCoachSectionDraft(participantId, 'purpose', { ...stored.data, ...data, step });
  }

  function handleAccept() {
    acceptCoachSection(participantId, 'purpose', draft.trim(), { drivers, whyDetail });
    onProgress();
    afterSectionAccept(onSectionComplete, navigate, `${ROUTES.ventureBlueprint}/coach/values`);
  }

  if (stored.completedAt) {
    return (
      <CoachMessage>
        <p className="font-semibold">My Purpose — complete ✓</p>
        <p className="mt-2 whitespace-pre-wrap text-slate-600">{stored.data.finalText}</p>
      </CoachMessage>
    );
  }

  return (
    <div className="space-y-6">
      {step === 1 ? (
        <>
          <CoachMessage>
            <p className="font-semibold">Why is achieving your ambition important?</p>
            <p className="mt-2 text-slate-600">Choose all that apply.</p>
          </CoachMessage>
          <CoachCardGrid
            options={PURPOSE_DRIVERS}
            selected={drivers}
            onToggle={(id) => {
              const next = drivers.includes(id) ? drivers.filter((x) => x !== id) : [...drivers, id];
              setDrivers(next);
              persist({ drivers: next });
            }}
          />
          <button
            type="button"
            disabled={drivers.length === 0}
            onClick={() => setStep(2)}
            className="spike-btn-primary disabled:opacity-50"
          >
            Continue
          </button>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <CoachMessage>
            <p className="font-semibold">Tell me more about why this matters.</p>
            <p className="mt-2 text-slate-600">A short, honest response is perfect.</p>
          </CoachMessage>
          <textarea
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-spike focus:outline-none focus:ring-2 focus:ring-spike/20"
            rows={4}
            value={whyDetail}
            placeholder="This matters to me because…"
            onChange={(e) => {
              setWhyDetail(e.target.value);
              persist({ whyDetail: e.target.value });
            }}
          />
          <button
            type="button"
            disabled={whyDetail.trim().length < 10}
            onClick={() => {
              const text = generatePurposeDraft({ drivers, whyDetail });
              setDraft(text);
              persist({ draft: text, step: 3 });
              setStep(3);
            }}
            className="spike-btn-primary disabled:opacity-50"
          >
            Generate my purpose statement
          </button>
        </>
      ) : null}

      {step === 3 && draft ? (
        <>
          <CoachMessage>
            <p>Here is your purpose statement draft. Refine it until it feels authentic.</p>
          </CoachMessage>
          <CoachDraftPanel
            title="Purpose Statement"
            draft={draft}
            onDraftChange={(text) => {
              setDraft(text);
              persist({ draft: text });
            }}
            onAccept={handleAccept}
          />
        </>
      ) : null}
    </div>
  );
}

/**
 * @param {{ participantId: string, onProgress: () => void, onSectionComplete?: () => void }} props
 */
export function ValuesCoachFlow({ participantId, onProgress, onSectionComplete }) {
  const navigate = useNavigate();
  const stored = getCoachSection(participantId, 'values');
  const [step, setStep] = useState(stored.data.step ?? 1);
  const [selected, setSelected] = useState(/** @type {string[]} */ (stored.data.selected ?? []));
  const [topFive, setTopFive] = useState(/** @type {string[]} */ (stored.data.topFive ?? []));
  const [profile, setProfile] = useState(String(stored.data.valuesProfile ?? ''));

  function persist(data) {
    saveCoachSectionDraft(participantId, 'values', { ...stored.data, ...data, step });
  }

  if (stored.completedAt) {
    return (
      <CoachMessage>
        <p className="font-semibold">My Values — complete ✓</p>
        <p className="mt-2 whitespace-pre-wrap text-slate-600">{stored.data.finalText}</p>
      </CoachMessage>
    );
  }

  return (
    <div className="space-y-6">
      {step === 1 ? (
        <>
          <CoachMessage>
            <p className="font-semibold">What principles will guide your venture?</p>
            <p className="mt-2 text-slate-600">Select up to 10 values.</p>
          </CoachMessage>
          <CoachCardGrid
            options={COACH_VALUE_CARDS}
            selected={selected}
            onToggle={(id) => {
              let next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
              if (next.length > 10) next = next.slice(-10);
              setSelected(next);
              persist({ selected: next });
            }}
          />
          <button
            type="button"
            disabled={selected.length < 5}
            onClick={() => setStep(2)}
            className="spike-btn-primary disabled:opacity-50"
          >
            Narrow to Top 5 ({selected.length}/10)
          </button>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <CoachMessage>
            <p className="font-semibold">Choose your Top 5 values.</p>
          </CoachMessage>
          <CoachCardGrid
            options={COACH_VALUE_CARDS.filter((c) => selected.includes(c.id))}
            selected={topFive}
            onToggle={(id) => {
              let next = topFive.includes(id) ? topFive.filter((x) => x !== id) : [...topFive, id];
              if (next.length > 5) next = next.slice(-5);
              setTopFive(next);
              persist({ topFive: next });
            }}
          />
          <button
            type="button"
            disabled={topFive.length !== 5}
            onClick={() => setStep(3)}
            className="spike-btn-primary disabled:opacity-50"
          >
            Rank Top 5
          </button>
        </>
      ) : null}

      {step === 3 ? (
        <>
          <CoachMessage>
            <p className="font-semibold">Rank your Top 5 — #1 is most important.</p>
            <p className="mt-2 text-slate-600">Use the arrows to reorder.</p>
          </CoachMessage>
          <ol className="space-y-2">
            {topFive.map((id, idx) => (
              <li key={id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                <span className="text-sm font-semibold">
                  #{idx + 1} {labelFor(id, COACH_VALUE_CARDS)}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => {
                      const next = [...topFive];
                      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                      setTopFive(next);
                      persist({ topFive: next });
                    }}
                    className="rounded px-2 py-1 text-xs disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={idx === topFive.length - 1}
                    onClick={() => {
                      const next = [...topFive];
                      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
                      setTopFive(next);
                      persist({ topFive: next });
                    }}
                    className="rounded px-2 py-1 text-xs disabled:opacity-30"
                  >
                    ↓
                  </button>
                </div>
              </li>
            ))}
          </ol>
          <button
            type="button"
            onClick={() => {
              const text = generateValuesProfile(topFive);
              const ranked = topFive.map((id, i) => `${i + 1}. ${labelFor(id, COACH_VALUE_CARDS)}`).join('\n');
              const finalText = `${ranked}\n\n${text}`;
              setProfile(finalText);
              persist({ valuesProfile: finalText, step: 4 });
              setStep(4);
            }}
            className="spike-btn-primary"
          >
            Generate values profile
          </button>
        </>
      ) : null}

      {step === 4 && profile ? (
        <>
          <CoachMessage>
            <p className="font-semibold">Values Profile</p>
            <p className="mt-2 whitespace-pre-wrap text-slate-600">{profile}</p>
          </CoachMessage>
          <button
            type="button"
            onClick={() => {
              acceptCoachSection(participantId, 'values', profile, { topFive, valuesProfile: profile });
              onProgress();
              afterSectionAccept(
                onSectionComplete,
                navigate,
                `${ROUTES.ventureBlueprint}/coach/future-self`,
              );
            }}
            className="spike-btn-primary"
          >
            Accept & save to Blueprint
          </button>
        </>
      ) : null}
    </div>
  );
}

/**
 * @param {{ participantId: string, onProgress: () => void, onSectionComplete?: () => void }} props
 */
export function FutureSelfCoachFlow({ participantId, onProgress, onSectionComplete }) {
  const navigate = useNavigate();
  const stored = getCoachSection(participantId, 'future-self');
  const [step, setStep] = useState(stored.data.step ?? 1);
  const [goals, setGoals] = useState(/** @type {string[]} */ (stored.data.goals ?? []));
  const [incomeLevel, setIncomeLevel] = useState(Number(stored.data.incomeLevel ?? 3));
  const [impact, setImpact] = useState(String(stored.data.impact ?? ''));
  const [successVision, setSuccessVision] = useState(String(stored.data.successVision ?? ''));
  const [draft, setDraft] = useState(String(stored.data.draft ?? ''));

  function persist(data) {
    saveCoachSectionDraft(participantId, 'future-self', { ...stored.data, ...data, step });
  }

  if (stored.completedAt) {
    return (
      <CoachMessage>
        <p className="font-semibold">My Future Self — complete ✓</p>
        <p className="mt-2 whitespace-pre-wrap text-slate-600">{stored.data.finalText}</p>
      </CoachMessage>
    );
  }

  return (
    <div className="space-y-6">
      <CoachMessage>
        <div className="flex flex-wrap items-center justify-center gap-2 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
          <span className="rounded-lg bg-slate-100 px-3 py-2">Today</span>
          <span>↓</span>
          <span className="rounded-lg bg-slate-100 px-3 py-2">1 Year</span>
          <span>↓</span>
          <span className="rounded-lg bg-spike px-3 py-2 text-white">3 Years</span>
          <span>↓</span>
          <span className="rounded-lg bg-slate-100 px-3 py-2">10 Years</span>
        </div>
      </CoachMessage>

      {step === 1 ? (
        <>
          <CoachMessage>
            <p className="font-semibold">Where do you want to be in 3 years?</p>
          </CoachMessage>
          <CoachCardGrid
            options={FUTURE_SELF_GOALS}
            selected={goals}
            onToggle={(id) => {
              const next = goals.includes(id) ? goals.filter((x) => x !== id) : [...goals, id];
              setGoals(next);
              persist({ goals: next });
            }}
          />
          <button type="button" disabled={goals.length === 0} onClick={() => setStep(2)} className="spike-btn-primary disabled:opacity-50">
            Continue
          </button>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <CoachMessage>
            <p className="font-semibold">What income level would make you proud?</p>
          </CoachMessage>
          <input
            type="range"
            min={1}
            max={5}
            value={incomeLevel}
            onChange={(e) => {
              const val = Number(e.target.value);
              setIncomeLevel(val);
              persist({ incomeLevel: val });
            }}
            className="w-full accent-spike"
          />
          <p className="text-center text-sm font-semibold text-spike">
            {INCOME_SLIDER_LABELS.find((l) => l.value === incomeLevel)?.label}
          </p>
          <button type="button" onClick={() => setStep(3)} className="spike-btn-primary">
            Continue
          </button>
        </>
      ) : null}

      {step === 3 ? (
        <>
          <CoachMessage>
            <p className="font-semibold">What impact would you like to create?</p>
          </CoachMessage>
          <textarea
            rows={3}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            value={impact}
            placeholder="Who you serve and how…"
            onChange={(e) => {
              setImpact(e.target.value);
              persist({ impact: e.target.value });
            }}
          />
          <CoachMessage>
            <p className="font-semibold">What would success look like?</p>
          </CoachMessage>
          <textarea
            rows={3}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            value={successVision}
            placeholder="Describe success in your own words…"
            onChange={(e) => {
              setSuccessVision(e.target.value);
              persist({ successVision: e.target.value });
            }}
          />
          <button
            type="button"
            disabled={impact.trim().length < 5 || successVision.trim().length < 5}
            onClick={() => {
              const text = generateFutureSelfNarrative({ goals, incomeLevel, impact, successVision });
              setDraft(text);
              persist({ draft: text, step: 4 });
              setStep(4);
            }}
            className="spike-btn-primary disabled:opacity-50"
          >
            Generate Future Self Narrative
          </button>
        </>
      ) : null}

      {step === 4 && draft ? (
        <>
          <CoachMessage>
            <p>Here is your Future Self narrative — about 300–500 words. Edit and refine until it inspires you.</p>
          </CoachMessage>
          <CoachDraftPanel
            title="Future Self Narrative"
            draft={draft}
            refineSet="future-self"
            onDraftChange={(text) => {
              setDraft(text);
              persist({ draft: text });
            }}
            onAccept={() => {
              acceptCoachSection(participantId, 'future-self', draft.trim(), {
                goals,
                incomeLevel,
                impact,
                successVision,
              });
              onProgress();
              afterSectionAccept(
                onSectionComplete,
                navigate,
                `${ROUTES.ventureBlueprint}/coach/venture-direction`,
              );
            }}
          />
        </>
      ) : null}
    </div>
  );
}

/**
 * @param {{ participantId: string, onProgress: () => void, onSectionComplete?: () => void }} props
 */
export function VentureDirectionCoachFlow({ participantId, onProgress, onSectionComplete }) {
  const stored = getCoachSection(participantId, 'venture-direction');
  const [track, setTrack] = useState(String(stored.data.track ?? ''));

  if (stored.completedAt) {
    return (
      <CoachMessage>
        <p className="font-semibold">Venture Direction — complete ✓</p>
        <p className="mt-2 text-slate-600">
          {VENTURE_DIRECTION_CARDS.find((c) => c.id === stored.data.track)?.label ?? stored.data.track}
        </p>
      </CoachMessage>
    );
  }

  return (
    <div className="space-y-6">
      <CoachMessage>
        <p className="font-semibold">Which direction currently excites you most?</p>
        <p className="mt-2 text-slate-600">No commitment yet — this helps shape your Blueprint path.</p>
      </CoachMessage>

      <div className="grid gap-4 sm:grid-cols-3">
        {VENTURE_DIRECTION_CARDS.map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => {
              setTrack(card.id);
              saveCoachSectionDraft(participantId, 'venture-direction', { track: card.id });
            }}
            className={`rounded-2xl border-2 p-5 text-left transition hover:shadow-md ${
              track === card.id
                ? 'border-spike bg-spike-muted ring-2 ring-spike/20'
                : 'border-slate-200 bg-white hover:border-spike/30'
            }`}
          >
            <p className="font-semibold text-slate-900">{card.label}</p>
            <p className="mt-2 text-sm text-slate-600">{card.description}</p>
          </button>
        ))}
      </div>

      <button
        type="button"
        disabled={!track}
        onClick={() => {
          acceptCoachSection(participantId, 'venture-direction', track, { track });
          onProgress();
          if (onSectionComplete) onSectionComplete();
        }}
        className="spike-btn-primary disabled:opacity-50"
      >
        Save venture direction to Blueprint
      </button>
    </div>
  );
}
