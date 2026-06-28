import { motion, useReducedMotion } from 'framer-motion'
import { SpaceIcon } from '../SpaceIcon.js'
import { motionTokens as t } from '../../motion/tokens.js'
import type { BoardSpaceProps } from '../../types/component-props.js'

const SIZE_CLASSES = {
  sm: 'h-12 w-12 min-h-touch min-w-touch text-xs',
  md: 'h-[3.75rem] w-[3.75rem] min-h-touch min-w-touch text-sm lg:h-16 lg:w-16 lg:text-base',
  lg: 'h-[4.75rem] w-[4.75rem] min-h-touch min-w-touch text-sm xl:h-[5.25rem] xl:w-[5.25rem] xl:text-base',
  xl: 'h-[5.25rem] w-[5.25rem] min-h-touch min-w-touch text-base 2xl:h-[5.75rem] 2xl:w-[5.75rem] 2xl:text-lg',
}

const ICON_SIZE_CLASSES = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5 lg:h-[1.35rem] lg:w-[1.35rem]',
  lg: 'h-5 w-5 xl:h-6 xl:w-6',
  xl: 'h-6 w-6 2xl:h-7 2xl:w-7',
}

export type { BoardSpaceProps }

export function BoardSpace({
  space,
  isLanded = false,
  isHighlighted = false,
  size = 'md',
  onSelect,
}: BoardSpaceProps) {
  const reduceMotion = useReducedMotion()
  const label = space.name || space.title
  const textColor = space.color.toUpperCase() === '#EAB308' ? '#1e293b' : '#ffffff'
  const isEmphasis = isLanded || isHighlighted

  return (
    <div
      className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${space.x * 100}%`, top: `${space.y * 100}%` }}
    >
      {isEmphasis && !reduceMotion && (
        <motion.span
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{ boxShadow: `0 0 0 2px ${space.color}` }}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{
            opacity: isLanded ? [0.5, 0.9, 0.5] : [0.35, 0.65, 0.35],
            scale: isLanded ? [1, 1.18, 1.12] : [1, 1.12, 1.06],
          }}
          transition={{
            duration: isLanded ? t.slow : t.normal,
            repeat: isLanded ? 2 : Infinity,
            ease: 'easeInOut',
          }}
          aria-hidden
        />
      )}

      <motion.button
        type="button"
        layout
        initial={false}
        animate={{
          scale: isLanded ? 1.14 : isHighlighted ? 1.08 : 1,
          boxShadow: isLanded
            ? `0 0 32px ${space.color}99, 0 10px 24px rgba(0,0,0,0.4)`
            : isHighlighted
              ? `0 0 22px ${space.color}77, 0 8px 18px rgba(0,0,0,0.34)`
              : `0 6px 16px rgba(0,0,0,0.3), 0 0 16px ${space.color}44`,
        }}
        whileHover={
          reduceMotion
            ? undefined
            : { scale: isEmphasis ? undefined : 1.05, transition: { duration: t.fast } }
        }
        whileTap={reduceMotion ? undefined : { scale: 0.96, transition: { duration: 0.1 } }}
        transition={t.spring.smooth}
        className={`relative flex touch-manipulation flex-col items-center justify-center gap-1 rounded-2xl border-2 font-bold leading-snug focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${SIZE_CLASSES[size]} ${
          isLanded ? 'z-20 ring-2 ring-white' : ''
        }`}
        style={{
          backgroundColor: space.color,
          borderColor: isLanded ? '#ffffff' : `${space.color}cc`,
          color: textColor,
        }}
        title={space.description ? `${label} — ${space.description}` : label}
        aria-label={`${label}, ${space.category}${isLanded ? ', landed' : ''}${isHighlighted ? ', highlighted' : ''}`}
        aria-pressed={isHighlighted || isLanded}
        onClick={() => onSelect?.(space)}
      >
        <motion.span
          animate={isLanded && !reduceMotion ? { y: [0, -2, 0] } : { y: 0 }}
          transition={{ duration: t.normal, repeat: isLanded ? 1 : 0 }}
        >
          <SpaceIcon icon={space.icon} className={`opacity-95 ${ICON_SIZE_CLASSES[size]}`} />
        </motion.span>
        <span className="line-clamp-2 px-1 text-center drop-shadow-md">{label}</span>
      </motion.button>
    </div>
  )
}
