export default function OnboardingRulesCard({ onDismiss }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
      <p className="text-xs font-semibold uppercase tracking-widest text-[#8B0000]">
        How to play
      </p>
      <h2 className="mt-2 text-xl font-bold text-slate-900">SPIKE LIFE in 5 minutes</h2>
      <ol className="mt-4 space-y-3 text-sm text-slate-700">
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#8B0000] text-xs font-bold text-white">1</span>
          <span>Get a random life persona — every player starts different.</span>
        </li>
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#8B0000] text-xs font-bold text-white">2</span>
          <span>Set your Life Blueprint goals before year one.</span>
        </li>
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#8B0000] text-xs font-bold text-white">3</span>
          <span>Each cycle: life domain → situation → one decision (15 seconds).</span>
        </li>
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#8B0000] text-xs font-bold text-white">4</span>
          <span>13th month pay & annual checkpoints shape your Philippine journey.</span>
        </li>
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#8B0000] text-xs font-bold text-white">5</span>
          <span>Win with the highest Life Score — balance, not just wealth.</span>
        </li>
      </ol>
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="btn-primary mt-5 w-full">
          Got it — let&apos;s play
        </button>
      )}
    </div>
  )
}
