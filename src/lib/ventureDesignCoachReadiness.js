/**
 * Gate Venture Design Studio (Day 4 FEC) coach — not Day 1 identity or Day 3 research.
 */

/** @typedef {{ title: string, coach: string, bias?: string, provider?: string }} VentureDesignCoachFeedback */

/** @typedef {import('./ventureDesignStudioService.js').VentureDesignIndividualDraft} VentureDesignDraft */

/** @typedef {{ ready: boolean, hint: string, feedback?: VentureDesignCoachFeedback }} VentureDesignCoachReadiness */

const INTERN_SELF_PATTERNS = [
  /\bmy internship\b/i,
  /\bduring my internship\b/i,
  /\bi want to learn\b/i,
  /\bi hope to learn\b/i,
  /\bpractical skills in finance\b/i,
  /\bapply them in real[- ]world\b/i,
  /\bmy career goal\b/i,
  /\bmy personal goal\b/i,
  /\bwhen i graduate\b/i,
  /\bas an intern\b/i,
];

/**
 * Text that belongs on Day 1 (personal ambition), not Day 4 customer problem fields.
 * @param {string} text
 */
export function looksLikeInternSelfGoal(text) {
  const t = String(text ?? '').trim();
  if (!t) return false;
  return INTERN_SELF_PATTERNS.some((re) => re.test(t));
}

/**
 * @param {number} stepIndex
 * @param {VentureDesignDraft} draft
 * @returns {VentureDesignCoachReadiness}
 */
export function assessVentureDesignCoachReadiness(stepIndex, draft) {
  const segment = draft.step1.customer.trim();
  const problem = draft.step1.problem.trim();

  if (looksLikeInternSelfGoal(problem) || looksLikeInternSelfGoal(draft.step1.opportunity)) {
    return {
      ready: false,
      hint: 'Replace personal internship goals with your client’s problem.',
      feedback: {
        title: 'Wrong canvas — client problem needed',
        bias: 'Day 1 personal goals ≠ Day 4 customer problem',
        coach:
          'This field should describe your target client’s financial pain — not your own internship learning goals. Return to Venture Research (Day 3) or rewrite the problem from the client’s point of view, then request coach feedback again.',
        provider: 'guide',
      },
    };
  }

  switch (stepIndex) {
    case 1: {
      if (!segment) {
        return {
          ready: false,
          hint: 'Name your target customer segment first.',
          feedback: {
            title: 'Venture Review',
            bias: 'No segment named yet.',
            coach:
              'Enter who you serve (target segment) and the validated problem from your research. Coach feedback reviews your venture design — not Day 1 identity statements.',
            provider: 'guide',
          },
        };
      }
      if (problem.length < 8) {
        return {
          ready: false,
          hint: 'Describe the client problem before coach review.',
          feedback: {
            title: 'Venture Review',
            bias: 'Customer problem still blank.',
            coach: `You named "${segment}" — now state the urgent financial problem they face (from field research), not your personal goals as an intern.`,
            provider: 'guide',
          },
        };
      }
      return { ready: true, hint: '' };
    }
    case 2: {
      if (!draft.step2.beforeFeeling.trim() || !draft.step2.afterFeeling.trim()) {
        return {
          ready: false,
          hint: 'Complete before and after emotional states.',
          feedback: {
            title: 'Psychology Check',
            bias: 'Transformation incomplete.',
            coach: 'Map how your client feels before and after your venture — both states are required for coach feedback.',
            provider: 'guide',
          },
        };
      }
      return { ready: true, hint: '' };
    }
    case 3: {
      if (!draft.step3.synthesisA.trim() && !draft.step3.whoServe.trim()) {
        return {
          ready: false,
          hint: 'Draft who you serve in the UVP step.',
          feedback: {
            title: 'UVP Polish',
            bias: 'UVP parts missing.',
            coach: 'Fill in who you serve and what transformation you deliver before UVP coach review.',
            provider: 'guide',
          },
        };
      }
      return { ready: true, hint: '' };
    }
    case 4: {
      if (!draft.step4.name.trim()) {
        return {
          ready: false,
          hint: 'Name your venture before brand coach review.',
          feedback: {
            title: 'Brand Cohesion',
            bias: 'Venture name missing.',
            coach: 'Add a venture name and tagline that match your UVP promise, then request coach feedback.',
            provider: 'guide',
          },
        };
      }
      return { ready: true, hint: '' };
    }
    case 5:
      return { ready: true, hint: '' };
    default:
      return { ready: true, hint: '' };
  }
}
