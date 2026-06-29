const CARD_THEMES = [
  {
    marker: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    hover: 'hover:border-emerald-400 hover:bg-emerald-50/30',
    ring: 'ring-emerald-500',
  },
  {
    marker: 'bg-blue-50 text-blue-600 border-blue-200',
    hover: 'hover:border-blue-400 hover:bg-blue-50/30',
    ring: 'ring-blue-500',
  },
  {
    marker: 'bg-purple-50 text-purple-600 border-purple-200',
    hover: 'hover:border-purple-400 hover:bg-purple-50/30',
    ring: 'ring-purple-500',
  },
  {
    marker: 'bg-amber-50 text-amber-600 border-amber-200',
    hover: 'hover:border-amber-400 hover:bg-amber-50/30',
    ring: 'ring-amber-500',
  },
]

const DOMAIN_ICONS = {
  career: '💼',
  opportunity: '💡',
  family: '👨‍👩‍👧',
  health: '❤️',
  business: '📈',
  lifestyle: '🛍️',
  housing: '🏠',
  education: '🎓',
  government: '🏛️',
  community: '🤝',
  chance: '🎲',
  milestone: '🏆',
}

export default function PremiumSituationStage({
  situation,
  options = [],
  selectedIndex = 0,
  onSelect,
  onConfirm,
  canDecide,
  deciding,
  error,
  domainLabel,
  impactTags = [],
}) {
  const domainKey = (domainLabel ?? situation?.domainLabel ?? 'life').toLowerCase().replace(/\s+/g, '_')
  const icon = DOMAIN_ICONS[domainKey.split('_')[0]] ?? '❓'

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
      {/* Situation panel */}
      <article className="life-glass-panel flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 md:flex-row md:p-6">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded border border-indigo-200 bg-indigo-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-indigo-700">
              {(situation?.domainLabel ?? domainLabel ?? 'Life').toUpperCase()} SITUATION
            </span>
          </div>
          <h2 className="text-xl font-black tracking-wide text-slate-900 md:text-2xl">
            {situation?.title ?? 'What will you do?'}
          </h2>
          {situation?.narrative && (
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{situation.narrative}</p>
          )}

          {impactTags.length > 0 && (
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {impactTags.map((tag) => (
                <div
                  key={tag.label}
                  className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-center"
                >
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-500">
                    {tag.label}
                  </span>
                  <span className="text-xs font-bold text-slate-800">{tag.value}</span>
                </div>
              ))}
            </div>
          )}

          {situation?.learningObjective && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-100/50 p-3">
              <span className="block text-[10px] font-bold uppercase text-slate-500">
                Advisor notes
              </span>
              <p className="mt-1 text-xs text-slate-600">{situation.learningObjective}</p>
            </div>
          )}
        </div>

        <div className="flex w-full shrink-0 flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-4 text-center shadow-sm md:w-40">
          <span className="text-5xl" aria-hidden>
            {icon}
          </span>
          <span className="mt-2 text-xs font-bold text-slate-600">Story moment</span>
        </div>
      </article>

      {/* Decision cards */}
      <section className="life-glass-panel rounded-2xl p-4 md:p-6">
        <p className="mb-4 text-center text-xs font-black uppercase tracking-[0.25em] text-indigo-600">
          Choose one natural human response
        </p>

        {error && (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {options.map((opt, index) => {
            const theme = CARD_THEMES[index % CARD_THEMES.length]
            const selected = selectedIndex === index
            const letter = String.fromCharCode(65 + index)

            return (
              <button
                key={opt.strategy}
                type="button"
                disabled={!canDecide || deciding}
                onClick={() => onSelect?.(index)}
                className={`group flex flex-col rounded-xl border bg-white p-3.5 text-left shadow-sm transition disabled:opacity-50 ${
                  theme.hover
                } ${selected ? `ring-2 ${theme.ring} bg-indigo-50/20` : 'border-slate-200'}`}
              >
                <div className="flex items-start gap-2">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded border text-sm font-bold shadow-inner ${theme.marker}`}
                  >
                    {letter}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold leading-tight text-slate-800 group-hover:text-indigo-950">
                      {opt.label}
                    </p>
                    {opt.description && (
                      <p className="mt-1 text-[11px] leading-snug text-slate-500">{opt.description}</p>
                    )}
                  </div>
                </div>
                {(opt.costLabel || opt.outcomePreview) && (
                  <div className="mt-3 space-y-1 border-t border-slate-100 pt-2 text-[10px]">
                    {opt.costLabel && (
                      <p className="font-mono font-bold text-slate-500">{opt.costLabel}</p>
                    )}
                    {opt.outcomePreview && (
                      <p className="italic text-slate-400">{opt.outcomePreview}</p>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {options.length > 0 && (
          <div className="mt-5 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row">
            <p className="text-xs italic text-slate-500">
              Every choice updates your financial story behind the scenes.
            </p>
            <button
              type="button"
              disabled={!canDecide || deciding}
              onClick={onConfirm}
              className="focus-game w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-10 py-3.5 text-sm font-extrabold uppercase tracking-widest text-white shadow-lg transition hover:-translate-y-0.5 disabled:opacity-50 sm:w-auto"
            >
              {deciding ? 'Deciding…' : 'Confirm decision'}
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
