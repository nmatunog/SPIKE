import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { graduateRaSpikeParticipant } from '../../lib/raSpikeGateService.js';
import { markRaSpikeGraduationSeen } from '../../lib/raSpikeGraduation.js';
import { ROUTES } from '../../routes/paths.js';
import { useAuth } from '../../AuthContext.jsx';

/**
 * @param {{ user?: { id?: string, internProgress?: object | null }, onClose?: () => void }} props
 */
export function RaSpikeGraduationModal({ user, onClose }) {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function continueToInternship() {
    if (!user?.id) return;
    setBusy(true);
    setError('');
    try {
      await graduateRaSpikeParticipant(user.id, true);
      await refreshUser?.();
      markRaSpikeGraduationSeen(user.id);
      onClose?.();
      navigate(ROUTES.ventureBlueprint, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not transition.');
    } finally {
      setBusy(false);
    }
  }

  function dismiss() {
    if (user?.id) markRaSpikeGraduationSeen(user.id);
    onClose?.();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <Trophy className="mx-auto text-amber-500" size={48} aria-hidden />
        <h2 className="mt-4 text-center text-2xl font-bold text-slate-900">Congratulations!</h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          You completed RA-SPIKE™ — Discover &amp; Advise. You earned your certificate of completion.
        </p>
        <ul className="mt-4 space-y-1 text-sm text-slate-700">
          <li>Stage 1 — Entrepreneurial Foundation</li>
          <li>Stage 2 — Foundational Client Acquisition</li>
        </ul>
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
        <div className="mt-6 flex flex-col gap-2">
          <button type="button" disabled={busy} onClick={continueToInternship} className="spike-btn-primary min-h-[48px]">
            Continue to SPIKE Internship
          </button>
          <button type="button" onClick={dismiss} className="spike-btn-secondary min-h-[44px]">
            Stay on RA-SPIKE home
          </button>
        </div>
      </div>
    </div>
  );
}
