import type { Variants } from 'framer-motion'
import { motionTokens as t } from './tokens.js'

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: t.normal, ease: t.ease.out } },
  exit: { opacity: 0, y: 4, transition: { duration: t.fast } },
}

export const fadeScale: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: t.normal, ease: t.ease.out } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: t.fast } },
}

export const overlayBackdrop: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: t.fast } },
  exit: { opacity: 0, transition: { duration: t.fast } },
}

export const modalPanel: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.94, rotateX: -6 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: { duration: t.slow, ease: t.ease.out },
  },
  exit: { opacity: 0, y: 10, scale: 0.97, transition: { duration: t.fast } },
}

export const cardFlip: Variants = {
  hidden: { opacity: 0, rotateY: -72, scale: 0.92 },
  visible: {
    opacity: 1,
    rotateY: 0,
    scale: 1,
    transition: { duration: t.slow, ease: t.ease.out },
  },
  exit: { opacity: 0, rotateY: 24, scale: 0.96, transition: { duration: t.fast } },
}

export const panelSlide: Variants = {
  hidden: { opacity: 0, y: 10, height: 0 },
  visible: {
    opacity: 1,
    y: 0,
    height: 'auto',
    transition: { duration: t.normal, ease: t.ease.out },
  },
  exit: { opacity: 0, y: 6, height: 0, transition: { duration: t.fast } },
}

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.04 },
  },
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: t.normal, ease: t.ease.out } },
}

export const stepPulse: Variants = {
  idle: { scale: 1 },
  active: {
    scale: [1, 1.06, 1],
    transition: { duration: t.slow, ease: t.ease.out },
  },
}
