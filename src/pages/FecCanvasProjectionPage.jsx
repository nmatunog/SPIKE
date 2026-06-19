import { useSearchParams } from 'react-router-dom';
import { FecCanvasProjectionView } from '../components/ventureDesign/FecCanvasProjectionView.jsx';
import { canToggleFecCanvasMode } from '../lib/fecProjectionAccess.js';
import { playbookHref } from '../routes/paths.js';

/**
 * Standalone FEC projection route (Playbook) — staff delivery + intern read-only blank view.
 * @param {{ viewerRole?: string }} props
 */
export function FecCanvasProjectionPage({ viewerRole = 'intern' }) {
  const [searchParams] = useSearchParams();
  const participantId = searchParams.get('participant')?.trim() || '';
  const participantName = searchParams.get('name')?.trim() || '';
  const exitHref = searchParams.get('exit')?.trim() || playbookHref({ week: 1, day: 4 });

  return (
    <FecCanvasProjectionView
      canToggleMode={canToggleFecCanvasMode(viewerRole) && !participantId}
      exitHref={exitHref}
      viewerRole={viewerRole}
      participantId={participantId || undefined}
      participantName={participantName || undefined}
    />
  );
}
