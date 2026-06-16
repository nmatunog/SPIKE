import { useSearchParams } from 'react-router-dom';
import { VentureStudioDay3 } from '../components/playbook/ventureStudio/VentureStudioDay3.jsx';

/**
 * Standalone Day 3 Venture Studio route — interactive market discovery workspace.
 * @param {{
 *   participantId?: string,
 *   readOnly?: boolean,
 * }} props
 */
export function VentureStudioDay3Page({ participantId, readOnly = false }) {
  const [searchParams] = useSearchParams();
  const presentMode = searchParams.get('present') === '1';

  return (
    <VentureStudioDay3
      participantId={participantId}
      readOnly={readOnly}
      presentMode={presentMode}
    />
  );
}
