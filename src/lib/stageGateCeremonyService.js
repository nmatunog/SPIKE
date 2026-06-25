/**
 * Stage Gate Ceremony — live squad venture / FEC / assessment data for Friday closing.
 */
import { groupInternsBySquad } from './facultyMentorFrameworkService.js';
import {
  week1OutputCompletionPct,
  getParticipantWeek1Outputs,
} from './mentorFrameworkService.js';
import { deriveVentureIdentity, deriveVentureMilestones } from './myVentureHqService.js';
import { loadVentureDesignRecord, loadSquadDesignRecord } from './ventureDesignStudioService.js';
import { loadVentureStudioState } from './ventureStudioStorage.js';
import { getCanvasSummary } from './canvasSummaryService.js';
import { getEffectiveCanvasCompletionPct } from './participantOutputMetrics.js';
import { getParticipantSquad } from './cohortFormationService.js';
import { countSquadsWithReviewForInterns } from './staff/squadAssessmentService.js';
import { getSquadMentorReview, getSquadWeeklyXp } from './staff/squadXpService.js';
import { getSquadPitchPanelSnapshot } from './staff/pitchPanelService.js';
import { listPortfolioDeliverablesLocal } from './portfolioDeliverableService.js';
import { deriveEngagementLevel } from './staffCoachHomeService.js';
import { getStageGateDefinition } from './stageGateCeremonyConstants.js';
import { isStageGateUnlocked, readStageGateUnlock } from './stageGateCeremonyStorage.js';
import { UNLOCK_WEEK2 } from './programUnlocks.js';
import { staffStageGateHref } from '../routes/paths.js';

/** @param {string | undefined | null} value */
function hasText(value) {
  return Boolean(String(value ?? '').trim());
}

/** @param {import('./ventureDesignStudioConstants.js').VentureDesignIndividualDraft} draft */
function synthesizeUvpFromDraft(draft) {
  const summary = [
    draft?.step3?.synthesisA,
    draft?.step3?.synthesisB,
    draft?.step3?.synthesisC,
  ].filter((part) => hasText(part));
  if (summary.length >= 2) return summary.join(' ');
  if (hasText(draft?.step3?.transformation)) return String(draft.step3.transformation).trim();
  if (hasText(draft?.step3?.whyUs)) return String(draft.step3.whyUs).trim();
  return '';
}

/**
 * @param {import('./ventureDesignStudioConstants.js').VentureDesignIndividualDraft} consolidated
 * @param {Array<{ id: string }>} members
 */
function resolveSquadVentureFields(consolidated, members) {
  let uvp = synthesizeUvpFromDraft(consolidated);
  let focusMarket =
    consolidated?.step1?.customer?.trim()
    || consolidated?.step1?.opportunity?.trim()
    || '';
  let ventureName = consolidated?.step4?.name?.trim() || '';
  let tagline = consolidated?.step4?.tagline?.trim() || '';
  let fecUvp = '';
  let canvasPct = 0;

  for (const member of members) {
    const design = loadVentureDesignRecord(member.id);
    const studio = loadVentureStudioState(member.id);
    const canvas = getCanvasSummary(member.id);
    const effectiveCanvasPct = getEffectiveCanvasCompletionPct(member.id);
    canvasPct = Math.max(canvasPct, effectiveCanvasPct);

    if (!focusMarket) {
      focusMarket =
        design.individual?.step1?.customer?.trim()
        || studio.targetSegment?.trim()
        || studio.step1?.stage?.trim()
        || '';
    }
    if (!uvp) uvp = synthesizeUvpFromDraft(design.individual);
    if (!uvp && hasText(canvas.unified_venture_proposition)) {
      uvp = String(canvas.unified_venture_proposition).trim();
    }
    if (!fecUvp && hasText(canvas.unified_venture_proposition)) {
      fecUvp = String(canvas.unified_venture_proposition).trim();
    }
    if (!ventureName) {
      const identity = deriveVentureIdentity(member.id, '');
      if (identity.hasNamedVenture) ventureName = identity.ventureName;
      if (!tagline && identity.tagline && !identity.tagline.startsWith('Name your')) {
        tagline = identity.tagline;
      }
    }
  }

  return {
    ventureName: ventureName || 'Venture forming',
    tagline,
    focusMarket: focusMarket || 'Target segment in progress',
    uvp: uvp || 'UVP draft in progress — consolidate in Venture Design Studio.',
    fecUvp: fecUvp || uvp,
    canvasPct,
  };
}

/** @param {Array<{ id: string }>} members */
function deriveSquadOutputChecks(members) {
  const checks = members.map((member) => {
    const milestones = deriveVentureMilestones(member.id);
    const byId = Object.fromEntries(milestones.map((m) => [m.id, m.complete]));
    const outputs = getParticipantWeek1Outputs(member.id);
    const pct = week1OutputCompletionPct(outputs);
    return { byId, pct };
  });

  const avgPct = checks.length
    ? Math.round(checks.reduce((sum, row) => sum + row.pct, 0) / checks.length)
    : 0;

  return {
    researchComplete: checks.some((row) => row.byId.customer || row.byId.problem),
    segmentMapped: checks.some((row) => row.byId.customer || row.byId.opportunity),
    uvpGenerated: checks.some((row) => row.byId.uvp),
    fecStarted: checks.some((row) => row.byId['business-model'] || row.byId['financial-plan']),
    pitchPortfolioReady:
      members.some((member) =>
        listPortfolioDeliverablesLocal(member.id).some((d) => d.category === 'presentation'),
      )
      || checks.some((row) => row.byId.pitch || row.byId.uvp)
      || avgPct >= 50,
    avgOutputPct: avgPct,
  };
}

/**
 * @param {Array<{ id: string, name: string, squad?: string, hours?: number }>} interns
 * @param {{ segment?: number, closingWeek?: number, role?: 'faculty' | 'mentor' }} opts
 */
export function deriveStageGateCeremony(interns, opts = {}) {
  const segment = opts.segment ?? 1;
  const closingWeek = opts.closingWeek ?? 1;
  const role = opts.role ?? 'faculty';
  const gate = getStageGateDefinition(closingWeek);
  const squads = groupInternsBySquad(interns);
  const unlocked = isStageGateUnlocked(segment, closingWeek) || (UNLOCK_WEEK2 && segment === 1 && closingWeek === 1);
  const unlockRecord = readStageGateUnlock(segment, closingWeek);

  const squadRows = squads.map((squad) => {
    const members = squad.members;
    const squadRecord = members[0]?.id ? getParticipantSquad(members[0].id) : null;
    const squadId = squadRecord?.id ?? squad.name;
    const squadDesign = loadSquadDesignRecord(squadId);
    const venture = resolveSquadVentureFields(squadDesign.consolidated, members);
    const outputs = deriveSquadOutputChecks(members);
    const memberIds = members.map((m) => m.id);
    const review = getSquadMentorReview(squad.name, closingWeek);
    const squadXp = getSquadWeeklyXp(squad.name, memberIds, closingWeek);
    const ratingValues = review
      ? Object.values(review.ratings ?? {}).filter((v) => v > 0)
      : [];
    const assessmentAvg = ratingValues.length
      ? ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length
      : 0;
    const panel = getSquadPitchPanelSnapshot(squad.name, memberIds, closingWeek);
    const pitchScore =
      panel.panelAverage != null
        ? Math.round(panel.panelAverage * 10) / 10
        : review && assessmentAvg > 0
          ? Math.round(assessmentAvg * 10) / 10
          : squadDesign.mentorRating != null && squadDesign.mentorRating > 0
            ? Number(squadDesign.mentorRating)
            : squadXp.totalXp > 0
              ? Math.round((squadXp.totalXp / 24) * 10) / 10
              : null;
    const engagement = deriveEngagementLevel(outputs.avgOutputPct, assessmentAvg || squadXp.totalXp / 25);
    const ready = outputs.pitchPortfolioReady
      || (
        hasText(venture.uvp)
        && !venture.uvp.includes('in progress')
        && (outputs.uvpGenerated || outputs.fecStarted)
        && outputs.avgOutputPct >= 40
      );

    return {
      slug: encodeURIComponent(squad.name),
      name: squad.name,
      memberCount: squad.count,
      ventureName: venture.ventureName,
      tagline: venture.tagline,
      focusMarket: venture.focusMarket,
      uvp: venture.uvp,
      fecUvp: venture.fecUvp,
      canvasPct: venture.canvasPct,
      outputs,
      pitchScore,
      mentorNotes: review?.aiSummary || squadDesign.mentorNotes || squadDesign.coachSummary || '',
      engagement,
      status: ready ? 'Ready' : 'Needs review',
      gatePassed: ready,
    };
  });

  const pitchScores = squadRows.map((row) => row.pitchScore).filter((s) => s != null);
  const avgPitchRating = pitchScores.length
    ? (pitchScores.reduce((a, b) => a + (b ?? 0), 0) / pitchScores.length).toFixed(1)
    : '—';
  const pitchesSubmittedPct = squadRows.length
    ? Math.round(
        (squadRows.filter((row) => row.outputs.pitchPortfolioReady || row.pitchScore).length
          / squadRows.length)
          * 100,
      )
    : 0;
  const squadsWithReview = countSquadsWithReviewForInterns(interns, closingWeek);

  const allSquadsReady = squadRows.length > 0 && squadRows.every((row) => row.gatePassed);
  const activeStageIndex = unlocked ? gate.nextWeek : closingWeek;
  const activeStageNumber = Math.min(4, Math.max(1, activeStageIndex <= 1 ? 1 : activeStageIndex <= 2 ? 2 : activeStageIndex <= 3 ? 3 : 4));

  return {
    gate,
    segment,
    closingWeek,
    role,
    unlocked,
    unlockRecord,
    stageGateHref: staffStageGateHref(role, segment, closingWeek),
    squads: squadRows,
    metrics: {
      totalSquads: squadRows.length,
      totalInterns: interns.length,
      pitchesSubmittedPct,
      avgPitchRating,
      assessmentsLogged: squadsWithReview,
      allSquadsReady,
    },
    advancementChecklist: [
      {
        label: `${interns.length} participants in cohort`,
        complete: interns.length > 0,
      },
      {
        label: `${squadRows.filter((s) => s.gatePassed).length} / ${squadRows.length || 0} squads pitch-ready`,
        complete: allSquadsReady,
      },
      {
        label: `${squadsWithReview} squad reviews logged (Week ${closingWeek})`,
        complete: squadsWithReview >= (squadRows.length || 1),
      },
      {
        label: 'Squad venture & FEC data captured',
        complete: squadRows.some((s) => s.outputs.uvpGenerated || s.canvasPct > 0),
      },
    ],
    programStages: [
      { stage: 1, label: 'DISCOVER', state: activeStageNumber > 1 || unlocked ? 'complete' : 'active', pct: activeStageNumber > 1 || unlocked ? 100 : 100 },
      { stage: 2, label: 'VALIDATE', state: unlocked && closingWeek === 1 ? 'active' : activeStageNumber > 2 ? 'complete' : activeStageNumber === 2 ? 'active' : 'locked', pct: unlocked && closingWeek === 1 ? 10 : activeStageNumber > 2 ? 100 : 0 },
      { stage: 3, label: 'BUILD', state: activeStageNumber > 3 ? 'complete' : activeStageNumber === 3 ? 'active' : 'locked', pct: activeStageNumber === 3 ? 10 : activeStageNumber > 3 ? 100 : 0 },
      { stage: 4, label: 'PITCH', state: activeStageNumber === 4 ? 'active' : 'locked', pct: activeStageNumber === 4 ? 5 : 0 },
    ],
  };
}
