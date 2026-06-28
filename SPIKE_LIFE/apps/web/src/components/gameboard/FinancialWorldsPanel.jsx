import {
  ACTIVE_FINANCIAL_WORLD_ID,
  FINANCIAL_WORLDS,
} from '@spike-life/application'

export default function FinancialWorldsPanel({ compact = false }) {
  return (
    <section
      className="rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-sm backdrop-blur-sm"
      aria-label="Financial Worlds"
    >
      <header className={compact ? 'mb-2' : 'mb-3'}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-spike-brand">
          SPIKE LIFE™
        </p>
        <h2 className={`font-semibold text-slate-900 ${compact ? 'text-xs' : 'text-sm'}`}>
          Financial Worlds
        </h2>
      </header>

      <ul className={`space-y-1 ${compact ? '' : 'space-y-1.5'}`} role="list">
        {FINANCIAL_WORLDS.map((world) => {
          const isActive = world.id === ACTIVE_FINANCIAL_WORLD_ID
          const isAvailable = world.status === 'available'

          return (
            <li key={world.id}>
              <button
                type="button"
                disabled={!isAvailable}
                aria-current={isActive ? 'true' : undefined}
                title={
                  isAvailable
                    ? world.title
                    : `${world.title} — coming soon`
                }
                className={`flex w-full items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition-colors ${
                  isActive
                    ? 'border-spike-brand/30 bg-red-50/80 text-slate-900'
                    : isAvailable
                      ? 'border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                      : 'cursor-not-allowed border-transparent bg-slate-50/80 text-slate-400'
                } ${compact ? 'text-xs' : 'text-sm'}`}
              >
                <span className="text-base leading-none" aria-hidden>
                  {world.flag}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium">{world.title}</span>
                {isActive && (
                  <span className="shrink-0 rounded-full bg-spike-brand px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                    Active
                  </span>
                )}
                {!isAvailable && (
                  <span className="shrink-0 text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                    Soon
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
