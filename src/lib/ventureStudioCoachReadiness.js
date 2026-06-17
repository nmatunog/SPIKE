/**
 * Gate Venture Studio coach until the current step has enough squad input.
 */

/** @typedef {import('./ventureStudioCoachPrompts.js').VentureStudioCoachFeedback} VentureStudioCoachFeedback */

/** @typedef {import('./ventureStudioTypes.js').VentureStudioState} VentureStudioContext */

/** @typedef {{ ready: boolean, hint: string, feedback?: VentureStudioCoachFeedback }} VentureStudioCoachReadiness */

/**
 * @param {number} stepIndex
 * @param {VentureStudioContext} ctx
 * @returns {VentureStudioCoachReadiness}
 */
export function assessVentureStudioCoachReadiness(stepIndex, ctx) {
  const segment = ctx.targetSegment.trim();

  switch (stepIndex) {
    case 1: {
      if (!segment) {
        return {
          ready: false,
          hint: 'Enter your target customer before requesting coach feedback.',
          feedback: {
            bias: 'Canvas still blank — nothing to evaluate yet.',
            coach:
              'Fill in field 1 (target customer) and at least one of fields 2–4 (life stage, daily money habits, or squad surprise). Then tap coach again.',
            evidenceScore: '1/10',
            provider: 'guide',
          },
        };
      }
      const hasDetail =
        ctx.step1.stage.trim().length > 2 ||
        ctx.step1.dayInLife.trim().length > 2 ||
        ctx.step1.surprise.trim().length > 2;
      if (!hasDetail) {
        return {
          ready: false,
          hint: 'Add life stage, daily money habits, or squad surprise first.',
          feedback: {
            bias: 'Segment named — squad notes still missing.',
            coach: `You named "${segment}" but have not described how they live with money yet. Complete at least one more field (life stage, daily financial interactions, or what surprised your squad) before coach feedback.`,
            evidenceScore: '2/10',
            provider: 'guide',
          },
        };
      }
      return { ready: true, hint: '' };
    }
    case 2: {
      if (!segment) {
        return emptySegmentFeedback();
      }
      const selectedGoals = Object.values(ctx.step2.goals).filter(Boolean).length;
      if (selectedGoals === 0 && ctx.step2.whyImportant.trim().length < 8) {
        return {
          ready: false,
          hint: 'Select goals from evidence or explain why they matter.',
          feedback: {
            bias: 'No emotional drivers captured yet.',
            coach: `For "${segment}", select at least one goal your squad heard in the field, or write why a priority matters emotionally.`,
            evidenceScore: '2/10',
            provider: 'guide',
          },
        };
      }
      return { ready: true, hint: '' };
    }
    case 3: {
      if (!segment) {
        return emptySegmentFeedback();
      }
      if (!ctx.step3.some((row) => row.problem.trim().length > 3)) {
        return {
          ready: false,
          hint: 'Write at least one financial pain point first.',
          feedback: {
            bias: 'No problems listed yet.',
            coach: `Document at least one financial challenge for "${segment}" — ideally with a quote or observation — then request coach feedback.`,
            evidenceScore: '2/10',
            provider: 'guide',
          },
        };
      }
      return { ready: true, hint: '' };
    }
    case 4: {
      if (!segment) {
        return emptySegmentFeedback();
      }
      if (!ctx.step4.some((row) => row.solution.trim().length > 3)) {
        return {
          ready: false,
          hint: 'Describe how they cope today (current solution).',
          feedback: {
            bias: 'Current solutions not documented.',
            coach: `How is "${segment}" handling their top problem today? Name the workaround or tool before coach review.`,
            evidenceScore: '2/10',
            provider: 'guide',
          },
        };
      }
      return { ready: true, hint: '' };
    }
    case 5: {
      if (!segment) {
        return emptySegmentFeedback();
      }
      const { suggests, unmetNeed, valueCreation } = ctx.step5;
      if (
        suggests.trim().length < 8 ||
        unmetNeed.trim().length < 8 ||
        valueCreation.trim().length < 8
      ) {
        return {
          ready: false,
          hint: 'Complete insight, unmet need, and value proposition.',
          feedback: {
            bias: 'Opportunity statement incomplete.',
            coach: `Finish all three opportunity boxes for "${segment}" (insight, unmet need, value proposition), then run final coach review.`,
            evidenceScore: '2/10',
            provider: 'guide',
          },
        };
      }
      return { ready: true, hint: '' };
    }
    default:
      return { ready: true, hint: '' };
  }
}

/** @returns {VentureStudioCoachReadiness} */
function emptySegmentFeedback() {
  return {
    ready: false,
    hint: 'Enter your target customer on Step 1 first.',
    feedback: {
      bias: 'Target segment missing.',
      coach: 'Go back to Step 1 and name your target customer before coach feedback on this step.',
      evidenceScore: '1/10',
      provider: 'guide',
    },
  };
}
