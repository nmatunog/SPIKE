import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Check, Sparkles, Star } from 'lucide-react';
import { ViewMyFecCanvasLink } from '../../ventureDesign/ViewMyFecCanvasLink.jsx';
import {
  approveEvidenceBoard,
  approveFecBoxEvolution,
  approveStudio3,
  buildStudioPitchSlides,
  generateVentureEvolutionReport,
  getFecStudioState,
  saveEvidenceBoardDraft,
} from '../../../lib/customerDiscovery/week2FecStudioService.js';
import {
  saveStudio2Draft,
  saveStudio3Draft,
  setMemberStudioDraftSource,
} from '../../../lib/customerDiscovery/week2FecStudioDraftCandidates.js';
import { FEC_STUDIO_PHASES, PITCH_SLIDE_KEYS } from '../../../lib/customerDiscovery/week2FecValidationConstants.js';
import { FecValidationCanvas, SquadRolesBanner } from './FecValidationShared.jsx';
import { hydrateSquadFecValidation } from '../../../lib/customerDiscovery/week2FecValidationSync.js';
import { hydrateSquadWeek2Discovery } from '../../../lib/customerDiscovery/week2DiscoverySync.js';

/**
 * FEC Validation Lab™ — three-studio venture upgrade (Day 4).
 * @param {{ participantId: string, squadName?: string, stepSlug?: string, onSaved?: () => void, memberNames?: Record<string, string>, onNavigate?: (slug: string) => void }} props
 */
export function FecValidationStudio({ participantId, stepSlug, onSaved, memberNames = {}, onNavigate }) {
  const [, tick] = useState(0);
  const refresh = () => {
    tick((n) => n + 1);
    onSaved?.();
  };

  useEffect(() => {
    void hydrateSquadFecValidation(participantId).then(() => refresh());
    void hydrateSquadWeek2Discovery(participantId).then(() => refresh());
  }, [participantId]);

  const studio = useMemo(() => getFecStudioState(participantId, memberNames), [participantId, memberNames, tick]);
  const rawSlug = stepSlug && stepSlug !== 'fec-lab' && stepSlug !== 'fec-studio' ? stepSlug : null;
  const legacyMap = {
    'fec-step-1': 'fec-studio-1',
    'fec-step-2': 'fec-studio-2',
    'fec-step-3': 'fec-studio-2',
    'fec-step-4': 'fec-studio-2',
    'fec-step-5': 'fec-studio-2',
    'fec-step-6': 'fec-studio-3',
  };
  const slug = rawSlug && legacyMap[rawSlug] ? legacyMap[rawSlug] : rawSlug;

  useEffect(() => {
    if (rawSlug && legacyMap[rawSlug]) onNavigate?.(legacyMap[rawSlug]);
  }, [rawSlug, onNavigate]);

  if (!slug) {
    return (
      <FecStudioLanding
        studio={studio}
        participantId={participantId}
        memberNames={memberNames}
        onStart={() => onNavigate?.(studio.activePhase.slug)}
        onNavigate={onNavigate}
      />
    );
  }

  if (slug === 'fec-studio-1') {
    return (
      <Studio1Evidence
        studio={studio}
        participantId={participantId}
        onSaved={refresh}
        onNext={() => onNavigate?.('fec-studio-2')}
        onNavigate={onNavigate}
      />
    );
  }
  if (slug === 'fec-studio-2') {
    return (
      <Studio2Evolution
        studio={studio}
        participantId={participantId}
        onSaved={refresh}
        onNext={() => onNavigate?.('fec-studio-3')}
        onNavigate={onNavigate}
      />
    );
  }
  if (slug === 'fec-studio-3') {
    return (
      <Studio3NextSteps
        studio={studio}
        participantId={participantId}
        onSaved={refresh}
        onFriday={() => onNavigate?.('market-validation-pitch', 5)}
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <FecStudioLanding
      studio={studio}
      participantId={participantId}
      memberNames={memberNames}
      onStart={() => onNavigate?.(studio.activePhase.slug)}
      onNavigate={onNavigate}
    />
  );
}

/** @param {{ phases: Array<{ id: string, slug: string, studioLabel: string, title: string, done?: boolean }>, activeSlug: string, onNavigate?: (slug: string) => void }} props */
function StudioPhaseNav({ phases, activeSlug, onNavigate }) {
  return (
    <nav aria-label="FEC studio path" className="space-y-2">
      <p className="text-sm font-bold uppercase tracking-wider text-slate-500">Venture evolution path</p>
      <ol className="space-y-2">
        {phases.map((phase, idx) => {
          const isActive = phase.slug === activeSlug;
          const isNext = !phase.done && phases.findIndex((p) => !p.done) === idx;
          return (
            <li key={phase.id}>
              <button
                type="button"
                onClick={() => onNavigate?.(phase.slug)}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition hover:border-spike/40 ${
                  isActive
                    ? 'border-spike bg-spike/10 ring-1 ring-spike/20'
                    : phase.done
                      ? 'border-emerald-200 bg-emerald-50'
                      : isNext
                        ? 'border-spike/30 bg-spike/5'
                        : 'border-slate-200 bg-white'
                }`}
              >
                <span className="text-xs font-bold text-spike">{phase.studioLabel}</span>
                <span className="flex-1 font-medium text-slate-900">{phase.title}</span>
                {phase.done ? (
                  <Check size={16} className="shrink-0 text-emerald-600" aria-hidden />
                ) : isActive ? (
                  <span className="text-xs font-semibold text-spike">You are here</span>
                ) : (
                  <ArrowRight size={16} className="shrink-0 text-slate-400" aria-hidden />
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** @param {{ studio: ReturnType<typeof getFecStudioState>, participantId: string, memberNames: Record<string, string>, onStart: () => void, onNavigate?: (slug: string) => void }} props */
function FecStudioLanding({ studio, participantId, memberNames, onStart, onNavigate }) {
  const { lab, readiness, clarity, phases } = studio;
  const pctcDone = readiness.pctcComplete;
  const activePhase = phases.find((p) => !p.done) ?? phases[phases.length - 1];
  const evidenceLow = lab.evidence.interviewCount < 3;

  return (
    <div className="space-y-8 pb-8">
      <section className="overflow-hidden rounded-2xl border border-spike/25 bg-gradient-to-br from-slate-900 via-slate-900 to-spike-dark p-6 text-white shadow-lg sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-spike-light/80">Week 2 · Day 4 · Synthesize</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">FEC Validation Lab™</h1>
        <p className="mt-2 text-lg text-slate-300">From Evidence to Venture Clarity</p>
        <blockquote className="mt-4 border-l-2 border-spike pl-4 text-sm leading-relaxed text-slate-200">
          The market has spoken.
          <br />
          Today we decide what changes.
        </blockquote>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <HeroStat label="Interview evidence" value={`${lab.evidence.interviewCount} interviews`} />
          <HeroStat label="Professional readiness" value={pctcDone ? '✓ Complete' : 'In progress'} highlight={pctcDone} />
          <HeroStat label="Canvas clarity" value={`${clarity.week2}%`} sub={`Week 1: ${clarity.week1}%`} />
        </div>

        <div className="mt-6">
          <div className="flex justify-between text-xs font-semibold text-slate-400">
            <span>Studio progress</span>
            <span>{studio.studioPct}%</span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-spike transition-all" style={{ width: `${studio.studioPct}%` }} />
          </div>
        </div>

        <SquadRolesBanner roles={lab.roles} memberNames={memberNames} currentParticipantId={participantId} />

        <div className="mt-6">
          <ViewMyFecCanvasLink
            compact
            label="View my full FEC Canvas board →"
            className="text-amber-200 hover:text-white"
          />
        </div>
      </section>

      <section className="rounded-xl border border-indigo-100 bg-indigo-50/80 px-4 py-4 text-sm text-indigo-950">
        <p className="font-semibold">How to encode your FEC Canvas today</p>
        <ol className="list-decimal space-y-1 pl-5 text-indigo-900">
          <li>Fill in <strong>Top 3 Goals</strong>, <strong>Top 3 Problems</strong>, and <strong>Top 3 Opportunities</strong> from squad interviews.</li>
          <li>Open <strong>Studio 2</strong> — approve each FEC box (Keep / Refine / Rebuild).</li>
          <li>Open <strong>Studio 3</strong> — lock build readiness and your Friday pitch draft.</li>
        </ol>
        <p className="mt-2 text-xs text-indigo-800">You do not type into the canvas grid directly — approvals write into your FEC automatically.</p>
      </section>

      {evidenceLow ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Your squad has <strong>{lab.evidence.interviewCount}</strong> encoded interviews so far. Finish Day 2 interviews first for stronger AI drafts — you can still start Studio 1.
        </p>
      ) : null}

      {!pctcDone ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Complete Wednesday&apos;s <strong>Professional Readiness Mission</strong> when you can — the lab stays open while you work.
        </p>
      ) : null}

      <StudioPhaseNav phases={phases} activeSlug="" onNavigate={onNavigate} />

      <button
        type="button"
        onClick={onStart}
        className="spike-btn-primary inline-flex min-h-[48px] w-full items-center justify-center gap-2 text-base sm:w-auto"
      >
        Open {activePhase.studioLabel} — {activePhase.title}
        <ArrowRight size={18} aria-hidden />
      </button>

      <FecValidationCanvas boxScores={lab.fec.boxScores} animate={clarity.delta > 0} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          Confidence scores above — open the full board to see every box with your venture outputs.
        </p>
        <ViewMyFecCanvasLink compact label="Full FEC board →" />
      </div>
    </div>
  );
}

/** @param {{ studio: ReturnType<typeof getFecStudioState>, participantId: string, onSaved: () => void, onNext: () => void, onNavigate?: (slug: string) => void }} props */
function Studio1Evidence({ studio, participantId, onSaved, onNext, onNavigate }) {
  const board = studio.evidenceBoard;
  const [topGoals, setTopGoals] = useState(board.topGoals);
  const [topProblems, setTopProblems] = useState(board.topProblems);
  const [topOpportunities, setTopOpportunities] = useState(board.topOpportunities);
  const [starred, setStarred] = useState(board.starredQuotes ?? []);
  const draftTimerRef = useRef(null);
  const skipDraftSaveRef = useRef(false);

  useEffect(() => {
    skipDraftSaveRef.current = true;
    setTopGoals(board.topGoals);
    setTopProblems(board.topProblems);
    setTopOpportunities(board.topOpportunities);
    setStarred(board.starredQuotes ?? []);
  }, [participantId, board.topGoals, board.topProblems, board.topOpportunities, board.starredQuotes]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void hydrateSquadFecValidation(participantId).then(() => onSaved());
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [participantId, onSaved]);

  useEffect(() => {
    if (skipDraftSaveRef.current) {
      skipDraftSaveRef.current = false;
      return undefined;
    }
    if (draftTimerRef.current) window.clearTimeout(draftTimerRef.current);
    draftTimerRef.current = window.setTimeout(() => {
      saveEvidenceBoardDraft(participantId, {
        topGoals,
        topProblems,
        topOpportunities,
        starredQuotes: starred,
      });
    }, 1200);
    return () => {
      if (draftTimerRef.current) window.clearTimeout(draftTimerRef.current);
    };
  }, [participantId, topGoals, topProblems, topOpportunities, starred]);

  function toggleStar(quote) {
    setStarred((prev) => {
      if (prev.includes(quote)) return prev.filter((q) => q !== quote);
      if (prev.length >= 5) return prev;
      return [...prev, quote];
    });
  }

  function updateRanked(setter, index, text) {
    setter((rows) => rows.map((row, i) => (i === index ? { ...row, text } : row)));
  }

  return (
    <div className="space-y-8 pb-8">
      <StudioPhaseNav phases={studio.phases} activeSlug="fec-studio-1" onNavigate={onNavigate} />
      <StudioHeader phase={FEC_STUDIO_PHASES[0]} />

      <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        Capture <strong>your raw Top 3</strong> from squad interviews (empty slots are seeded from interview data). Edits save under your account. Approve when ready to encode <strong>Who we serve</strong> on the FEC.
      </p>

      {studio.phases[0]?.done ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Evidence board approved for your squad — Studio 1 fields are locked.
        </p>
      ) : null}

      {board.interviewCount < 3 ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Your squad has <strong>{board.interviewCount}</strong> encoded interviews — add more from Day 2 Discover for stronger patterns.
        </p>
      ) : null}

      <TopThreeRankedEditor
        title="Top 3 Goals"
        hint="What customers aspire to — from interview answers."
        items={topGoals}
        onChange={(index, text) => updateRanked(setTopGoals, index, text)}
      />

      <TopThreeRankedEditor
        title="Top 3 Problems"
        hint="Pain points or struggles that repeat across conversations."
        items={topProblems}
        onChange={(index, text) => updateRanked(setTopProblems, index, text)}
      />

      <TopThreeRankedEditor
        title="Top 3 Opportunities"
        hint="Where customers are open to guidance, trust, or new solutions."
        items={topOpportunities}
        onChange={(index, text) => updateRanked(setTopOpportunities, index, text)}
      />

      {board.quotes.length > 0 ? (
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Supporting quotes</h3>
          <p className="text-sm text-slate-600">Star up to 5 quotes to carry into your portfolio pitch.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {board.quotes.slice(0, 8).map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => toggleStar(q)}
                className={`rounded-xl border p-4 text-left text-sm transition ${
                  starred.includes(q) ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white hover:border-spike/30'
                }`}
              >
                <Star size={14} className={starred.includes(q) ? 'text-amber-500' : 'text-slate-300'} />
                <p className="mt-2 italic text-slate-800">&ldquo;{q}&rdquo;</p>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <button
        type="button"
        className="spike-btn-primary w-full sm:w-auto"
        onClick={() => {
          approveEvidenceBoard(participantId, {
            topGoals,
            topProblems,
            topOpportunities,
            starredQuotes: starred,
          });
          onSaved();
          onNext();
        }}
      >
        Approve evidence board → save to FEC &amp; portfolio
      </button>
    </div>
  );
}

/** @param {ReturnType<typeof getFecStudioState>} studio */
function buildInitialStudio2Boxes(studio) {
  const fromDraft = studio.studio2Choice?.activeDraft?.boxes ?? {};
  /** @type {Record<string, { week2Text: string, verdict: string }>} */
  const out = {};
  for (const box of studio.evolutionBoxes) {
    const saved = fromDraft[box.boxId];
    out[box.boxId] = {
      week2Text: saved?.week2Text || box.week2 || box.week2Suggested || '',
      verdict: saved?.verdict || box.verdict || 'keep',
    };
  }
  return out;
}

/** @param {{ studio: ReturnType<typeof getFecStudioState>, participantId: string, onSaved: () => void, onNext: () => void, onNavigate?: (slug: string) => void }} props */
function Studio2Evolution({ studio, participantId, onSaved, onNext, onNavigate }) {
  const choice = studio.studio2Choice;
  const [sourceChoice, setSourceChoice] = useState(choice?.activeSource ?? 'filled');
  const [boxDrafts, setBoxDrafts] = useState(() => buildInitialStudio2Boxes(studio));
  const [activeBox, setActiveBox] = useState(0);
  const boxes = studio.evolutionBoxes;
  const box = boxes[activeBox];
  const week2Draft = box ? boxDrafts[box.boxId]?.week2Text ?? '' : '';
  const verdict = box ? boxDrafts[box.boxId]?.verdict ?? 'keep' : 'keep';
  const clarity = studio.clarity;
  const allDone = boxes.every((b) => b.complete);
  const draftTimerRef = useRef(null);
  const skipDraftSaveRef = useRef(false);

  useEffect(() => {
    setSourceChoice(choice?.activeSource ?? 'filled');
  }, [choice?.activeSource]);

  useEffect(() => {
    skipDraftSaveRef.current = true;
    setBoxDrafts(buildInitialStudio2Boxes(studio));
  }, [participantId, studio.studio2Choice?.activeDraft, studio.evolutionBoxes]);

  function applySource(source) {
    if (!choice || choice.locked) return;
    const candidate = source === 'recent' ? choice.recent : choice.filled;
    skipDraftSaveRef.current = true;
    setSourceChoice(source);
    setBoxDrafts(candidate.draft.boxes ?? buildInitialStudio2Boxes(studio));
    setMemberStudioDraftSource(participantId, 'studio2', source);
  }

  function updateActiveBox(patch) {
    if (!box) return;
    setBoxDrafts((prev) => ({
      ...prev,
      [box.boxId]: { ...prev[box.boxId], ...patch },
    }));
  }

  useEffect(() => {
    if (skipDraftSaveRef.current) {
      skipDraftSaveRef.current = false;
      return undefined;
    }
    if (draftTimerRef.current) window.clearTimeout(draftTimerRef.current);
    draftTimerRef.current = window.setTimeout(() => {
      saveStudio2Draft(participantId, boxDrafts, sourceChoice);
    }, 1200);
    return () => {
      if (draftTimerRef.current) window.clearTimeout(draftTimerRef.current);
    };
  }, [participantId, boxDrafts, sourceChoice]);

  function approveBox() {
    if (!box) return;
    approveFecBoxEvolution(participantId, box.boxId, { verdict, week2Text: week2Draft });
    onSaved();
    if (activeBox < boxes.length - 1) setActiveBox((n) => n + 1);
  }

  return (
    <div className="space-y-8 pb-8">
      <StudioPhaseNav phases={studio.phases} activeSlug="fec-studio-2" onNavigate={onNavigate} />
      <StudioHeader phase={FEC_STUDIO_PHASES[1]} />

      <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        For each FEC box: read Week 1 vs Week 2, edit the draft, choose Keep / Refine / Rebuild, then tap <strong>Approve → update FEC</strong>.
      </p>

      {choice && !choice.locked ? (
        <StudioDraftSourcePicker
          choice={choice}
          activeSource={sourceChoice}
          onSelect={applySource}
          studioLabel="Studio 2"
        />
      ) : null}

      <section className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white p-6 text-center">
        <p className="text-xs font-bold uppercase text-slate-500">Canvas Clarity Score</p>
        <div className="mt-2 flex items-center justify-center gap-4">
          <span className="text-3xl font-black text-slate-400">{clarity.week1}%</span>
          <ArrowRight className="text-emerald-600" />
          <span className="text-4xl font-black text-emerald-700">{clarity.week2}%</span>
        </div>
        <p className="mt-2 text-sm text-slate-600">Week 1 venture → Week 2 venture — because of evidence.</p>
      </section>

      <div className="flex flex-wrap gap-2">
        {boxes.map((b, idx) => (
          <button
            key={b.boxId}
            type="button"
            onClick={() => setActiveBox(idx)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              idx === activeBox ? 'bg-spike text-white' : b.complete ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {b.label} {b.complete ? '✓' : ''}
          </button>
        ))}
      </div>

      {box ? (
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h3 className="text-xl font-bold text-slate-900">{box.label}</h3>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase text-slate-400">Week 1</p>
              <p className="mt-2 text-sm text-slate-800">{box.week1}</p>
              <p className="mt-3 text-lg font-bold text-slate-500">{box.score.before}%</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
              <p className="text-[10px] font-bold uppercase text-emerald-700">Week 2</p>
              <textarea
                value={week2Draft}
                onChange={(e) => updateActiveBox({ week2Text: e.target.value })}
                rows={4}
                className="mt-2 w-full rounded-lg border border-emerald-100 bg-white p-3 text-sm"
              />
              <p className="mt-3 text-lg font-bold text-emerald-700">{box.score.after}%</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase text-slate-400">Evidence</p>
            <ul className="mt-2 space-y-1">
              {box.evidenceItems.map((item) => (
                <li key={item} className="text-sm text-slate-700">• {item}</li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: 'keep', label: '✓ Keep' },
              { id: 'refine', label: '⚠ Refine' },
              { id: 'rebuild', label: '✗ Rebuild' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => updateActiveBox({ verdict: opt.id })}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${verdict === opt.id ? 'bg-spike text-white' : 'bg-slate-100'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button type="button" onClick={approveBox} className="spike-btn-primary">
            Approve {box.label} → update FEC
          </button>
        </article>
      ) : null}

      <FecValidationCanvas boxScores={studio.lab.fec.boxScores} animate />

      {allDone ? (
        <button type="button" onClick={onNext} className="spike-btn-primary inline-flex items-center gap-2">
          Studio 2 complete — continue to action
          <ArrowRight size={16} />
        </button>
      ) : null}
    </div>
  );
}

/** @param {{ studio: ReturnType<typeof getFecStudioState>, participantId: string, onSaved: () => void, onFriday: () => void, onNavigate?: (slug: string) => void }} props */
function Studio3NextSteps({ studio, participantId, onSaved, onFriday, onNavigate }) {
  const choice = studio.studio3Choice;
  const initialDraft = choice?.activeDraft;
  const [sourceChoice, setSourceChoice] = useState(choice?.activeSource ?? 'filled');
  const [strategic, setStrategic] = useState(
    initialDraft?.strategicOpportunity
      || studio.lab.fec.steps['fec-step-5']?.approvedStatement
      || '',
  );
  const [nextExp, setNextExp] = useState(
    initialDraft?.nextExperiment || studio.nextExperiment || 'Run a protection-gap conversation with 3 new prospects.',
  );
  const [buildDir, setBuildDir] = useState(
    initialDraft?.week3BuildDirection || studio.week3BuildDirection || 'Prototype Week 3 build around validated problem and UVP v2.',
  );
  const [slides, setSlides] = useState(() => {
    const fromDraft = initialDraft?.pitchSlides ?? {};
    if (Object.values(fromDraft).some(Boolean)) return fromDraft;
    const existing = studio.pitchSlides ?? {};
    if (existing.mission) return existing;
    return buildStudioPitchSlides(participantId);
  });
  const draftTimerRef = useRef(null);
  const skipDraftSaveRef = useRef(false);
  const report = studio.ventureReport?.topInsight ? studio.ventureReport : generateVentureEvolutionReport(participantId);

  useEffect(() => {
    setSourceChoice(choice?.activeSource ?? 'filled');
  }, [choice?.activeSource]);

  useEffect(() => {
    const draft = choice?.activeDraft;
    if (!draft) return;
    skipDraftSaveRef.current = true;
    setStrategic(draft.strategicOpportunity || studio.lab.fec.steps['fec-step-5']?.approvedStatement || '');
    setNextExp(draft.nextExperiment || studio.nextExperiment || '');
    setBuildDir(draft.week3BuildDirection || studio.week3BuildDirection || '');
    if (Object.values(draft.pitchSlides ?? {}).some(Boolean)) {
      setSlides(draft.pitchSlides);
    }
  }, [participantId, choice?.activeDraft, studio.lab.fec.steps, studio.nextExperiment, studio.week3BuildDirection]);

  function applySource(source) {
    if (!choice || choice.locked) return;
    const candidate = source === 'recent' ? choice.recent : choice.filled;
    const draft = candidate.draft;
    skipDraftSaveRef.current = true;
    setSourceChoice(source);
    setStrategic(draft.strategicOpportunity || '');
    setNextExp(draft.nextExperiment || '');
    setBuildDir(draft.week3BuildDirection || '');
    setSlides(draft.pitchSlides ?? {});
    setMemberStudioDraftSource(participantId, 'studio3', source);
  }

  useEffect(() => {
    if (skipDraftSaveRef.current) {
      skipDraftSaveRef.current = false;
      return undefined;
    }
    if (draftTimerRef.current) window.clearTimeout(draftTimerRef.current);
    draftTimerRef.current = window.setTimeout(() => {
      saveStudio3Draft(participantId, {
        strategicOpportunity: strategic,
        nextExperiment: nextExp,
        week3BuildDirection: buildDir,
        pitchSlides: slides,
      }, sourceChoice);
    }, 1200);
    return () => {
      if (draftTimerRef.current) window.clearTimeout(draftTimerRef.current);
    };
  }, [participantId, strategic, nextExp, buildDir, slides, sourceChoice]);

  return (
    <div className="space-y-8 pb-8">
      <StudioPhaseNav phases={studio.phases} activeSlug="fec-studio-3" onNavigate={onNavigate} />
      <StudioHeader phase={FEC_STUDIO_PHASES[2]} />

      <p className="text-lg font-semibold text-slate-900">Now that the market has spoken… what should happen next?</p>

      {choice && !choice.locked ? (
        <StudioDraftSourcePicker
          choice={choice}
          activeSource={sourceChoice}
          onSelect={applySource}
          studioLabel="Studio 3"
        />
      ) : null}

      <label className="block space-y-2">
        <span className="text-sm font-bold text-slate-700">Strategic opportunity</span>
        <textarea value={strategic} onChange={(e) => setStrategic(e.target.value)} rows={3} className="w-full rounded-xl border border-slate-200 p-3 text-sm" />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-bold text-slate-700">Next experiment</span>
        <textarea value={nextExp} onChange={(e) => setNextExp(e.target.value)} rows={2} className="w-full rounded-xl border border-slate-200 p-3 text-sm" />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-bold text-slate-700">Week 3 build direction</span>
        <textarea value={buildDir} onChange={(e) => setBuildDir(e.target.value)} rows={2} className="w-full rounded-xl border border-slate-200 p-3 text-sm" />
      </label>

      <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
        <p className="text-sm font-bold text-slate-900">Venture Evolution Report</p>
        <p className="text-xs text-slate-600"><strong>UVP:</strong> {report.uvpChanges}</p>
        <p className="text-xs text-slate-600"><strong>Top insight:</strong> {report.topInsight}</p>
        <p className="text-xs text-slate-600"><strong>Biggest opportunity:</strong> {report.biggestOpportunity}</p>
      </section>

      <section className="space-y-3">
        <p className="flex items-center gap-2 text-sm font-bold text-spike"><Sparkles size={16} /> Friday pitch draft</p>
        {PITCH_SLIDE_KEYS.map(({ key, label }, idx) => (
          <article key={key} className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-[10px] font-bold uppercase text-slate-400">Slide {idx + 1} · {label}</p>
            <textarea
              value={slides[key] ?? ''}
              onChange={(e) => setSlides({ ...slides, [key]: e.target.value })}
              rows={2}
              className="mt-1 w-full border-0 bg-transparent text-sm focus:outline-none"
              placeholder="Auto-generated on approve…"
            />
          </article>
        ))}
      </section>

      <button
        type="button"
        className="spike-btn-primary inline-flex items-center gap-2"
        onClick={() => {
          approveStudio3(participantId, {
            strategicOpportunity: strategic,
            nextExperiment: nextExp,
            week3BuildDirection: buildDir,
            pitchSlides: slides,
            buildReadiness: 'Build readiness confirmed — FEC Version 2 locked.',
          });
          onSaved();
        }}
      >
        Approve build readiness → lock pitch draft
      </button>

      {studio.labComplete ? (
        <button type="button" onClick={onFriday} className="spike-btn-secondary inline-flex items-center gap-2">
          Continue to Friday pitch
          <ArrowRight size={16} />
        </button>
      ) : null}
    </div>
  );
}

/** @param {{ phase: typeof FEC_STUDIO_PHASES[number] }} props */
function StudioHeader({ phase }) {
  return (
    <header>
      <p className="text-xs font-bold uppercase tracking-wider text-spike">{phase.studioLabel}</p>
      <h2 className="mt-1 text-2xl font-black text-slate-900">{phase.title}</h2>
      <p className="mt-1 text-sm text-slate-600">{phase.subtitle}</p>
    </header>
  );
}

/** @param {{ label: string, value: string, sub?: string, highlight?: boolean }} props */
function HeroStat({ label, value, sub, highlight }) {
  return (
    <div className={`rounded-xl p-3 ${highlight ? 'bg-emerald-500/20' : 'bg-white/10'}`}>
      <p className="text-[10px] font-bold uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-bold">{value}</p>
      {sub ? <p className="text-xs text-slate-400">{sub}</p> : null}
    </div>
  );
}

/** @param {string} iso */
function formatDraftAt(iso) {
  if (!iso) return 'No save time yet';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Recently';
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

/**
 * @param {{
 *   choice: NonNullable<ReturnType<typeof getFecStudioState>['studio2Choice']>,
 *   activeSource: 'recent' | 'filled',
 *   onSelect: (source: 'recent' | 'filled') => void,
 *   studioLabel: string,
 * }} props
 */
function StudioDraftSourcePicker({ choice, activeSource, onSelect, studioLabel }) {
  const options = [choice.recent, choice.filled];

  return (
    <section className="space-y-3 rounded-xl border border-indigo-100 bg-indigo-50/70 p-4">
      <div>
        <p className="text-sm font-bold text-indigo-950">{studioLabel}: choose which squad save loads on your screen</p>
        <p className="mt-1 text-xs text-indigo-900">
          Pick <strong>most recent</strong> or <strong>most filled</strong>. Your edits save under your account.
          {choice.hasChoice ? ' These versions differ right now.' : ' Both match for now — you can still set a preference.'}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const active = activeSource === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              className={`rounded-xl border p-4 text-left transition ${
                active
                  ? 'border-spike bg-white ring-2 ring-spike/25'
                  : 'border-indigo-100 bg-white/90 hover:border-spike/40'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-slate-900">{option.label}</p>
                {active ? (
                  <span className="shrink-0 rounded-full bg-spike px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                    Your view
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-slate-600">{option.description}</p>
              <p className="mt-3 text-xs font-semibold text-slate-800">
                {option.meta.filledFields}/{option.meta.totalFields} fields filled
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                {option.id === 'recent'
                  ? `${option.meta.detail} · ${formatDraftAt(option.meta.draftAt)}`
                  : option.meta.detail}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/** @param {{ title: string, hint: string, items: Array<{ text: string, count: number }>, onChange: (index: number, text: string) => void }} props */
function TopThreeRankedEditor({ title, hint, items, onChange }) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-600">{hint}</p>
      </div>
      <ol className="space-y-3">
        {items.map((item, index) => (
          <li key={`${title}-${index}`} className="rounded-xl border border-slate-200 bg-white p-3">
            <label className="block space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                #{index + 1}
                {item.count > 0 ? ` · ${item.count} interview ref${item.count === 1 ? '' : 's'}` : ''}
              </span>
              <textarea
                value={item.text}
                onChange={(e) => onChange(index, e.target.value)}
                rows={2}
                placeholder={`Enter ${title.toLowerCase()} #${index + 1} from your squad evidence…`}
                className="w-full rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-800 focus:border-spike focus:outline-none focus:ring-1 focus:ring-spike"
              />
            </label>
          </li>
        ))}
      </ol>
    </section>
  );
}
