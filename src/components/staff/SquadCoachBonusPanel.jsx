import { useEffect, useState } from 'react';
import { PlusCircle } from 'lucide-react';
import {
  getSquadCoachBonus,
  saveSquadCoachBonus,
  SQUAD_COACH_BONUS_EVENT,
} from '../../lib/staff/squadCoachBonusService.js';
import { SQUAD_COACH_BONUS_MAX } from '../../lib/staff/squadXpConstants.js';

const PRESETS = [0, 5, 10, 15];

/**
 * Award discretionary bonus XP to a squad (mentor or program coach).
 * @param {{
 *   staffId: string,
 *   squadName: string,
 *   week?: number,
 *   role?: 'mentor' | 'faculty',
 *   showToast?: (message: string) => void,
 *   compact?: boolean,
 *   className?: string,
 * }} props
 */
export function SquadCoachBonusPanel({
  staffId,
  squadName,
  week = 2,
  role = 'mentor',
  showToast,
  compact = false,
  className = '',
}) {
  const existing = getSquadCoachBonus(squadName, week);
  const [bonusXp, setBonusXp] = useState(existing.bonusXp);
  const [note, setNote] = useState(existing.note ?? '');
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    window.addEventListener(SQUAD_COACH_BONUS_EVENT, bump);
    return () => window.removeEventListener(SQUAD_COACH_BONUS_EVENT, bump);
  }, []);

  useEffect(() => {
    const row = getSquadCoachBonus(squadName, week);
    setBonusXp(row.bonusXp);
    setNote(row.note ?? '');
  }, [squadName, week, version]);

  function handleSave() {
    if (!staffId) {
      showToast?.('Sign in to award bonus XP.');
      return;
    }
    saveSquadCoachBonus(staffId, squadName, week, { bonusXp, note, role });
    showToast?.(
      bonusXp > 0
        ? `+${bonusXp} coach bonus XP for ${squadName}`
        : `${squadName} coach bonus cleared`,
    );
  }

  if (compact) {
    return (
      <div className={`rounded-xl border border-spike/15 bg-spike-muted/20 px-3 py-2.5 ${className}`}>
        <p className="text-[11px] font-bold uppercase tracking-wide text-spike">Coach bonus</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {PRESETS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setBonusXp(value)}
              className={`min-h-[36px] rounded-lg px-3 text-xs font-bold ${
                bonusXp === value ? 'bg-spike text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200'
              }`}
            >
              +{value}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={handleSave}
          className="mt-2 text-xs font-semibold text-spike hover:underline"
        >
          Save bonus
        </button>
      </div>
    );
  }

  return (
    <section className={`rounded-2xl border border-spike/20 bg-white p-4 shadow-sm sm:p-5 ${className}`}>
      <div className="flex items-start gap-2">
        <PlusCircle size={18} className="mt-0.5 shrink-0 text-spike" aria-hidden />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-slate-900">Award squad bonus XP</h3>
          <p className="mt-1 text-xs text-slate-600">
            Optional recognition on top of mission + pitch XP (max {SQUAD_COACH_BONUS_MAX} per squad this week).
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {PRESETS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setBonusXp(value)}
            className={`min-h-[44px] rounded-xl px-4 text-sm font-bold transition ${
              bonusXp === value
                ? 'bg-spike text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            +{value} XP
          </button>
        ))}
      </div>

      <label className="mt-4 block text-sm font-semibold text-slate-700">
        Note <span className="font-normal text-slate-400">(optional)</span>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Outstanding panel recovery"
          className="mt-1.5 w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
        />
      </label>

      <button type="button" onClick={handleSave} className="mt-4 spike-btn-primary text-sm">
        {existing.bonusXp > 0 ? 'Update bonus XP' : 'Apply bonus XP'}
      </button>
    </section>
  );
}
