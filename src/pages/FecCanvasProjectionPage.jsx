import { FecCanvasProjectionView } from '../components/ventureDesign/FecCanvasProjectionView.jsx';
import { canToggleFecCanvasMode } from '../lib/fecProjectionAccess.js';
import { playbookHref } from '../routes/paths.js';

/**
 * Standalone FEC projection route (Playbook) — staff delivery + intern read-only blank view.
 * @param {{ viewerRole?: string }} props
 */
export function FecCanvasProjectionPage({ viewerRole = 'intern' }) {
  return (
    <FecCanvasProjectionView
      canToggleMode={canToggleFecCanvasMode(viewerRole)}
      exitHref={playbookHref({ week: 1, day: 4 })}
      viewerRole={viewerRole}
    />
  );
}
