import { useState } from 'react';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { Week3Day3PlaybookHero } from './Week3Day3PlaybookHero.jsx';
import { BusinessEngineCanvas } from './businessEngine/BusinessEngineCanvas.jsx';
import { Week3Day3PortfolioMission } from './Week3Day3PortfolioMission.jsx';
import { Week3Day3FecBoxEditor } from './Week3Day3FecBoxEditor.jsx';
import { PlaybookDayClosingReflectionBlock } from '../PlaybookDayClosingReflectionBlock.jsx';
import { PlaybookReflectionNudge } from '../PlaybookReflectionNudge.jsx';
import { ParticipantSquadXpCard } from '../../staff/SquadXpDashboard.jsx';
import { isWeek3Day3FecEditSlug } from '../../../lib/week3Day3PortfolioService.js';

/**
 * Week 3 Day 3 mission-first Playbook — Business Engine hero, FNA role play, FEC Box 4/5 portfolio.
 * @param {{
 *   participantId: string,
 *   missionSlug?: string,
 *   programWeek?: number,
 *   focusReflection?: boolean,
 *   pendingReflection?: { week: number, day: number, title: string, label: string } | null,
 *   onOpenCurriculum?: () => void,
 *   onProgress?: () => void,
 *   onMissionNavigate?: (slug: string) => void,
 *   staffPreview?: boolean,
 * }} props
 */
export function Week3Day3MissionPlaybookView({
  participantId,
  missionSlug = '',
  programWeek = 3,
  focusReflection = false,
  pendingReflection = null,
  onOpenCurriculum,
  onProgress,
  onMissionNavigate,
  staffPreview = false,
}) {
  const [fecRefreshKey, setFecRefreshKey] = useState(0);
  const editingFec = isWeek3Day3FecEditSlug(missionSlug);

  function goToMission(slug = '') {
    onMissionNavigate?.(slug);
  }

  function handleFecSaved() {
    setFecRefreshKey((n) => n + 1);
    onProgress?.();
  }

  return (
    <div className="space-y-6">
      {pendingReflection ? (
        <PlaybookReflectionNudge
          week={pendingReflection.week}
          day={pendingReflection.day}
          title={pendingReflection.title}
          label={pendingReflection.label}
        />
      ) : null}

      {!staffPreview && participantId ? (
        <ParticipantSquadXpCard participantId={participantId} week={programWeek} compact />
      ) : null}

      <Week3Day3PlaybookHero />

      {!editingFec ? (
        <section className="rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/80 p-4 shadow-card sm:p-6">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-spike">Workshop · Page 1 & 2</p>
            <h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
              SPIKE Business Engine Canvas™
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Design your weekly operating system, simulate growth, and commit to your Year 1 revenue target.
            </p>
          </div>
          <BusinessEngineCanvas
            participantId={participantId}
            readOnly={staffPreview}
            onSaved={onProgress}
          />
        </section>
      ) : null}

      {editingFec ? (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => goToMission('')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-spike hover:underline"
          >
            <ArrowLeft size={16} aria-hidden />
            Back to Day 3 portfolio mission
          </button>
          <Week3Day3FecBoxEditor
            participantId={participantId}
            stepSlug={missionSlug}
            onSaved={handleFecSaved}
          />
        </div>
      ) : (
        <Week3Day3PortfolioMission
          participantId={participantId}
          onSaved={onProgress}
          onEditFecBox={(slug) => goToMission(slug)}
          staffPreview={staffPreview}
          fecRefreshKey={fecRefreshKey}
        />
      )}

      {onOpenCurriculum ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-sm text-slate-700">Coach slides, activities, and facilitator notes for today.</p>
          <button
            type="button"
            onClick={onOpenCurriculum}
            className="inline-flex items-center gap-2 text-sm font-semibold text-spike hover:underline"
          >
            <BookOpen size={16} aria-hidden />
            Open curriculum view
          </button>
        </div>
      ) : null}

      {!staffPreview ? (
        <PlaybookDayClosingReflectionBlock
          week={3}
          day={3}
          participantId={participantId}
          onCompleted={onProgress}
          focusReflection={Boolean(pendingReflection) || focusReflection}
        />
      ) : null}
    </div>
  );
}
