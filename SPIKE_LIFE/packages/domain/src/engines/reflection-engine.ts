import type { DecisionQuality } from './consequence-engine.js'
import type { FnaSnapshot } from './fna-engine.js'
import type { Recommendation } from './recommendation-engine.js'
import type { DecisionStrategy } from '../types.js'
import type { ConsequenceOutcome } from './consequence-engine.js'

export interface ReflectionPrompt {
  id: string
  question: string
}

export interface ReflectionAnswer {
  promptId: string
  response: string
}

export interface ReflectionSnapshot {
  prompts: ReflectionPrompt[]
  answers: ReflectionAnswer[]
  summary: string
  learningHighlights: string[]
  advisorInsight: string
  completedAt: string | null
}

export function buildReflectionPrompts(): ReflectionPrompt[] {
  return [
    { id: 'what_happened', question: 'What happened after your decision?' },
    { id: 'why_happened', question: 'Why did it happen — which tradeoffs drove the outcome?' },
    { id: 'what_worked', question: 'What worked well in your planning approach?' },
    { id: 'what_change', question: 'What would you change if you advised yourself again?' },
    { id: 'advise_other', question: 'How would you advise someone else facing a promotion?' },
  ]
}

export function runReflectionEngine(
  strategy: DecisionStrategy,
  consequence: ConsequenceOutcome,
  fnaBefore: FnaSnapshot,
  fnaAfter: FnaSnapshot,
  recommendations: Recommendation[],
  answers: ReflectionAnswer[],
): ReflectionSnapshot {
  const topRecommendation = recommendations[0]
  const aligned = consequence.decisionQuality === 'excellent' || consequence.decisionQuality === 'good'

  const learningHighlights = [
    `FNA overall score moved from ${fnaBefore.overallScore} to ${fnaAfter.overallScore}.`,
    `Top priority before deciding: ${fnaBefore.topPriority}.`,
    topRecommendation
      ? `Recommended first action was: ${topRecommendation.label}.`
      : 'Recommendations were generated from gap analysis.',
    consequence.narrative,
  ]

  const advisorInsight = aligned
    ? 'You practiced recommendation-before-action: analysis informed the decision.'
    : `Consider leading with ${topRecommendation?.label ?? 'FNA priorities'} before lifestyle changes when income rises.`

  const summary = answers.length > 0
    ? 'Reflection captured. Experience converted toward financial judgment.'
    : 'Reflection pending — learning is incomplete until prompts are answered.'

  return {
    prompts: buildReflectionPrompts(),
    answers,
    summary,
    learningHighlights,
    advisorInsight,
    completedAt: answers.length >= 3 ? new Date().toISOString() : null,
  }
}

export function validateReflectionAnswers(answers: ReflectionAnswer[]): boolean {
  return answers.filter((a) => a.response.trim().length >= 3).length >= 3
}

export function decisionQualityLabel(quality: DecisionQuality): string {
  const labels: Record<DecisionQuality, string> = {
    excellent: 'Excellent',
    good: 'Good',
    needs_attention: 'Needs Attention',
    high_risk: 'High Risk',
  }
  return labels[quality]
}
