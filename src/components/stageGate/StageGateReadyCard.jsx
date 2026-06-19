import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Lock, Trophy, Unlock } from 'lucide-react';
import { validateStageCompletion, unlockStage } from '../../lib/stageGateService.js';
import { staffStageGateHref } from '../../routes/paths.js';
import { usePortalWriteAccess } from '../../hooks/usePortalWriteAccess.js';

/**
 * Coach dashboard card — appears when Week closing requirements are met.
 * @param {{
 *   role: 'faculty' | 'mentor',
 *   interns: Array<{ id: string, name: string, squad?: string }>,
 *   segment?: number,
 *   closingWeek?: number,
 *   staffId?: string,
 *   staffName?: string,
 *   onUnlocked?: () => void,
 * }} props
 */
export function StageGateReadyCard({
  role,
  interns,
  segment = 1,
  closingWeek = 1,
  staffId = '',
  staffName = 'Coach',
  onUnlocked,
}) {
  const { canWrite } = usePortalWriteAccess();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const validation = useMemo(
    () => validateStageCompletion(interns, { segment, closingWeek, role }),
    [interns, segment, closingWeek, role, refreshKey],
  );

  const { gate, metrics, ready, alreadyUnlocked } = validation;
  const ceremonyHref = staffStageGateHref(role, segment, closingWeek);

  if (alreadyUnlocked) {
    return (
      <section className="spike-card border-emerald-200 bg-emerald-50/60 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Stage gate</p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">
              Stage 2: {gate.nextStageLabel} unlocked
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Week {closingWeek} ({gate.stageLabel}) is complete. Certificates issued.
            </p>
          </div>
          <Link to={ceremonyHref} className="spike-btn-secondary shrink-0 text-sm">
            <Trophy size={16} className="mr-1 inline" /> Replay ceremony
          </Link>
        </div>
      </section>
    );
  }

  if (!ready && metrics.totalSquads === 0) return null;

  async function handleUnlock() {
    if (!canWrite) return;
    setBusy(true);
    setError('');
    try {
      const result = await unlockStage(interns, {
        segment,
        closingWeek,
        staffId,
        staffName,
        force: !validation.ready,
      });
      if (!result.ok) {
        setError(result.error ?? 'Could not unlock stage.');
        return;
      }
      setShowDialog(false);
      setRefreshKey((k) => k + 1);
      onUnlocked?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unlock failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section
        className={`spike-card p-6 ${
          ready ? 'border-spike/30 bg-gradient-to-br from-white to-spike-muted/30' : 'border-slate-200'
        }`}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              {ready ? (
                <Unlock size={18} className="text-spike" aria-hidden />
              ) : (
                <Lock size={18} className="text-slate-400" aria-hidden />
              )}
              <p className="text-xs font-bold uppercase tracking-widest text-spike">Stage gate ready</p>
            </div>
            <h2 className="mt-2 text-xl font-bold text-slate-900">
              {ready
                ? `All Week ${closingWeek} requirements completed`
                : `Week ${closingWeek} stage gate in progress`}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {ready
                ? `Stage 1 (${gate.stageLabel}) is ready to be unlocked.`
                : 'Complete squad venture pitch presentations to unlock Stage 2.'}
            </p>
            <ul className="mt-4 space-y-1.5 text-sm text-slate-700">
              <li className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-600" /> Total participants:{' '}
                <strong>{metrics.totalParticipants}</strong>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-600" /> Total squads:{' '}
                <strong>{metrics.totalSquads}</strong>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle
                  size={14}
                  className={metrics.weekCompletionPct >= 60 ? 'text-emerald-600' : 'text-slate-300'}
                />
                Week {closingWeek} completion: <strong>{metrics.weekCompletionPct}%</strong>
              </li>
            </ul>
            {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
            <button
              type="button"
              disabled={!canWrite || busy}
              onClick={() => setShowDialog(true)}
              className="spike-btn-primary min-h-[48px] disabled:opacity-50"
            >
              Unlock Stage 2
            </button>
            <Link to={ceremonyHref} className="spike-btn-secondary text-center text-sm">
              Open ceremony
            </Link>
          </div>
        </div>
      </section>

      {showDialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="spike-card max-w-md p-6" role="dialog" aria-labelledby="unlock-stage-title">
            <h3 id="unlock-stage-title" className="text-lg font-bold text-slate-900">
              Unlock Stage 2?
            </h3>
            <p className="mt-2 text-sm text-slate-600">This will:</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-600" /> Complete Stage 1 ({gate.stageLabel})
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-600" /> Lock Week {closingWeek}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-600" /> Unlock Week {gate.nextWeek} ({gate.nextStageLabel})
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-600" /> Generate certificates
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-600" /> Update participant portfolios
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-600" /> Notify participants
              </li>
            </ul>
            <div className="mt-6 flex gap-3">
              <button type="button" className="spike-btn-secondary flex-1" onClick={() => setShowDialog(false)}>
                Cancel
              </button>
              <button
                type="button"
                disabled={busy || !canWrite}
                className="spike-btn-primary flex-1"
                onClick={handleUnlock}
              >
                {busy ? 'Unlocking…' : 'Unlock Stage'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
