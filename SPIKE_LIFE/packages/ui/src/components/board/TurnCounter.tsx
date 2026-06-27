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
      <dl className={`flex gap-5 text-sm ${className}`} aria-label="Turn counter">
      <div>
        <dt className="text-xs font-medium text-slate-400">{yearLabel}</dt>
        <dd className="text-lg font-bold text-white">{boardYear}</dd>
      </div>
      <div>
        <dt className="text-xs font-medium text-slate-400">{turnLabel}</dt>
        <dd className="text-lg font-bold text-white">
          {roundNumber} / {maxRounds}
        </dd>
      </div>
    </dl>
  )
}
