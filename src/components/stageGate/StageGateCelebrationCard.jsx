import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, X } from 'lucide-react';
import {
  dismissStageGateNotification,
  readParticipantStageNotification,
} from '../../lib/stageGateService.js';
import { stageGateCertificateHref } from '../../routes/paths.js';

/**
 * Congratulations card shown after stage unlock on next login / visit.
 * @param {{ participantId: string }} props
 */
export function StageGateCelebrationCard({ participantId }) {
  const notification = readParticipantStageNotification(participantId);
  const [visible, setVisible] = useState(Boolean(notification));

  if (!visible || !notification) return null;

  const certHref = stageGateCertificateHref(notification.closingWeek ?? 1);

  function dismiss() {
    dismissStageGateNotification(participantId);
    setVisible(false);
  }

  return (
    <section className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm">
      <button
        type="button"
        onClick={dismiss}
        className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 hover:bg-white/80 hover:text-slate-600"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
      <div className="flex items-start gap-3">
        <span className="text-2xl" aria-hidden>
          🎉
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Congratulations!</p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">Stage 1 Completed</h2>
          <p className="mt-1 text-2xl font-black tracking-tight text-spike">{notification.stageLabel}</p>
          <p className="mt-2 text-sm text-slate-600">
            You have successfully completed the first stage of SPIKE. Continue your journey in Week{' '}
            {(notification.closingWeek ?? 1) + 1} — <strong>{notification.nextStageLabel}</strong>.
          </p>
          <Link
            to={certHref}
            onClick={dismiss}
            className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-spike px-5 py-2.5 text-sm font-semibold text-white hover:bg-spike-light"
          >
            <Sparkles size={16} /> View Stage Gate Certificate
          </Link>
        </div>
      </div>
    </section>
  );
}
