import ThirteenthMonthModal from './ThirteenthMonthModal.jsx'
import AnnualCheckpointCard from './AnnualCheckpointCard.jsx'
import LifeSummaryScreen from './LifeSummaryScreen.jsx'

export default function PlanningCycleShell({
  dashboard,
  busy,
  onThirteenthMonthSelect,
  onCalendarDismiss,
  lifeSummary,
  onPlayAgain,
  children,
}) {
  if (lifeSummary?.complete) {
    return <LifeSummaryScreen summary={lifeSummary} onPlayAgain={onPlayAgain} />
  }

  return (
    <>
      {children}

      {dashboard?.pendingCalendarEvent === 'thirteenth_month' && (
        <ThirteenthMonthModal
          allocations={dashboard.thirteenthMonthAllocations}
          onSelect={onThirteenthMonthSelect}
          onDismiss={onCalendarDismiss}
          busy={busy}
        />
      )}

      {dashboard?.pendingCalendarEvent === 'annual_checkpoint' && dashboard.lastAnnualCheckpoint && (
        <div className="fixed inset-x-0 bottom-24 z-40 flex justify-center px-4 sm:bottom-8">
          <div className="w-full max-w-md">
            <AnnualCheckpointCard
              checkpoint={dashboard.lastAnnualCheckpoint}
              onContinue={onCalendarDismiss}
            />
          </div>
        </div>
      )}
    </>
  )
}
