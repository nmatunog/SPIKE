export default function App() {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-spike-muted to-slate-50">
      <header className="border-b border-spike/10 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-spike">
              SPIKE Initiative
            </p>
            <h1 className="text-2xl font-semibold text-slate-900">SPIKE_LIFE</h1>
          </div>
          <span className="rounded-full bg-spike/10 px-3 py-1 text-xs font-medium text-spike">
            Bootstrap
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Major project scaffold</h2>
          <p className="mt-3 text-slate-600 leading-relaxed">
            SPIKE_LIFE is initialized as a standalone app inside the SPIKE monorepo.
            Define product scope in{' '}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">PRD_SPIKE_LIFE_V1.md</code>
            , then build features here.
          </p>

          <ul className="mt-6 space-y-2 text-sm text-slate-600">
            <li>Dev: <code className="rounded bg-slate-100 px-1.5 py-0.5">cd SPIKE_LIFE && npm run dev</code></li>
            <li>Port: <strong>5174</strong> (SPIKE Portal uses 5173)</li>
            <li>Stack: Vite + React + Tailwind</li>
          </ul>
        </section>
      </main>
    </div>
  )
}
