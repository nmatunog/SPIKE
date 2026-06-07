import { lazy } from 'react';

export const VentureBlueprintShell = lazy(() => import('../pages/VentureBlueprintShell.jsx'));
export const PlaybookShell = lazy(() => import('../pages/PlaybookShell.jsx'));
export const ResearchPage = lazy(() => import('../pages/ResearchPage.jsx'));
export const PortfolioPage = lazy(() => import('../pages/PortfolioPage.jsx'));
export const ProgressReportsPage = lazy(() => import('../pages/ProgressReportsPage.jsx'));
export const StaffDashboardPage = lazy(() => import('../pages/StaffDashboardPage.jsx'));
export const WelcomePage = lazy(() => import('../pages/WelcomePage.jsx'));
export const AdminPage = lazy(() => import('../pages/AdminPage.jsx'));
export const CohortIdentityPage = lazy(() => import('../pages/cohort/CohortIdentityPage.jsx'));
export const SquadPreferencesPage = lazy(() => import('../pages/cohort/SquadPreferencesPage.jsx'));
export const SquadDashboardPage = lazy(() => import('../pages/cohort/SquadDashboardPage.jsx'));
export const SquadCharterPage = lazy(() => import('../pages/cohort/SquadCharterPage.jsx'));
export const AdminCohortsPage = lazy(() => import('../pages/admin/AdminCohortsPage.jsx'));
export const AdminSquadThemesPage = lazy(() => import('../pages/admin/AdminSquadThemesPage.jsx'));
export const AdminSquadsPage = lazy(() => import('../pages/admin/AdminSquadsPage.jsx'));
export const MentorVentureCoachPage = lazy(() => import('../pages/mentor/MentorVentureCoachPage.jsx'));
export const CohortIdentityAnalyticsPage = lazy(
  () => import('../pages/analytics/CohortIdentityAnalyticsPage.jsx'),
);
