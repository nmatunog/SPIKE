import { Link } from 'react-router-dom';
import { ContentStudioPanel, ContentStudioShell } from './ContentStudioShell.jsx';
import { ROUTES } from '../../../routes/paths.js';

export function ContentStudioPlaybooksPage() {
  return (
    <ContentStudioShell>
      <ContentStudioPanel
        title="Operating Playbooks"
        description="Sprint 06B separates Program Coaches (teach) from Mentors (coach). Manage day frameworks without code changes."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
            <h3 className="font-semibold text-indigo-950">Program Coach Playbook</h3>
            <p className="mt-2 text-sm text-indigo-900">
              Learning objectives, speaker notes, activities, worksheets, assessments, rubrics, expected outputs.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to={ROUTES.adminProgramCoachPlaybook} className="spike-btn-primary text-sm">
                Admin templates
              </Link>
              <Link to={ROUTES.programCoachPlaybook} className="spike-btn-secondary text-sm">
                Preview delivery
              </Link>
            </div>
          </div>
          <div className="rounded-xl border border-sky-100 bg-sky-50 p-4">
            <h3 className="font-semibold text-sky-950">Mentor Playbook</h3>
            <p className="mt-2 text-sm text-sky-900">
              Coaching objectives, discussion questions, reflection prompts, warning signs, expected outcomes.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to={ROUTES.adminMentorPlaybook} className="spike-btn-primary text-sm">
                Admin guides
              </Link>
              <Link to={ROUTES.mentorPlaybook} className="spike-btn-secondary text-sm">
                Preview delivery
              </Link>
            </div>
          </div>
        </div>
        <p className="text-sm text-slate-600">
          Block-level program coach and mentor guides also live under{' '}
          <Link to={ROUTES.programCoachGuides} className="font-semibold text-spike hover:underline">
            Program Coach Guides
          </Link>{' '}
          and{' '}
          <Link to={`${ROUTES.adminContentStudio}/mentor-guides`} className="font-semibold text-spike hover:underline">
            Mentor Guides
          </Link>{' '}
          in Content Studio.
        </p>
      </ContentStudioPanel>
    </ContentStudioShell>
  );
}
