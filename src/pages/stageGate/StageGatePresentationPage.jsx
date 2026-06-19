import { useEffect, useState } from 'react';
import { CheckCircle, Lock, Unlock } from 'lucide-react';
import { getStageGateDefinition } from '../../lib/stageGateCeremonyConstants.js';

/**
 * Fullscreen projector sequence — /presentation/stagegate?week=1
 * @param {{
 *   closingWeek?: number,
 *   stageLabel?: string,
 *   nextStageLabel?: string,
 *   autoFinish?: boolean,
 *   onComplete?: () => void,
 * }} props
 */
export function StageGatePresentationPage({
  closingWeek = 1,
  stageLabel: stageLabelProp,
  nextStageLabel: nextStageLabelProp,
  autoFinish = false,
  onComplete,
}) {
  const gate = getStageGateDefinition(closingWeek);
  const stageLabel = stageLabelProp ?? gate.stageLabel;
  const nextStageLabel = nextStageLabelProp ?? gate.nextStageLabel;
  const [screen, setScreen] = useState(0);
  const [progress, setProgress] = useState(0);
  const [lockOpen, setLockOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.add('spike-presentation-mode');
    return () => document.documentElement.classList.remove('spike-presentation-mode');
  }, []);

  useEffect(() => {
    if (screen !== 0) return undefined;
    const t = setTimeout(() => setScreen(1), 2800);
    return () => clearTimeout(t);
  }, [screen]);

  useEffect(() => {
    if (screen !== 1) return undefined;
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => setScreen(2), 1200);
          return 100;
        }
        return p + 2;
      });
    }, 40);
    return () => clearInterval(interval);
  }, [screen]);

  useEffect(() => {
    if (screen !== 2) return undefined;
    const t = setTimeout(() => setScreen(3), 2200);
    return () => clearTimeout(t);
  }, [screen]);

  useEffect(() => {
    if (screen !== 3) return undefined;
    setLockOpen(false);
    const t1 = setTimeout(() => setLockOpen(true), 800);
    const t2 = setTimeout(() => setScreen(4), 3200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [screen]);

  useEffect(() => {
    if (screen !== 4) return undefined;
    if (!autoFinish || !onComplete) return undefined;
    const t = setTimeout(() => onComplete(), 2600);
    return () => clearTimeout(t);
  }, [screen, autoFinish, onComplete]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white text-slate-900">
      {screen === 0 ? (
        <div className="text-center">
          <p className="text-5xl font-black tracking-tight sm:text-7xl">{stageLabel}</p>
          <div className="mx-auto mt-10 h-3 w-64 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-full rounded-full bg-spike" />
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-400">100%</p>
        </div>
      ) : null}

      {screen === 1 ? (
        <div className="text-center">
          <p className="text-5xl font-black sm:text-6xl">{stageLabel}</p>
          <p className="mt-6 flex items-center justify-center gap-2 text-2xl font-bold text-emerald-600">
            <CheckCircle size={32} /> COMPLETE
          </p>
          <div className="mx-auto mt-10 h-2 w-56 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-spike transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : null}

      {screen === 2 ? (
        <div className="text-center">
          <div
            className={`mx-auto flex h-28 w-28 items-center justify-center rounded-full border-2 border-slate-200 transition-all duration-700 ${
              lockOpen ? 'scale-110 border-emerald-500' : ''
            }`}
          >
            {lockOpen ? (
              <Unlock className="h-14 w-14 text-emerald-600" />
            ) : (
              <Lock className="h-14 w-14 text-spike" />
            )}
          </div>
        </div>
      ) : null}

      {screen === 3 ? (
        <div className="text-center">
          <p className="text-5xl font-black sm:text-6xl">{nextStageLabel}</p>
          <p className="mt-4 text-xl font-bold text-emerald-600">🔓 UNLOCKED</p>
        </div>
      ) : null}

      {screen === 4 ? (
        <div className="text-center">
          <p className="text-3xl font-light text-slate-500 sm:text-4xl">
            See you in Week {gate.nextWeek}.
          </p>
        </div>
      ) : null}
    </div>
  );
}
