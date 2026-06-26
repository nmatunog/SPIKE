import { motion } from 'framer-motion'
import { SpaceIcon } from './SpaceIcon.js'
import type { PositionedSpace } from '../types/view-models.js'

export interface BoardSpaceProps {
  space: PositionedSpace
  isLanded?: boolean
  isHighlighted?: boolean
  size?: 'sm' | 'md' | 'lg'
  onSelect?: (space: PositionedSpace) => void
}

const SIZE_CLASSES = {
  sm: 'h-9 w-9 text-[9px]',
  md: 'h-11 w-11 text-[10px] md:h-12 md:w-12 md:text-[11px]',
  lg: 'h-14 w-14 text-xs md:h-16 md:w-16 md:text-sm',
}

export function BoardSpace({
  space,
  isLanded = false,
  isHighlighted = false,
  size = 'md',
  onSelect,
}: BoardSpaceProps) {
  const textColor = space.color === '#EAB308' ? '#1e293b' : '#ffffff'

  return (
    <motion.button
      type="button"
      layout
      initial={false}
      animate={{
        scale: isLanded ? 1.12 : isHighlighted ? 1.06 : 1,
        boxShadow: isLanded
          ? `0 0 24px ${space.color}88, 0 6px 16px rgba(0,0,0,0.35)`
          : `0 4px 12px rgba(0,0,0,0.28), 0 0 14px ${space.color}44`,
      }}
      transition={{ type: 'spring', stiffness: 420, damping: 28, duration: 0.22 }}
      className={`absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-0.5 rounded-2xl border-2 font-bold leading-tight focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${SIZE_CLASSES[size]} ${
        isLanded ? 'z-20 ring-2 ring-white' : ''
      }`}
      style={{
        left: `${space.x * 100}%`,
        top: `${space.y * 100}%`,
        backgroundColor: space.color,
        borderColor: isLanded ? '#ffffff' : `${space.color}cc`,
        color: textColor,
      }}
      title={space.description ? `${space.title} — ${space.description}` : space.title}
      aria-label={`${space.title}, ${space.category}`}
      onClick={() => onSelect?.(space)}
    >
      <SpaceIcon icon={space.icon} className="h-3.5 w-3.5 opacity-95 md:h-4 md:w-4" />
      <span className="line-clamp-2 px-0.5 text-center drop-shadow-sm">{space.title}</span>
    </motion.button>
  )
}
