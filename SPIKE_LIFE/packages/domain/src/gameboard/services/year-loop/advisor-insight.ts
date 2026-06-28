import { getYearLoopConfig } from './year-loop-context.js'

/** Probability that the advisor offers insight before decision (content-pack tunable). */
export const ADVISOR_INSIGHT_PROBABILITY = 0.27

export function advisorInsightProbability(): number {
  return getYearLoopConfig().advisorInsightProbability ?? ADVISOR_INSIGHT_PROBABILITY
}

export function shouldOfferAdvisorInsight(rng: () => number = Math.random): boolean {
  return rng() < advisorInsightProbability()
}
