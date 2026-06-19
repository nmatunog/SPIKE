import { useNavigate } from 'react-router-dom';
import { StageGatePresentationPage } from '../../pages/stageGate/StageGatePresentationPage.jsx';
import { clearPendingPortfolioCelebration } from '../../lib/stageGatePortfolioCelebration.js';
import { dismissStageGateNotification } from '../../lib/stageGateService.js';
import { stageGateCertificateHref } from '../../routes/paths.js';

/**
 * Pitch-deck celebration — projector animation, then certificate view.
 * @param {{ participantId: string, closingWeek: number }} props
 */
export function StageGatePortfolioCelebration({ participantId, closingWeek }) {
  const navigate = useNavigate();

  function finishCelebration() {
    clearPendingPortfolioCelebration(participantId);
    dismissStageGateNotification(participantId);
    navigate(stageGateCertificateHref(closingWeek), { replace: true });
  }

  return (
    <StageGatePresentationPage
      closingWeek={closingWeek}
      autoFinish
      onComplete={finishCelebration}
    />
  );
}
