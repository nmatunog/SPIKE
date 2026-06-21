import { Link } from 'react-router-dom';
import { ArrowRight, Star, Trophy, Zap } from 'lucide-react';
import { groupInternsBySquad } from '../../lib/mentorFrameworkService.js';
import { ROUTES } from '../../routes/paths.js';
import { MentorSquadRatingPanel } from '../staff/MentorSquadRatingPanel.jsx';
import { SquadWeeklyReviewPanel } from '../staff/SquadWeeklyReviewPanel.jsx';
import { SquadXpLeaderboard } from '../staff/SquadXpDashboard.jsx';

/**
 * Week 2 mentor scoring — squad XP, daily pulse, weekly review (prominent on mentor home).
 * @param {{
 *   mentorId: string,
 *   interns: Array<{ id: string, name: string, squad?: string }>,
 *   week?: number,
 *   day?: number,
 *   showToast?: (message: string, type?: string) => void,
 * }} props
 */
export function MentorWeek2ScoringSection({
  mentorId,
  interns,
  week = 2,
  day = 1,
  showToast,
}) {
  const squads = groupInternsBySquad(interns);

  if (!squads.length) {
    return (
      <section className="mt-10 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-sm text-slate-600">
        <p className="font-semibold text-slate-900">Week 2 squad scoring</p>
        <p className="mt-2">
          Assign squads in cohort formation to score squad pulse and weekly reviews.
        </p>
      </section>
    );
  }

  return (
    <section id="week-2-scoring" className="mt-10 space-y-6 border-t border-slate-200 pt-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-venture-activate">
            <Trophy size={14} aria-hidden />
            Week {week} scoring
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">Squad-first assessment</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Auto XP from intern missions (80%) + your weekly review bonus (20%). Daily pulse takes
            ~30 seconds; end-of-week review ~1 minute — no per-intern essays.
          </p>
        </div>
        <Link
          to={ROUTES.mentorSquads}
          className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-spike hover:underline"
        >
          Open squad hub
          <ArrowRight size={14} />
        </Link>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <ScoringPrinciple
          icon={Zap}
          title="Daily pulse"
          detail="1–5 for the whole squad today"
        />
        <ScoringPrinciple
          icon={Star}
          title="Weekly review"
          detail="4 dimensions + stage gate + commendations"
        />
        <ScoringPrinciple
          icon={Trophy}
          title="Squad XP"
          detail="Shared by all members · leaderboard"
        />
      </div>

      <SquadXpLeaderboard interns={interns} week={week} />

      <div className="space-y-6">
        {squads.map((squad) => (
          <div key={squad.name} className="grid gap-4 xl:grid-cols-2">
            <MentorSquadRatingPanel
              staffId={mentorId}
              squadName={squad.name}
              week={week}
              day={day}
              interns={squad.members ?? []}
              showToast={showToast}
            />
            <SquadWeeklyReviewPanel
              staffId={mentorId}
              squadName={squad.name}
              week={week}
              interns={squad.members ?? []}
              showToast={showToast}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

/** @param {{ icon: import('lucide-react').LucideIcon, title: string, detail: string }} props */
function ScoringPrinciple({ icon: Icon, title, detail }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <Icon size={16} className="text-spike" aria-hidden />
        {title}
      </p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );
}
