/**
 * Day 3 Venture Studio — local heuristic coach (no API / Vite deps).
 */
import { GOAL_LABELS } from './ventureStudioTypes.js';

/** @typedef {{ bias: string, coach: string, evidenceScore: string, provider?: string }} VentureStudioCoachFeedback */

/** @typedef {import('./ventureStudioTypes.js').VentureStudioState} VentureStudioContext */

const MONEY_PATTERN =
  /\b(salary|sweldo|paycheck|pay day|payday|gcash|maya|bank|loan|utang|remit|remittance|budget|spend|saving|bill|payment|income|commission|tip|cash|wallet|credit|debt|invest)\b/i;
const BEHAVIOR_PATTERN =
  /\b(when they|every|daily|morning|night shift|graveyard|first thing|habit|routine|stress|worry|check|transfer|withdraw|before they|after they|usually|often|typically)\b/i;
const PRODUCT_PATTERN =
  /\b(policy|premium|vul|insurance|plan|product|quote|proposal|aia|sun life|pru)\b/i;
const QUOTE_PATTERN = /["""'']([^"""'']{8,})["""'']/;

/** @param {string} text */
function words(text) {
  return String(text ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

/** @param {string} text @param {number} max */
function clip(text, max = 90) {
  const cleaned = String(text ?? '').trim().replace(/\s+/g, ' ');
  if (!cleaned) return '';
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 1).trim()}…`;
}

/** @param {string} text */
function firstQuote(text) {
  const match = String(text ?? '').match(QUOTE_PATTERN);
  return match?.[1]?.trim() ?? '';
}

/** @param {VentureStudioContext['evidenceList']} evidenceList @param {VentureStudioContext} ctx @param {number} stepIndex */
function computeEvidenceScore(evidenceList, ctx, stepIndex) {
  let score = Math.min(evidenceList.length * 2, 6);
  if (stepIndex >= 3) {
    const withQuotes = ctx.step3.filter((row) => row.evidence.trim().length > 12).length;
    score += withQuotes;
  }
  if (stepIndex === 1 && ctx.step1.surprise.trim().length > 20) score += 1;
  if (stepIndex === 5 && ctx.step5.suggests.trim().length > 40) score += 1;
  return `${Math.min(10, Math.max(1, score))}/10`;
}

/**
 * @param {number} stepIndex
 * @param {VentureStudioContext} ctx
 * @returns {VentureStudioCoachFeedback}
 */
export function evaluateVentureStudioStepLocally(stepIndex, ctx) {
  const evidenceScore = computeEvidenceScore(ctx.evidenceList, ctx, stepIndex);

  switch (stepIndex) {
    case 1:
      return evaluateStep1(ctx, evidenceScore);
    case 2:
      return evaluateStep2(ctx, evidenceScore);
    case 3:
      return evaluateStep3(ctx, evidenceScore);
    case 4:
      return evaluateStep4(ctx, evidenceScore);
    case 5:
      return evaluateStep5(ctx, evidenceScore);
    default:
      return {
        bias: 'Review your squad answers together.',
        coach: 'What is the single most surprising thing your evidence revealed about this customer?',
        evidenceScore,
        provider: 'local',
      };
  }
}

/** @param {VentureStudioContext} ctx @param {string} evidenceScore */
function evaluateStep1(ctx, evidenceScore) {
  const segment = ctx.targetSegment.trim();
  const stage = ctx.step1.stage.trim();
  const dayInLife = ctx.step1.dayInLife.trim();
  const surprise = ctx.step1.surprise.trim();
  const combined = `${segment} ${stage} ${dayInLife}`.toLowerCase();

  if (!segment) {
    return {
      bias: 'Segment still open — name a real person archetype, not a category.',
      coach:
        'Who exactly are you studying? Give a segment label your squad could spot in the field this week — job, city, and life moment included.',
      evidenceScore,
      provider: 'local',
    };
  }

  const hasMoney = MONEY_PATTERN.test(dayInLife) || MONEY_PATTERN.test(surprise);
  const hasBehavior = BEHAVIOR_PATTERN.test(dayInLife) || BEHAVIOR_PATTERN.test(stage);
  const isBpo = /\bbpo\b|call center|contact center|csr|agent/i.test(combined);
  const isFreelance = /freelance|gig|contract|remote/i.test(combined);

  if (dayInLife.length > 40 && hasMoney && hasBehavior) {
    const hook = clip(dayInLife, 70) || clip(segment, 50);
    return {
      bias: 'Strong behavioral sketch — pressure-test one assumption.',
      coach: `You painted a credible day for "${segment}" — especially where you noted "${hook}". What is the exact trigger moment they feel financial stress: before payday, after a bill, or when comparing themselves to peers?`,
      evidenceScore,
      provider: 'local',
    };
  }

  if (isBpo && !hasMoney) {
    return {
      bias: 'BPO segment named — money rhythm not yet visible.',
      coach: `For "${segment}", walk through one pay cycle: night-shift payout, GCash transfer to family, loan deduction, and what is left before the next cutoff. What is the first app they open when salary hits?`,
      evidenceScore,
      provider: 'local',
    };
  }

  if (isFreelance && !hasMoney) {
    return {
      bias: 'Gig economy segment — income volatility missing.',
      coach: `You described "${segment}" but not how irregular income lands. When a client pays late, what do they sacrifice first — rent, food, or savings? Capture that sequence in your day-in-life.`,
      evidenceScore,
      provider: 'local',
    };
  }

  if (words(dayInLife) < 12 && words(stage) < 8) {
    return {
      bias: 'Demographic label without lived context.',
      coach: `"${segment}" reads like a market category. Add one concrete scene: where are they at 7pm on payday, who are they with, and what financial decision are they avoiding?`,
      evidenceScore,
      provider: 'local',
    };
  }

  if (!hasMoney) {
    return {
      bias: 'Life stage described — daily money behavior still thin.',
      coach: `Your stage notes for "${segment}" are a start (${clip(stage, 60)}). Now trace money hour-by-hour: wake up, commute, lunch spend, and the moment they check balance. What surprised your squad in the field?`,
      evidenceScore,
      provider: 'local',
    };
  }

  if (surprise.length < 15) {
    return {
      bias: 'Missing squad surprise — evidence not reflected yet.',
      coach: `You described "${segment}" with some money habits. What did your squad assume that field notes proved wrong? Write that tension — it becomes your venture edge.`,
      evidenceScore,
      provider: 'local',
    };
  }

  return {
    bias: 'Good foundation — sharpen the payday moment.',
    coach: `Your surprise about "${clip(surprise, 55)}" is useful. Now anchor it: what do they do in the first 30 minutes after money arrives, and what emotion drives that choice?`,
    evidenceScore,
    provider: 'local',
  };
}

/** @param {VentureStudioContext} ctx @param {string} evidenceScore */
function evaluateStep2(ctx, evidenceScore) {
  const selected = Object.entries(ctx.step2.goals)
    .filter(([, on]) => on)
    .map(([key]) => GOAL_LABELS[key] ?? key);
  const why = ctx.step2.whyImportant.trim();

  if (selected.length === 0) {
    return {
      bias: 'No emotional goals selected from evidence.',
      coach:
        'Go back to your field notes — which goals did customers mention twice or more? Select only what your evidence supports, then explain why it matters emotionally.',
      evidenceScore,
      provider: 'local',
    };
  }

  if (selected.length === 1 && why.length > 30) {
    const goal = selected[0];
    return {
      bias: 'Focused priority — deepen the emotional stake.',
      coach: `You centered on "${goal}" — strong. Why is that the non-negotiable for ${ctx.targetSegment.trim() || 'this segment'}? What fear appears if they miss it in the next 3 years?`,
      evidenceScore,
      provider: 'local',
    };
  }

  if (selected.length >= 4) {
    return {
      bias: 'Too many equal priorities — force a trade-off.',
      coach: `You selected ${selected.slice(0, 3).join(', ')}${selected.length > 3 ? ', and more' : ''}. If ${ctx.targetSegment.trim() || 'they'} could only fund one in the next 12 months, which wins — and which would they quietly drop?`,
      evidenceScore,
      provider: 'local',
    };
  }

  if (why.length < 25) {
    return {
      bias: 'Goals chosen — emotional “why” still shallow.',
      coach: `You picked ${selected.join(' and ')}. In your interviews, what exact words did they use when describing why "${selected[0]}" matters? Paste a quote or paraphrase their emotion.`,
      evidenceScore,
      provider: 'local',
    };
  }

  return {
    bias: 'Priorities mapped — rank them ruthlessly.',
    coach: `Between ${selected.join(' and ')}, your notes say: "${clip(why, 75)}". Which goal would they sacrifice during a crisis — and what does that reveal about their real driver?`,
    evidenceScore,
    provider: 'local',
  };
}

/** @param {VentureStudioContext} ctx @param {string} evidenceScore */
function evaluateStep3(ctx, evidenceScore) {
  const rows = ctx.step3.filter((r) => r.problem.trim());
  if (!rows.length) {
    return {
      bias: 'No problems articulated yet.',
      coach:
        'List at least one financial pain point your squad heard verbatim. Start with a quote, then name the root problem behind it.',
      evidenceScore,
      provider: 'local',
    };
  }

  const primary = rows[0];
  const problem = primary.problem.trim();
  const evidence = primary.evidence.trim();
  const lowConfidence = rows.filter((r) => r.confidence === 'Low').length;
  const highConfidence = rows.filter((r) => r.confidence === 'High').length;
  const quote = firstQuote(evidence) || clip(evidence, 60);

  if (lowConfidence >= 2 && highConfidence === 0) {
    return {
      bias: 'Mostly assumptions — evidence thin across problems.',
      coach: `Your top problem "${problem}" is still squad guesswork. What one field observation or quote would move it to High confidence this week?`,
      evidenceScore,
      provider: 'local',
    };
  }

  if (evidence.length < 12) {
    return {
      bias: 'Problem named — proof quote missing.',
      coach: `You wrote "${problem}" but no customer language yet. What exact sentence did someone say in observation or interview that proves this hurts?`,
      evidenceScore,
      provider: 'local',
    };
  }

  if (/income|irregular|unstable|budget/i.test(problem) && !/system|habit|plan|track/i.test(problem)) {
    return {
      bias: 'Symptom flagged — root cause may be deeper.',
      coach: `Is "${problem}" the disease, or is the real issue no system to handle volatility? ${quote ? `They said "${quote}" — what behavior sits underneath?` : 'What behavior sits underneath?'}`,
      evidenceScore,
      provider: 'local',
    };
  }

  const secondary = rows[1]?.problem?.trim();
  const topGoal = Object.entries(ctx.step2.goals).find(([, on]) => on)?.[0];
  const topGoalLabel = topGoal ? GOAL_LABELS[topGoal] : 'their top goal';
  return {
    bias: highConfidence > 0 ? 'Validated pain — test sequence' : 'Pain mapped — validate ordering',
    coach: secondary
      ? `You ranked "${problem}" ahead of "${secondary}". Which one blocks ${ctx.targetSegment.trim() || 'them'} from acting on ${topGoalLabel}?`
      : `Strong start on "${problem}"${quote ? ` — "${quote}"` : ''}. What happens the week this problem peaks — who do they call, and what do they avoid?`,
    evidenceScore,
    provider: 'local',
  };
}

/** @param {VentureStudioContext} ctx @param {string} evidenceScore */
function evaluateStep4(ctx, evidenceScore) {
  const topProblem = ctx.step3[0]?.problem?.trim() || 'their main challenge';
  const solution = ctx.step4[0]?.solution?.trim() || '';
  const limitations = ctx.step4[0]?.limitations?.trim() || '';

  if (!solution) {
    return {
      bias: 'Current solutions not documented.',
      coach: `How are ${ctx.targetSegment.trim() || 'they'} coping with "${topProblem}" today? Name the real tool — app, family help, loan, or avoidance.`,
      evidenceScore,
      provider: 'local',
    };
  }

  if (limitations.length < 15) {
    return {
      bias: 'Solution listed — gap analysis incomplete.',
      coach: `They use "${solution}" for "${topProblem}". Where does it break down — trust, fees, discipline, or access? Be specific to ${ctx.targetSegment.trim() || 'this segment'}.`,
      evidenceScore,
      provider: 'local',
    };
  }

  const misaligned =
    /sav|gcash|maya|wallet|budget app/i.test(solution) &&
    /hospital|insurance|health|emergency|protect/i.test(topProblem);

  if (misaligned) {
    return {
      bias: 'Mismatch — liquid tool vs protection need.',
      coach: `"${topProblem}" is a protection fear, but "${solution}" is a liquidity tool. Why haven't they upgraded — cost, literacy, or distrust of advisors?`,
      evidenceScore,
      provider: 'local',
    };
  }

  return {
    bias: 'Gap identified — explain inertia.',
    coach: `They rely on "${solution}" despite "${clip(limitations, 55)}". What would make ${ctx.targetSegment.trim() || 'them'} switch — social proof, a friend’s story, or a crisis?`,
    evidenceScore,
    provider: 'local',
  };
}

/** @param {VentureStudioContext} ctx @param {string} evidenceScore */
function evaluateStep5(ctx, evidenceScore) {
  const insight = ctx.step5.suggests.trim();
  const need = ctx.step5.unmetNeed.trim();
  const value = ctx.step5.valueCreation.trim();

  if (!insight || !need || !value) {
    const missing = [!insight && 'insight', !need && 'unmet need', !value && 'value proposition']
      .filter(Boolean)
      .join(' and ');
    return {
      bias: `Opportunity statement incomplete — ${missing} missing.`,
      coach: `Tie all three boxes to "${ctx.targetSegment.trim() || 'your segment'}" and problem "${clip(ctx.step3[0]?.problem, 40)}". What transformation do they feel, not what product you sell?`,
      evidenceScore,
      provider: 'local',
    };
  }

  if (PRODUCT_PATTERN.test(value) || PRODUCT_PATTERN.test(insight)) {
    return {
      bias: 'Product language detected — lead with life change.',
      coach: `Rewrite the proposition without policy words. How does ${ctx.targetSegment.trim() || 'their'} daily stress change because of you — in plain language they would use?`,
      evidenceScore,
      provider: 'local',
    };
  }

  if (words(value) < 15) {
    return {
      bias: 'Value proposition too thin for a venture pitch.',
      coach: `You see unmet need: "${clip(need, 55)}". Expand how you deliver peace of mind — what is the first win they feel in 30 days?`,
      evidenceScore,
      provider: 'local',
    };
  }

  return {
    bias: 'Opportunity taking shape — stress-test differentiation.',
    coach: `Your insight "${clip(insight, 50)}" and need "${clip(need, 50)}" connect. Why can an advisor squad win here where "${clip(ctx.step4[0]?.solution, 30) || 'their current workaround'}" fails?`,
    evidenceScore,
    provider: 'local',
  };
}

/** @param {number} stepIndex @param {VentureStudioContext} ctx */
export function buildVentureStudioCoachPayloadFields(stepIndex, ctx) {
  const selectedGoals = Object.entries(ctx.step2.goals)
    .filter(([, on]) => on)
    .map(([key]) => GOAL_LABELS[key] ?? key);

  return {
    step: String(stepIndex),
    squadName: ctx.squadName,
    targetSegment: ctx.targetSegment,
    stage: ctx.step1.stage,
    dayInLife: ctx.step1.dayInLife,
    surprise: ctx.step1.surprise,
    goals: selectedGoals.join(', '),
    whyImportant: ctx.step2.whyImportant,
    problems: ctx.step3.map((r, i) => `${i + 1}. ${r.problem} | evidence: ${r.evidence} | ${r.confidence}`).join('\n'),
    solutions: ctx.step4
      .map((r, i) => `${i + 1}. ${r.solution} | limits: ${r.limitations}`)
      .join('\n'),
    insight: ctx.step5.suggests,
    unmetNeed: ctx.step5.unmetNeed,
    valueCreation: ctx.step5.valueCreation,
    evidenceNotes: ctx.evidenceList
      .filter((e) => e.type === 'note')
      .map((e) => e.content)
      .slice(0, 5)
      .join(' | '),
    evidenceCount: String(ctx.evidenceList.length),
  };
}
