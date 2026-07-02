import {
  formatPitchPeso,
  PITCH_PANEL_CAPITAL,
  PITCH_PANEL_COMMENT_MAX_CHARS,
  PITCH_PANEL_INVESTMENT_INCREMENT,
  PITCH_PANEL_INVESTMENT_PRESETS,
} from '../../lib/staff/pitchPanelConstants.js';
import { AnimatedPeso } from './PitchPanelCelebration.jsx';

const INPUT_CLASS =
  'mt-1.5 w-full min-h-[48px] rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100';

/**
 * @param {{ remaining: number, className?: string }} props
 */
export function VentureCapitalHeader({ remaining, className = '' }) {
  return (
    <div
      className={`rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-6 text-white shadow-xl ring-1 ring-orange-500/30 sm:p-8 ${className}`}
    >
      <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-400">SPIKE Venture Capital</p>
      <p className="mt-2 text-sm text-slate-400">Available Capital</p>
      <p className="mt-1 text-4xl font-black tracking-tight text-white sm:text-5xl">
        {formatPitchPeso(PITCH_PANEL_CAPITAL)}
      </p>
      <div className="mt-6 flex items-end justify-between gap-4 border-t border-slate-700/80 pt-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Remaining Capital</p>
          <p className="mt-1 text-2xl font-bold text-orange-400 sm:text-3xl">
            <AnimatedPeso value={remaining} />
          </p>
        </div>
        <p className="max-w-[10rem] text-right text-xs leading-relaxed text-slate-500">
          Allocate up to ₱1M across all squads. ₱0 is allowed.
        </p>
      </div>
    </div>
  );
}

/**
 * @param {{
 *   squadName: string,
 *   amount: number,
 *   comment: string,
 *   remaining: number,
 *   provisional?: boolean,
 *   readOnly?: boolean,
 *   onAmountChange: (n: number) => void,
 *   onCommentChange: (s: string) => void,
 * }} props
 */
export function InvestmentAllocationPanel({
  squadName,
  amount,
  comment,
  remaining,
  provisional = true,
  readOnly = false,
  onAmountChange,
  onCommentChange,
}) {
  const otherAllocated = PITCH_PANEL_CAPITAL - remaining - amount;
  const maxForSquad = PITCH_PANEL_CAPITAL - otherAllocated;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Round 1 · Initial interest</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">{squadName}</h2>
        </div>
        {provisional && !readOnly ? (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-800">
            Provisional
          </span>
        ) : null}
      </div>

      <p className="mt-3 text-sm text-slate-600">
        Invest based on confidence, scalability, viability, growth potential, and presentation.
      </p>

      <div className="mt-6">
        <p className="text-sm font-semibold text-slate-700">Investment</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PITCH_PANEL_INVESTMENT_PRESETS.map((preset) => {
            const selected = amount === preset;
            const disabled = readOnly || preset > maxForSquad;
            return (
              <button
                key={preset}
                type="button"
                disabled={disabled}
                onClick={() => onAmountChange(preset)}
                className={`min-h-[52px] touch-manipulation rounded-xl border px-2 py-2 text-sm font-bold transition active:scale-[0.98] ${
                  selected
                    ? 'border-orange-500 bg-orange-500 text-white shadow-md'
                    : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300 disabled:opacity-40'
                }`}
              >
                {formatPitchPeso(preset)}
              </button>
            );
          })}
        </div>

        <label className="mt-4 block text-sm font-semibold text-slate-700">
          Custom amount (₱10,000 increments)
          <input
            type="number"
            inputMode="numeric"
            step={PITCH_PANEL_INVESTMENT_INCREMENT}
            min={0}
            max={maxForSquad}
            value={amount || ''}
            onChange={(e) => onAmountChange(Math.max(0, Number(e.target.value) || 0))}
            readOnly={readOnly}
            className={INPUT_CLASS}
          />
        </label>
      </div>

      <label className="mt-4 block text-sm font-semibold text-slate-700">
        Reason for investment <span className="font-normal text-slate-400">(optional)</span>
        <input
          type="text"
          maxLength={PITCH_PANEL_COMMENT_MAX_CHARS}
          value={comment}
          onChange={(e) => onCommentChange(e.target.value)}
          readOnly={readOnly}
          placeholder="e.g. Excellent scalability"
          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
        />
        <span className="mt-1 block text-right text-xs text-slate-400">
          {comment.length}/{PITCH_PANEL_COMMENT_MAX_CHARS}
        </span>
      </label>

      {amount > maxForSquad ? (
        <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          Allocation exceeds remaining capital ({formatPitchPeso(remaining)} left).
        </p>
      ) : null}
    </section>
  );
}

/**
 * @param {{
 *   squads: string[],
 *   allocations: Record<string, { amount: number, comment?: string, isFinal?: boolean }>,
 *   remaining: number,
 *   readOnly?: boolean,
 *   onChange: (squadName: string, amount: number) => void,
 * }} props
 */
export function InvestmentPortfolioReview({ squads, allocations, remaining, readOnly = false, onChange }) {
  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Round 2 · Investment Committee</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">Portfolio review</h2>
        <p className="mt-2 text-sm text-slate-600">
          Compare all ventures side by side. Adjust allocations, then finalize your portfolio.
        </p>
      </div>

      <div className="space-y-3">
        {squads.map((squad) => {
          const row = allocations[squad] ?? { amount: 0, comment: '' };
          return (
            <div key={squad} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900">{squad}</p>
                  {!row.isFinal && row.amount > 0 ? (
                    <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800">
                      Provisional
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={readOnly}
                    onClick={() => onChange(squad, Math.max(0, row.amount - 50_000))}
                    className="min-h-[44px] min-w-[44px] rounded-xl border border-slate-200 bg-slate-50 text-lg font-bold disabled:opacity-40"
                  >
                    −
                  </button>
                  <span className="min-w-[7rem] text-center text-lg font-bold tabular-nums text-orange-600">
                    {formatPitchPeso(row.amount)}
                  </span>
                  <button
                    type="button"
                    disabled={readOnly || remaining < 50_000}
                    onClick={() => onChange(squad, row.amount + 50_000)}
                    className="min-h-[44px] min-w-[44px] rounded-xl border border-slate-200 bg-slate-50 text-lg font-bold disabled:opacity-40"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    disabled={readOnly}
                    onClick={() => onChange(squad, 0)}
                    className="min-h-[44px] rounded-xl border border-red-200 px-3 text-xs font-bold text-red-700 disabled:opacity-40"
                  >
                    Remove
                  </button>
                </div>
              </div>
              {row.comment ? (
                <p className="mt-2 text-xs italic text-slate-500">&ldquo;{row.comment}&rdquo;</p>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wide text-orange-800">Remaining capital</p>
        <p className="mt-1 text-2xl font-bold text-orange-600">
          <AnimatedPeso value={remaining} />
        </p>
      </div>
    </section>
  );
}

/**
 * @param {{ leaderboard: Array<{ squadName: string, totalInvestment: number }> }} props
 */
export function PitchFundingResults({ leaderboard }) {
  const medals = ['🥇', '🥈', '🥉'];
  const labels = ['Champion', 'Runner-up', 'Third'];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-orange-500">SPIKE</p>
        <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-slate-900 sm:text-5xl">
          Venture Funding
        </h1>
        <p className="mt-2 text-lg font-semibold text-slate-500">Results</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {leaderboard.slice(0, 3).map((row, idx) => (
          <div
            key={row.squadName}
            className={`rounded-3xl border p-6 text-center shadow-lg ${
              idx === 0
                ? 'border-amber-300 bg-gradient-to-b from-amber-50 to-white ring-2 ring-amber-400/50'
                : 'border-slate-200 bg-white'
            }`}
          >
            <p className="text-4xl">{medals[idx] ?? ''}</p>
            <p className="mt-2 text-xs font-bold uppercase tracking-wide text-slate-500">
              {labels[idx] ?? `#${idx + 1}`}
            </p>
            <p className="mt-2 text-xl font-bold text-slate-900">{row.squadName}</p>
            <p className="mt-3 text-sm text-slate-500">Investment received</p>
            <p className={`mt-1 text-2xl font-black tabular-nums ${idx === 0 ? 'text-amber-600' : 'text-orange-600'}`}>
              {formatPitchPeso(row.totalInvestment)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
