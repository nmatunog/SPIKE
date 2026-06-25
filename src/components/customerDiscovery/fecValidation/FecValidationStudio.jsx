import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, Sparkles, Star } from 'lucide-react';
import {
  approveEvidenceBoard,
  approveFecBoxEvolution,
  approveStudio3,
  buildStudioPitchSlides,
  generateVentureEvolutionReport,
  getFecStudioState,
} from '../../../lib/customerDiscovery/week2FecStudioService.js';
import { FEC_STUDIO_PHASES, PITCH_SLIDE_KEYS } from '../../../lib/customerDiscovery/week2FecValidationConstants.js';
import { FecValidationCanvas, SquadRolesBanner } from './FecValidationShared.jsx';
import { hydrateParticipantFecValidation } from '../../../lib/customerDiscovery/week2FecValidationSync.js';
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
    void hydrateParticipantFecValidation(participantId).then(() => refresh());
    void hydrateSquadWeek2Discovery(participantId).then(() => refresh());
  }, [participantId]);

  const studio = useMemo(() => getFecStudioState(participantId), [participantId, tick]);
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
      </section>

      <section className="rounded-xl border border-indigo-100 bg-indigo-50/80 px-4 py-4 text-sm text-indigo-950">
        <p className="font-semibold">How to encode your FEC Canvas today</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-indigo-900">
          <li>Open <strong>Studio 1</strong> — review interview evidence and approve the market summary.</li>
          <li>Open <strong>Studio 2</strong> — for each FEC box, edit the Week 2 draft and tap <strong>Approve → update FEC</strong>.</li>
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

      <p className="text-center text-xs text-slate-500">
        Or use <strong>Mission track</strong> on the right — Learn → Evolve → Act.
      </p>
    </div>
  );
}

/** @param {{ studio: ReturnType<typeof getFecStudioState>, participantId: string, onSaved: () => void, onNext: () => void, onNavigate?: (slug: string) => void }} props */
function Studio1Evidence({ studio, participantId, onSaved, onNext, onNavigate }) {
  const board = studio.evidenceBoard;
  const [summary, setSummary] = useState(board.marketSummary);
  const [starred, setStarred] = useState(board.starredQuotes ?? []);

  useEffect(() => {
    setSummary(board.marketSummary);
    setStarred(board.starredQuotes ?? []);
  }, [participantId]);

  function toggleStar(quote) {
    setStarred((prev) => {
      if (prev.includes(quote)) return prev.filter((q) => q !== quote);
      if (prev.length >= 5) return prev;
      return [...prev, quote];
    });
  }

  return (
    <div className="space-y-8 pb-8">
      <StudioPhaseNav phases={studio.phases} activeSlug="fec-studio-1" onNavigate={onNavigate} />
      <StudioHeader phase={FEC_STUDIO_PHASES[0]} />

      {board.quotes.length === 0 ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          No interview quotes yet — go back to <strong>Day 2 Discover</strong> and encode interviews, then return here. You can still edit the market summary below and approve.
        </p>
      ) : null}

      <section className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Top quotes</h3>
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

      <section className="space-y-3">
        <h3 className="text-lg font-bold text-slate-900">Top problems</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {board.problems.map((p) => (
            <div key={p.text} className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-sm font-medium text-slate-900">{p.text}</p>
              <p className="mt-1 text-xs font-bold text-spike">{p.count} interview refs</p>
            </div>
          ))}
        </div>
      </section>

      <InsightSection title="Top goals" items={board.goals} />
      <InsightSection title="Top themes" items={board.themes} tag />

      <section className="rounded-xl border border-spike/20 bg-spike/5 p-4 space-y-3">
        <p className="flex items-center gap-2 text-sm font-bold text-spike"><Sparkles size={16} /> Market summary</p>
        {['values', 'struggles', 'needs'].map((key) => (
          <textarea
            key={key}
            value={summary[key] ?? ''}
            onChange={(e) => setSummary({ ...summary, [key]: e.target.value })}
            rows={2}
            className="w-full rounded-lg border border-spike/10 bg-white p-3 text-sm"
          />
        ))}
      </section>

      <button
        type="button"
        className="spike-btn-primary w-full sm:w-auto"
        onClick={() => {
          approveEvidenceBoard(participantId, { marketSummary: summary, starredQuotes: starred });
          onSaved();
          onNext();
        }}
      >
        Approve evidence board → save to FEC &amp; portfolio
      </button>
      <p className="text-xs text-slate-500">This encodes <strong>Who we serve</strong> on your FEC Canvas and unlocks Studio 2.</p>
    </div>
  );
}

/** @param {{ studio: ReturnType<typeof getFecStudioState>, participantId: string, onSaved: () => void, onNext: () => void, onNavigate?: (slug: string) => void }} props */
function Studio2Evolution({ studio, participantId, onSaved, onNext, onNavigate }) {
  const [activeBox, setActiveBox] = useState(0);
  const boxes = studio.evolutionBoxes;
  const box = boxes[activeBox];
  const [week2Draft, setWeek2Draft] = useState(box?.week2 ?? '');
  const [verdict, setVerdict] = useState(box?.verdict || 'keep');
  const clarity = studio.clarity;
  const allDone = boxes.every((b) => b.complete);

  useEffect(() => {
    if (box) {
      setWeek2Draft(box.week2 || box.week2Suggested);
      setVerdict(box.verdict || 'keep');
    }
  }, [activeBox, participantId]);

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
        For each FEC box: read Week 1 vs Week 2, edit the draft if needed, choose Keep / Refine / Rebuild, then tap <strong>Approve → update FEC</strong>.
      </p>

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
                onChange={(e) => setWeek2Draft(e.target.value)}
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
                onClick={() => setVerdict(opt.id)}
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
  const [strategic, setStrategic] = useState(studio.lab.fec.steps['fec-step-5']?.approvedStatement ?? '');
  const [nextExp, setNextExp] = useState(studio.nextExperiment || 'Run a protection-gap conversation with 3 new prospects.');
  const [buildDir, setBuildDir] = useState(studio.week3BuildDirection || 'Prototype Week 3 build around validated problem and UVP v2.');
  const [slides, setSlides] = useState(() => {
    const existing = studio.pitchSlides ?? {};
    if (existing.mission) return existing;
    return buildStudioPitchSlides(participantId);
  });
  const report = studio.ventureReport?.topInsight ? studio.ventureReport : generateVentureEvolutionReport(participantId);

  return (
    <div className="space-y-8 pb-8">
      <StudioPhaseNav phases={studio.phases} activeSlug="fec-studio-3" onNavigate={onNavigate} />
      <StudioHeader phase={FEC_STUDIO_PHASES[2]} />

      <p className="text-lg font-semibold text-slate-900">Now that the market has spoken… what should happen next?</p>

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

/** @param {{ title: string, items: string[], tag?: boolean }} props */
function InsightSection({ title, items, tag }) {
  return (
    <section>
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      {items.length ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {items.map((item) => (
            <span key={item} className={`rounded-lg px-3 py-2 text-sm ${tag ? 'bg-spike/10 font-medium text-spike' : 'bg-slate-50 text-slate-700'}`}>
              {item}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-slate-400">Encode more interviews to populate.</p>
      )}
    </section>
  );
}
