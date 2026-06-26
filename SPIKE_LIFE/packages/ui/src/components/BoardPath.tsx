export interface BoardPathProps {
  path: string
  className?: string
}

export function BoardPath({ path, className = '' }: BoardPathProps) {
  if (!path) return null

  return (
    <svg
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
    >
      <path
        d={path}
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d={path}
        fill="none"
        stroke="rgba(251,191,36,0.28)"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeDasharray="2.5 2.5"
      />
    </svg>
  )
}
