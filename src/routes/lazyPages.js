import { lazy } from 'react';

/** React.lazy requires a default export; route pages use named exports. */
function lazyNamed(loader, name) {
  return lazy(() => loader().then((module) => ({ default: module[name] })));
}

export const VentureBlueprintShell = lazyNamed(
  () => import('../pages/VentureBlueprintShell.jsx'),
  'VentureBlueprintShell',
);
export const PlaybookShell = lazyNamed(() => import('../pages/PlaybookShell.jsx'), 'PlaybookShell');
export const ResearchPage = lazyNamed(() => import('../pages/ResearchPage.jsx'), 'ResearchPage');
export const PortfolioPage = lazyNamed(() => import('../pages/PortfolioPage.jsx'), 'PortfolioPage');
export const ProgressReportsPage = lazyNamed(
  () => import('../pages/ProgressReportsPage.jsx'),
  'ProgressReportsPage',
);
export const StaffDashboardPage = lazyNamed(
  () => import('../pages/StaffDashboardPage.jsx'),
  'StaffDashboardPage',
);
export const WelcomePage = lazyNamed(() => import('../pages/WelcomePage.jsx'), 'WelcomePage');
export const AdminPage = lazyNamed(() => import('../pages/AdminPage.jsx'), 'AdminPage');
export const CohortIdentityPage = lazyNamed(
  () => import('../pages/cohort/CohortIdentityPage.jsx'),
  'CohortIdentityPage',
);
export const SquadPreferencesPage = lazyNamed(
  () => import('../pages/cohort/SquadPreferencesPage.jsx'),
  'SquadPreferencesPage',
);
export const SquadDashboardPage = lazyNamed(
  () => import('../pages/cohort/SquadDashboardPage.jsx'),
  'SquadDashboardPage',
);
export const SquadCharterPage = lazyNamed(
  () => import('../pages/cohort/SquadCharterPage.jsx'),
  'SquadCharterPage',
);
export const AdminCohortsPage = lazyNamed(
  () => import('../pages/admin/AdminCohortsPage.jsx'),
  'AdminCohortsPage',
);
export const AdminSquadThemesPage = lazyNamed(
  () => import('../pages/admin/AdminSquadThemesPage.jsx'),
  'AdminSquadThemesPage',
);
export const AdminSquadsPage = lazyNamed(
  () => import('../pages/admin/AdminSquadsPage.jsx'),
  'AdminSquadsPage',
);
export const ContentStudioPage = lazyNamed(
  () => import('../pages/admin/contentStudio/ContentStudioPage.jsx'),
  'ContentStudioPage',
);
export const MentorVentureCoachPage = lazyNamed(
  () => import('../pages/mentor/MentorVentureCoachPage.jsx'),
  'MentorVentureCoachPage',
);
export const MentorParticipantsPage = lazyNamed(
  () => import('../pages/mentor/MentorParticipantsPage.jsx'),
  'MentorParticipantsPage',
);
export const FacultyHomePage = lazyNamed(
  () => import('../pages/faculty/FacultyHomePage.jsx'),
  'FacultyHomePage',
);
export const FacultyPlaybookPage = lazyNamed(
  () => import('../pages/faculty/FacultyPlaybookPage.jsx'),
  'FacultyPlaybookPage',
);
export const FacultyDayFrameworkPage = lazyNamed(
  () => import('../pages/faculty/FacultyDayFrameworkPage.jsx'),
  'FacultyDayFrameworkPage',
);
export const MentorHomePage = lazyNamed(
  () => import('../pages/mentor/MentorHomePage.jsx'),
  'MentorHomePage',
);
export const MentorPlaybookPage = lazyNamed(
  () => import('../pages/mentor/MentorPlaybookPage.jsx'),
  'MentorPlaybookPage',
);
export const MentorDayFrameworkPage = lazyNamed(
  () => import('../pages/mentor/MentorDayFrameworkPage.jsx'),
  'MentorDayFrameworkPage',
);
export const AdminFacultyPlaybookPage = lazyNamed(
  () => import('../pages/admin/AdminFacultyPlaybookPage.jsx'),
  'AdminFacultyPlaybookPage',
);
export const AdminMentorPlaybookPage = lazyNamed(
  () => import('../pages/admin/AdminMentorPlaybookPage.jsx'),
  'AdminMentorPlaybookPage',
);
export const CohortIdentityAnalyticsPage = lazyNamed(
  () => import('../pages/analytics/CohortIdentityAnalyticsPage.jsx'),
  'CohortIdentityAnalyticsPage',
);
export const MyVenturePortfolioRoute = lazyNamed(
  () => import('../pages/MyVenturePortfolioShell.jsx'),
  'MyVenturePortfolioRoute',
);
export const PublicPortfolioPage = lazyNamed(
  () => import('../pages/PublicPortfolioPage.jsx'),
  'PublicPortfolioPage',
);
export const PortfolioSettingsPage = lazyNamed(
  () => import('../pages/admin/PortfolioSettingsPage.jsx'),
  'PortfolioSettingsPage',
);
