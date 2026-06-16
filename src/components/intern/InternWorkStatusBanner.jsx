import { CheckCircle2, CloudUpload, HardDrive, Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../AuthContext.jsx';

const PHASE_STYLES = {
  sign_in_sync: 'border-sky-200 bg-sky-50 text-sky-900',
  cloud_sync: 'border-indigo-200 bg-indigo-50 text-indigo-950',
  local_backup: 'border-violet-200 bg-violet-50 text-violet-950',
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-950',
  error: 'border-amber-200 bg-amber-50 text-amber-950',
};

/**
 * Global intern work status — sign-in cloud sync and sign-out backup pipeline.
 */
export function InternWorkStatusBanner() {
  const { user, internCloudSyncing, internWorkStatus } = useAuth();

  if (user?.role !== 'INTERN') return null;

  const signingIn = internCloudSyncing;
  const signingOut = internWorkStatus?.showBanner && internWorkStatus.phase !== 'idle';

  if (!signingIn && !signingOut) return null;

  const phase = signingIn ? 'sign_in_sync' : internWorkStatus.phase;
  const message = signingIn
    ? 'Syncing your saved work from this device to the cloud…'
    : internWorkStatus.message;
  const style = PHASE_STYLES[phase] ?? PHASE_STYLES.cloud_sync;

  const Icon = phase === 'completed'
    ? CheckCircle2
    : phase === 'error'
      ? AlertTriangle
      : phase === 'local_backup'
        ? HardDrive
        : CloudUpload;

  const busy = phase === 'sign_in_sync' || phase === 'cloud_sync' || phase === 'local_backup';

  return (
    <div
      className={`fixed inset-x-0 top-0 z-[100] border-b px-4 py-3 shadow-sm ${style}`}
      role="status"
      aria-live="polite"
      aria-busy={busy ? 'true' : 'false'}
    >
      <div className="mx-auto flex max-w-4xl items-start gap-3 text-sm">
        {busy ? (
          <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" aria-hidden />
        ) : (
          <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        )}
        <div className="min-w-0">
          <p className="font-semibold">
            {phase === 'sign_in_sync' && 'Loading your work…'}
            {phase === 'cloud_sync' && 'Saving to cloud…'}
            {phase === 'local_backup' && 'Backing up on this device…'}
            {phase === 'completed' && 'Backup complete'}
            {phase === 'error' && 'Backup notice'}
          </p>
          <p className="mt-0.5 opacity-90">{message}</p>
          {internWorkStatus?.error && phase !== 'sign_in_sync' ? (
            <p className="mt-1 text-xs opacity-80">{internWorkStatus.error}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
