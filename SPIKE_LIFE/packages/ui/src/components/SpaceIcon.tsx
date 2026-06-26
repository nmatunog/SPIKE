import type { SpaceIconId } from '../types/board-config.js'

const ICON_PATHS: Record<SpaceIconId, string> = {
  briefcase:
    'M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m-10 0h10m-10 0a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2',
  wallet:
    'M3 7h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zm16 4h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2',
  sparkles: 'M12 3l1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3z',
  alert: 'M12 9v4m0 4h.01M10.3 4.3h3.4L20 18H4L10.3 4.3z',
  heart:
    'M12 20s-6.5-4.2-8.5-7.8C1.8 9.2 3.6 6.5 6.5 6.5c1.7 0 3.2.9 3.5 2.3.3-1.4 1.8-2.3 3.5-2.3 2.9 0 4.7 2.7 2.9 5.7C18.5 15.8 12 20 12 20z',
  medical: 'M12 6v12M6 12h12',
  building: 'M5 20V8l7-4 7 4v12H5zm4-8h2v4H9v-4zm4 0h2v4h-2v-4z',
  chart: 'M5 19V9m5 10V5m5 14V11m5 8V7',
  book: 'M6 4h10a2 2 0 0 1 2 2v12l-7-3-7 3V6a2 2 0 0 1 2-2z',
  star: 'M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.3L12 15.8 7.2 17.8l.9-5.3L4.2 8.7l5.4-.8L12 3z',
  moon: 'M20 14.5A7.5 7.5 0 0 1 9.5 4 6.5 6.5 0 1 0 20 14.5z',
  gift: 'M20 12H4v8h16v-8zM12 12V4m-3 4h6M9 8a2 2 0 1 1 0-2 2 2 0 0 1 0 2zm6 0a2 2 0 1 0 0-2 2 2 0 0 0 0 2z',
  users: 'M16 18v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1m12-6a3 3 0 1 0-6 0m6 0a3 3 0 1 1-6 0',
  trending: 'M4 16l5-5 3 3 7-7',
}

export interface SpaceIconProps {
  icon: SpaceIconId
  className?: string
}

export function SpaceIcon({ icon, className = 'h-4 w-4' }: SpaceIconProps) {
  const d = ICON_PATHS[icon] ?? ICON_PATHS.star
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d={d} />
    </svg>
  )
}
