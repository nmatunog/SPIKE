import { motion } from 'framer-motion'
import DecisionTimerRing from '../gameboard/DecisionTimerRing.jsx'
import DomainHeroSvg from '../../illustrations/DomainHeroSvg.jsx'
import { resolveDomainIdentity } from '../../illustrations/domain-identity.js'

export default function SituationStageV3({
  situation,
  domainId,
  domainLabel,
  cycleLabel,
  decisionTimerSeconds,
  cycleDeadlineAt,
  timerActive,
  onTimerExpire,
}) {
  const identity = resolveDomainIdentity(domainId, domainLabel)
  const title = situation?.title ?? 'Life presents a moment…'

  return (
    <motion.article
      initial={{ opacity: 0, scale: 0.96, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="gsv3-situation-stage"
    >
      <div className="flex flex-col gap-4 p-6 md:flex-row md:p-8">
        <div className="min-w-0 flex-1">
          <span
            className="inline-flex rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white"
            style={{ background: identity.color }}
          >
            {(situation?.domainLabel ?? domainLabel ?? 'Life').toUpperCase()} situation
          </span>
          <h1 className="mt-4 font-serif text-3xl font-bold leading-tight text-slate-900 md:text-4xl">
            {title}
          </h1>
          {situation?.narrative && (
            <p className="mt-3 max-w-xl text-base leading-relaxed text-slate-600">
              {situation.narrative}
            </p>
          )}
          {cycleLabel && (
            <p className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-400">
              {cycleLabel}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-center gap-4 md:w-48">
          <div
            className="flex h-36 w-36 items-center justify-center rounded-2xl md:h-40 md:w-40"
            style={{ background: `${identity.color}18` }}
          >
            <DomainHeroSvg domainId={domainId} className="h-28 w-28 md:h-32 md:w-32" />
          </div>
          {timerActive && decisionTimerSeconds > 0 && (
            <div className="text-center">
              <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                Time to decide
              </p>
              <DecisionTimerRing
                deadlineAt={cycleDeadlineAt}
                totalSeconds={decisionTimerSeconds}
                active={timerActive}
                onExpire={onTimerExpire}
                variant="light"
              />
            </div>
          )}
        </div>
      </div>
    </motion.article>
  )
}
