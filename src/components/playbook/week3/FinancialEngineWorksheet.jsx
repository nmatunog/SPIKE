import { useRef } from 'react';
import { Calculator, Download, LineChart, Printer, RefreshCw, Scale, TrendingUp } from 'lucide-react';
import { useFinancialEngineWorksheet } from '../../../hooks/useFinancialEngineWorksheet.js';
import { exportExecutiveCanvasPdf, exportExecutiveCanvasPng } from '../../../lib/canvasExportService.js';
import { ViewMyFecCanvasLink } from '../../ventureDesign/ViewMyFecCanvasLink.jsx';

const SECTION =
  'rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8';
const LABEL = 'text-xs font-bold uppercase tracking-[0.15em] text-slate-500';
const TITLE = 'mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl';
const INPUT =
  'mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100';
const TEXTAREA = `${INPUT} min-h-[88px] resize-y`;

/**
 * SPIKE Financial Engine Worksheet™ — Week 3 Day 4 (after Growth Engine).
 * @param {{ participantId?: string, readOnly?: boolean, onSaved?: () => void, className?: string }} props
 */
export function FinancialEngineWorksheet({
  participantId = '',
  readOnly = false,
  onSaved,
  className = '',
}) {
  const sheetRef = useRef(null);
  const {
    state,
    refreshFromGrowth,
    recalcFinancials,
    setRevenueField,
    setEconomicsField,
    setScalingField,
    setSustainabilityField,
    importHint,
    progressPct,
    saveStatus,
  } = useFinancialEngineWorksheet(participantId, { readOnly, onSaved });

  async function exportPdf() {
    if (!sheetRef.current) return;
    await exportExecutiveCanvasPdf(sheetRef.current, 'spike-financial-engine-worksheet.pdf');
  }

  async function exportPng() {
    if (!sheetRef.current) return;
    await exportExecutiveCanvasPng(sheetRef.current, 'spike-financial-engine-worksheet.png');
  }

  const importedLabel = state.importedFromGrowthAt
    ? `Linked to Growth Engine · ${new Date(state.importedFromGrowthAt).toLocaleString()}`
    : 'Import from Growth Engine to populate revenue and scaling targets.';

  return (
    <div className={`mx-auto w-full max-w-[960px] font-sans ${className}`}>
      {!readOnly ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 print:hidden">
          <div className="min-w-0 flex-1">
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {progressPct}% complete
              {saveStatus === 'saved' ? ' · Saved to FEC Box 8' : ''}
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
        <section className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 sm:p-8">
          <p className={LABEL}>Financial Engine</p>
          <h2 className={TITLE}>Turn growth targets into venture economics</h2>
          <p className="mt-3 max-w-2xl text-sm text-slate-600">
            Revenue model, economics, and scaling from your Growth Engine worksheet — synced to FEC Box 8
            (Financial Engine) for your Venture Pitch.
          </p>
          {!readOnly ? (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button type="button" onClick={refreshFromGrowth} className={IMPORT_BTN} title="Pull latest Year 1 revenue, funnel, and 3-year growth narrative from Growth Engine">
                <RefreshCw size={16} aria-hidden />
                Import from Growth Engine
              </button>
              <button
                type="button"
                onClick={recalcFinancials}
                className={RECALC_BTN}
                title="Recalculate margin, break-even, and FEC narratives from the numbers below"
              >
                <Calculator size={16} aria-hidden />
                Recalculate economics
              </button>
              <span className="text-xs text-slate-500">{importedLabel}</span>
            </div>
          ) : null}
          {importHint ? <p className="mt-2 text-sm text-amber-700">{importHint}</p> : null}
        </section>

        <section className={SECTION}>
          <p className={LABEL}>Revenue model · FEC</p>
          <h2 className={TITLE}>
            <TrendingUp className="mr-2 inline-block text-emerald-600" size={28} aria-hidden />
            Revenue at target run-rate
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ['year1Revenue', 'Year 1 revenue', true],
              ['monthlyRevenue', 'Monthly revenue', true],
              ['weeklyRevenue', 'Weekly revenue', true],
              ['revenuePerClient', 'Revenue per client', true],
              ['requiredClients', 'Required clients (Y1)', false],
            ].map(([key, label, currency]) => (
              <label key={key} className="block rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
                <FinNumberInput
                  className="mt-2"
                  value={state.revenueModel[key]}
                  onChange={(v) => setRevenueField(key, v)}
                  readOnly={readOnly}
                  currency={currency}
                />
              </label>
            ))}
          </div>
          <label className="mt-6 block">
            <span className="text-sm font-semibold text-slate-800">Revenue model narrative (FEC · Revenue Model)</span>
            <textarea
              className={TEXTAREA}
              value={state.revenueModel.streamsNarrative}
              onChange={(e) => setRevenueField('streamsNarrative', e.target.value)}
              readOnly={readOnly}
              rows={8}
            />
          </label>
        </section>

        <section className={SECTION}>
          <p className={LABEL}>Economics · FEC</p>
          <h2 className={TITLE}>
            <Scale className="mr-2 inline-block text-emerald-600" size={28} aria-hidden />
            Cost structure & margin
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['variableCostsMonthly', 'Variable costs / month', true],
              ['fixedCostsMonthly', 'Fixed costs / month', true],
              ['contributionPerClient', 'Contribution / client', true],
              ['marginPercent', 'Operating margin %', false],
            ].map(([key, label, currency]) => (
              <label key={key} className="block rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
                <FinNumberInput
                  className="mt-2"
                  value={state.economics[key]}
                  onChange={(v) => setEconomicsField(key, v)}
                  readOnly={readOnly}
                  currency={currency}
                />
              </label>
            ))}
          </div>
          <label className="mt-6 block">
            <span className="text-sm font-semibold text-slate-800">Economics narrative (FEC · Economics)</span>
            <textarea
              className={TEXTAREA}
              value={state.economics.costStructureNarrative}
              onChange={(e) => setEconomicsField('costStructureNarrative', e.target.value)}
              readOnly={readOnly}
              rows={7}
            />
          </label>
        </section>

        <section className={SECTION}>
          <p className={LABEL}>Scaling · 3-year trajectory</p>
          <h2 className={TITLE}>
            <LineChart className="mr-2 inline-block text-emerald-600" size={28} aria-hidden />
            Capture scaling
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Revenue and client capacity scale from Growth Engine — edit to reflect your reinvestment plan.
          </p>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[32rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-4">Year</th>
                  <th className="py-2 pr-4">Revenue</th>
                  <th className="py-2">Clients</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['year1Revenue', 'year1Clients', 'Year 1 · Launch'],
                  ['year2Revenue', 'year2Clients', 'Year 2 · Expand'],
                  ['year3Revenue', 'year3Clients', 'Year 3 · Multiply'],
                ].map(([revKey, clientKey, label]) => (
                  <tr key={revKey} className="border-b border-slate-100">
                    <td className="py-3 pr-4 font-semibold text-slate-800">{label}</td>
                    <td className="py-3 pr-4">
                      <FinNumberInput
                        value={state.scaling[revKey]}
                        onChange={(v) => setScalingField(revKey, v)}
                        readOnly={readOnly}
                        currency
                      />
                    </td>
                    <td className="py-3">
                      <FinNumberInput
                        value={state.scaling[clientKey]}
                        onChange={(v) => setScalingField(clientKey, v)}
                        readOnly={readOnly}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <label className="mt-4 block">
            <span className="text-sm font-semibold text-slate-800">How will you invest in capacity?</span>
            <textarea
              className={TEXTAREA}
              value={state.scaling.capacityInvestment}
              onChange={(e) => setScalingField('capacityInvestment', e.target.value)}
              readOnly={readOnly}
              rows={3}
              placeholder="Team, systems, technology, training…"
            />
          </label>
          <label className="mt-4 block">
            <span className="text-sm font-semibold text-slate-800">Scaling narrative (included in FEC sustainability)</span>
            <textarea
              className={TEXTAREA}
              value={state.scaling.scalingNarrative}
              onChange={(e) => setScalingField('scalingNarrative', e.target.value)}
              readOnly={readOnly}
              rows={8}
            />
          </label>
        </section>

        <section className={SECTION}>
          <p className={LABEL}>Sustainability · FEC</p>
          <h2 className={TITLE}>Profit formula & break-even</h2>
          <label className="mt-4 block max-w-xs rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Break-even monthly revenue
            </span>
            <FinNumberInput
              className="mt-2"
              value={state.sustainability.breakEvenMonthlyRevenue}
              onChange={(v) => setSustainabilityField('breakEvenMonthlyRevenue', v)}
              readOnly={readOnly}
              currency
            />
          </label>
          <label className="mt-4 block">
            <span className="text-sm font-semibold text-slate-800">Reinvestment plan</span>
            <textarea
              className={TEXTAREA}
              value={state.sustainability.reinvestmentPlan}
              onChange={(e) => setSustainabilityField('reinvestmentPlan', e.target.value)}
              readOnly={readOnly}
              rows={3}
            />
          </label>
          <label className="mt-4 block">
            <span className="text-sm font-semibold text-slate-800">
              Sustainability narrative (FEC · Sustainability & Profit)
            </span>
            <textarea
              className={TEXTAREA}
              value={state.sustainability.profitFormulaNarrative}
              onChange={(e) => setSustainabilityField('profitFormulaNarrative', e.target.value)}
              readOnly={readOnly}
              rows={7}
            />
          </label>
        </section>
      </div>
    </div>
  );
}

const TOOL =
  'inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50';

const IMPORT_BTN =
  'inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-100';

const RECALC_BTN =
  'inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700';

/**
 * @param {{
 *   value?: number | string,
 *   onChange: (value: string) => void,
 *   readOnly?: boolean,
 *   currency?: boolean,
 *   className?: string,
 * }} props
 */
function FinNumberInput({ value, onChange, readOnly = false, currency = false, className = '' }) {
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
    <div className={`relative inline-flex w-full max-w-[10rem] items-center ${className}`}>
      {currency ? (
        <span className="pointer-events-none absolute left-2 text-xs font-bold text-slate-400">₱</span>
      ) : null}
      <input
        type="number"
        inputMode="numeric"
        className={`w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-right text-sm font-semibold text-slate-900 tabular-nums outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 ${
          currency ? 'pl-6' : ''
        }`}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
