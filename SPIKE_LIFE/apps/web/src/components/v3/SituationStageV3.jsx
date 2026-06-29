import { Lightbulb, Sparkles } from 'lucide-react'
import DecisionTimerRing from '../gameboard/DecisionTimerRing.jsx'
import DomainHeroSvg from '../../illustrations/DomainHeroSvg.jsx'
import { resolveDomainIdentity } from '../../illustrations/domain-identity.js'

function DetailBox({ label, text, icon: Icon, accent }) {
  if (!text) return null
  return (
    <div className="gsv3-detail-box">
      <div className="flex items-start gap-1.5">
        <span
          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded"
          style={{ background: `${accent}18`, color: accent }}
        >
          <Icon className="h-3 w-3" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[8px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
          <p className="text-[10px] font-medium leading-snug text-slate-700">{text}</p>
        </div>
      </div>
    </div>
  )
}

export default function SituationStageV3({
  situation,
  domainId,
  domainLabel,
  cycleLabel,
  recommendations = [],
  decisionTimerSeconds,
  cycleDeadlineAt,
  timerActive,
  onTimerExpire,
}) {
  const identity = resolveDomainIdentity(domainId, domainLabel)
  const opportunity = recommendations[0]?.label ?? situation?.learningObjective
  const consideration = recommendations[1]?.label
    ?? (situation?.narrative?.includes('—')
      ? situation.narrative.split('—').slice(1).join('—').trim()
      : null)

  return (
    <article className="gsv3-situation-stage">
      <div className="gsv3-situation-stage__inner">
        <div className="gsv3-situation-stage__copy">
          <span
            className="inline-flex w-fit rounded-full px-2.5 py-0.5 text-[8px] font-extrabold uppercase tracking-[0.2em] text-white"
            style={{ background: identity.color }}
          >
            {(situation?.domainLabel ?? domainLabel ?? 'Life').toUpperCase()} situation
          </span>

          <h1 className="gsv3-situation-title mt-2">
            {situation?.title ?? 'Life presents a moment…'}
          </h1>

          {situation?.narrative && (
            <p className="mt-2 text-xs leading-relaxed text-slate-600 md:text-sm">
              {situation.narrative}
            </p>
          )}

          {cycleLabel && (
            <p className="mt-2 text-[9px] font-bold uppercase tracking-widest text-slate-400">
              {cycleLabel}
            </p>
          )}

          <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            <DetailBox label="Opportunity" text={opportunity} icon={Lightbulb} accent={identity.color} />
            <DetailBox label="Consideration" text={consideration} icon={Sparkles} accent="#8B5CF6" />
          </div>
        </div>

        <div className="gsv3-situation-stage__right">
          <DomainHeroSvg
            domainId={domainId}
            className="max-h-[min(28vh,220px)] w-full object-contain"
          />
          {timerActive && decisionTimerSeconds > 0 && (
            <div className="text-center">
              <p className="mb-0.5 text-[8px] font-bold uppercase tracking-widest text-slate-400">
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
    </article>
  )
}
