import { useEffect, useMemo } from 'react';
import { getDayContentBundle } from '../../lib/curriculumService.js';
import { DayClosingReflectionSection } from './DayClosingReflectionSection.jsx';
import { getPlaybookDayReflections } from '../../lib/dayClosingReflection.js';
import { isReflectionCompleted } from '../../lib/playbookProgress.js';

/**
 * End-of-day Playbook reflection for a specific week/day (Week 1 curriculum + Week 2 missions).
 * @param {{
 *   segment?: number,
 *   week: number,
 *   day: number,
 *   participantId?: string,
 *   focusReflection?: boolean,
 *   onCompleted?: () => void,
 * }} props
 */
export function PlaybookDayClosingReflectionBlock({
  segment = 1,
  week,
  day,
  participantId,
  focusReflection = false,
  onCompleted,
}) {
  const bundle = useMemo(() => {
    try {
      return getDayContentBundle(`segment-${segment}`, `week-${week}`, `day-${day}`);
    } catch {
      return null;
    }
  }, [segment, week, day]);

  const reflections = bundle ? getPlaybookDayReflections(bundle) : [];
  const pending = participantId
    ? reflections.some((r) => !isReflectionCompleted(participantId, r.id))
    : false;

  useEffect(() => {
    if (!focusReflection && !pending) return;
    const el = document.getElementById('playbook-day-reflection');
    if (!el) return;
    const timer = window.setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [focusReflection, pending, week, day, bundle]);

  if (!bundle || !reflections.length) return null;

  return (
    <div id="playbook-day-reflection" className="scroll-mt-24">
      <DayClosingReflectionSection
        bundle={bundle}
        participantId={participantId}
        onCompleted={onCompleted}
        highlightPending={pending}
      />
    </div>
  );
}
