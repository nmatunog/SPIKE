import { CheckCircle2, Lock } from 'lucide-react';
import { readParticipantStageProgress } from '../../lib/stageGateParticipantStorage.js';
import { SPIKE_PROGRAM_STAGES } from '../../lib/stageGateCeremonyConstants.js';

const STAGE_KEYS = ['discover', 'validate', 'build', 'pitch'];

/**
 * Venture HQ journey timeline — DISCOVER → VALIDATE → BUILD → PITCH.
 * @param {{ participantId: string }} props
 */
export function StageGateJourneyPanel({ participantId }) {
  const progress = readParticipantStageProgress(participantId);

  return (
    <section className="py-8">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Journey</p>
      <ol className="mt-5 space-y-0">
        {SPIKE_PROGRAM_STAGES.map((stage, index) => {
          const key = STAGE_KEYS[index] ?? 'discover';
          const row = progress[key] ?? { status: 'locked' };
          const isCompleted = row.status === 'completed';
          const isActive = row.status === 'active';
          const isLocked = row.status === 'locked';

          return (
            <li key={stage.label} className="relative flex gap-4 pb-8 last:pb-0">
              {index < SPIKE_PROGRAM_STAGES.length - 1 ? (
                <span
                  aria-hidden
                  className={`absolute left-[11px] top-7 h-[calc(100%-12px)] w-0.5 ${
                    isCompleted ? 'bg-emerald-400' : 'bg-slate-200'
                  }`}
                />
              ) : null}
              <div
                className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                  isCompleted
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : isActive
                      ? 'border-spike bg-white text-spike'
                      : 'border-slate-200 bg-slate-50 text-slate-300'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 size={14} />
                ) : isLocked ? (
                  <Lock size={12} />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-spike" />
                )}
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p
                  className={`text-sm font-bold tracking-wide ${
                    isLocked ? 'text-slate-400' : 'text-slate-900'
                  }`}
                >
                  {stage.label}
                </p>
                <p className="text-xs text-slate-500">{stage.hourLabel}</p>
                <p
                  className={`mt-1 text-xs font-semibold uppercase tracking-wide ${
                    isCompleted
                      ? 'text-emerald-700'
                      : isActive
                        ? 'text-spike'
                        : 'text-slate-400'
                  }`}
                >
                  {isCompleted ? '✓ Completed' : isActive ? 'Current' : 'Locked'}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
