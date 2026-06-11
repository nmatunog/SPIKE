/**
 * @param {{
 *   onBack?: () => void,
 *   onForward?: () => void,
 *   backLabel?: string,
 *   forwardLabel?: string,
 *   backDisabled?: boolean,
 *   forwardDisabled?: boolean,
 * }} props
 */
export function CoachStepNav({
  onBack,
  onForward,
  backLabel = 'Back',
  forwardLabel = 'Continue',
  backDisabled = false,
  forwardDisabled = false,
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {onBack ? (
        <button type="button" onClick={onBack} disabled={backDisabled} className="spike-btn-secondary disabled:opacity-50">
          {backLabel}
        </button>
      ) : null}
      {onForward ? (
        <button
          type="button"
          onClick={onForward}
          disabled={forwardDisabled}
          className="spike-btn-primary disabled:opacity-50"
        >
          {forwardLabel}
        </button>
      ) : null}
    </div>
  );
}
