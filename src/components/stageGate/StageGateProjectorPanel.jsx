import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  CheckCircle,
  Lock,
  Maximize2,
  Minimize2,
  Play,
  Trophy,
  Unlock,
} from 'lucide-react';

/**
 * Full-screen projector ceremony — runs after Friday squad pitch.
 * @param {{
 *   model: ReturnType<import('../../lib/stageGateCeremonyService.js').deriveStageGateCeremony>,
 *   onExit: () => void,
 *   onCompleteUnlock: () => void,
 * }} props
 */
export function StageGateProjectorPanel({ model, onExit, onCompleteUnlock }) {
  const [presentationMode, setPresentationMode] = useState(true);
  const [step, setStep] = useState(0);
  const [progressValue, setProgressValue] = useState(0);
  const [activeCheckmark, setActiveCheckmark] = useState(0);
  const [lockRotating, setLockRotating] = useState(false);
  const [showRipple, setShowRipple] = useState(false);
  const [localUnlocked, setLocalUnlocked] = useState(model.unlocked);
  const canvasRef = useRef(null);
  const animationFrameId = useRef(null);

  useEffect(() => {
    setLocalUnlocked(model.unlocked);
  }, [model.unlocked]);

  useEffect(() => {
    if (step <= 0) return undefined;
    const canvas = canvasRef.current;
    if (!canvas?.parentElement) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = 120;
    let waveOffset = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let j = 0; j < 3; j += 1) {
        ctx.beginPath();
        ctx.strokeStyle =
          j === 0 ? 'rgba(185, 28, 28, 0.65)' : j === 1 ? 'rgba(234, 179, 8, 0.35)' : 'rgba(185, 28, 28, 0.15)';
        ctx.lineWidth = j === 0 ? 2.5 : 1.5;
        for (let i = 0; i < canvas.width; i += 1) {
          const amplitude = step === 2 ? 36 : 14;
          const y =
            canvas.height / 2
            + Math.sin(i * 0.01 + waveOffset + j * 10) * amplitude * Math.sin(i * 0.005);
          if (i === 0) ctx.moveTo(i, y);
          else ctx.lineTo(i, y);
        }
        ctx.stroke();
      }
      waveOffset += 0.05;
      animationFrameId.current = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [step]);

  useEffect(() => {
    if (step !== 1) return undefined;
    const interval = setInterval(() => {
      setProgressValue((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1.5;
      });
    }, 25);
    return () => clearInterval(interval);
  }, [step]);

  useEffect(() => {
    if (progressValue < 100 || step !== 1) return undefined;
    let current = 0;
    const checkInterval = setInterval(() => {
      current += 1;
      setActiveCheckmark(current);
      if (current >= model.gate.progressChecklist.length) {
        clearInterval(checkInterval);
        setTimeout(() => setStep(2), 1200);
      }
    }, 900);
    return () => clearInterval(checkInterval);
  }, [progressValue, step, model.gate.progressChecklist.length]);

  function executeUnlock() {
    setLockRotating(true);
    setTimeout(() => {
      setShowRipple(true);
      setLocalUnlocked(true);
      setLockRotating(false);
      onCompleteUnlock();
      setTimeout(() => setStep(3), 900);
    }, 1600);
  }

  const shellClass = presentationMode
    ? 'fixed inset-0 z-50 flex flex-col bg-slate-950 p-4 text-white md:p-10'
    : 'relative flex min-h-[640px] flex-col rounded-3xl border border-slate-800 bg-slate-950 p-6 text-white shadow-2xl';

  return (
    <div className={shellClass}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(185,28,28,0.12)_0%,transparent_70%)]" />
      <header className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-spike px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
            SPIKE venture incubator
          </span>
          <span className="text-xs font-semibold text-slate-400">
            Week {model.closingWeek} · {model.gate.gateSubtitle}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPresentationMode((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-white/10"
          >
            {presentationMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            {presentationMode ? 'Exit fullscreen' : 'Presentation mode'}
          </button>
          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-white/10"
          >
            Coach control
          </button>
        </div>
      </header>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center py-8 text-center">
        <canvas ref={canvasRef} className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full opacity-40" />

        {step === 0 ? (
          <div className="max-w-2xl space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-spike/20">
              <Trophy className="h-8 w-8 text-yellow-400" />
            </div>
            <h2 className="text-4xl font-black tracking-tight md:text-5xl">{model.gate.ceremonyTitle}</h2>
            <p className="text-base leading-relaxed text-slate-400">
              After squad venture pitch presentations, initiate the gate ceremony to archive Week{' '}
              {model.closingWeek} and unlock{' '}
              <span className="font-bold text-yellow-400">{model.gate.nextStageLabel}</span>.
            </p>
            <p className="text-sm text-slate-500">
              {model.metrics.totalSquads} squads · {model.metrics.totalInterns} participants · live
              venture &amp; FEC data loaded
            </p>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="mx-auto inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-sm font-black uppercase tracking-wider text-slate-900"
            >
              <Play size={16} className="fill-current text-spike" /> Initiate gate ceremony
            </button>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="w-full max-w-xl space-y-8">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-yellow-400">
                Week {model.closingWeek} accomplishments
              </p>
              <h3 className="mt-1 text-3xl font-black">Earning the gate transition</h3>
            </div>
            <div>
              <div className="mb-2 flex justify-between text-xs font-bold text-slate-400">
                <span>Synchronizing squad portfolios…</span>
                <span className="text-lg text-yellow-400">{Math.floor(progressValue)}%</span>
              </div>
              <div className="h-4 overflow-hidden rounded-full border border-white/10 bg-white/5 p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-spike-dark via-spike to-yellow-500 transition-all"
                  style={{ width: `${progressValue}%` }}
                />
              </div>
            </div>
            <ul className="mx-auto max-w-md space-y-3 rounded-2xl border border-white/10 bg-white/5 p-6 text-left">
              {model.gate.progressChecklist.map((line, index) => (
                <li
                  key={line}
                  className={`flex items-center gap-3 text-sm font-bold transition-all ${
                    activeCheckmark > index ? 'text-white' : 'text-slate-600'
                  }`}
                >
                  <CheckCircle
                    size={18}
                    className={activeCheckmark > index ? 'text-emerald-400' : 'text-slate-700'}
                  />
                  {index + 1}. {line}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="relative max-w-lg space-y-8">
            {showRipple ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-48 w-48 animate-ping rounded-full border border-yellow-500/30 bg-yellow-500/10" />
              </div>
            ) : null}
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-emerald-400">
                Week {model.closingWeek} portfolios archived
              </p>
              <h3 className="mt-1 text-3xl font-black">S.P.I.K.E. gate master key</h3>
            </div>
            <button
              type="button"
              disabled={lockRotating || localUnlocked}
              onClick={executeUnlock}
              className="relative mx-auto flex h-28 w-28 items-center justify-center rounded-full border-2 border-spike bg-slate-950 shadow-xl transition hover:border-yellow-400"
            >
              {localUnlocked ? (
                <Unlock className="h-12 w-12 text-emerald-400" />
              ) : (
                <Lock
                  className={`h-12 w-12 ${lockRotating ? 'animate-pulse text-yellow-400' : 'text-spike-light'}`}
                />
              )}
            </button>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              {lockRotating
                ? 'Disengaging lock…'
                : localUnlocked
                  ? 'Gate unlocked'
                  : 'Click dial to unlock the next stage'}
            </p>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="max-w-2xl space-y-6">
            <Unlock className="mx-auto h-12 w-12 text-emerald-400" />
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-emerald-400">
                Transition complete
              </p>
              <h2 className="mt-1 text-4xl font-black md:text-5xl">
                {model.gate.nextStageLabel} unlocked
              </h2>
            </div>
            <p className="text-lg italic text-yellow-400">&ldquo;{model.gate.quote}&rdquo;</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {model.gate.nextPhaseCards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-xl border border-white/10 bg-white/5 p-4 text-left"
                >
                  <p className="text-[10px] font-black uppercase text-spike-light">{card.title}</p>
                  <p className="mt-1 text-sm font-bold">{card.body}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{card.detail}</p>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setStep(4)}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-xs font-black uppercase tracking-wider text-slate-900"
            >
              Complete ceremony <ArrowRight size={16} />
            </button>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="max-w-md space-y-5">
            <p className="text-3xl font-black uppercase tracking-widest text-slate-500">
              {model.gate.stageLabel} complete
            </p>
            <div className="mx-auto h-1 w-16 rounded-full bg-spike" />
            <h2 className="text-4xl font-extrabold">{model.gate.nextStageLabel} next</h2>
            <p className="text-sm text-slate-400">
              Week {model.gate.nextWeek} begins Monday — {model.gate.hourRange}.
            </p>
            <button
              type="button"
              onClick={onExit}
              className="rounded-xl border border-white/20 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10"
            >
              Return to coach control
            </button>
          </div>
        ) : null}
      </div>

      <footer className="relative z-10 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        <span>S.P.I.K.E. program · class presentation</span>
        <span className="text-yellow-500">Live cohort data · {model.squads.length} squads</span>
      </footer>
    </div>
  );
}
