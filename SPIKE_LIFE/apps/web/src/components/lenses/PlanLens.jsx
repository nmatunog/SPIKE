import { motion, useReducedMotion } from 'framer-motion'
import FnaExplainer from '../gameboard/FnaExplainer.jsx'
import DecisionTimerRing from '../gameboard/DecisionTimerRing.jsx'

function PriorityBadge({ priority }) {
  const colors = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-amber-100 text-amber-800',
    low: 'bg-slate-100 text-slate-600',
  }
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-caption font-medium ${colors[priority] ?? colors.low}`}>
      {priority}
    </span>
  )
}

function StaggerList({ animated, children, className = '' }) {
  const reduceMotion = useReducedMotion()
  if (!animated || reduceMotion) {
    return <div className={className}>{children}</div>
  }
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function StaggerItem({ animated, children, className = '' }) {
  const reduceMotion = useReducedMotion()
  if (!animated || reduceMotion) {
    return <div className={className}>{children}</div>
  }
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 6 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.18 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default function PlanLens({
  data,
  onDecide,
  deciding,
  error,
  onTimerExpire,
  animated = false,
  sections = ['header', 'fna', 'recommendations', 'goals', 'decisions', 'recorded'],
}) {
  const show = (name) => sections.includes(name)
  const showFnaIntro = show('fna') || show('recommendations')

  return (
    <div className="space-y-5">
      {data.canDecide && data.decisionTimerSeconds > 0 && (
        <DecisionTimerRing
          deadlineAt={data.cycleDeadlineAt}
          totalSeconds={data.decisionTimerSeconds}
          active={data.canDecide}
          onExpire={onTimerExpire}
        />
      )}

      {show('header') && (
        <section>
          <p className="text-label uppercase tracking-wide text-sky-700">{data.cycleLabel}</p>
          <h2 className="text-title font-semibold text-spike-ink">What are you trying to achieve?</h2>
          <p className="mt-2 text-body text-slate-600">
            Every recommendation below comes from your Financial Needs Analysis—not guesswork.
          </p>
        </section>
      )}

      {showFnaIntro && <FnaExplainer compact={!show('fna')} />}

      {show('fna') && data.fna && (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-title font-semibold text-spike-ink">Your FNA snapshot</h3>
              <p className="mt-1 text-caption text-slate-500">Scores show strength; gaps show where to act.</p>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-2 text-right ring-1 ring-slate-100">
              <p className="text-label uppercase text-slate-400">Overall</p>
              <p className="text-title font-bold tabular-nums text-spike-ink">
                {data.fna.overallScore}
                <span className="ml-1 text-caption font-medium text-slate-500">{data.fna.rating}</span>
              </p>
            </div>
          </div>
          <StaggerList animated={animated} className="mt-5 space-y-3">
            {data.fna.gaps.slice(0, 3).map((gap) => (
              <StaggerItem key={gap.dimension} animated={animated}>
                <div className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-body leading-relaxed text-slate-800">{gap.summary}</p>
                    <PriorityBadge priority={gap.priority} />
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerList>
        </section>
      )}

      {show('recommendations') && (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <h3 className="text-title font-semibold text-spike-ink">Advisor recommendations</h3>
          <p className="mt-1 text-caption text-slate-500">
            Ranked by urgency—address #1 before lower priorities when you can.
          </p>
          <StaggerList animated={animated} className="mt-4 space-y-3">
            {data.recommendations.map((rec) => (
              <StaggerItem key={rec.rank} animated={animated}>
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-body font-semibold text-spike-ink">
                      {rec.rank}. {rec.label}
                    </span>
                    <PriorityBadge priority={rec.priority} />
                  </div>
                  <p className="mt-2 text-body leading-relaxed text-slate-600">{rec.rationale}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerList>
        </section>
      )}

      {show('goals') && (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <h3 className="text-title font-semibold text-spike-ink">Goals on track</h3>
          <p className="mt-1 text-caption text-slate-500">FNA checks whether funding matches your timeline.</p>
          <ul className="mt-4 space-y-4">
            {data.goals.map((goal) => (
              <li key={goal.goalId}>
                <div className="flex justify-between text-body">
                  <span className="font-medium text-spike-ink">{goal.goalName}</span>
                  <span className="tabular-nums text-slate-500">{goal.progressPercent}%</span>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-spike-brand transition-[width] duration-300"
                    style={{ width: `${goal.progressPercent}%` }}
                  />
                </div>
                <p className="mt-1.5 text-caption text-slate-500">
                  {goal.currentFunding.formatted} of {goal.targetAmount.formatted}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {show('decisions') && data.canDecide && onDecide && (
        <section className="rounded-2xl border-2 border-spike-brand/25 bg-white p-5 shadow-sm">
          <h3 className="text-title font-semibold text-spike-ink">Your move this turn</h3>
          <p className="mt-2 text-body text-slate-600">
            Choose the strategy that best closes your top gap. The Financial Decision Engine calculates
            real outcomes—no random luck.
          </p>
          {error && (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-body text-red-700" role="alert">
              {error}
            </p>
          )}
          <div className="mt-4 grid gap-3">
            {data.decisionOptions.map((opt) => (
              <button
                key={opt.strategy}
                type="button"
                disabled={deciding}
                onClick={() => onDecide(opt.strategy)}
                className="focus-game w-full rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-spike-brand/35 hover:bg-red-50/40 disabled:opacity-50"
              >
                <p className="text-body font-semibold text-spike-ink">{opt.label}</p>
                <p className="mt-1 text-caption leading-relaxed text-slate-600">{opt.description}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {show('recorded') && data.selectedStrategy && !data.canDecide && (
        <section className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-5">
          <p className="text-caption font-medium uppercase text-emerald-700">Decision recorded</p>
          <p className="mt-1 text-title font-semibold capitalize text-emerald-950">
            {data.selectedStrategy.replace(/_/g, ' ')}
          </p>
          {data.decisionQuality && (
            <p className="mt-2 text-body text-emerald-800">Alignment with FNA: {data.decisionQuality}</p>
          )}
        </section>
      )}
    </div>
  )
}
