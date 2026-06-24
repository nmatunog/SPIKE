/**
 * Squad-level Week 2 mission progress for coach / mentor dashboards.
 */
import { loadWeek2Discovery } from './week2DiscoveryStorage.js';
import {
  deriveWeek2MissionTrack,
  week2MissionProgressPct,
} from './week2MissionService.js';
import { getReadinessMissionState } from './week2ReadinessMissionService.js';
import {
  hasAnyPctcCertificate,
  isPctcMissionComplete,
} from './week2PctcCertificateService.js';
import { WEEK2_JOURNEY_PHASES } from './week2JourneyConstants.js';

/** @param {import('./week2DiscoveryTypes.js').Week2DiscoveryState} state */
function pctcCertDetail(state) {
  const count = (state.pctcCertificate1Id ? 1 : 0) + (state.pctcCertificate2Id ? 1 : 0);
  if (count > 0) return `${count}/2 cert${count === 1 ? '' : 's'}`;
  if (isPctcMissionComplete(state)) return 'legacy note';
  return '—';
}

/**
 * Coach-facing task rows for a single intern on a playbook day.
 * @param {string} participantId
 * @param {number} day
 */
export function deriveMemberDayMissionProgress(participantId, day) {
  const d = Math.max(1, Math.min(5, day));

  if (d === 3) {
    const state = loadWeek2Discovery(participantId);
    const mission = getReadinessMissionState(participantId);
    const tasks = [
      {
        id: 'pctc',
        label: 'PCTC (1+ cert)',
        complete: isPctcMissionComplete(state),
        detail: pctcCertDetail(state),
      },
      {
        id: 'reflection',
        label: 'Reflection',
        complete: mission.reflectionApproved,
        detail: mission.reflectionApproved ? 'approved' : mission.reflectionFilled ? 'draft' : '—',
      },
      {
        id: 'uvp',
        label: 'UVP checkpoint',
        complete: Boolean(state.uvpCheckpointAt),
        detail: state.uvpCheckpointVerdict || '—',
      },
      {
        id: 'thursday',
        label: 'Thursday readiness',
        complete: mission.thursdayUnlocked,
        detail: `${mission.readinessPct}%`,
      },
    ];
    return {
      day: d,
      progressPct: mission.missionPct,
      dayComplete: tasks.every((t) => t.complete),
      tasks,
      pctcComplete: isPctcMissionComplete(state),
      hasCert: hasAnyPctcCertificate(state),
    };
  }

  const track = deriveWeek2MissionTrack(participantId, 'playbook', d);
  const tasks = track
    .filter((t) => !t.optional)
    .map((t) => ({
      id: t.id,
      label: t.shortLabel || t.label,
      complete: t.complete,
      detail: '',
    }));

  return {
    day: d,
    progressPct: week2MissionProgressPct(participantId, d),
    dayComplete: tasks.length > 0 && tasks.every((t) => t.complete),
    tasks,
    pctcComplete: false,
    hasCert: false,
  };
}

/**
 * @param {string[]} memberIds
 * @param {Array<{ id: string, name?: string }>} members
 * @param {{ week: number, day: number }} programDay
 */
export function deriveSquadWeekMissionProgress(memberIds, members, programDay) {
  const ids = memberIds.filter(Boolean);
  const nameById = Object.fromEntries((members ?? []).map((m) => [m.id, m.name || m.id.slice(0, 8)]));

  const currentDay =
    programDay.week >= 2 ? Math.max(1, Math.min(5, programDay.day)) : 1;

  const days = WEEK2_JOURNEY_PHASES.map((phase) => {
    const memberRows = ids.map((id) => ({
      participantId: id,
      name: nameById[id] ?? id.slice(0, 8),
      ...deriveMemberDayMissionProgress(id, phase.day),
    }));

    const squadPct = memberRows.length
      ? Math.round(memberRows.reduce((sum, row) => sum + row.progressPct, 0) / memberRows.length)
      : 0;

    const squadComplete = memberRows.length > 0 && memberRows.every((row) => row.dayComplete);

    const taskColumns = memberRows[0]?.tasks ?? [];

    return {
      day: phase.day,
      label: phase.label,
      theme: phase.theme,
      shortLabel: phase.shortLabel,
      isCurrent: phase.day === currentDay && programDay.week >= 2,
      isFuture: programDay.week < 2 || phase.day > currentDay,
      isPast: programDay.week >= 2 && phase.day < currentDay,
      squadPct,
      squadComplete,
      taskColumns,
      members: memberRows,
    };
  });

  const currentPhase = days.find((d) => d.isCurrent) ?? days[0];

  return {
    week: programDay.week >= 2 ? 2 : programDay.week,
    currentDay,
    currentPhase,
    days: programDay.week >= 2 ? days : days.slice(0, 1),
  };
}
