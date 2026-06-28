import type { TurnCounterProps } from '../../types/component-props.js'

export type { TurnCounterProps }

export function TurnCounter({
  roundNumber,
  maxRounds,
  boardYear,
  className = '',
  yearLabel = 'Year',
  turnLabel = 'Turn',
}: TurnCounterProps) {
  return (
    <dl className={`flex gap-6 text-body ${className}`} aria-label="Turn counter">
      <div>
        <dt className="text-label uppercase text-slate-400">{yearLabel}</dt>
        <dd className="text-title font-bold tabular-nums text-white">{boardYear}</dd>
      </div>
      <div>
        <dt className="text-label uppercase text-slate-400">{turnLabel}</dt>
        <dd className="text-title font-bold tabular-nums text-white">
          {roundNumber}/{maxRounds}
        </dd>
      </div>
    </dl>
  )
}
