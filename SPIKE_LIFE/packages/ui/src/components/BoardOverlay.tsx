import { motion, AnimatePresence } from 'framer-motion'
import type { ReactNode } from 'react'

export interface BoardOverlayProps {
  visible: boolean
  children: ReactNode
  onDismiss?: () => void
}

export function BoardOverlay({ visible, children, onDismiss }: BoardOverlayProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[2px]"
          onClick={onDismiss}
          role="presentation"
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
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
