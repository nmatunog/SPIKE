import { useEffect, useState } from 'react';
import { loadMentorDayTemplates } from '../lib/mentorEncodingTemplates.js';

/** @param {number} day */
export function useMentorDayTemplates(day) {
  const [templates, setTemplates] = useState({
    observation: null,
    debrief: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void loadMentorDayTemplates(day).then((next) => {
      if (!cancelled) {
        setTemplates(next);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [day]);

  return { ...templates, loading };
}
