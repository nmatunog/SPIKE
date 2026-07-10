import { FEC_CANVAS_EXEMPLAR_ENGINES } from './fecCanvasExemplar.js';
import { FEC_UVP_SUGGESTIVE_EXAMPLE } from './fecCanvasConstants.js';
import { getRaSpikeDiscoveryCanvas } from './raSpikeDiscoveryCanvas.js';
import { readWizardField } from './raSpikeCanvasWizard.js';

/** @param {unknown} text @param {number} [max] */
function clipPhrase(text, max = 72) {
  const raw = String(text ?? '').trim().replace(/\s+/g, ' ');
  if (!raw) return '';
  if (raw.length <= max) return raw;
  const cut = raw.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 24 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

/** @param {unknown} text */
function sentenceFragment(text) {
  const raw = String(text ?? '').trim().replace(/\s+/g, ' ');
  if (!raw) return '';
  return raw.replace(/[.!?]+$/g, '').toLowerCase();
}

/**
 * Rule-based AI Assist copy for the Week 2 FEC intro wizard.
 * @param {string} participantId
 * @param {string} stepId
 * @returns {string}
 */
export function buildFecIntroWizardAssist(participantId, stepId) {
  if (stepId === 'value_proposition') {
    return buildValuePropositionAssist(participantId);
  }
  return '';
}

/** @param {string} participantId */
function buildValuePropositionAssist(participantId) {
  const segment = readWizardField(participantId, 'create_value', 'customer_segments').trim();
  const problem = readWizardField(participantId, 'create_value', 'customer_problem').trim();
  const discovery = participantId ? getRaSpikeDiscoveryCanvas(participantId) : null;

  if (segment && problem) {
    return (
      `For ${clipPhrase(segment, 64)}, I help them move past ${sentenceFragment(problem)} `
      + '— with clear protection and investment guidance, regular check-ins, and a financial plan '
      + 'they can follow without feeling overwhelmed.'
    );
  }

  if (segment) {
    return (
      `For ${clipPhrase(segment, 64)}, I deliver trusted financial guidance: protection and growth plans `
      + 'explained simply, with accountability so they never feel alone with major money decisions.'
    );
  }

  if (problem) {
    return (
      `I help customers facing ${sentenceFragment(problem)} — with protection, disciplined saving, `
      + 'and an advisor who explains every step in plain language and stays with them over time.'
    );
  }

  const discoverySegment = [
    discovery?.idealAge,
    discovery?.idealOccupation,
    discovery?.idealLifeStage,
  ]
    .map((part) => String(part ?? '').trim())
    .filter(Boolean)
    .join(', ');

  if (discoverySegment && discovery?.topProblem) {
    return (
      `For ${clipPhrase(discoverySegment, 56)} who struggle with ${sentenceFragment(discovery.topProblem)}, `
      + 'I offer a trusted advisor relationship — protection, savings discipline, and guidance '
      + 'that turns anxiety into a clear next step.'
    );
  }

  if (discovery?.reflectionStruggle) {
    return (
      `For people who ${sentenceFragment(discovery.reflectionStruggle)}, I create financial clarity `
      + 'through protection, disciplined investing, and ongoing coaching they can actually understand.'
    );
  }

  if (!participantId) {
    return FEC_CANVAS_EXEMPLAR_ENGINES.create_value.value_offering;
  }

  return FEC_UVP_SUGGESTIVE_EXAMPLE;
}
