import { IDENTITY_TRIANGLE } from '../../lib/ventureCoachConstants.js';

/** SPIKE Identity Triangle — onboarding graphic for Ambition / Impact / Values */
export function CoachIdentityTriangle() {
  const { ambition, impact, values } = IDENTITY_TRIANGLE;

  return (
    <div
      className="rounded-2xl border border-spike/15 bg-gradient-to-br from-white to-spike-muted/30 p-6"
      aria-label="SPIKE Identity Triangle: Ambition, Impact, and Values"
    >
      <p className="mb-4 text-center text-xs font-bold uppercase tracking-widest text-spike">SPIKE Identity Triangle</p>
      <div className="relative mx-auto max-w-md">
        <div className="text-center">
          <p className="text-sm font-bold text-slate-900">{ambition.label.toUpperCase()}</p>
          <p className="text-xs text-slate-600">{ambition.subtitle}</p>
          <div className="mx-auto mt-3 flex h-8 w-8 items-center justify-center text-spike" aria-hidden>
            ▲
          </div>
        </div>
        <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-center text-xs">
          <div>
            <p className="font-bold text-slate-900">{values.label.toUpperCase()}</p>
            <p className="text-slate-600">{values.subtitle}</p>
          </div>
          <span className="text-lg text-slate-300" aria-hidden>
            ◄ ─ ►
          </span>
          <div>
            <p className="font-bold text-slate-900">{impact.label.toUpperCase()}</p>
            <p className="text-slate-600">{impact.subtitle}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
