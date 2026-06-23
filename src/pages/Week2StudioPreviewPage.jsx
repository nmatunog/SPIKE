import { useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer.jsx';
import { Week2MissionPlaybookView } from '../components/playbook/week2/Week2MissionPlaybookView.jsx';
import {
  COACH_WEEK2_STUDIO_PREVIEW_PARTICIPANT_ID,
  COACH_WEEK2_STUDIO_PREVIEW_SQUAD,
  ensureCoachWeek2StudioPreviewSeeded,
  resetCoachWeek2StudioPreview,
} from '../lib/customerDiscovery/coachWeek2StudioPreview.js';
import { getActiveWeek2Task } from '../lib/customerDiscovery/week2MissionService.js';
import { playbookHref, ROUTES } from '../routes/paths.js';
import { PROGRAM_COACH_LABEL } from '../lib/terminology.js';

/**
 * Staff-only preview of Week 2 SPIKE Studio — sample participant sandbox.
 * @param {{ backHref?: string, backLabel?: string, roleLabel?: string }} props
 */
export function Week2StudioPreviewPage({
  backHref = ROUTES.programCoachHome,
  backLabel = 'Back to coach home',
  roleLabel = PROGRAM_COACH_LABEL,
}) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    ensureCoachWeek2StudioPreviewSeeded();
  }, []);

  const day = useMemo(() => {
    const parsed = Number.parseInt(searchParams.get('day') ?? '', 10);
    return Number.isFinite(parsed) && parsed >= 1 && parsed <= 5 ? parsed : 1;
  }, [searchParams]);

  const missionSlug = useMemo(() => {
    const fromQuery = searchParams.get('mission');
    if (fromQuery) return fromQuery;
    return getActiveWeek2Task(COACH_WEEK2_STUDIO_PREVIEW_PARTICIPANT_ID, day).slug;
  }, [searchParams, day]);

  useEffect(() => {
    if (searchParams.get('mission')) return;
    const params = new URLSearchParams(searchParams);
    params.set('mission', missionSlug);
    params.set('day', String(day));
    setSearchParams(params, { replace: true });
  }, [searchParams, missionSlug, day, setSearchParams]);

  function syncQuery(next) {
    const params = new URLSearchParams(searchParams);
    if (next.mission) params.set('mission', next.mission);
    if (next.day != null) params.set('day', String(next.day));
    setSearchParams(params);
  }

  function handleReset() {
    resetCoachWeek2StudioPreview();
    syncQuery({ day: 1, mission: 'mission' });
    window.location.reload();
  }

  return (
    <PageContainer presentation wide>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link
          to={backHref}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-spike"
        >
          <ArrowLeft size={16} aria-hidden />
          {backLabel}
        </Link>
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          <RotateCcw size={14} aria-hidden />
          Reset sample data
        </button>
      </div>

      <div className="mb-6 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950">
        <p className="font-semibold">{roleLabel} preview — SPIKE Studio</p>
        <p className="mt-1 text-sky-900">
          This is the same mission journey interns see in Playbook. All five days are unlocked so you can
          rehearse before the workshop. Edits save locally as sample data only — your cohort is not affected.
        </p>
        <Link
          to={playbookHref({ segment: 1, week: 2, day })}
          className="mt-2 inline-flex text-sm font-semibold text-spike hover:underline"
        >
          Open coach delivery view for Day {day} →
        </Link>
      </div>

      <Week2MissionPlaybookView
        participantId={COACH_WEEK2_STUDIO_PREVIEW_PARTICIPANT_ID}
        squadName={COACH_WEEK2_STUDIO_PREVIEW_SQUAD}
        missionSlug={missionSlug}
        playbookDay={day}
        calendarDay={day}
        onOpenCurriculum={() => navigate(playbookHref({ segment: 1, week: 2, day }))}
        onMissionNavigate={(slug) => syncQuery({ mission: slug })}
      />
    </PageContainer>
  );
}
