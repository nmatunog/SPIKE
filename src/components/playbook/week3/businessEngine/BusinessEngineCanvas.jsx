import { useRef, useState } from 'react';
import { motion } from 'framer-motion';

const MotionDiv = motion.div;
import {
  ArrowRight,
  Calculator,
  ChevronLeft,
  ChevronRight,
  Download,
  MessageSquare,
  Presentation,
  Redo2,
  RotateCcw,
  Star,
  Target,
  Undo2,
  UserCheck,
  Users,
  TrendingUp,
  Settings,
  ClipboardList,
  BarChart3,
} from 'lucide-react';
import { useBusinessEngineCanvas } from '../../../../hooks/useBusinessEngineCanvas.js';
import {
  BEC_BRAND,
  BUSINESS_LEVERS,
  ENGINE_STEPS,
  GROWTH_SIM_METRICS,
  MONTHLY_METRICS,
  PROCESS_BANNER,
  WEEKLY_METRICS,
  YEAR1_KPIS,
} from '../../../../lib/businessEngineCanvas/constants.js';
import { cascadeFromProspects, syncGrowthFromProspects } from '../../../../lib/businessEngineCanvas/funnel.js';
import { exportExecutiveCanvasPng, exportExecutiveCanvasPdf } from '../../../../lib/canvasExportService.js';
import { ViewMyFecCanvasLink } from '../../../ventureDesign/ViewMyFecCanvasLink.jsx';

const TOOL_BTN =
  'inline-flex min-h-[44px] touch-manipulation items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-40 lg:min-h-[48px] lg:px-4 lg:text-sm';

const NAV_BTN =
  'inline-flex min-h-[48px] touch-manipulation items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-orange-300 hover:bg-orange-50 disabled:opacity-40';

const ICONS = {
  users: Users,
  messages: MessageSquare,
  presentation: Presentation,
  'user-check': UserCheck,
  peso: () => <span className="text-2xl font-black">₱</span>,
  referrals: Users,
  star: Star,
  gears: Settings,
  clipboard: ClipboardList,
  chart: BarChart3,
};

const BANNER_ICONS = {
  gears: Settings,
  clipboard: ClipboardList,
  users: Users,
  chart: BarChart3,
};

/**
 * SPIKE Business Engine Canvas™ — interactive Week 3 Day 3 workshop.
 * @param {{ participantId: string, readOnly?: boolean, onSaved?: () => void, className?: string }} props
 */
export function BusinessEngineCanvas({ participantId, readOnly = false, onSaved, className = '' }) {
  const canvasRef = useRef(null);
  const [page, setPage] = useState(1);
  const {
    state,
    persist,
    progressPct,
    saveStatus,
    undo,
    redo,
    canUndo,
    canRedo,
    setWeeklyTarget,
    setMonthlyTarget,
    recalcMonthlyFromWeekly,
  } = useBusinessEngineCanvas(participantId, { readOnly, onSaved });

  function updateEngineStep(stepId, patch) {
    persist((prev) => {
      const activityEngine = {
        ...prev.activityEngine,
        [stepId]: { ...prev.activityEngine[stepId], ...patch },
      };
      let next = { ...prev, activityEngine };
      if (stepId === 'prospects' || stepId === 'revenue') {
        const prospects = stepId === 'prospects' ? Number(patch.value) : Number(activityEngine.prospects?.value);
        const revPer = Number(activityEngine.revenue?.value) || 10000;
        const c = cascadeFromProspects(prospects, revPer);
        next = {
          ...next,
          weeklyTargets: {
            prospects: c.prospects,
            discoveryConversations: c.discovery,
            solutionPresentations: c.presentations,
            newClients: c.clients,
            revenue: c.revenue,
            referrals: c.referrals,
          },
          growthSimulation: {
            current: {
              prospects: c.prospects,
              discovery: c.discovery,
              presentations: c.presentations,
              clients: c.clients,
              revenue: c.revenue,
              referrals: c.referrals,
            },
            new: syncGrowthFromProspects(prev, prospects * 2).new,
          },
        };
        if (!Object.values(next.monthlyManualOverride).some(Boolean)) {
          next.monthlyTargets = {
            prospects: c.prospects * 4,
            discoverySessions: c.discovery * 4,
            solutionPresentations: c.presentations * 4,
            newClients: c.clients * 4,
            revenue: c.revenue * 4,
            referrals: c.referrals * 4,
          };
        }
      }
      return next;
    });
  }

  function updateGrowthNew(metricId, raw) {
    const num = Number(raw);
    persist((prev) => {
      if (metricId === 'prospects' && Number.isFinite(num)) {
        const revPer = Number(prev.activityEngine.revenue?.value) || 10000;
        const cascaded = cascadeFromProspects(num, revPer);
        return {
          ...prev,
          growthSimulation: {
            ...prev.growthSimulation,
            new: {
              prospects: cascaded.prospects,
              discovery: cascaded.discovery,
              presentations: cascaded.presentations,
              clients: cascaded.clients,
              revenue: cascaded.revenue,
              referrals: cascaded.referrals,
            },
          },
        };
      }
      return {
        ...prev,
        growthSimulation: {
          ...prev.growthSimulation,
          new: { ...prev.growthSimulation.new, [metricId]: raw },
        },
      };
    });
  }

  async function exportPng() {
    if (!canvasRef.current) return;
    await exportExecutiveCanvasPng(canvasRef.current, 'spike-business-engine-canvas.png');
  }

  async function exportPdf() {
    if (!canvasRef.current) return;
    await exportExecutiveCanvasPdf(canvasRef.current, 'spike-business-engine-canvas.pdf');
  }

  function printCanvas() {
    window.print();
  }

  return (
    <div className={`mx-auto w-full max-w-[1200px] font-sans ${className}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 print:hidden">
        <div className="min-w-0 flex-1">
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <MotionDiv
              className="h-full rounded-full"
              style={{ backgroundColor: BEC_BRAND.orange }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-600">
            {progressPct}% completed
            {saveStatus === 'saved' ? ' · Saved' : ' · Autosaves every 3s'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!readOnly ? (
            <>
              <button type="button" onClick={undo} disabled={!canUndo} className={TOOL_BTN} aria-label="Undo">
                <Undo2 size={16} />
              </button>
              <button type="button" onClick={redo} disabled={!canRedo} className={TOOL_BTN} aria-label="Redo">
                <Redo2 size={16} />
              </button>
            </>
          ) : null}
          <button type="button" onClick={exportPng} className={TOOL_BTN}>
            <Download size={16} /> PNG
          </button>
          <button type="button" onClick={exportPdf} className={TOOL_BTN}>
            <Download size={16} /> PDF
          </button>
          <button type="button" onClick={printCanvas} className={TOOL_BTN}>
            Print
          </button>
        </div>
      </div>

      <div
        ref={canvasRef}
        className="bec-canvas space-y-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8 print:border-0 print:shadow-none"
      >
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: BEC_BRAND.orange }}>
              Week 3 • Day 3 · Workshop
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: BEC_BRAND.navy }}>
              {page === 1 ? (
                <>
                  Build Your <span style={{ color: BEC_BRAND.orange }}>Business Engine</span>
                </>
              ) : (
                <>
                  Build Your <span style={{ color: BEC_BRAND.orange }}>Business Dashboard</span>
                </>
              )}
            </h1>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
              SPIKE Business Engine Canvas™ · Page {page} of 2
            </p>
          </div>
          <div className="text-right">
            <p className="text-xl font-black tracking-tight text-slate-900">SPIKE</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Financial Entrepreneurship</p>
          </div>
        </header>

        {page === 1 ? (
          <PageOne
            state={state}
            readOnly={readOnly}
            updateEngineStep={updateEngineStep}
            setWeeklyTarget={setWeeklyTarget}
            setMonthlyTarget={setMonthlyTarget}
            recalcMonthlyFromWeekly={recalcMonthlyFromWeekly}
            persist={persist}
          />
        ) : (
          <PageTwo state={state} readOnly={readOnly} persist={persist} updateGrowthNew={updateGrowthNew} />
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex gap-2">
          <button type="button" disabled={page <= 1} onClick={() => setPage(1)} className={NAV_BTN}>
            <ChevronLeft size={16} /> Page 1
          </button>
          <button type="button" disabled={page >= 2} onClick={() => setPage(2)} className={NAV_BTN}>
            Page 2 <ChevronRight size={16} />
          </button>
        </div>
        <ViewMyFecCanvasLink exit="/playbook?segment=1&week=3&day=3" compact label="Open FEC Canvas" />
      </div>
    </div>
  );
}

/** @param {any} props */
function PageOne({
  state,
  readOnly,
  updateEngineStep,
  setWeeklyTarget,
  setMonthlyTarget,
  recalcMonthlyFromWeekly,
  persist,
}) {
  return (
    <>
      <section>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Part A · Your Activity Engine</p>
        <p className="mt-1 text-sm text-slate-600">
          Use the 10–5–3–1–₱10,000–3 Model to design your weekly operating system.
        </p>

        <div className="mt-8 overflow-x-auto pb-2">
          <div className="flex min-w-[720px] items-center justify-center gap-2 sm:gap-3">
            {ENGINE_STEPS.map((step, idx) => {
              const Icon = ICONS[step.icon] ?? Users;
              const data = state.activityEngine[step.id];
              return (
                <div key={step.id} className="flex items-center gap-2">
                  <MotionDiv
                    whileHover={{ scale: readOnly ? 1 : 1.02 }}
                    className="flex w-[100px] flex-col items-center rounded-xl border border-slate-200 bg-slate-50/80 px-2 py-4 text-center sm:w-[120px]"
                  >
                    <input
                      type="number"
                      readOnly={readOnly}
                      value={data?.value ?? step.defaultValue}
                      onChange={(e) => updateEngineStep(step.id, { value: Number(e.target.value) })}
                      className="w-full rounded-lg bg-transparent text-center text-3xl font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-400/50"
                      aria-label={step.defaultLabel}
                    />
                    <Icon size={22} className="mt-2 text-orange-500" aria-hidden />
                    <input
                      readOnly={readOnly}
                      value={data?.label ?? step.defaultLabel}
                      onChange={(e) => updateEngineStep(step.id, { label: e.target.value })}
                      className="mt-2 w-full bg-transparent text-center text-[9px] font-bold uppercase leading-tight tracking-wide text-slate-600 focus:outline-none"
                    />
                  </MotionDiv>
                  {idx < ENGINE_STEPS.length - 1 ? (
                    <ArrowRight size={20} className="shrink-0 text-orange-500" aria-hidden />
                  ) : (
                    <RotateCcw size={20} className="shrink-0 text-orange-500" aria-hidden title="Referral loop" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="overflow-hidden rounded-xl border border-slate-200">
          <div className="px-4 py-3 text-sm font-bold text-white" style={{ backgroundColor: BEC_BRAND.navy }}>
            Weekly Target
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-2 text-left font-semibold text-slate-600">Metric</th>
                <th className="px-4 py-2 text-left font-semibold text-slate-600">Target</th>
              </tr>
            </thead>
            <tbody>
              {WEEKLY_METRICS.map((row) => (
                <tr key={row.id} className="border-b border-slate-50">
                  <td className="px-4 py-2.5 text-slate-700">{row.label}</td>
                  <td className="px-4 py-2">
                    <InlineNumberInput
                      readOnly={readOnly}
                      currency={row.currency}
                      value={state.weeklyTargets[row.id]}
                      onChange={(v) => setWeeklyTarget(row.id, v)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200">
          <div
            className="flex items-center justify-between px-4 py-3 text-sm font-bold text-white"
            style={{ backgroundColor: BEC_BRAND.navy }}
          >
            <span>Part B · Monthly Projection</span>
            {!readOnly ? (
              <button
                type="button"
                onClick={recalcMonthlyFromWeekly}
                className="flex items-center gap-1 text-xs font-semibold text-orange-200 hover:text-white"
              >
                <Calculator size={14} /> Weekly × 4
              </button>
            ) : null}
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-2 text-left font-semibold text-slate-600">Metric</th>
                <th className="px-4 py-2 text-left font-semibold text-slate-600">Monthly</th>
              </tr>
            </thead>
            <tbody>
              {MONTHLY_METRICS.map((row) => (
                <tr key={row.id} className="border-b border-slate-50">
                  <td className="px-4 py-2.5 text-slate-700">{row.label}</td>
                  <td className="px-4 py-2">
                    <InlineNumberInput
                      readOnly={readOnly}
                      currency={row.currency}
                      value={state.monthlyTargets[row.id]}
                      onChange={(v) => setMonthlyTarget(row.id, v, true)}
                    />
                    {state.monthlyManualOverride[row.id] ? (
                      <Calculator size={12} className="ml-1 inline text-orange-600" aria-label="Manual override" />
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <section className="rounded-xl border-2 border-slate-200 bg-slate-50 p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <Target size={32} className="shrink-0 text-orange-500" aria-hidden />
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold text-slate-900 sm:text-xl">
              Can this engine produce the business you want?
            </h3>
            <textarea
              readOnly={readOnly}
              rows={3}
              value={state.reflections.engineProducesBusiness ?? ''}
              onChange={(e) =>
                persist((p) => ({
                  ...p,
                  reflections: { ...p.reflections, engineProducesBusiness: e.target.value },
                }))
              }
              placeholder="Short reflection…"
              className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400/20"
            />
          </div>
        </div>
      </section>
    </>
  );
}

/** @param {any} props */
function PageTwo({ state, readOnly, persist, updateGrowthNew }) {
  const projectedRevenue = Number(state.growthSimulation.new.revenue) || 0;
  const currentRevenue = Number(state.growthSimulation.current.revenue) || 0;
  const revenueDelta = projectedRevenue - currentRevenue;

  return (
    <>
      <section>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Year 1 Targets</p>
        <p className="mb-4 mt-1 text-sm text-slate-600">Set your Year 1 targets for your Business Engine.</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {YEAR1_KPIS.map((kpi) => (
            <div key={kpi.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{kpi.label}</p>
              <InlineNumberInput
                readOnly={readOnly}
                currency={kpi.currency}
                value={state.year1Targets[kpi.id]}
                onChange={(v) => persist((p) => ({ ...p, year1Targets: { ...p.year1Targets, [kpi.id]: v } }))}
                className="mt-2 text-2xl font-black"
              />
            </div>
          ))}
        </div>
      </section>

      <section>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Business Levers</p>
        <p className="mb-3 mt-1 text-sm text-slate-600">
          Circle the ONE lever that will create the biggest improvement.
        </p>
        <div className="flex flex-wrap gap-2">
          {BUSINESS_LEVERS.map((lever) => {
            const active = state.businessLever === lever.id;
            return (
              <button
                key={lever.id}
                type="button"
                disabled={readOnly}
                onClick={() => persist((p) => ({ ...p, businessLever: lever.id }))}
                className={`min-h-[48px] rounded-full px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'border border-slate-200 bg-white text-slate-700 hover:border-orange-300'
                }`}
              >
                {active ? '● ' : '○ '}
                {lever.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200">
        <div className="px-4 py-3" style={{ backgroundColor: BEC_BRAND.navy }}>
          <p className="text-sm font-bold text-white">Growth Simulation</p>
          <p className="text-xs text-slate-300">If we improve ONE number, what happens to the rest of the engine?</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="px-4 py-2 text-left font-semibold">Lever</th>
                <th className="px-4 py-2 text-left font-semibold">Current</th>
                <th className="px-4 py-2 text-left font-semibold">New</th>
                <th className="px-4 py-2 text-left font-semibold">Difference</th>
              </tr>
            </thead>
            <tbody>
              {GROWTH_SIM_METRICS.map((row) => {
                const cur = Number(state.growthSimulation.current[row.id]) || 0;
                const neu = Number(state.growthSimulation.new[row.id]) || 0;
                const diff = neu - cur;
                return (
                  <tr key={row.id} className="border-b border-slate-50">
                    <td className="px-4 py-2 font-medium text-slate-700">{row.label}</td>
                    <td className="px-4 py-2 tabular-nums text-slate-600">
                      {row.currency ? `₱${cur.toLocaleString()}` : cur}
                    </td>
                    <td className="px-4 py-2">
                      <InlineNumberInput
                        readOnly={readOnly}
                        currency={row.currency}
                        value={state.growthSimulation.new[row.id]}
                        onChange={(v) => updateGrowthNew(row.id, v)}
                      />
                    </td>
                    <td
                      className={`px-4 py-2 tabular-nums font-semibold ${diff >= 0 ? 'text-emerald-700' : 'text-red-600'}`}
                    >
                      {diff >= 0 ? '+' : ''}
                      {row.currency ? `₱${diff.toLocaleString()}` : diff}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-orange-50">
                <td className="px-4 py-3 font-bold text-slate-900" colSpan={2}>
                  Projected Revenue
                </td>
                <td className="px-4 py-3 text-lg font-black tabular-nums text-slate-900">
                  ₱{projectedRevenue.toLocaleString()}
                </td>
                <td
                  className={`px-4 py-3 font-bold tabular-nums ${revenueDelta >= 0 ? 'text-emerald-700' : 'text-red-600'}`}
                >
                  {revenueDelta >= 0 ? '+' : ''}₱{revenueDelta.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Reflection</p>
        {[
          { key: 'biggestWeakness', label: 'What is the biggest weakness in your Business Engine?' },
          { key: 'firstImprovement', label: 'What activity should your team improve first?' },
        ].map((q) => (
          <label key={q.key} className="block">
            <span className="text-sm font-semibold text-slate-800">{q.label}</span>
            <textarea
              readOnly={readOnly}
              rows={2}
              value={state.reflections[q.key] ?? ''}
              onChange={(e) =>
                persist((p) => ({ ...p, reflections: { ...p.reflections, [q.key]: e.target.value } }))
              }
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-orange-400 focus:outline-none"
            />
          </label>
        ))}
        <label className="block">
          <span className="text-sm font-semibold text-slate-800">
            What Year 1 Revenue Target are you committing to?
          </span>
          <div className="mt-3 rounded-2xl border-2 border-orange-400 bg-orange-50/50 px-6 py-5">
            <div className="flex items-center gap-2">
              <span className="text-4xl font-black text-slate-900">₱</span>
              <input
                readOnly={readOnly}
                type="text"
                inputMode="numeric"
                value={state.reflections.year1RevenueGoal ?? ''}
                onChange={(e) =>
                  persist((p) => ({
                    ...p,
                    reflections: {
                      ...p.reflections,
                      year1RevenueGoal: e.target.value.replace(/[^\d]/g, ''),
                    },
                  }))
                }
                placeholder="0"
                className="min-w-0 flex-1 bg-transparent text-4xl font-black text-slate-900 focus:outline-none sm:text-5xl"
              />
            </div>
          </div>
        </label>
      </section>

      <section className="rounded-xl bg-slate-100 px-4 py-5">
        <div className="flex flex-wrap items-center justify-center gap-3 text-center sm:gap-6">
          {PROCESS_BANNER.map((step, idx) => {
            const BannerIcon = BANNER_ICONS[step.icon] ?? TrendingUp;
            return (
              <div key={step.label} className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1">
                  <BannerIcon size={20} className="text-orange-500" aria-hidden />
                  <p className="max-w-[140px] text-[10px] font-bold uppercase leading-tight tracking-wide text-slate-700 sm:text-xs">
                    {step.label}
                  </p>
                </div>
                {idx < PROCESS_BANNER.length - 1 ? (
                  <MotionDiv animate={{ x: [0, 3, 0] }} transition={{ repeat: Infinity, duration: 2.5 }}>
                    <ArrowRight size={16} className="hidden text-orange-400 sm:block" aria-hidden />
                  </MotionDiv>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}

/** @param {{ readOnly?: boolean, currency?: boolean, value: unknown, onChange: (v: number | string) => void, className?: string }} props */
function InlineNumberInput({ readOnly, currency, value, onChange, className = '' }) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {currency ? <span className="text-sm font-semibold text-slate-500">₱</span> : null}
      <input
        readOnly={readOnly}
        type="text"
        inputMode="numeric"
        value={value ?? ''}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^\d]/g, '');
          onChange(raw === '' ? '' : Number(raw));
        }}
        className="min-h-[44px] w-full min-w-[80px] rounded-lg border border-transparent bg-transparent px-2 py-1 font-semibold tabular-nums text-slate-900 hover:border-slate-200 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-400/20"
      />
    </div>
  );
}
