import { ArrowRight, CheckCircle2, Circle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FecCanvasLayout } from '../ventureDesign/FecCanvasLayout.jsx';
import { deriveMyVentureHq } from '../../lib/myVentureHqService.js';
import { StageGateCelebrationCard } from '../../components/stageGate/StageGateCelebrationCard.jsx';
import { StageGateJourneyPanel } from '../../components/stageGate/StageGateJourneyPanel.jsx';
import { getActiveProgramStageLabel } from '../../lib/stageGateParticipantStorage.js';

/**
 * Venture-centric intern home — replaces week-first Build Studio landing.
 * @param {{
 *   participantId: string,
 *   state: { week: number, day: number, segment?: number, blueprint_completion?: number },
 *   squadNameFallback?: string,
 * }} props
 */
export function MyVentureHQ({ participantId, state, squadNameFallback = '' }) {
  const { identity, stage, today, milestones, fecPreview } = deriveMyVentureHq(
    participantId,
    state,
    squadNameFallback,
  );
  const programStage = getActiveProgramStageLabel(participantId);

  return (
    <div className="mx-auto max-w-3xl space-y-0 divide-y divide-slate-200/90">
      <StageGateCelebrationCard participantId={participantId} />
      {/* MY VENTURE */}
      <section className="pb-8 pt-2 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">My Venture</p>
        <h1
          className={`mt-3 text-3xl font-bold tracking-tight sm:text-4xl ${
            identity.hasNamedVenture ? 'text-slate-900' : 'text-slate-400'
          }`}
        >
          {identity.ventureName}
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-base italic text-slate-600 sm:text-lg">
          &ldquo;{identity.tagline}&rdquo;
        </p>
      </section>

      {/* CURRENT STAGE */}
      <section className="py-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Current Stage</p>
        <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">{programStage}</p>
        <p className="mt-1 text-sm font-medium text-slate-500">{stage.stageLabel}</p>
        <div className="mt-4">
          <div
            className="h-2.5 overflow-hidden rounded-full bg-slate-200"
            role="progressbar"
            aria-valuenow={stage.progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Venture milestone progress"
          >
            <div
              className="h-full rounded-full bg-spike transition-all duration-700"
              style={{ width: `${stage.progressPercent}%` }}
            />
          </div>
          <p className="mt-1.5 text-right text-xs font-semibold text-slate-500">
            {stage.progressPercent}%
          </p>
        </div>
      </section>

      <StageGateJourneyPanel participantId={participantId} />

      {/* TODAY */}
      <section className="py-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Today</p>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">{today.title}</h2>
        <p className="mt-1 text-sm text-slate-600">
          Estimated time: {today.estimatedMinutes} min
        </p>
        <Link
          to={today.href}
          className="mt-5 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-spike px-8 py-3 text-base font-semibold text-white shadow-md shadow-spike/20 transition hover:bg-spike-light"
        >
          {today.continueLabel}
          <ArrowRight size={18} />
        </Link>
      </section>

      {/* YOUR VENTURE checklist */}
      <section className="py-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Your Venture</p>
        <ul className="mt-4 space-y-2.5">
          {milestones.milestones.map((item) => (
            <li key={item.id}>
              <Link
                to={item.href}
                className="flex items-center gap-3 rounded-lg px-1 py-1.5 text-slate-800 transition hover:bg-slate-50"
              >
                {item.complete ? (
                  <CheckCircle2 size={20} className="shrink-0 text-emerald-600" aria-hidden />
                ) : (
                  <Circle size={20} className="shrink-0 text-slate-300" aria-hidden />
                )}
                <span className={item.complete ? 'font-medium text-slate-700' : 'text-slate-600'}>
                  {item.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* FEC Live Preview */}
      <section className="py-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
            Financial Entrepreneurship Canvas
          </p>
          <Link
            to={fecPreview.canvasHref}
            className="text-sm font-semibold text-spike hover:underline"
          >
            Live Preview →
          </Link>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50/50 p-2 sm:p-4">
          <div className="pointer-events-none min-w-[640px] scale-[0.92] origin-top-left sm:scale-100">
            <FecCanvasLayout
              mode={fecPreview.mode}
              variant="embedded"
              showHeader={false}
              showFooter={false}
              centerContent={fecPreview.centerContent}
              uvpDetailContent={fecPreview.uvpDetailContent}
              boxContents={fecPreview.boxContents}
            />
          </div>
        </div>
        {!fecPreview.centerContent ? (
          <p className="mt-3 text-center text-sm text-slate-500">
            Your canvas fills in as you work through Venture Design Studio.
          </p>
        ) : null}
      </section>
    </div>
  );
}
