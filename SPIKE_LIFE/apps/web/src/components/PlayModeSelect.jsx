export default function PlayModeSelect({ onSolo, onMultiplayer }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 py-12">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#8B0000]">
        SPIKE LIFE™
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">
        How do you want to play?
      </h1>
      <p className="mt-2 text-slate-600">
        Practice your financial life solo, or join up to six players in a shared room.
      </p>

      <div className="mt-8 space-y-3">
        <button
          type="button"
          onClick={onSolo}
          className="w-full rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-[#8B0000]/30 hover:shadow-md"
        >
          <p className="text-sm font-semibold text-slate-900">Solo play</p>
          <p className="mt-1 text-sm text-slate-600">
            Full campaign at your own pace — dream board, planning cycles, and Life Score.
          </p>
        </button>

        <button
          type="button"
          onClick={onMultiplayer}
          className="w-full rounded-xl border border-[#8B0000]/20 bg-[#8B0000] p-5 text-left text-white shadow-sm transition hover:bg-[#6d0000]"
        >
          <p className="text-sm font-semibold">Multiplayer room</p>
          <p className="mt-1 text-sm text-white/85">
            Create or join a room (2–6 players). Everyone sets up their Life Blueprint, then
            play together.
          </p>
        </button>
      </div>
    </div>
  )
}
