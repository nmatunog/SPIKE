/**
 * Staff-facing Day 1 output summaries — coach, builders, and blueprint merged.
 */
import { getDay1MissionProgress, getAllDay1BuilderData, isBuilderCompleted } from './day1BuilderService.js';
import { getCoachSummaryForMentor } from './ventureCoachService.js';
import { getParticipantSquadLabel } from './participantSquadCache.js';
import { getParticipantSquad } from './cohortFormationService.js';
import { RESEARCH_MARKETS } from './day1BuilderConstants.js';
import { ventureDirectionLabel } from './ventureCoachEngine.js';

/** @param {unknown} value @param {number} [max] */
function clip(value, max = 120) {
  const text = String(value ?? '').trim();
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/** @param {string} participantId */
export function getParticipantDay1Outputs(participantId) {
  const coach = getCoachSummaryForMentor(participantId);
  const progress = getDay1MissionProgress(participantId);
  const builders = getAllDay1BuilderData(participantId);
  const dreamBoard = builders['dream-board'];
  const charter = builders['squad-charter'];
  const squadFormation = builders['squad-formation'];

  const ambition = coach?.ambition?.trim() || '';
  const impact = (coach?.impact ?? coach?.purpose)?.trim() || '';
  const values =
    coach?.valuesProfile?.trim()
    || (coach?.topThreeValues?.length ? coach.topThreeValues.join(', ') : '');
  const tagline = coach?.tagline?.trim() || '';
  const futureSelf = coach?.futureSelf?.trim() || '';
  const track = coach?.ventureDirection?.trim() || '';
  const careerDirection = track && track !== 'undecided' ? ventureDirectionLabel(track) : '';

  const squadName =
    getParticipantSquadLabel(participantId)
    || getParticipantSquad(participantId)?.name
    || charter?.data?.squadName
    || '';

  const marketLabels = (squadFormation?.data?.marketPreferences ?? [])
    .map((id) => RESEARCH_MARKETS.find((m) => m.id === id)?.label)
    .filter(Boolean);

  const dreamBoardAssets = /** @type {Array<unknown>} */ (dreamBoard?.data?.assets ?? []);

  return {
    progressPercent: progress.percent,
    coachPercent: coach?.progress?.percent ?? 0,
    ambition,
    impact,
    values,
    tagline,
    futureSelf,
    careerDirection,
    dreamBoardDone: Boolean(dreamBoard?.completedAt) || dreamBoardAssets.length > 0,
    dreamBoardCount: dreamBoardAssets.length,
    charterDone: isBuilderCompleted(participantId, 'squad-charter'),
    charterSquadName: String(charter?.data?.squadName ?? '').trim(),
    squadName,
    squadMarkets: marketLabels.join(', '),
    hasRemoteOutputs: Boolean(
      ambition || impact || values || tagline || futureSelf || dreamBoardAssets.length,
    ),
    preview: {
      ambition: clip(ambition),
      impact: clip(impact),
      values: clip(values),
      tagline: clip(tagline),
      futureSelf: clip(futureSelf),
    },
  };
}

/**
 * @param {Array<{ id: string, name: string, squad?: string }>} interns
 */
export function summarizeCohortDay1Outputs(interns) {
  const rows = interns.map((intern) => ({
    intern,
    outputs: getParticipantDay1Outputs(intern.id),
  }));

  const withOutputs = rows.filter((r) => r.outputs.hasRemoteOutputs).length;
  const avgProgress = rows.length
    ? Math.round(rows.reduce((sum, r) => sum + r.outputs.progressPercent, 0) / rows.length)
    : 0;

  return {
    rows,
    total: interns.length,
    withOutputs,
    avgProgress,
  };
}
