import { useMemo } from 'react'
import { motion } from 'framer-motion'
import DomainTile from './DomainTile.jsx'

export default function DomainCarousel({
  domains = [],
  rolling = false,
  scanHighlightId = null,
  selectedDomainId = null,
  winnerLocked = false,
}) {
  const tileState = useMemo(() => {
    return (id) => {
      if (winnerLocked && selectedDomainId === id) return 'winner'
      if (rolling && scanHighlightId === id) return 'scan'
      if (rolling && scanHighlightId && scanHighlightId !== id) return 'dimmed'
      if (!rolling && selectedDomainId === id) return 'winner'
      if (rolling) return 'idle'
      return 'idle'
    }
  }, [rolling, scanHighlightId, selectedDomainId, winnerLocked])

  return (
    <section className="w-full px-4" aria-label="Life domain board" aria-busy={rolling}>
      {rolling && (
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 text-center text-xs font-bold uppercase tracking-[0.35em] text-indigo-600"
        >
          Rolling life domain…
        </motion.p>
      )}

      <div className="flex items-center justify-center gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin">
        {domains.map((domain) => (
          <DomainTile
            key={domain.id}
            domain={domain}
            state={tileState(domain.id)}
          />
        ))}
      </div>

      {rolling && (
        <p className="mt-2 text-center text-[11px] text-slate-500">
          Life is choosing your next chapter…
        </p>
      )}
    </section>
  )
}
