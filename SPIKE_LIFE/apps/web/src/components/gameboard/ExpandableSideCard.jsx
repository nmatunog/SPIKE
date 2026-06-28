import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

export default function ExpandableSideCard({
  id,
  title,
  subtitle,
  summary,
  preview,
  expanded,
  onToggle,
  accent = 'slate',
  forceOpen = false,
  children,
}) {
  const reduceMotion = useReducedMotion()
  const isOpen = forceOpen || expanded === id
  const accentBorder = accent === 'brand' ? 'border-spike-brand/30' : 'border-slate-200/70'
  const accentBg =
    accent === 'brand'
      ? 'bg-gradient-to-br from-red-50/90 via-white to-white'
      : 'bg-white'

  return (
    <motion.section
      layout={!reduceMotion}
      aria-labelledby={`card-${id}-title`}
      className={`game-card-elevated overflow-hidden ${accentBorder} ${accentBg} ${
        isOpen && accent === 'brand' ? 'ring-2 ring-spike-brand/10' : ''
      }`}
    >
      <button
        type="button"
        id={`card-${id}-title`}
        onClick={() => !forceOpen && onToggle(isOpen ? null : id)}
        className={`focus-game flex w-full touch-manipulation items-start gap-4 px-5 py-4 text-left ${
          forceOpen ? 'cursor-default' : 'hover:bg-slate-50/60'
        }`}
        aria-expanded={isOpen}
        disabled={forceOpen}
      >
        <div className="min-w-0 flex-1">
          <p className="text-label uppercase text-slate-500">{title}</p>
          <AnimatePresence mode="wait">
            <motion.p
              key={subtitle ?? 'empty'}
              initial={reduceMotion ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="mt-1.5 text-display-sm text-spike-ink"
            >
              {subtitle}
            </motion.p>
          </AnimatePresence>
          {!isOpen && preview}
          {!isOpen && !preview && summary && (
            <p className="mt-2 line-clamp-2 text-body text-slate-600">{summary}</p>
          )}
        </div>
        {!forceOpen && (
          <motion.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="mt-1 shrink-0 text-xl text-slate-400"
            aria-hidden
          >
            ▾
          </motion.span>
        )}
      </button>
      <AnimatePresence initial={false}>
        {isOpen && children && (
          <motion.div
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-slate-100/90"
          >
            <div className="max-h-[min(40vh,18rem)] overflow-y-auto px-5 py-5 text-body xl:max-h-[min(36vh,20rem)]">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  )
}
