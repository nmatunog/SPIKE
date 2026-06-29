import { motion } from 'framer-motion'

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
  investment: '💰',
  finance: '💰',
}

export default function CinematicSituationCard({ situation, domainLabel, domainId }) {
  const domainKey = (domainId ?? domainLabel ?? 'life').toLowerCase().split('_')[0]
  const icon = DOMAIN_ICONS[domainKey] ?? '✨'

  return (
    <motion.article
      initial={{ opacity: 0, scale: 0.94, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="gsv2-situation-card mx-auto flex w-full max-w-4xl flex-col p-6 sm:p-8"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-rose-500/10" />

      <div className="relative flex flex-1 flex-col">
        <span className="inline-flex w-fit rounded-full border border-indigo-300/30 bg-indigo-500/20 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-indigo-200">
          {(situation?.domainLabel ?? domainLabel ?? 'Life').toUpperCase()} SITUATION
        </span>

        <h1 className="mt-4 text-2xl font-black leading-tight tracking-tight text-white sm:text-4xl">
          {situation?.title ?? 'Life presents a moment…'}
        </h1>

        {situation?.narrative && (
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
            {situation.narrative}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-6 pt-8">
          <p className="text-xs italic text-slate-500">
            One meaningful choice this cycle — think like a person, not a spreadsheet.
          </p>
          <div
            className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-5xl shadow-inner"
            aria-hidden
          >
            {icon}
          </div>
        </div>
      </div>
    </motion.article>
  )
}
