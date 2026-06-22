import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Stethoscope } from 'lucide-react';
import {
  getProgramWeek,
  saveCareerTrackSelection,
} from '../../lib/careerTrackService.js';
import { BLUEPRINT_LINKS } from '../../routes/paths.js';

/**
 * @param {{ userId: string, internProgress?: object | null, onComplete: (progress: object) => void }} props
 */
export function CareerTrackPicker({ userId, internProgress, onComplete }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const week = getProgramWeek(internProgress);

  async function choose(track) {
    setSaving(true);
    setError('');
    try {
      const progress = await saveCareerTrackSelection(userId, track, internProgress);
      onComplete(progress);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save career track.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
        <h2 className="text-xl font-black text-gray-900">Choose your career track</h2>
        <p className="mt-2 text-sm text-gray-600">
          Week {week} is open for everyone. Pick the ACS path that fits how you want to build your
          practice — this unlocks track-specific Blueprint modules.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => choose('agency_builder')}
            className="rounded-xl border-2 border-gray-200 p-4 text-left hover:border-[#8B0000] disabled:opacity-50"
          >
            <Briefcase className="mb-2 text-[#8B0000]" size={22} />
            <p className="font-bold text-gray-900">Agency Builder</p>
            <p className="mt-1 text-xs text-gray-600">Recruitment, leadership, team production.</p>
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => choose('specialist_consultant')}
            className="rounded-xl border-2 border-gray-200 p-4 text-left hover:border-[#8B0000] disabled:opacity-50"
          >
            <Stethoscope className="mb-2 text-[#8B0000]" size={22} />
            <p className="font-bold text-gray-900">Specialist Consultant</p>
            <p className="mt-1 text-xs text-gray-600">Practice growth, authority, niche expertise.</p>
          </button>
        </div>
        {saving ? (
          <p className="mt-4 text-center text-sm text-slate-500">Saving your track…</p>
        ) : null}
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        <div className="mt-5 border-t border-slate-100 pt-4 text-center">
          <Link
            to={BLUEPRINT_LINKS.customerDiscovery}
            className="text-sm font-semibold text-spike hover:underline"
          >
            Continue to Week 2 Customer Discovery →
          </Link>
          <p className="mt-1 text-xs text-slate-500">
            You can choose your ACS track later from Build home.
          </p>
        </div>
      </div>
    </div>
  );
}
