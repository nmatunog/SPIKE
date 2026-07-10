import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { RaSpikeShell } from '../../components/ra-spike/RaSpikeShell.jsx';
import { getRaSpikeStepContent } from '../../lib/raSpikeContentLoader.js';
import { isBuilderCompleted } from '../../lib/day1BuilderService.js';
import {
  canSubmitRaSpikeWeek,
  fetchRaSpikeWeekProgress,
  getStepStatus,
  isRaSpikeStepUnlocked,
  setRaSpikeStepStatus,
  submitRaSpikeWeek,
} from '../../lib/raSpikeWeekProgress.js';
import { isCanvasWizardComplete, isFecIntroWizardComplete } from '../../lib/raSpikeCanvasWizard.js';
import { isDiscoveryCanvasComplete } from '../../lib/raSpikeDiscoveryCanvas.js';
import { isRaSpikeWorksheetComplete } from '../../lib/raSpikeWorksheetStorage.js';
import { isGatePrepComplete, gateNumberForWeek } from '../../lib/raSpikeGateService.js';
import {
  ROUTES,
  raSpikePlaybookDreamBoardHref,
  raSpikePlaybookFecIntroHref,
  raSpikePlaybookCanvasWizardHref,
  raSpikePlaybookDiscoveryCanvasHref,
  raSpikeStageGateHref,
  raSpikePlaybookStepHref,
} from '../../routes/paths.js';
import { useAuth } from '../../AuthContext.jsx';
import { isRaSpikeCoachPreviewUser } from '../../lib/raSpikeCoachPreview.js';

/**
 * @param {{
 *   user?: { id?: string, internProgress?: object | null },
 *   week: number,
 *   stepId: string,
 * }} props
 */
export function RaSpikeWeekStepPage({ user, week, stepId }) {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const staffPreview = isRaSpikeCoachPreviewUser(user);
  const participantId = staffPreview ? '' : (user?.id ?? '');
  const content = getRaSpikeStepContent(week, /** @type {import('../../lib/raSpikeWeekProgress.js').RaSpikeStepId} */ (stepId));

  const [progress, setProgress] = useState({});
  const [reflection, setReflection] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    if (!participantId) return;
    const row = await fetchRaSpikeWeekProgress(participantId, week);
    setProgress(row);
    setReflection(row.reflectionNotes ?? '');
  }, [participantId, week]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    reload()
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reload]);

  useEffect(() => {
    if (!participantId) return;
    if (stepId === 'workshop' && week === 2 && isDiscoveryCanvasComplete(participantId)) {
      setRaSpikeStepStatus(participantId, week, 'workshop', 'complete').then(setProgress).catch(() => {});
    }
    if (stepId !== 'assignment') return;
    if (week === 1 && isBuilderCompleted(participantId, 'dream-board')) {
      setRaSpikeStepStatus(participantId, week, 'assignment', 'complete').then(setProgress).catch(() => {});
    }
    if (week === 2 && isFecIntroWizardComplete(participantId)) {
      setRaSpikeStepStatus(participantId, week, 'assignment', 'complete').then(setProgress).catch(() => {});
    }
    if (week === 3 && isCanvasWizardComplete(participantId)) {
      setRaSpikeStepStatus(participantId, week, 'assignment', 'complete').then(setProgress).catch(() => {});
    }
    const gateNum = gateNumberForWeek(week) ?? (content.action?.type === 'stage-gate' ? content.action.gate : null);
    if (gateNum && isGatePrepComplete(participantId, gateNum)) {
      setRaSpikeStepStatus(participantId, week, 'assignment', 'complete').then(setProgress).catch(() => {});
    }
    if (week === 5 && isRaSpikeWorksheetComplete(participantId, 'prospecting')) {
      setRaSpikeStepStatus(participantId, week, 'assignment', 'complete').then(setProgress).catch(() => {});
    }
    if (week === 6 && isRaSpikeWorksheetComplete(participantId, 'discovery-log')) {
      setRaSpikeStepStatus(participantId, week, 'assignment', 'complete').then(setProgress).catch(() => {});
    }
  }, [stepId, participantId, week]);

  if (!content) {
    return (
      <RaSpikeShell user={user}>
        <PageContainer>
          <p className="text-slate-600">Step not found.</p>
          <Link to={ROUTES.raSpikePlaybook} className="mt-4 inline-block text-spike hover:underline">
            Back to Playbook
          </Link>
        </PageContainer>
      </RaSpikeShell>
    );
  }

  const stepKey = /** @type {import('../../lib/raSpikeWeekProgress.js').RaSpikeStepId} */ (stepId);
  const unlocked = staffPreview || isRaSpikeStepUnlocked(progress, stepKey);
  const status = getStepStatus(progress, stepKey);
  function assignmentHref() {
    const action = content.action;
    if (!action) return null;
    if (action.type === 'dream-board') return raSpikePlaybookDreamBoardHref();
    if (action.type === 'fec-intro-wizard') return raSpikePlaybookFecIntroHref();
    if (action.type === 'discovery-canvas') return raSpikePlaybookDiscoveryCanvasHref();
    if (action.type === 'canvas-wizard') return raSpikePlaybookCanvasWizardHref();
    if (action.type === 'stage-gate') return raSpikeStageGateHref(action.gate ?? 1, week);
    if (action.type === 'prospecting') return ROUTES.raSpikePlaybookProspecting;
    if (action.type === 'discovery-log') return ROUTES.raSpikePlaybookDiscoveryLog;
    return null;
  }

  const stepActionLink =
    (stepId === 'assignment' || stepId === 'workshop') && content.action ? assignmentHref() : null;

  async function markComplete(nextStatus = 'complete') {
    setBusy(true);
    setError('');
    try {
      const next = await setRaSpikeStepStatus(participantId, week, stepKey, nextStatus, {
        reflectionNotes: stepId === 'reflection' ? reflection : undefined,
      });
      setProgress(next);
      if (nextStatus === 'complete' && stepId !== 'submit') {
        const order = ['learn', 'workshop', 'assignment', 'reflection', 'submit'];
        const idx = order.indexOf(stepId);
        const nextStep = order[idx + 1];
        if (nextStep) {
          navigate(raSpikePlaybookStepHref(nextStep, week), { replace: true });
          return;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save progress.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmitWeek() {
    setBusy(true);
    setError('');
    try {
      await submitRaSpikeWeek(participantId, week);
      await refreshUser?.();
      navigate(ROUTES.raSpikeHome, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit week.');
    } finally {
      setBusy(false);
    }
  }

  if (!unlocked && !loading) {
    return (
      <RaSpikeShell user={user}>
        <PageContainer>
          <p className="text-slate-600">Complete the previous step to unlock this one.</p>
          <Link to={ROUTES.raSpikePlaybook} className="mt-4 inline-block text-spike hover:underline">
            Back to Playbook
          </Link>
        </PageContainer>
      </RaSpikeShell>
    );
  }

  return (
    <RaSpikeShell user={user}>
      <PageContainer>
        <div className="mx-auto max-w-2xl space-y-5">
          <Link
            to={ROUTES.raSpikePlaybook}
            className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-slate-600 hover:text-spike"
          >
            <ArrowLeft size={16} aria-hidden />
            Playbook
          </Link>

          <header>
            <p className="text-sm font-semibold uppercase tracking-wider text-spike">
              Week {week} · {content.label}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">{content.headline}</h1>
            <p className="mt-2 text-slate-600">{content.summary}</p>
            {content.durationMinutes ? (
              <p className="mt-2 text-xs text-slate-500">~{content.durationMinutes} min</p>
            ) : null}
          </header>

          {loading ? (
            <p className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="animate-spin" size={16} /> Loading…
            </p>
          ) : null}

          {content.bullets?.length ? (
            <ul className="spike-card list-disc space-y-2 pl-5 text-sm text-slate-700">
              {content.bullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}

          {content.callout ? (
            <p className="rounded-xl border border-spike/20 bg-spike-muted/40 px-4 py-3 text-sm text-slate-700">
              {content.callout}
            </p>
          ) : null}

          {stepId === 'reflection' && content.prompts?.length ? (
            <div className="spike-card space-y-3">
              {content.prompts.map((prompt) => (
                <p key={prompt} className="text-sm font-medium text-slate-700">{prompt}</p>
              ))}
              <textarea
                value={reflection}
                onChange={(e) => {
                  if (staffPreview) return;
                  setReflection(e.target.value);
                  if (status === 'not_started') {
                    void setRaSpikeStepStatus(participantId, week, 'reflection', 'in_progress');
                  }
                }}
                readOnly={staffPreview}
                rows={6}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder={staffPreview ? 'Rookies write reflections here.' : 'Your reflection…'}
              />
            </div>
          ) : null}

          {stepId === 'submit' && gateNumberForWeek(week) && status === 'complete' ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              Submitted — awaiting panel evaluation. Your coach will record pass/fail after Stage Gate {gateNumberForWeek(week)}.
            </p>
          ) : null}

          {stepActionLink ? (
            <Link
              to={stepActionLink}
              className="spike-btn-primary inline-flex min-h-[48px] w-full items-center justify-center sm:w-auto"
            >
              {content.action?.label ?? 'Open assignment'}
            </Link>
          ) : null}

          {error ? (
            <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>
          ) : null}

          {!staffPreview ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              {stepId === 'submit' ? (
                <button
                  type="button"
                  disabled={busy || !canSubmitRaSpikeWeek(progress) || status === 'complete'}
                  onClick={handleSubmitWeek}
                  className="spike-btn-primary min-h-[48px] flex-1"
                >
                  {busy ? 'Submitting…' : status === 'complete' ? 'Week submitted' : 'Submit week'}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={busy || status === 'complete'}
                  onClick={() => markComplete('complete')}
                  className="spike-btn-primary min-h-[48px] flex-1"
                >
                  {busy ? 'Saving…' : status === 'complete' ? 'Completed' : `Mark ${content.label} complete`}
                </button>
              )}
            </div>
          ) : null}
        </div>
      </PageContainer>
    </RaSpikeShell>
  );
}
