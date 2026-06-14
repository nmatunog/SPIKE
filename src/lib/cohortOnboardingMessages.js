/**
 * @param {string} step
 * @param {string} [phase]
 */
export function waitingMessage(step, phase) {
  if (step === 'waiting' && phase === 'suggestions_closed') {
    return 'You are checked in. Your Program Coach will open cohort name suggestions when the room is ready.';
  }
  if (step === 'waiting' && phase === 'finalists_ready') {
    return 'Your Program Coach is preparing finalist names.';
  }
  if (step === 'waiting' && phase === 'voting_closed') {
    return 'Voting is closed. Waiting for your Program Coach to reveal the founding cohort name.';
  }
  if (step === 'waiting' && phase === 'voting_open') {
    return 'Your vote is in. Watch the live count until voting closes.';
  }
  if (step === 'cohort-photo') {
    return 'Take your group photo together. Your Program Coach or Mentor will upload the official cohort photo.';
  }
  if (step === 'squad-wait') {
    return 'Your Program Coach is assigning squads of three.';
  }
  return 'Please wait for your Program Coach to open the next step.';
}

/** @param {string} step @param {string} [phase] */
export function waitingHint(step, phase) {
  if (step === 'waiting' && phase === 'suggestions_closed') {
    return 'Nothing else to do right now — stay on this page; it will refresh when suggestions open.';
  }
  if (step === 'waiting' && phase === 'suggestions_open') {
    return 'Suggestions are open for your cohort. This screen will update when it is your turn.';
  }
  if (step === 'waiting' && phase === 'voting_open') {
    return 'Vote counts update live as classmates vote.';
  }
  if (step === 'squad-wait') {
    return 'You will name and register your squad once assignments are posted.';
  }
  return 'This page checks for updates automatically.';
}

/** @param {string} step @param {string} [phase] */
export function isLiveWaitingStep(step, phase) {
  return step === 'waiting' && phase === 'voting_open';
}
