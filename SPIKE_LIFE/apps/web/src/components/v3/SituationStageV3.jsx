import { Lightbulb, Sparkles } from 'lucide-react'
import DecisionTimerRing from '../gameboard/DecisionTimerRing.jsx'
import DomainHeroSvg from '../../illustrations/DomainHeroSvg.jsx'
import { resolveDomainIdentity } from '../../illustrations/domain-identity.js'

function DetailBox({ label, text, icon: Icon, accent }) {
  if (!text) return null
  return (
    <div className="gsv3-detail-box">
      <div className="flex items-start gap-2">
        <span
          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
          style={{ background: `${accent}18`, color: accent }}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="gsv3-detail-box__label">{label}</p>
          <p className="gsv3-detail-box__text">{text}</p>
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
          <span className="gsv3-situation-badge" style={{ background: identity.color }}>
            {(situation?.domainLabel ?? domainLabel ?? 'Life').toUpperCase()} situation
          </span>

          <h1 className="gsv3-situation-title mt-1.5">
            {situation?.title ?? 'Life presents a moment…'}
          </h1>

          {situation?.narrative && (
            <p className="gsv3-situation-narrative mt-1.5">{situation.narrative}</p>
          )}

          {cycleLabel && (
            <p className="gsv3-situation-cycle mt-1.5">{cycleLabel}</p>
          )}

          <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <DetailBox label="Opportunity" text={opportunity} icon={Lightbulb} accent={identity.color} />
            <DetailBox label="Consideration" text={consideration} icon={Sparkles} accent="#8B5CF6" />
          </div>
        </div>

        <div className="gsv3-situation-stage__right">
          <DomainHeroSvg domainId={domainId} className="gsv3-situation-hero" />
          {timerActive && decisionTimerSeconds > 0 && (
            <div className="shrink-0 text-center">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
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
