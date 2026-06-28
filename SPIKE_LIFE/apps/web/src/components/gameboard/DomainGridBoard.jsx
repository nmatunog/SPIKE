import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

const ICONS = {
  briefcase: '💼',
  wallet: '💰',
  'chart-line': '📊',
  sparkles: '✨',
  users: '👨‍👩‍👧',
  'heart-pulse': '❤️',
  'trending-up': '📈',
  'shopping-bag': '🛍️',
  home: '🏠',
  'graduation-cap': '🎓',
  landmark: '🏛️',
  'hand-heart': '🤝',
  'dice-5': '🎲',
  trophy: '🏆',
}

/**
 * @typedef {'scanning' | 'locked' | 'idle'} DomainGridMode
 */

export default function DomainGridBoard({
  domains = [],
  selectedDomainId = null,
  animationCycle = [],
  rolling = false,
  mode = 'idle',
  className = '',
}) {
  const reduceMotion = useReducedMotion()
  const [cycleIndex, setCycleIndex] = useState(0)

  const cycleIds =
    animationCycle.length > 0 ? animationCycle : domains.map((domain) => domain.id)
  const cycleKey = cycleIds.join(',')
  const isScanning = mode === 'scanning' || (rolling && mode !== 'locked')
  const isLocked = mode === 'locked' && selectedDomainId

  useEffect(() => {
    if (!isScanning || reduceMotion || cycleIds.length === 0) return undefined
    const timer = setInterval(() => {
      setCycleIndex((index) => (index + 1) % cycleIds.length)
    }, 120)
    return () => clearInterval(timer)
  }, [isScanning, reduceMotion, cycleKey, cycleIds.length])

  if (domains.length === 0) return null

  const highlightId = isLocked
    ? selectedDomainId
    : isScanning && !selectedDomainId
      ? cycleIds[cycleIndex]
      : selectedDomainId

  return (
    <div
      className={`grid grid-cols-3 gap-2 sm:gap-2.5 ${className}`}
      role="list"
      aria-label="Life domains"
      aria-busy={isScanning}
    >
      {domains.map((domain) => {
        const active = domain.id === highlightId
        const dimOthers = isLocked && !active
        return (
          <motion.div
            key={domain.id}
            role="listitem"
            layout={!reduceMotion}
            animate={{
              scale: active ? (isLocked ? 1.08 : 1.04) : 1,
              opacity: dimOthers ? 0.12 : active ? 1 : isScanning ? 0.45 : 0.72,
            }}
            transition={{ duration: isLocked && active ? 0.35 : 0.15 }}
            className={`flex flex-col items-center justify-center rounded-xl border px-2 py-3 text-center sm:rounded-2xl sm:px-3 sm:py-4 ${
              active
                ? 'border-white/40 bg-white/20 shadow-lg shadow-black/40 ring-2 ring-white/50'
                : 'border-white/10 bg-slate-900/40'
            }`}
            style={
              active
                ? {
                    boxShadow: isLocked
                      ? `0 0 40px ${domain.color}, 0 0 80px ${domain.color}66`
                      : `0 0 24px ${domain.color}55`,
                  }
                : undefined
            }
          >
            <span className="text-xl sm:text-2xl" aria-hidden>
              {ICONS[domain.icon] ?? '•'}
            </span>
            <span
              className={`mt-1.5 text-[0.625rem] font-semibold leading-tight sm:text-caption ${
                active ? 'text-white' : 'text-slate-300'
              }`}
            >
              {domain.label}
            </span>
          </motion.div>
        )
      })}
    </div>
  )
}
