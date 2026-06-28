import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'
import { modalPanel, overlayBackdrop } from '../motion/variants.js'

export interface BoardOverlayProps {
  visible: boolean
  children: ReactNode
  onDismiss?: () => void
}

export function BoardOverlay({ visible, children, onDismiss }: BoardOverlayProps) {
  const reduceMotion = useReducedMotion()

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          variants={reduceMotion ? undefined : overlayBackdrop}
          initial={reduceMotion ? { opacity: 0 } : 'hidden'}
          animate={reduceMotion ? { opacity: 1 } : 'visible'}
          exit={reduceMotion ? { opacity: 0 } : 'exit'}
          className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[3px]"
          onClick={onDismiss}
          role="presentation"
        >
          <motion.div
            variants={reduceMotion ? undefined : modalPanel}
            initial={reduceMotion ? { opacity: 0, y: 8 } : 'hidden'}
            animate={reduceMotion ? { opacity: 1, y: 0 } : 'visible'}
            exit={reduceMotion ? { opacity: 0, y: 6 } : 'exit'}
            style={{ perspective: 1200 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md"
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
