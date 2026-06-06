export function PendingLogCard({ log, onApprove, onReject }) {
  return (
    <article className="space-y-3 rounded-lg border border-gray-100 bg-gray-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-bold text-gray-900">{log.user?.name}</p>
          <p className="text-xs text-gray-500">
            {new Date(log.createdAt).toLocaleDateString()}
          </p>
        </div>
        <span className="rounded-full bg-red-100 px-2.5 py-1 text-sm font-bold text-[#8B0000]">
          {log.hours} hrs
        </span>
      </div>
      <p className="text-sm text-gray-700">{log.task}</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onApprove}
          className="min-h-[44px] flex-1 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-green-700"
        >
          Approve
        </button>
        <button
          type="button"
          onClick={onReject}
          className="min-h-[44px] flex-1 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-50"
        >
          Reject
        </button>
      </div>
    </article>
  );
}
