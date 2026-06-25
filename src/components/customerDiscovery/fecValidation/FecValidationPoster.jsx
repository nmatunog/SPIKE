import { useMemo } from 'react';
import { FecCanvasLayout } from '../../ventureDesign/FecCanvasLayout.jsx';
import { buildFecLayoutParticipantContent } from '../../../lib/fecCanvasLayoutContent.js';

/**
 * Interactive FEC poster — boxes 1–5 active with confidence animation.
 * @param {{ participantId: string, animate?: boolean }} props
 */
export function FecValidationPoster({ participantId, animate = true }) {
  const layout = useMemo(() => buildFecLayoutParticipantContent(participantId), [participantId]);

  const hasContent = layout.mode === 'full';

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
        Financial Entrepreneurship Canvas · Validation focus
      </p>
      <FecCanvasLayout
        mode={hasContent ? 'full' : 'blank'}
        variant="embedded"
        showHeader
        showFooter={false}
        validationFocus={layout.validationFocus}
        animateScores={animate}
        boxScores={layout.boxScores ?? {}}
        headerMeta={
          layout.headerMeta ?? {
            weekLabel: 'Week 2',
            dayLabel: 'FEC Lab',
            subtitle: 'Evidence strengthens boxes 1–5 — venture becoming clearer.',
          }
        }
        centerContent={layout.centerContent}
        uvpDetailContent={layout.uvpDetailContent}
        boxContents={layout.boxContents}
        complexContents={layout.complexContents ?? {}}
      />
    </div>
  );
}
