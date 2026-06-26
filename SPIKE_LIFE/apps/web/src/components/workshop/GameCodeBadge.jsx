import { useState } from 'react'

export default function GameCodeBadge({ code, compact = false }) {
  const [copied, setCopied] = useState(false)

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={copyCode}
        className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-sm font-semibold tracking-wider text-[#8B0000] hover:bg-slate-100"
        title="Click to copy game code"
      >
        {code}
        {copied && <span className="ml-2 text-xs font-normal text-emerald-700">Copied</span>}
      </button>
    )
  }

  return (
    <div className="rounded-lg border-2 border-dashed border-[#8B0000]/30 bg-red-50/40 p-3 text-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Game code</p>
      <p className="mt-1 font-mono text-2xl font-bold tracking-widest text-[#8B0000]">{code}</p>
      <button
        type="button"
        onClick={copyCode}
        className="mt-2 text-xs font-medium text-slate-600 hover:text-slate-900"
      >
        {copied ? 'Copied to clipboard' : 'Copy code'}
      </button>
    </div>
  )
}
