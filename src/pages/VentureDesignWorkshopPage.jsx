import { useSearchParams } from 'react-router-dom';
import { VentureDesignStudio } from './VentureDesignStudio.jsx';

/**
 * Standalone Day 4 Venture Design workshop (Playbook) — staff delivery + mentor preview.
 * Interns use Build → `/venture-blueprint/canvas`.
 * @param {{
 *   participantId?: string,
 *   participantName?: string,
 *   squadNameFallback?: string,
 *   viewerRole?: string,
 *   readOnly?: boolean,
 * }} props
 */
export function VentureDesignWorkshopPage({
  participantId = '',
  participantName = 'Builder',
  squadNameFallback = '',
  viewerRole = 'intern',
  readOnly = false,
}) {
  const [searchParams] = useSearchParams();
  const coachMode = searchParams.get('coach') === '1';

  return (
    <VentureDesignStudio
      participantId={participantId}
      participantName={participantName}
      squadNameFallback={squadNameFallback}
      coachMode={coachMode}
      readOnly={readOnly}
      viewerRole={viewerRole}
    />
  );
}
