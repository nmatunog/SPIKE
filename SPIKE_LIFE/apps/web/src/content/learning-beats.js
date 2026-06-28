/**
 * Amendment A5 v1.1 — canonical year loop copy for UI steppers.
 * FNA/discovery sits between situation generation and decision (advisor workflow).
 */

export const YEAR_LOOP_STEPS = {
  year: {
    label: 'Year',
    hint: 'One year of financial life',
    learn: 'Each turn is a full year — choices compound over time.',
  },
  domain: {
    label: 'Domain',
    hint: 'Life domains animate',
    learn: 'Which part of life will demand your attention this year?',
  },
  situation: {
    label: 'Situation',
    hint: 'Your moment arrives',
    learn: 'One domain, one specific financial moment — not random luck.',
  },
  generate: {
    label: 'Generate',
    hint: 'Face the moment',
    learn: 'Real life does not wait for a spreadsheet.',
  },
  analysis: {
    label: 'Analysis',
    hint: 'Check your FNA',
    learn: 'Advisors diagnose gaps before they prescribe solutions.',
  },
  decision: {
    label: 'Decision',
    hint: 'Choose ONE plan',
    learn: 'One decision per year — make it count.',
  },
  immediate: {
    label: 'Consequence',
    hint: 'See what changed now',
    learn: 'Immediate effects show up in cash flow and protection right away.',
  },
  hidden: {
    label: 'Long-term',
    hint: 'Echo recorded',
    learn: 'Some consequences stay hidden until future years — like real life.',
  },
  advance: {
    label: 'Next year',
    hint: 'Advance time',
    learn: 'Good planners track what today’s choice means tomorrow.',
  },
}

/** @deprecated Use YEAR_LOOP_STEPS — kept for gradual UI migration */
export { YEAR_LOOP_STEPS as TURN_STEPS }

export function resolveLearningBeat({
  phase,
  rolling,
  expandedPanel,
  showEncounterModal,
  roundNumber = 1,
  hasEncounter = false,
  selectedDomainLabel = null,
}) {
  if (rolling) {
    return {
      tone: 'fun',
      title: 'Let\'s see what life brings you this year…',
      body: 'One domain will light up — then your situation for the year emerges.',
    }
  }

  if (phase === 'ready_to_roll' && !hasEncounter) {
    if (roundNumber <= 1) {
      return {
        tone: 'fun',
        title: `Year ${roundNumber} begins`,
        body: 'Tap Next Year. Domains animate, a situation appears, then you choose ONE decision.',
      }
    }
    return {
      tone: 'fun',
      title: `Ready for year ${roundNumber}?`,
      body: 'Next Year → domain selection → situation → one decision → consequences.',
    }
  }

  if (showEncounterModal || (phase === 'decision_phase' && !expandedPanel)) {
    return {
      tone: 'learn',
      title: selectedDomainLabel
        ? `${selectedDomainLabel} — situation generated`
        : 'Situation generated',
      body: 'Before reacting, pause. This is when advisors open a Financial Needs Analysis.',
    }
  }

  if (expandedPanel === 'fna') {
    return {
      tone: 'fna',
      title: 'Financial Needs Analysis',
      body: 'FNA measures gaps in protection, cash flow, debt, goals, and retirement—then ranks what matters most.',
    }
  }

  if (expandedPanel === 'decision') {
    return {
      tone: 'learn',
      title: 'Choose ONE decision',
      body: 'Pick the single action that best closes your top gap. Immediate and hidden long-term effects follow.',
    }
  }

  if (expandedPanel === 'reflect') {
    return {
      tone: 'insight',
      title: 'Immediate consequence — hidden echo recorded',
      body: 'You saw what changed today. Some effects will surface in later years when you advance time.',
    }
  }

  if (phase === 'game_complete') {
    return {
      tone: 'insight',
      title: 'Years of choices',
      body: 'Domain → Situation → ONE decision → immediate + hidden consequences. That is the advisor loop at scale.',
    }
  }

  return null
}

export const FNA_EXPLAINER = {
  title: 'Why advisors start with FNA',
  body: 'Products come last. First, planners measure whether you are protected, liquid, on track for goals, and ready for retirement. FNA turns your whole picture into ranked priorities.',
  dimensions: [
    { key: 'cashFlow', label: 'Cash flow', hint: 'Can you sustain today and save for tomorrow?' },
    { key: 'protection', label: 'Protection', hint: 'Are you and your family covered if life shocks you?' },
    { key: 'debt', label: 'Debt', hint: 'Is borrowing helping or hurting your plan?' },
    { key: 'goals', label: 'Goals', hint: 'Are you funding what matters on schedule?' },
    { key: 'retirement', label: 'Retirement', hint: 'Will today’s choices still work in 30 years?' },
  ],
}

export const PANEL_COPY = {
  fna: {
    title: 'Your FNA analysis',
    subtitle: 'See your gaps—the same view a financial advisor uses before recommending anything.',
  },
  decision: {
    title: 'Choose your strategy',
    subtitle: 'One decision this year — pick the action that best addresses your top priority.',
  },
  reflect: {
    title: 'Reflect on your choice',
    subtitle: 'Immediate effects are visible; long-term echoes were recorded for future years.',
  },
  journey: {
    title: 'Your life story',
    subtitle: 'Every year adds to the timeline advisors use to track progress.',
  },
  grow: {
    title: 'Grow',
    subtitle: 'Income, savings, and surplus—the fuel for every plan.',
  },
  protect: {
    title: 'Protect',
    subtitle: 'Coverage and resilience when life does not go to plan.',
  },
}
