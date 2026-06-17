/**
 * Program Coach exemplar — projection "full canvas" mode (AIA Philippines).
 */
import { FEC_UVP_SUGGESTIVE_EXAMPLE } from './fecCanvasConstants.js';

/** One sentence — same structure as Venture Design Studio Step 3. */
export const FEC_CANVAS_EXEMPLAR_UVP = FEC_UVP_SUGGESTIVE_EXAMPLE.replace(
  'affordable protection',
  'AIA protection',
).replace(' while building a scalable advisory business', '');

/** @type {Record<string, Record<string, string>>} */
export const FEC_CANVAS_EXEMPLAR_ENGINES = {
  create_value: {
    customer_segments:
      'Young Filipino professionals (25–35) in BPO and tech — first-time protection buyers with rising income but low financial literacy.',
    customer_problem:
      'They want to protect family and build wealth, but products feel complex and pushy.',
    value_offering:
      'A trusted AIA advisor relationship: simplified protection and investment-linked plans aligned to life milestones (marriage, home, retirement, health).',
  },
  capture_value: {
    revenue_streams:
      'AIA protection premiums, investment-linked advisory fees, and recurring financial review sessions bundled into an annual wellness plan.',
    cost_structure:
      'Licensing, CRM, lead generation, mentor coaching time, and compliance — kept lean through digital-first delivery.',
    profit_formula:
      'Profit = (Active clients × average annual fee) − (acquisition cost + service cost per client). Target 30% margin by Year 2.',
  },
  enable_value: {
    key_resources:
      'SPIKE training, AIA Philippines product suite, squad mentor network, personal brand, and a simple client CRM.',
    key_partners:
      'AIA Philippines agency support, Program Coach, squad mentor, and referral partners in HR / community groups.',
    funding_strategy:
      'Bootstrap from early AIA commissions; reinvest 20% of revenue into marketing and talent once 15 active clients are secured.',
  },
  prove_value: {
    revenue: '₱480K annualized (Year 1 target)',
    profit: '₱144K',
    cac: '₱2,500 per client',
    ltv: '₱18,000',
    clients: '24 active',
    referrals: '35% of new leads',
    conversion: '18% first meeting → policy',
    families_protected: '24',
    premium_placed: '₱1.2M',
    lives_improved: '72 (client + household)',
  },
  agency_talent: {
    talent_segments: 'Career shifters and fresh grads seeking flexible income with mentorship.',
    recruit_value_proposition: 'Train-with-earn pathway: licensing support + squad accountability from Day 1.',
    recruitment_channels: 'University partners, alumni networks, and intern cohort referrals.',
    talent_development_system: 'Weekly squad huddles, role-play, and shadowing before solo client meetings.',
  },
  agency_leadership: {
    culture_statement: 'Growth with integrity — clients first, squad second, ego never.',
    leadership_system: 'Monthly business reviews, transparent scorecards, and mentor escalation paths.',
    expansion_strategy: 'District hub model: one anchor advisor recruits and coaches 5–8 associates.',
    growth_multipliers: 'Referral loops, digital content, and corporate wellness partnerships.',
  },
};

export const FEC_CANVAS_EXEMPLAR_SUMMARY = {
  unified_venture_proposition: FEC_CANVAS_EXEMPLAR_UVP,
  roadmap_12mo: 'AIA licensing, first 10 clients, repeatable discovery call, 30% FEC complete.',
  roadmap_24mo: '25 AIA client relationships, referral engine, first associate recruited, profitable unit economics.',
  roadmap_36mo: 'District hub — 50+ families protected through AIA, 3 associates, recognized community advisor brand.',
  success_narrative:
    'In three years we help 50+ Filipino families achieve financial independence through AIA protection and disciplined habits.',
  success_revenue: '₱1.5M annual revenue',
  success_customers: '50 active client relationships',
  success_families_protected: '50',
  success_jobs: '3 associate advisors',
  success_annual_profit: '₱450K',
};
