/**
 * Stage gate definitions — Friday ceremony after squad pitch (one per closing week).
 * @typedef {{
 *   closingWeek: number,
 *   segment: number,
 *   stageLabel: string,
 *   nextStageLabel: string,
 *   nextWeek: number,
 *   ceremonyTitle: string,
 *   gateSubtitle: string,
 *   quote: string,
 *   progressChecklist: string[],
 *   nextPhaseCards: Array<{ title: string, body: string, detail: string }>,
 *   hourRange: string,
 * }} StageGateDefinition
 */

/** @type {Record<number, StageGateDefinition>} */
export const STAGE_GATE_BY_CLOSING_WEEK = {
  1: {
    closingWeek: 1,
    segment: 1,
    stageLabel: 'DISCOVER',
    nextStageLabel: 'VALIDATE',
    nextWeek: 2,
    ceremonyTitle: 'Stage Gate Ceremony I',
    gateSubtitle: 'The Gate of Discovery',
    quote: 'The market will now determine whether your venture deserves to grow.',
    progressChecklist: [
      'Phase 1 entrepreneur mindset anchored',
      'Target customer segments explored & mapped',
      'Unified Venture Proposition drafted',
      'FEC financial blueprint in progress',
      'Squad venture pitch validated',
    ],
    nextPhaseCards: [
      {
        title: 'Week 2 objective',
        body: 'Venture Validation',
        detail: 'Gather real evidence from target segments to challenge initial assumptions.',
      },
      {
        title: 'Tactical fieldwork',
        body: 'Customer audits',
        detail: 'Live interviews with peers and prospects in your focus market.',
      },
      {
        title: 'Metric requirement',
        body: 'Validation evidence',
        detail: 'Upload verifiable customer feedback before the next stage gate.',
      },
    ],
    hourRange: 'Hours 41 – 110',
  },
  2: {
    closingWeek: 2,
    segment: 1,
    stageLabel: 'VALIDATE',
    nextStageLabel: 'BUILD',
    nextWeek: 3,
    ceremonyTitle: 'Stage Gate Ceremony II',
    gateSubtitle: 'The 80-Hour Market Review Gate',
    quote: 'Evidence beats opinion — your venture earns the right to build.',
    progressChecklist: [
      'Customer validation interviews completed',
      'Market feedback synthesized per squad',
      'UVP refined with field evidence',
      'FEC assumptions updated',
      'Squad validation pitch delivered',
    ],
    nextPhaseCards: [
      {
        title: 'Week 3 objective',
        body: 'Venture Build',
        detail: 'Translate validated insights into executable venture systems.',
      },
      {
        title: 'Studio focus',
        body: 'Blueprint execution',
        detail: 'Operationalize FEC and portfolio milestones as a squad.',
      },
      {
        title: 'Metric requirement',
        body: 'Build readiness',
        detail: 'Complete squad build checkpoints before the next gate.',
      },
    ],
    hourRange: 'Hours 111 – 160',
  },
  4: {
    closingWeek: 4,
    segment: 1,
    stageLabel: 'BUILD',
    nextStageLabel: 'PITCH',
    nextWeek: 5,
    ceremonyTitle: 'Stage Gate Ceremony III',
    gateSubtitle: 'The 160-Hour Professional Gate',
    quote: 'Professional ventures are built on discipline, not enthusiasm alone.',
    progressChecklist: [
      'Venture systems documented',
      'Financial model stress-tested',
      'Professional licensing path chosen',
      'Partnership board pitch rehearsed',
      'Commitment artifacts signed',
    ],
    nextPhaseCards: [
      {
        title: 'Week 5 objective',
        body: 'Partnership pitch',
        detail: 'Present venture readiness to external advisors.',
      },
      {
        title: 'Ceremony focus',
        body: 'Professional commitment',
        detail: 'Public pledge with mentor witness and licensing plan.',
      },
      {
        title: 'Metric requirement',
        body: 'Board readiness',
        detail: 'Partnership board materials complete before graduation gate.',
      },
    ],
    hourRange: 'Hours 161 – 200',
  },
};

/** @param {number} closingWeek */
export function getStageGateDefinition(closingWeek) {
  return STAGE_GATE_BY_CLOSING_WEEK[closingWeek] ?? STAGE_GATE_BY_CLOSING_WEEK[1];
}

/** SPIKE program stages for progress panel */
export const SPIKE_PROGRAM_STAGES = [
  { id: 1, label: 'DISCOVER', hourLabel: 'Hours 1 – 40' },
  { id: 2, label: 'VALIDATE', hourLabel: 'Hours 41 – 110' },
  { id: 3, label: 'BUILD', hourLabel: 'Hours 111 – 160' },
  { id: 4, label: 'PITCH', hourLabel: 'Hours 161 – 200' },
];
