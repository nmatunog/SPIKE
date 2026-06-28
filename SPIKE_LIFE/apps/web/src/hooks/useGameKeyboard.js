import { useEffect } from 'react'

/**
 * Global game keyboard shortcuts.
 * R — roll dice (when allowed)
 * Escape — dismiss overlay / close panel
 */
export function useGameKeyboard({ canRoll, rolling, onRoll, onDismiss, onClosePanel }) {
  useEffect(() => {
    function handleKeyDown(event) {
      const tag = event.target?.tagName?.toLowerCase()
      const isTyping =
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        event.target?.isContentEditable

      if (isTyping) return

      if (event.key === 'Escape') {
        onDismiss?.()
        onClosePanel?.()
        return
      }

      if ((event.key === 'r' || event.key === 'R') && canRoll && !rolling) {
        event.preventDefault()
        onRoll?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canRoll, rolling, onRoll, onDismiss, onClosePanel])
}
