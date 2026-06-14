/**
 * @param {string} step
 * @param {string} [phase]
 */
export function waitingMessage(step, phase) {
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
