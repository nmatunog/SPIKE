export default function App() {
  return (
    <div className="min-h-dvh bg-slate-50 p-8 font-sans text-slate-900">
      <h1 className="text-2xl font-semibold text-[#8B0000]">SPIKE LIFE™</h1>
      <p className="mt-2 max-w-xl text-slate-600">
        Phase 1 validates the Financial Decision Engine in{' '}
        <code className="rounded bg-slate-100 px-1">@spike-life/domain</code>.
        Run <code className="rounded bg-slate-100 px-1">npm test</code> from the monorepo root.
      </p>
    </div>
  )
}
