import { useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { getCoachSectionForBuilder } from '../../lib/day1BuilderConstants.js';
import { writeBuilderEntry } from '../../lib/day1BuilderStorage.js';
import { markCoachStarted } from '../../lib/ventureCoachService.js';
import {
  AmbitionCoachFlow,
  FutureSelfCoachFlow,
  ImpactCoachFlow,
  TaglineCoachFlow,
  ValuesCoachFlow,
  VentureDirectionCoachFlow,
} from '../ventureCoach/CoachSectionFlows.jsx';

const COACH_FLOWS = {
  ambition: AmbitionCoachFlow,
  impact: ImpactCoachFlow,
  purpose: ImpactCoachFlow,
  values: ValuesCoachFlow,
  tagline: TaglineCoachFlow,
  'future-self': FutureSelfCoachFlow,
  'venture-direction': VentureDirectionCoachFlow,
};

/**
 * @param {{
 *   builderId: string,
 *   participantId: string,
 *   onSectionComplete: () => void,
 *   onProgress: () => void,
 * }} props
 */
export function Day1CoachSection({ builderId, participantId, onSectionComplete, onProgress }) {
  const sectionId = getCoachSectionForBuilder(builderId);
  const Flow = sectionId ? COACH_FLOWS[sectionId] : null;

  useEffect(() => {
    markCoachStarted(participantId);
  }, [participantId]);

  if (!Flow || !sectionId) {
    return null;
  }

  function handleComplete() {
    writeBuilderEntry(participantId, builderId, { via: 'ai_venture_coach', sectionId }, true);
    onProgress();
    onSectionComplete();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-xl border border-spike/20 bg-spike-muted/30 px-4 py-3">
        <Sparkles size={18} className="text-spike" />
        <p className="text-sm text-slate-700">
          <strong className="text-spike">AI Venture Coach™</strong> — guided conversation. No blank forms.
          Respond to each prompt; your coach drafts statements you can refine before saving.
        </p>
      </div>
      <Flow
        participantId={participantId}
        onProgress={onProgress}
        onSectionComplete={handleComplete}
      />
    </div>
  );
}
