import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { VentureDesignStudioWorkspace } from '../components/ventureDesign/VentureDesignStudioWorkspace.jsx';
import { prepareFecCanvas } from '../lib/fecCanvasService.js';
import { loadVentureDesignRecord, saveVentureDesignRecord } from '../lib/ventureDesignStudioService.js';

/**
 * Venture Design Studio — Day 4 FEC workshop (Gemini layout + SPIKE data layer).
 * @param {{
 *   participantId: string,
 *   participantName?: string,
 *   squadNameFallback?: string,
 *   careerTrack?: string,
 *   coachMode?: boolean,
 *   readOnly?: boolean,
 * }} props
 */
export function VentureDesignStudio({
  participantId,
  participantName = 'Builder',
  squadNameFallback = '',
  coachMode: coachModeProp = false,
  readOnly: readOnlyProp = false,
}) {
  const [searchParams] = useSearchParams();
  const coachMode = searchParams.get('coach') === '1' || coachModeProp;
  const readOnly = readOnlyProp;

  useEffect(() => {
    prepareFecCanvas(participantId);
    if (searchParams.get('start') === '1') {
      const record = loadVentureDesignRecord(participantId);
      if (!record.isStarted) {
        saveVentureDesignRecord(participantId, { isStarted: true });
      }
    }
  }, [participantId, searchParams]);

  return (
    <VentureDesignStudioWorkspace
      participantId={participantId}
      participantName={participantName}
      squadNameFallback={squadNameFallback}
      coachMode={coachMode}
      readOnly={readOnly}
    />
  );
}
