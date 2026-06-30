import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer.jsx';
import { BusinessEngineCanvasBlankPreview } from '../components/playbook/week3/businessEngine/BusinessEngineCanvasBlankPreview.jsx';
import { ROUTES } from '../routes/paths.js';
import { PROGRAM_COACH_LABEL } from '../lib/terminology.js';

/**
 * Full-screen blank Business Engine Canvas for coaches and mentors.
 * @param {{ backHref?: string, backLabel?: string, roleLabel?: string }} props
 */
export function BusinessEngineCanvasPreviewPage({
  backHref = ROUTES.programCoachHome,
  backLabel = 'Back to coach home',
  roleLabel = PROGRAM_COACH_LABEL,
}) {
  return (
    <PageContainer presentation wide>
      <div className="mb-4">
        <Link
          to={backHref}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-spike"
        >
          <ArrowLeft size={16} aria-hidden />
          {backLabel}
        </Link>
      </div>

      <BusinessEngineCanvasBlankPreview roleLabel={roleLabel} showOpenFullscreen={false} />
    </PageContainer>
  );
}
