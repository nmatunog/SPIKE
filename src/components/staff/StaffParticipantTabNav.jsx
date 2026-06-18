import { Link, useSearchParams } from 'react-router-dom';
import { Briefcase, LayoutGrid, MessageSquare, Sparkles, User } from 'lucide-react';
import { mentorParticipantReviewHref } from '../../routes/paths.js';
import { STAFF_PARTICIPANT_TABS } from '../../lib/staffParticipantTabs.js';

const TAB_ICONS = {
  overview: User,
  venture: Sparkles,
  fec: LayoutGrid,
  portfolio: Briefcase,
  feedback: MessageSquare,
};

/**
 * @param {{ participantId: string, activeTab?: string }} props
 */
export function StaffParticipantTabNav({ participantId, activeTab }) {
  const [searchParams] = useSearchParams();
  const current = activeTab ?? searchParams.get('tab') ?? 'overview';

  return (
    <nav
      className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/80 p-1"
      aria-label="Participant sections"
    >
      {STAFF_PARTICIPANT_TABS.map((tab) => {
        const IconComponent = TAB_ICONS[tab.id] ?? User;
        const isActive = current === tab.id;
        return (
          <Link
            key={tab.id}
            to={mentorParticipantReviewHref(participantId, tab.id)}
            className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
              isActive
                ? 'bg-white text-spike shadow-sm'
                : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
            }`}
          >
            <IconComponent size={16} />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
