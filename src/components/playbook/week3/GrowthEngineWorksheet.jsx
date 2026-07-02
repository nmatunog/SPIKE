import { useRef, createElement } from 'react';
import {
  ArrowDown,
  Calculator,
  Download,
  Printer,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { useGrowthEngineWorksheet } from '../../../hooks/useGrowthEngineWorksheet.js';
import { GROWTH_STRATEGY_OPTIONS } from '../../../lib/growthEngineWorksheet/types.js';
import { ENGINE_STEPS } from '../../../lib/businessEngineCanvas/constants.js';
import { exportExecutiveCanvasPdf, exportExecutiveCanvasPng } from '../../../lib/canvasExportService.js';
import { ViewMyFecCanvasLink } from '../../ventureDesign/ViewMyFecCanvasLink.jsx';
import { GrowthEngineFunnelMentalModel } from './GrowthEngineFunnelMentalModel.jsx';

const SECTION =
  'rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8';
const LABEL = 'text-xs font-bold uppercase tracking-[0.15em] text-slate-500';
const TITLE = 'mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl';
const INPUT =
  'mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100';
const TEXTAREA = `${INPUT} min-h-[88px] resize-y`;

/**
 * SPIKE Growth Engine Worksheet™ — Week 3 Day 4 interactive workshop.
 * @param {{ participantId?: string, readOnly?: boolean, onSaved?: () => void, className?: string }} props
 */
export function GrowthEngineWorksheet({
  participantId = '',
  readOnly = false,
  onSaved,
  className = '',
}) {
  const sheetRef = useRef(null);
  const { state, persist, recalcTargets, setWeeklyTarget, setMonthlyTarget, progressPct, saveStatus } =
    useGrowthEngineWorksheet(participantId, { readOnly, onSaved });

  function setField(key, value) {
    persist((prev) => ({ ...prev, [key]: value }));
  }

  function setTarget(key, value) {
    persist((prev) => ({
      ...prev,
      targets: { ...prev.targets, [key]: value },
    }));
  }

  async function exportPdf() {
    if (!sheetRef.current) return;
    await exportExecutiveCanvasPdf(sheetRef.current, 'spike-growth-engine-worksheet.pdf');
  }

  async function exportPng() {
    if (!sheetRef.current) return;
    await exportExecutiveCanvasPng(sheetRef.current, 'spike-growth-engine-worksheet.png');
  }

  const weekly = state.targets.weeklyTargets ?? {};
  const monthly = state.targets.monthlyTargets ?? {};

  return (
    <div className={`mx-auto w-full max-w-[960px] font-sans ${className}`}>
      {!readOnly ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 print:hidden">
          <div className="min-w-0 flex-1">
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-orange-500 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {progressPct}% complete
              {saveStatus === 'saved' ? ' · Saved' : ''}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => window.print()} className={TOOL}>
              <Printer size={16} aria-hidden />
              Print
            </button>
            <button type="button" onClick={exportPdf} className={TOOL}>
              <Download size={16} aria-hidden />
              PDF
            </button>
            <button type="button" onClick={exportPng} className={TOOL}>
              <Download size={16} aria-hidden />
              PNG
            </button>
            <ViewMyFecCanvasLink participantId={participantId} />
          </div>
        </div>
      ) : null}

      <div ref={sheetRef} className="space-y-6 bg-white pb-8">
        <GrowthEngineFunnelMentalModel className="print:break-inside-avoid" />

        {/* Opening reflection */}
        <section className={SECTION}>
          <p className={LABEL}>Opening reflection</p>
          <h2 className={TITLE}>What did you learn yesterday?</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              ['openingBiggestInsight', 'Biggest insight'],
              ['openingBiggestSurprise', 'Biggest surprise'],
              ['openingOneImprovement', 'One thing I will improve'],
            ].map(([key, label]) => (
              <label key={key} className="block">
                <span className="text-sm font-semibold text-slate-800">{label}</span>
                <textarea
                  className={TEXTAREA}
                  value={state[key]}
                  onChange={(e) => setField(key, e.target.value)}
                  readOnly={readOnly}
                  rows={3}
                />
              </label>
            ))}
          </div>
        </section>

        {/* Section 1 */}
        <section className={SECTION}>
          <p className={LABEL}>Section 1</p>
          <h2 className={TITLE}>Why businesses stop growing</h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate-600">
            Businesses don&apos;t fail because demand disappears. They fail because{' '}
            <strong className="text-slate-900">capacity stops growing</strong>.
          </p>
          <label className="mt-6 block">
            <span className="text-sm font-semibold text-slate-800">
              What currently limits your venture?
            </span>
            <textarea
              className={TEXTAREA}
              value={state.capacityLimitReflection}
              onChange={(e) => setField('capacityLimitReflection', e.target.value)}
              readOnly={readOnly}
              rows={4}
            />
          </label>
        </section>

        {/* Section 2 */}
        <section className={SECTION}>
          <p className={LABEL}>Section 2</p>
          <h2 className={TITLE}>Capacity vs activity</h2>
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="px-4 py-3 font-semibold">Activity</th>
                  <th className="px-4 py-3 font-semibold">Capacity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  ['Working harder', 'Building systems'],
                  ['Working alone', 'Developing people'],
                  ['Serving more clients yourself', 'Serving more families'],
                ].map(([activity, capacity]) => (
                  <tr key={activity}>
                    <td className="px-4 py-3 text-slate-600">{activity}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{capacity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <fieldset className="mt-6">
            <legend className="text-sm font-semibold text-slate-800">
              Which side describes your current venture?
            </legend>
            <div className="mt-3 flex flex-wrap gap-3">
              {[
                ['activity', 'Mostly activity'],
                ['capacity', 'Building capacity'],
              ].map(([val, label]) => (
                <label
                  key={val}
                  className={`cursor-pointer rounded-xl border px-4 py-2 text-sm font-medium ${
                    state.capacityVsActivitySide === val
                      ? 'border-orange-400 bg-orange-50 text-orange-900'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="capacitySide"
                    className="sr-only"
                    checked={state.capacityVsActivitySide === val}
                    onChange={() => setField('capacityVsActivitySide', val)}
                    disabled={readOnly}
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
        </section>

        {/* Section 3 — Growth Engine Canvas */}
        <section className={SECTION}>
          <p className={LABEL}>Section 3</p>
          <h2 className={TITLE}>Growth Engine Canvas</h2>
          <p className="mt-2 text-slate-600">How will your venture grow beyond yourself?</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              { key: 'developLeaders', label: 'Develop leaders', icon: Users },
              { key: 'buildSystems', label: 'Build systems', icon: Zap },
              { key: 'increaseCapacity', label: 'Increase capacity', icon: TrendingUp },
              { key: 'expandMarket', label: 'Expand market', icon: ArrowDown },
              { key: 'longTermVision', label: 'Long-term vision', icon: Calculator },
            ].map(({ key, label, icon }) => (
              <label key={key} className={`block rounded-2xl border border-slate-200 p-4 ${key === 'longTermVision' ? 'sm:col-span-2' : ''}`}>
                <span className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  {createElement(icon, { size: 18, className: 'text-orange-500', 'aria-hidden': true })}
                  {label}
                </span>
                <textarea
                  className={`${TEXTAREA} mt-2 bg-white`}
                  value={state[key]}
                  onChange={(e) => setField(key, e.target.value)}
                  readOnly={readOnly}
                  rows={key === 'longTermVision' ? 4 : 3}
                />
              </label>
            ))}
          </div>
        </section>

        {/* Section 4 — Business Growth Targets */}
        <section className={SECTION}>
          <p className={LABEL}>Section 4 · Workshop</p>
          <h2 className={TITLE}>Business growth targets</h2>

          <div className="mt-8 space-y-6">
            <label className="block">
              <span className="text-sm font-bold text-slate-900">Step 1 — Year 1 revenue goal</span>
              <div className="relative mt-2 max-w-xs">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">₱</span>
                <input
                  type="number"
                  className={`${INPUT} pl-10 text-lg font-semibold`}
                  value={state.targets.yearRevenueGoal}
                  onChange={(e) => setTarget('yearRevenueGoal', e.target.value)}
                  readOnly={readOnly}
                />
              </div>
            </label>

            <label className="block">
              <span className="text-sm font-bold text-slate-900">Step 2 — Average revenue per client</span>
              <div className="relative mt-2 max-w-xs">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">₱</span>
                <input
                  type="number"
                  className={`${INPUT} pl-10 text-lg font-semibold`}
                  value={state.targets.averageRevenuePerClient}
                  onChange={(e) => setTarget('averageRevenuePerClient', e.target.value)}
                  readOnly={readOnly}
                />
              </div>
            </label>

            <div className="rounded-2xl border border-orange-200 bg-orange-50/60 p-6">
              <p className="text-sm font-bold text-slate-900">Step 3 — Required clients</p>
              <div className="mt-4 flex flex-wrap items-end gap-3">
                <p className="text-sm text-slate-600">
                  Revenue goal ÷ avg revenue, or enter your own target:
                </p>
                <div className="relative max-w-[200px]">
                  <input
                    type="number"
                    className={`${INPUT} text-lg font-bold text-orange-600`}
                    value={state.targets.requiredClients}
                    onChange={(e) => setTarget('requiredClients', e.target.value)}
                    readOnly={readOnly}
                    aria-label="Required clients"
                  />
                  <span className="mt-1 block text-xs font-medium text-slate-500">clients / year</span>
                </div>
              </div>
              {!readOnly ? (
                <>
                  <button type="button" onClick={recalcTargets} className={RECALC}>
                    Recalculate funnel
                  </button>
                  <p className="mt-2 text-xs text-slate-600">
                    Fills required clients and weekly/monthly targets from your revenue inputs. You can
                    edit any number afterward — changes save until you recalculate again.
                  </p>
                </>
              ) : null}
            </div>

            {/* Business Engine funnel visual */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Business Engine · Weekly funnel
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                {ENGINE_STEPS.map((step, i) => {
                  const weeklyKey =
                    step.id === 'discovery'
                      ? 'discoveryConversations'
                      : step.id === 'presentations'
                        ? 'solutionPresentations'
                        : step.id === 'clients'
                          ? 'newClients'
                          : step.id;
                  return (
                  <div key={step.id} className="flex items-center gap-2">
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-center">
                      <TargetNumberInput
                        currency={step.id === 'revenue'}
                        value={weekly[weeklyKey] ?? ''}
                        onChange={(v) => setWeeklyTarget(weeklyKey, v)}
                        readOnly={readOnly}
                        className="text-lg font-bold"
                      />
                      <p className="text-[10px] font-semibold uppercase text-slate-500">{step.defaultLabel}</p>
                    </div>
                    {i < ENGINE_STEPS.length - 1 ? (
                      <ArrowDown className="rotate-[-90deg] text-slate-300" size={16} aria-hidden />
                    ) : null}
                  </div>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-sm font-bold text-slate-900">Step 4 — Monthly goals</p>
                <dl className="mt-3 space-y-2 text-sm">
                  {[
                    ['newClients', 'Clients'],
                    ['revenue', 'Monthly revenue', true],
                    ['discoverySessions', 'Discovery sessions'],
                    ['solutionPresentations', 'Solution presentations'],
                    ['prospects', 'Prospects'],
                    ['referrals', 'Referrals'],
                  ].map(([key, label, currency]) => (
                    <div key={key} className="flex items-center justify-between gap-2 border-b border-slate-100 py-2">
                      <dt className="text-slate-600">{label}</dt>
                      <dd className="min-w-[7rem] text-right">
                        <TargetNumberInput
                          currency={Boolean(currency)}
                          value={monthly[key] ?? ''}
                          onChange={(v) => setMonthlyTarget(key, v)}
                          readOnly={readOnly}
                        />
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Step 5 — Weekly goals</p>
                <dl className="mt-3 space-y-2 text-sm">
                  {[
                    ['prospects', 'Prospects'],
                    ['discoveryConversations', 'Discovery'],
                    ['solutionPresentations', 'Presentations'],
                    ['newClients', 'Clients'],
                    ['revenue', 'Revenue', true],
                    ['referrals', 'Referrals'],
                  ].map(([key, label, currency]) => (
                    <div key={key} className="flex items-center justify-between gap-2 border-b border-slate-100 py-2">
                      <dt className="text-slate-600">{label}</dt>
                      <dd className="min-w-[7rem] text-right">
                        <TargetNumberInput
                          currency={Boolean(currency)}
                          value={weekly[key] ?? ''}
                          onChange={(v) => setWeeklyTarget(key, v)}
                          readOnly={readOnly}
                        />
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>

          <fieldset className="mt-8">
            <legend className="text-sm font-semibold text-slate-800">
              Can this Business Engine realistically achieve your target?
            </legend>
            <div className="mt-3 flex gap-3">
              {[true, false].map((val) => (
                <label
                  key={String(val)}
                  className={`cursor-pointer rounded-xl border px-4 py-2 text-sm font-bold ${
                    state.engineAchievesTarget === val
                      ? val
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                        : 'border-amber-400 bg-amber-50 text-amber-900'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="engineAchieves"
                    className="sr-only"
                    checked={state.engineAchievesTarget === val}
                    onChange={() => setField('engineAchievesTarget', val)}
                    disabled={readOnly}
                  />
                  {val ? 'YES' : 'NO'}
                </label>
              ))}
            </div>
          </fieldset>
          {state.engineAchievesTarget === false ? (
            <label className="mt-4 block">
              <span className="text-sm font-semibold text-slate-800">What must change?</span>
              <textarea
                className={TEXTAREA}
                value={state.engineChangeIfNo}
                onChange={(e) => setField('engineChangeIfNo', e.target.value)}
                readOnly={readOnly}
                rows={3}
              />
            </label>
          ) : null}
        </section>

        {/* Growth strategy */}
        <section className={SECTION}>
          <p className={LABEL}>Growth strategy</p>
          <h2 className={TITLE}>How will you create more capacity?</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {GROWTH_STRATEGY_OPTIONS.map((opt) => (
              <label
                key={opt.id}
                className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-medium ${
                  state.growthStrategy === opt.id
                    ? 'border-orange-400 bg-orange-500 text-white'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="growthStrategy"
                  className="sr-only"
                  checked={state.growthStrategy === opt.id}
                  onChange={() => setField('growthStrategy', opt.id)}
                  disabled={readOnly}
                />
                {opt.label}
              </label>
            ))}
          </div>
          {state.growthStrategy === 'other' ? (
            <input
              className={INPUT}
              placeholder="Describe your strategy"
              value={state.growthStrategyOther}
              onChange={(e) => setField('growthStrategyOther', e.target.value)}
              readOnly={readOnly}
            />
          ) : null}
          <label className="mt-4 block">
            <span className="text-sm font-semibold text-slate-800">
              Which strategy fits your venture — and why?
            </span>
            <textarea
              className={TEXTAREA}
              value={state.growthStrategyReflection}
              onChange={(e) => setField('growthStrategyReflection', e.target.value)}
              readOnly={readOnly}
              rows={4}
            />
          </label>
        </section>

        {/* FEC Integration */}
        <section className={SECTION}>
          <p className={LABEL}>FEC integration · Box 6</p>
          <h2 className={TITLE}>Growth Engine — three years</h2>
          <p className="mt-2 text-slate-600">
            Describe how your venture will grow over the next three years.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              ['fecYear1Launch', 'Year 1 · Launch'],
              ['fecYear2Expand', 'Year 2 · Expand'],
              ['fecYear3Multiply', 'Year 3 · Multiply'],
            ].map(([key, label]) => (
              <label key={key} className="block rounded-2xl border border-slate-200 p-4">
                <span className="text-sm font-bold text-orange-600">{label}</span>
                <textarea
                  className={`${TEXTAREA} mt-2 bg-white`}
                  value={state[key]}
                  onChange={(e) => setField(key, e.target.value)}
                  readOnly={readOnly}
                  rows={5}
                />
              </label>
            ))}
          </div>
        </section>

        {/* Venture Pitch checklist */}
        <section className={SECTION}>
          <p className={LABEL}>Venture pitch preparation</p>
          <h2 className={TITLE}>Before Friday</h2>
          <p className="mt-2 text-sm text-slate-600">
            Refine your Financial Entrepreneurship Canvas. Finalize Business Engine and Growth Engine.
            Prepare your 5-minute Venture Pitch.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              ['pitchClientExperience', 'Client Experience complete'],
              ['pitchWinningStrategy', 'Winning Strategy complete'],
              ['pitchBusinessEngine', 'Business Engine complete'],
              ['pitchGrowthEngine', 'Growth Engine complete'],
              ['pitchRevenueTargets', 'Revenue targets calculated'],
              ['pitchCapacityPlan', 'Capacity plan drafted'],
            ].map(([key, label]) => (
              <li key={key}>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={state[key]}
                    onChange={(e) => setField(key, e.target.checked)}
                    disabled={readOnly}
                    className="h-5 w-5 rounded border-slate-300 text-orange-600"
                  />
                  <span className="text-sm font-medium text-slate-800">{label}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

const TOOL =
  'inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50';

const RECALC =
  'mt-4 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600';

/**
 * @param {{
 *   value?: number | string,
 *   onChange: (value: string) => void,
 *   readOnly?: boolean,
 *   currency?: boolean,
 *   className?: string,
 * }} props
 */
function TargetNumberInput({ value, onChange, readOnly = false, currency = false, className = '' }) {
  if (readOnly) {
    const display =
      value === '' || value == null
        ? '—'
        : currency
          ? `₱${Number(value).toLocaleString()}`
          : String(value);
    return <span className={`font-semibold text-slate-900 tabular-nums ${className}`}>{display}</span>;
  }

  return (
    <div className={`relative inline-flex w-full max-w-[8rem] items-center ${className}`}>
      {currency ? (
        <span className="pointer-events-none absolute left-2 text-xs font-bold text-slate-400">₱</span>
      ) : null}
      <input
        type="number"
        inputMode="numeric"
        className={`w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-right text-sm font-semibold text-slate-900 tabular-nums outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 ${
          currency ? 'pl-6' : ''
        }`}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
