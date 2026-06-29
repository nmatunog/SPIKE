import DecisionTimerRing from './DecisionTimerRing.jsx'

const TONE_STYLES = {
  positive: 'border-emerald-500/40 bg-emerald-950/30 hover:border-emerald-400/60',
  neutral: 'border-slate-500/40 bg-slate-900/50 hover:border-slate-400/60',
  warning: 'border-amber-500/40 bg-amber-950/20 hover:border-amber-400/60',
  critical: 'border-red-500/50 bg-red-950/30 hover:border-red-400/60',
}

const TONE_DOTS = {
  positive: 'bg-emerald-400',
  neutral: 'bg-slate-400',
  warning: 'bg-amber-400',
  critical: 'bg-red-500',
}

export default function LifeDecisionStage({
  situation,
  options = [],
  canDecide,
  deciding,
  error,
  decisionTimerSeconds,
  cycleDeadlineAt,
  onDecide,
  onTimerExpire,
  onDismiss,
}) {
  if (!situation && !options.length) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/85 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <article className="flex max-h-[95dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl sm:rounded-3xl">
        <header className="border-b border-white/10 px-5 py-5 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-300/90">
                {situation?.domainLabel ?? 'Life moment'}
              </p>
              <h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">
                {situation?.title ?? 'What will you do?'}
              </h2>
            </div>
            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="text-slate-400 hover:text-white"
                aria-label="Close"
              >
                ✕
              </button>
            )}
          </div>
          {situation?.narrative && (
            <p className="mt-3 text-sm leading-relaxed text-slate-300">{situation.narrative}</p>
          )}
          {canDecide && decisionTimerSeconds > 0 && (
            <div className="mt-4">
              <DecisionTimerRing
                deadlineAt={cycleDeadlineAt}
                totalSeconds={decisionTimerSeconds}
                active={canDecide}
                onExpire={onTimerExpire}
              />
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Choose one — think like a person, not a spreadsheet
          </p>
          {error && (
            <p className="mb-3 rounded-lg bg-red-950/50 px-3 py-2 text-sm text-red-200">{error}</p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {options.map((opt) => {
              const tone = opt.tone ?? 'neutral'
              return (
                <button
                  key={opt.strategy}
                  type="button"
                  disabled={!canDecide || deciding}
                  onClick={() => onDecide?.(opt.strategy)}
                  className={`rounded-2xl border p-4 text-left transition disabled:opacity-50 ${TONE_STYLES[tone] ?? TONE_STYLES.neutral}`}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${TONE_DOTS[tone] ?? TONE_DOTS.neutral}`}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white">{opt.label}</p>
                      {opt.description && (
                        <p className="mt-1 text-xs leading-relaxed text-slate-400">{opt.description}</p>
                      )}
                      {(opt.costLabel || opt.outcomePreview) && (
                        <dl className="mt-3 space-y-1 text-[11px]">
                          {opt.costLabel && (
                            <div className="flex justify-between gap-2 text-slate-500">
                              <dt>Cost</dt>
                              <dd className="font-medium text-slate-300">{opt.costLabel}</dd>
                            </div>
                          )}
                          {opt.outcomePreview && (
                            <div className="flex justify-between gap-2 text-slate-500">
                              <dt>Outcome</dt>
                              <dd className="font-medium text-slate-300">{opt.outcomePreview}</dd>
                            </div>
                          )}
                        </dl>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </article>
    </div>
  )
}
