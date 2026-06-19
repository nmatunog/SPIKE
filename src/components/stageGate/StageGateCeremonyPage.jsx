import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Award,
  Check,
  CheckCircle,
  Lock,
  Sparkles,
  Trophy,
  Tv,
  Unlock,
  Users,
} from 'lucide-react';
import { deriveStageGateCeremony } from '../../lib/stageGateCeremonyService.js';
import { buildSampleStageGateCertificate, unlockStage } from '../../lib/stageGateService.js';
import { stageGatePresentationHref } from '../../routes/paths.js';
import { usePortalWriteAccess } from '../../hooks/usePortalWriteAccess.js';
import { useCohortHydration } from '../../hooks/useParticipantHydration.js';
import { StageGateCertificatePreviewModal } from './StageGateCertificatePreviewModal.jsx';
import { StageGateProjectorPanel } from './StageGateProjectorPanel.jsx';

/**
 * @param {{
 *   role: 'faculty' | 'mentor',
 *   interns: Array<{ id: string, name: string, squad?: string, hours?: number }>,
 *   segment: number,
 *   closingWeek: number,
 *   staffId?: string,
 *   homeHref: string,
 *   onUnlock?: () => void,
 * }} props
 */
export function StageGateCeremonyPage({
  role,
  interns = [],
  segment,
  closingWeek,
  staffId = '',
  homeHref,
  onUnlock,
}) {
  const { canWrite } = usePortalWriteAccess();
  const cohortIds = useMemo(() => interns.map((i) => i.id), [interns]);
  const { ready: cohortReady, version: cohortVersion, error: cohortHydrationError } = useCohortHydration(
    cohortIds,
    {
      enabled: interns.length > 0,
      interns,
    },
  );
  const [view, setView] = useState('coach');
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showSampleCert, setShowSampleCert] = useState(false);
  const [unlockBusy, setUnlockBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const model = useMemo(
    () => deriveStageGateCeremony(interns, { segment, closingWeek, role }),
    [interns, segment, closingWeek, role, refreshKey, cohortVersion],
  );

  const sampleCertificate = useMemo(
    () =>
      buildSampleStageGateCertificate(closingWeek, {
        participantName: interns[0]?.name,
        squadName: model.squads[0]?.name,
      }),
    [closingWeek, interns, model.squads],
  );

  const roleLabel = role === 'faculty' ? 'Program Coach' : 'Mentor';

  async function handleUnlock() {
    if (!canWrite) return;
    setUnlockBusy(true);
    try {
      await unlockStage(interns, {
        segment,
        closingWeek,
        staffId,
        staffName: roleLabel,
        force: true,
      });
      setShowUnlockModal(false);
      setRefreshKey((k) => k + 1);
      onUnlock?.();
    } finally {
      setUnlockBusy(false);
    }
  }

  if (view === 'projector') {
    return (
      <StageGateProjectorPanel
        model={model}
        onExit={() => setView('coach')}
        onCompleteUnlock={async () => {
          if (!model.unlocked && canWrite) {
            await unlockStage(interns, {
              segment,
              closingWeek,
              staffId,
              staffName: roleLabel,
              force: true,
            });
            setRefreshKey((k) => k + 1);
            onUnlock?.();
          }
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {!cohortReady && interns.length > 0 ? (
        <section className="spike-card border-sky-200 bg-sky-50/80 px-4 py-3 text-sm text-sky-900">
          Syncing squad venture propositions and FEC data from the cloud…
        </section>
      ) : null}
      {cohortHydrationError ? (
        <section className="spike-card border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {cohortHydrationError} Refresh the page to retry cloud sync.
        </section>
      ) : null}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            to={homeHref}
            className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-spike"
          >
            <ArrowLeft size={16} /> Back to {roleLabel} home
          </Link>
          <p className="mt-2 text-sm font-medium text-slate-500">{roleLabel}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            {model.gate.ceremonyTitle}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Week {closingWeek} closing — evaluate squad pitches, venture segments, UVP, and FEC
            readiness before unlocking {model.gate.nextStageLabel}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
              model.unlocked
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-spike-muted text-spike'
            }`}
          >
            {model.unlocked
              ? `Stage 2: ${model.gate.nextStageLabel} unlocked`
              : `Stage 1: ${model.gate.stageLabel} active`}
          </span>
          <a
            href={stageGatePresentationHref(closingWeek)}
            target="_blank"
            rel="noopener noreferrer"
            className="spike-btn-secondary inline-flex items-center gap-2 text-sm"
          >
            <Tv size={16} /> Presentation mode
          </a>
          <button
            type="button"
            onClick={() => setView('projector')}
            className="spike-btn-secondary inline-flex items-center gap-2 text-sm"
          >
            <Tv size={16} /> Projector screen
          </button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="spike-card p-6">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-spike">
              <Award size={16} /> Week {closingWeek} pitch &amp; evaluation
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricTile label="Squads" value={`${model.metrics.totalSquads}`} />
              <MetricTile label="Participants" value={`${model.metrics.totalInterns}`} />
              <MetricTile
                label="Pitch-ready squads"
                value={`${model.metrics.pitchesSubmittedPct}%`}
                accent={model.metrics.pitchesSubmittedPct >= 80}
              />
              <MetricTile
                label="Avg pitch rating"
                value={model.metrics.avgPitchRating === '—' ? '—' : `${model.metrics.avgPitchRating}/5`}
              />
            </div>
          </section>

          <section className="spike-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <h2 className="flex items-center gap-2 font-semibold text-slate-900">
                <Users size={18} className="text-spike" /> Squad pitch submissions
              </h2>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  model.metrics.allSquadsReady
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-900'
                }`}
              >
                {model.metrics.allSquadsReady ? 'All ready' : 'Review in progress'}
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {model.squads.length === 0 ? (
                <p className="px-6 py-10 text-sm text-slate-500">No squads assigned yet.</p>
              ) : (
                model.squads.map((squad) => (
                  <article key={squad.name} className="px-6 py-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">{squad.name}</h3>
                        <p className="text-sm text-slate-600">
                          {squad.ventureName}
                          {squad.tagline ? ` · ${squad.tagline}` : ''}
                        </p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-spike">
                          Segment: {squad.focusMarket}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {squad.pitchScore != null ? (
                          <span className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-900">
                            ★ {squad.pitchScore} / 5.0
                          </span>
                        ) : (
                          <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500">
                            Rating pending
                          </span>
                        )}
                        <span
                          className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                            squad.status === 'Ready'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {squad.status}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        Unique venture proposition
                      </p>
                      <p className="mt-1 text-sm italic text-slate-700">&ldquo;{squad.uvp}&rdquo;</p>
                      {squad.fecUvp && squad.fecUvp !== squad.uvp ? (
                        <p className="mt-2 text-xs text-slate-500">
                          FEC UVP: {squad.fecUvp}
                        </p>
                      ) : null}
                    </div>
                    <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold">
                      <CheckItem ok={squad.outputs.researchComplete} label="Market research" />
                      <CheckItem ok={squad.outputs.segmentMapped} label="Target segment" />
                      <CheckItem ok={squad.outputs.uvpGenerated} label="UVP drafted" />
                      <CheckItem ok={squad.outputs.fecStarted || squad.canvasPct >= 20} label={`FEC ${squad.canvasPct}%`} />
                      <CheckItem ok={squad.outputs.pitchPortfolioReady} label="Pitch portfolio" />
                    </ul>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-spike-dark p-6 text-white shadow-xl">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-spike-light">
              <Sparkles size={16} /> Stage gate system
            </div>
            <div className="mt-6 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/15 bg-white/5">
                {model.unlocked ? (
                  <Unlock className="h-10 w-10 text-emerald-400" />
                ) : (
                  <Lock className="h-10 w-10 text-spike-light" />
                )}
              </div>
              <h3 className="mt-4 text-xl font-bold">
                {model.unlocked ? `Week ${model.gate.nextWeek} ready` : `Week ${model.gate.nextWeek} locked`}
              </h3>
              <p className="mt-2 text-xs text-slate-400">
                {model.gate.gateSubtitle} — unlock after squad pitch presentations.
              </p>
            </div>
            <ul className="mt-6 space-y-2 text-xs text-slate-300">
              {model.advancementChecklist.map((item) => (
                <li key={item.label} className="flex items-center gap-2">
                  <CheckCircle
                    size={14}
                    className={item.complete ? 'text-emerald-400' : 'text-slate-600'}
                  />
                  {item.label}
                </li>
              ))}
            </ul>
            <div className="mt-6 space-y-2">
              {!model.unlocked ? (
                <>
                  <button
                    type="button"
                    disabled={!canWrite}
                    onClick={() => setShowUnlockModal(true)}
                    className="spike-btn-primary flex w-full items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Unlock size={16} />
                    Unlock {model.gate.nextStageLabel}
                  </button>
                  <button
                    type="button"
                    onClick={() => setView('projector')}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
                  >
                    <Tv size={16} /> Preview ceremony
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSampleCert(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
                  >
                    <Award size={16} /> Preview sample certificate
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setView('projector')}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
                  >
                    <Trophy size={16} /> Replay ceremony
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSampleCert(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
                  >
                    <Award size={16} /> Preview sample certificate
                  </button>
                </>
              )}
            </div>
          </section>

          <section className="spike-card p-6">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900">
              S.P.I.K.E. stage progress
            </h3>
            <div className="mt-4 space-y-4">
              {model.programStages.map((stage) => (
                <div key={stage.stage}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">
                      Stage {stage.stage}: {stage.label}
                    </span>
                    <span className="font-semibold capitalize text-slate-500">{stage.state}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all ${
                        stage.state === 'complete'
                          ? 'bg-emerald-600'
                          : stage.state === 'active'
                            ? 'bg-spike'
                            : 'bg-slate-200'
                      }`}
                      style={{ width: `${stage.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {showSampleCert ? (
        <StageGateCertificatePreviewModal
          certificate={sampleCertificate}
          onClose={() => setShowSampleCert(false)}
        />
      ) : null}

      {showUnlockModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="spike-card max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-900">
              Unlock {model.gate.nextStageLabel}?
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              This closes Week {closingWeek} ({model.gate.stageLabel}) and opens Week{' '}
              {model.gate.nextWeek} for the cohort. Run the projector ceremony with participants
              present.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                className="spike-btn-secondary flex-1"
                onClick={() => setShowUnlockModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={unlockBusy || !canWrite}
                className="spike-btn-primary flex-1"
                onClick={handleUnlock}
              >
                {unlockBusy ? 'Unlocking…' : 'Unlock & launch'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** @param {{ label: string, value: string, accent?: boolean }} props */
function MetricTile({ label, value, accent = false }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <span className="block text-xs font-semibold text-slate-500">{label}</span>
      <span className={`text-xl font-black ${accent ? 'text-emerald-600' : 'text-slate-900'}`}>
        {value}
      </span>
    </div>
  );
}

/** @param {{ ok: boolean, label: string }} props */
function CheckItem({ ok, label }) {
  return (
    <li className={`flex items-center gap-1 ${ok ? 'text-emerald-700' : 'text-slate-400'}`}>
      <Check size={14} /> {label}
    </li>
  );
}
