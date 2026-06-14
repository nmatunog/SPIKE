import { useLocation } from 'react-router-dom';
import { ContentStudioBlocksPage } from './ContentStudioBlocksPage.jsx';
import { ContentStudioDayBuilderPage } from './ContentStudioDayBuilderPage.jsx';
import { ContentStudioHomePage } from './ContentStudioHomePage.jsx';
import { ContentStudioMediaPage } from './ContentStudioMediaPage.jsx';
import { ContentStudioPlaybooksPage } from './ContentStudioPlaybooksPage.jsx';
import { ROUTES } from '../../../routes/paths.js';

const BLOCK_PAGES = {
  [`${ROUTES.adminContentStudio}/playbooks`]: {
    title: 'Playbooks',
    section: 'playbooks',
  },
  [`${ROUTES.adminContentStudio}/presentations`]: {
    title: 'Presentations',
    description: 'Upload PPTX, PDF, Google Slides URLs, or video links. Optional slide-by-slide metadata.',
    blockType: 'presentation',
  },
  [`${ROUTES.adminContentStudio}/worksheets`]: {
    title: 'Worksheets',
    description: 'Builder, reflection, research, planning, and assessment worksheets.',
    blockType: 'worksheet',
  },
  [`${ROUTES.adminContentStudio}/activities`]: {
    title: 'Activities',
    description: 'Individual, squad, and cohort activities with duration and instructions.',
    blockType: 'activity',
  },
  [`${ROUTES.adminContentStudio}/assessments`]: {
    title: 'Assessments',
    description: 'Quiz, reflection, presentation, and practical exercise assessments.',
    blockType: 'assessment',
  },
  [`${ROUTES.adminContentStudio}/surveys`]: {
    title: 'Surveys',
    description: 'Attach surveys to sessions using the existing survey engine slug IDs.',
    blockType: 'survey',
  },
  [`${ROUTES.adminContentStudio}/rubrics`]: {
    title: 'Rubrics',
    description: 'Presentation, research, participation, and venture board rubrics.',
    blockType: 'rubric',
  },
  [`${ROUTES.adminContentStudio}/mentor-guides`]: {
    title: 'Mentor Guides',
    description: 'Mentor objectives, coaching notes, debrief and observation guides.',
    blockType: 'mentor_guide',
  },
  [ROUTES.programCoachGuides]: {
    title: 'Program Coach Guides',
    description: 'Session overview, teaching notes, facilitation guide, timing, and expected outputs.',
    blockType: 'faculty_guide',
  },
  [`${ROUTES.adminContentStudio}/coaching-templates`]: {
    title: 'Coaching Templates',
    description: 'Mentor coaching session templates for Week 1 conversations.',
    blockType: 'coaching_template',
  },
  [`${ROUTES.adminContentStudio}/observation-forms`]: {
    title: 'Observation Forms',
    description: 'Mentor observation checklists aligned to playbook days.',
    blockType: 'observation_form',
  },
  [`${ROUTES.adminContentStudio}/reflection-forms`]: {
    title: 'Reflection Forms',
    description: 'Participant and mentor reflection forms for coaching debriefs.',
    blockType: 'reflection_form',
  },
};

export function ContentStudioPage() {
  const { pathname } = useLocation();

  if (pathname === ROUTES.adminContentStudio) {
    return <ContentStudioHomePage />;
  }

  if (pathname === `${ROUTES.adminContentStudio}/day-builder`) {
    return <ContentStudioDayBuilderPage />;
  }

  if (pathname === `${ROUTES.adminContentStudio}/media`) {
    return <ContentStudioMediaPage />;
  }

  if (pathname === `${ROUTES.adminContentStudio}/playbooks`) {
    return <ContentStudioPlaybooksPage />;
  }

  const config = BLOCK_PAGES[pathname];
  if (config) {
    return (
      <ContentStudioBlocksPage
        title={config.title}
        description={config.description}
        blockType={config.blockType}
        emptyHint={config.emptyHint}
      />
    );
  }

  return <ContentStudioHomePage />;
}
