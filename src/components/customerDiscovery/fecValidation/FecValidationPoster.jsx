import { useMemo } from 'react';
import { FecCanvasLayout } from '../../ventureDesign/FecCanvasLayout.jsx';
import { buildFecLayoutParticipantContent } from '../../../lib/fecCanvasLayoutContent.js';
import { loadFecValidation } from '../../../lib/customerDiscovery/week2FecValidationStorage.js';
import { getSquadNameForParticipant } from '../../../lib/customerDiscovery/week2SquadEvidenceService.js';

/**
 * Interactive FEC poster — boxes 1–5 active with confidence animation.
 * @param {{ participantId: string, squadKey?: string, animate?: boolean }} props
 */
export function FecValidationPoster({ participantId, squadKey = '', animate = true }) {
  const key = squadKey || getSquadNameForParticipant(participantId) || `solo-${participantId}`;
  const fec = loadFecValidation(key);
  const layout = useMemo(() => buildFecLayoutParticipantContent(participantId), [participantId]);

  const boxContents = {
    who_we_serve: fec.boxScores?.who_we_serve?.approvedText || layout.boxContents?.who_we_serve,
    problem_we_solve: fec.boxScores?.problem_we_solve?.approvedText || layout.boxContents?.problem_we_solve,
    client_experience: fec.boxScores?.client_experience?.approvedText || layout.boxContents?.client_experience,
    winning_strategy: fec.boxScores?.winning_strategy?.approvedText || layout.boxContents?.winning_strategy,
  };

  const centerContent =
    fec.boxScores?.uvp?.approvedText || layout.centerContent || layout.uvpDetailContent;

  const hasContent = Boolean(
    centerContent
    || boxContents.who_we_serve
    || boxContents.problem_we_solve
    || boxContents.client_experience
    || boxContents.winning_strategy,
  );

  const boxScores = {
    uvp: fec.boxScores?.uvp,
    who_we_serve: fec.boxScores?.who_we_serve,
    problem_we_solve: fec.boxScores?.problem_we_solve,
    client_experience: fec.boxScores?.client_experience,
    winning_strategy: fec.boxScores?.winning_strategy,
  };

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
        validationFocus
        animateScores={animate}
        boxScores={boxScores}
        headerMeta={{
          weekLabel: 'Week 2',
          dayLabel: 'FEC Lab',
          subtitle: 'Evidence strengthens boxes 1–5 — venture becoming clearer.',
        }}
        centerContent={centerContent}
        uvpDetailContent={centerContent}
        boxContents={boxContents}
        complexContents={layout.complexContents ?? {}}
      />
    </div>
  );
}
