import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Compass,
  LayoutTemplate,
  Layers,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { CircularProgress } from '../components/blueprint/CircularProgress.jsx';
import {
  FEC_AGENCY_BUILDER_EXTENSIONS,
  FEC_CANVAS_TITLE,
  FEC_SHORT_LABEL,
  FEC_SPIKE_FLOW,
  FEC_TOP_BANNER,
  FEC_UVP_HELPER,
  FEC_UVP_SUGGESTIVE_EXAMPLE,
  FEC_V2_PILLARS,
} from '../lib/fecCanvasConstants.js';
import {
  computeFecCanvasCompletionPct,
  getFecField,
  getFecSummaryField,
  getFecUnifiedVentureProposition,
  getVentureScorecard,
  prepareFecCanvas,
} from '../lib/fecCanvasService.js';
import { BLUEPRINT_LINKS, ROUTES } from '../routes/paths.js';

const FEC_V1_GOAL_PCT = 30;

const PILLAR_ICONS = {
  create_value: Sparkles,
  capture_value: TrendingUp,
  enable_value: Layers,
  prove_value: Target,
};

const PILLAR_ACCENTS = {
  create_value: 'border-violet-200 bg-violet-50/80 text-violet-900',
  capture_value: 'border-emerald-200 bg-emerald-50/80 text-emerald-900',
  enable_value: 'border-sky-200 bg-sky-50/80 text-sky-900',
  prove_value: 'border-amber-200 bg-amber-50/80 text-amber-900',
};

/**
 * @param {{
 *   participantId: string,
 *   participantName?: string,
 *   careerTrack?: string,
 * }} props
 */
export function VentureDesignStudio({
  participantId,
  participantName = 'Builder',
  careerTrack = 'agency_builder',
}) {
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    prepareFecCanvas(participantId);
    setRefreshKey((k) => k + 1);
  }, [participantId]);

  const completion = useMemo(
    () => computeFecCanvasCompletionPct(participantId, careerTrack === 'agency_builder'),
    [participantId, careerTrack, refreshKey],
  );

  const uvp = useMemo(
    () => getFecUnifiedVentureProposition(participantId),
    [participantId, refreshKey],
  );

  const flowProgress = useMemo(() => {
    return FEC_SPIKE_FLOW.map((step) => {
      let filled = false;
      if (step.kind === 'summary' && step.fieldKey === 'unified_venture_proposition') {
        filled = uvp.trim().length >= 20;
      } else if (step.kind === 'scorecard') {
        const scorecard = getVentureScorecard(participantId);
        filled = Object.values(scorecard).some((value) => String(value).trim().length > 0);
      } else if (step.kind === 'roadmap_success') {
        const narrative = String(getFecSummaryField(participantId, 'success_narrative')).trim();
        filled = narrative.length >= 5;
      } else if (step.engineKey && step.fieldKey) {
        const value = getFecField(participantId, step.engineKey, step.fieldKey);
        filled = String(value).trim().length >= 10;
      }
      return { ...step, filled };
    });
  }, [participantId, uvp, refreshKey]);

  const flowComplete = flowProgress.filter((step) => step.filled).length;
  const workshopHref = `${ROUTES.ventureBlueprint}/canvas/edit`;
  const summaryHref = BLUEPRINT_LINKS.canvasSummary;
  const firstName = participantName.trim().split(/\s+/)[0] || 'Builder';
  const goalMet = completion >= FEC_V1_GOAL_PCT;

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-spike-dark p-6 text-white shadow-2xl sm:p-8 lg:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-16 h-72 w-72 rounded-full bg-spike/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 left-0 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl"
        />

        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-spike-light/90">
            Venture Design Studio
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
            {FEC_CANVAS_TITLE}
          </h1>
          <p className="mt-4 max-w-2xl text-base text-slate-300 sm:text-lg">
            {firstName}, your canvas is your operating model — not a one-page plan. You will design how
            you create, capture, enable, and prove value for the venture you are building.
          </p>

          <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-wrap items-center gap-4">
              <CircularProgress
                value={completion}
                label={goalMet ? `${FEC_SHORT_LABEL} v1 ready` : `Goal: ${FEC_V1_GOAL_PCT}% for v1`}
              />
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-2xs font-bold uppercase tracking-wide text-spike-light">Day 4 target</p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {goalMet
                    ? 'FE Canvas v1 draft complete — refine or present.'
                    : `${FEC_V1_GOAL_PCT}% completion unlocks your portfolio canvas section.`}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link to={workshopHref} className="spike-btn-primary inline-flex min-h-[48px] items-center gap-2">
                {completion > 0 ? 'Continue FEC Workshop' : 'Start FEC Workshop'}
                <ArrowRight size={18} />
              </Link>
              <Link
                to={summaryHref}
                className="inline-flex min-h-[48px] items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                <LayoutTemplate size={16} />
                Executive Summary
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-spike/20 bg-spike-muted/30 px-4 py-4 sm:px-6">
        <p className="flex items-start gap-2 text-sm font-medium leading-relaxed text-spike">
          <Compass size={18} className="mt-0.5 shrink-0" aria-hidden />
          {FEC_TOP_BANNER}
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="rounded-3xl border-2 border-spike/30 bg-gradient-to-br from-white to-spike-muted/20 p-6 shadow-card sm:p-8">
          <p className="spike-label text-spike">Center · Step 0</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">Unified Venture Proposition</h2>
          <p className="mt-3 text-sm text-slate-600">{FEC_UVP_HELPER}</p>
          <div className="mt-5 rounded-2xl border border-dashed border-spike/25 bg-white/80 p-4">
            {uvp.trim() ? (
              <p className="text-sm font-medium leading-relaxed text-slate-800">{uvp}</p>
            ) : (
              <p className="text-sm italic leading-relaxed text-slate-500">{FEC_UVP_SUGGESTIVE_EXAMPLE}</p>
            )}
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Every box on your canvas should strengthen this one proposition.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
          <p className="spike-label text-slate-500">SPIKE Flow</p>
          <h2 className="mt-2 text-xl font-bold text-slate-900">Guided build order</h2>
          <p className="mt-2 text-sm text-slate-600">
            Coaches and interns follow the same sequence — start at the center, then work outward.
          </p>
          <ol className="mt-5 space-y-2">
            {flowProgress.map((step) => (
              <li
                key={`${step.step}-${step.fieldKey}`}
                className={`flex items-start gap-3 rounded-xl px-3 py-2 text-sm ${
                  step.filled ? 'bg-emerald-50 text-emerald-900' : 'bg-slate-50 text-slate-700'
                }`}
              >
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    step.filled ? 'bg-emerald-500 text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200'
                  }`}
                >
                  {step.filled ? '✓' : step.step}
                </span>
                <span>
                  <span className="font-semibold">{step.question}</span>
                  {step.kind === 'scorecard' ? (
                    <span className="block text-xs opacity-80">Venture Scorecard — metrics you can prove</span>
                  ) : null}
                  {step.kind === 'roadmap_success' ? (
                    <span className="block text-xs opacity-80">12 / 24 / 36-month roadmap + success statement</span>
                  ) : null}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-xs font-semibold text-slate-500">
            {flowComplete} of {flowProgress.length} flow checkpoints started
          </p>
        </div>
      </section>

      <section>
        <header className="mb-5">
          <h2 className="text-xl font-bold text-slate-900">Four pillars of value</h2>
          <p className="mt-1 text-sm text-slate-600">
            Your {FEC_SHORT_LABEL} is organized around four questions every venture must answer.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(FEC_V2_PILLARS).map(([key, pillar]) => {
            const Icon = PILLAR_ICONS[key] ?? Layers;
            const accent = PILLAR_ACCENTS[key] ?? PILLAR_ACCENTS.enable_value;
            return (
              <article key={key} className={`rounded-2xl border p-5 ${accent}`}>
                <div className="mb-3 flex items-center gap-2">
                  <Icon size={18} aria-hidden />
                  <h3 className="text-sm font-bold uppercase tracking-wide">
                    Pillar {pillar.pillarNumber} · {pillar.label}
                  </h3>
                </div>
                {pillar.fields.length ? (
                  <ul className="space-y-2">
                    {pillar.fields.map((field) => (
                      <li
                        key={field.key}
                        className="rounded-lg bg-white/70 px-3 py-2 text-sm font-medium text-slate-800"
                      >
                        {field.label}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-lg bg-white/70 px-3 py-2 text-sm font-medium text-slate-800">
                    Venture Scorecard — revenue, growth, and impact metrics
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {careerTrack === 'agency_builder' ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-6">
          <h2 className="text-lg font-bold text-amber-950">Agency Builder extensions</h2>
          <p className="mt-2 text-sm text-amber-900">
            Agency Builder track interns also document talent recruitment and leadership scale — below the
            core one-page board.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {Object.entries(FEC_AGENCY_BUILDER_EXTENSIONS).map(([key, section]) => (
              <div key={key} className="rounded-xl border border-amber-200/80 bg-white/80 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-800">{section.label}</p>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  {section.fields.map((field) => (
                    <li key={field.key}>· {field.label}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:flex sm:items-center sm:justify-between sm:gap-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Ready to draft your operating model?</h2>
          <p className="mt-2 text-sm text-slate-600">
            The workshop auto-saves every two seconds. Client Growth and FNA work can feed your Venture
            Scorecard as you build.
          </p>
        </div>
        <Link
          to={workshopHref}
          className="mt-4 inline-flex shrink-0 items-center gap-2 rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800 sm:mt-0"
        >
          Open {FEC_SHORT_LABEL} Workshop
          <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
}
