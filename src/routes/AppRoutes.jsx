import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AuthLayout from "../components/layout/AuthLayout.jsx";
import Layout from "../components/layout/Layout.jsx";
import Page from "../components/layout/Page.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import RequireAuth from "./RequireAuth.jsx";
import RequireProject from "./RequireProject.jsx";
import calendarCss from "../styles/calendar.css?url";
import pipelineCss from "../styles/pipeline.css?url";

const LoginPage = lazy(() => import("../pages/auth/LoginPage.jsx"));
const RegisterPage = lazy(() => import("../pages/auth/RegisterPage.jsx"));
const AcceptOrgInvitePage = lazy(() => import("../pages/invites/AcceptOrgInvitePage.jsx"));
const AcceptProjectInvitePage = lazy(() => import("../pages/invites/AcceptProjectInvitePage.jsx"));
const PublicFormPage = lazy(() => import("../pages/forms/PublicFormPage.jsx"));
const NotFoundPage = lazy(() => import("../pages/notFound/NotFoundPage.jsx"));
const DashboardPage = lazy(() => import("../pages/dashboard/DashboardPage.jsx"));
const MyWorkPage = lazy(() => import("../pages/myWork/MyWorkPage.jsx"));
const BoardHubPage = lazy(() => import("../pages/boardHub/BoardHubPage.jsx"));
const CalendarPage = lazy(() => import("../pages/calendar/CalendarPage.jsx"));
const NotificationsPage = lazy(() => import("../pages/notifications/NotificationsPage.jsx"));
const AiDraftsPage = lazy(() => import("../pages/ai/AiDraftsPage.jsx"));
const HelpPage = lazy(() => import("../pages/help/HelpPage.jsx"));
const OrgsPage = lazy(() => import("../pages/orgs/OrgsPage.jsx"));
const OrgSettingsPage = lazy(() => import("../pages/orgs/OrgSettingsPage.jsx"));
const OrgMembersPage = lazy(() => import("../pages/orgs/OrgMembersPage.jsx"));
const OrgAuditPage = lazy(() => import("../pages/orgs/OrgAuditPage.jsx"));
const ProjectsPage = lazy(() => import("../pages/projects/ProjectsPage.jsx"));
const ProjectOverviewPage = lazy(() => import("../pages/projects/ProjectOverviewPage.jsx"));
const IssuesPage = lazy(() => import("../pages/issues/IssuesPage.jsx"));
const IssueDetailPage = lazy(() => import("../pages/issues/IssueDetailPage.jsx"));
const BoardPage = lazy(() => import("../pages/board/BoardPage.jsx"));
const BacklogPage = lazy(() => import("../pages/backlog/BacklogPage.jsx"));
const ReleasesPage = lazy(() => import("../pages/releases/ReleasesPage.jsx"));
const TimesheetPage = lazy(() => import("../pages/timesheet/TimesheetPage.jsx"));
const WikiPage = lazy(() => import("../pages/wiki/WikiPage.jsx"));
const WikiDetailPage = lazy(() => import("../pages/wiki/WikiDetailPage.jsx"));
const WikiEditorPage = lazy(() => import("../pages/wiki/WikiEditorPage.jsx"));
const ReportsPage = lazy(() => import("../pages/reports/ReportsPage.jsx"));
const DashboardsPage = lazy(() => import("../pages/dashboards/DashboardsPage.jsx"));
const DashboardDetailPage = lazy(() => import("../pages/dashboards/DashboardDetailPage.jsx"));
const GoalsPage = lazy(() => import("../pages/goals/GoalsPage.jsx"));
const AutomationPage = lazy(() => import("../pages/automation/AutomationPage.jsx"));
const AutomationRulePage = lazy(() => import("../pages/automation/AutomationRulePage.jsx"));
const IntegrationsPage = lazy(() => import("../pages/integrations/IntegrationsPage.jsx"));
const WebhooksPage = lazy(() => import("../pages/integrations/WebhooksPage.jsx"));
const QueuePage = lazy(() => import("../pages/serviceDesk/QueuePage.jsx"));
const DeskSettingsPage = lazy(() => import("../pages/serviceDesk/DeskSettingsPage.jsx"));
const FormsPage = lazy(() => import("../pages/forms/FormsPage.jsx"));
const FormBuilderPage = lazy(() => import("../pages/forms/FormBuilderPage.jsx"));
const TestCasesPage = lazy(() => import("../pages/tests/TestCasesPage.jsx"));
const TestRunPage = lazy(() => import("../pages/tests/TestRunPage.jsx"));
const RisksPage = lazy(() => import("../pages/risks/RisksPage.jsx"));
const BudgetPage = lazy(() => import("../pages/budget/BudgetPage.jsx"));
const CatPage = lazy(() => import("../pages/cat/CatPage.jsx"));
const ProjectSettingsPage = lazy(() => import("../pages/projectSettings/ProjectSettingsPage.jsx"));
const ProjectMembersPage = lazy(() => import("../pages/projectSettings/ProjectMembersPage.jsx"));
const RolesPage = lazy(() => import("../pages/projectSettings/RolesPage.jsx"));
const WorkflowsPage = lazy(() => import("../pages/projectSettings/WorkflowsPage.jsx"));
const WorkflowEditorPage = lazy(() => import("../pages/projectSettings/WorkflowEditorPage.jsx"));
const FieldsPage = lazy(() => import("../pages/projectSettings/FieldsPage.jsx"));
const LabelsPage = lazy(() => import("../pages/projectSettings/LabelsPage.jsx"));
const ProjectAuditPage = lazy(() => import("../pages/projectSettings/ProjectAuditPage.jsx"));
const ProfilePage = lazy(() => import("../pages/settings/ProfilePage.jsx"));
const NotificationPrefsPage = lazy(() => import("../pages/settings/NotificationPrefsPage.jsx"));
const SecurityPage = lazy(() => import("../pages/settings/SecurityPage.jsx"));
const AppearancePage = lazy(() => import("../pages/settings/AppearancePage.jsx"));
const SettingsLayout = lazy(() => import("../pages/settings/SettingsLayout.jsx"));

function NotFoundRoute() {
  const { status } = useAuth();
  const Shell = status === "authenticated" ? Layout : AuthLayout;
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route path="*" element={<Page name="not-found"><NotFoundPage /></Page>} />
      </Route>
    </Routes>
  );
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<Spinner size="lg" />}>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="login" element={<Page name="login"><LoginPage /></Page>} />
          <Route path="register" element={<Page name="register"><RegisterPage /></Page>} />
          <Route path="f/:publicKey" element={<Page name="public-form"><PublicFormPage /></Page>} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route element={<AuthLayout />}>
            <Route path="invite/:token" element={<Page name="org-invite"><AcceptOrgInvitePage /></Page>} />
            <Route path="project-invite/:token" element={<Page name="project-invite"><AcceptProjectInvitePage /></Page>} />
          </Route>

          <Route element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Page name="dashboard"><DashboardPage /></Page>} />
            <Route path="my-work" element={<Page name="my-work"><MyWorkPage /></Page>} />
            <Route path="board" element={<Page name="board-hub"><BoardHubPage /></Page>} />
            <Route path="calendar" element={<Page name="calendar" css={calendarCss}><CalendarPage /></Page>} />
            <Route path="notifications" element={<Page name="notifications"><NotificationsPage /></Page>} />
            <Route path="ai" element={<Page name="ai"><AiDraftsPage /></Page>} />
            <Route path="help" element={<Page name="help"><HelpPage /></Page>} />

            <Route path="settings" element={<SettingsLayout />}>
              <Route index element={<Navigate to="profile" replace />} />
              <Route path="profile" element={<Page name="profile"><ProfilePage /></Page>} />
              <Route path="notifications" element={<Page name="notification-prefs"><NotificationPrefsPage /></Page>} />
              <Route path="security" element={<Page name="security"><SecurityPage /></Page>} />
              <Route path="appearance" element={<Page name="appearance"><AppearancePage /></Page>} />
            </Route>

            <Route path="orgs" element={<Page name="orgs"><OrgsPage /></Page>} />
            <Route path="orgs/:orgId/settings" element={<Page name="org-settings"><OrgSettingsPage /></Page>} />
            <Route path="orgs/:orgId/members" element={<Page name="org-members"><OrgMembersPage /></Page>} />
            <Route path="orgs/:orgId/audit" element={<Page name="org-audit"><OrgAuditPage /></Page>} />
            <Route path="projects" element={<Page name="projects"><ProjectsPage /></Page>} />

            <Route path="p/:projectId" element={<RequireProject />}>
              <Route index element={<Page name="project-overview"><ProjectOverviewPage /></Page>} />
              <Route path="issues" element={<Page name="issues"><IssuesPage /></Page>} />
              <Route path="issues/:issueKey" element={<Page name="issue-detail"><IssueDetailPage /></Page>} />
              <Route path="board/:boardId?" element={<Page name="pipeline" css={pipelineCss}><BoardPage /></Page>} />
              <Route path="backlog" element={<Page name="backlog"><BacklogPage /></Page>} />
              <Route path="releases" element={<Page name="releases"><ReleasesPage /></Page>} />
              <Route path="timesheet" element={<Page name="timesheet"><TimesheetPage /></Page>} />
              <Route path="wiki" element={<Page name="wiki"><WikiPage /></Page>} />
              <Route path="wiki/new" element={<Page name="wiki-editor"><WikiEditorPage /></Page>} />
              <Route path="wiki/:pageId" element={<Page name="wiki-detail"><WikiDetailPage /></Page>} />
              <Route path="wiki/:pageId/edit" element={<Page name="wiki-editor"><WikiEditorPage /></Page>} />
              <Route path="reports" element={<Page name="reports"><ReportsPage /></Page>} />
              <Route path="dashboards" element={<Page name="dashboards"><DashboardsPage /></Page>} />
              <Route path="dashboards/:dashboardId" element={<Page name="dashboard-detail"><DashboardDetailPage /></Page>} />
              <Route path="goals" element={<Page name="goals"><GoalsPage /></Page>} />
              <Route path="automation" element={<Page name="automation"><AutomationPage /></Page>} />
              <Route path="automation/new" element={<Page name="automation-rule"><AutomationRulePage /></Page>} />
              <Route path="automation/:ruleId" element={<Page name="automation-rule"><AutomationRulePage /></Page>} />
              <Route path="integrations" element={<Page name="integrations"><IntegrationsPage /></Page>} />
              <Route path="integrations/webhooks" element={<Page name="webhooks"><WebhooksPage /></Page>} />
              <Route path="desk" element={<Page name="desk"><QueuePage /></Page>} />
              <Route path="desk/settings" element={<Page name="desk-settings"><DeskSettingsPage /></Page>} />
              <Route path="forms" element={<Page name="forms"><FormsPage /></Page>} />
              <Route path="forms/new" element={<Page name="form-builder"><FormBuilderPage /></Page>} />
              <Route path="forms/:formId" element={<Page name="form-builder"><FormBuilderPage /></Page>} />
              <Route path="tests" element={<Page name="tests"><TestCasesPage /></Page>} />
              <Route path="tests/runs/:runId" element={<Page name="test-run"><TestRunPage /></Page>} />
              <Route path="risks" element={<Page name="risks"><RisksPage /></Page>} />
              <Route path="budget" element={<Page name="budget"><BudgetPage /></Page>} />
              <Route path="cat" element={<Page name="cat"><CatPage /></Page>} />
              <Route path="settings" element={<Page name="project-settings"><ProjectSettingsPage /></Page>} />
              <Route path="settings/people" element={<Page name="project-members"><ProjectMembersPage /></Page>} />
              <Route path="settings/roles" element={<Page name="roles"><RolesPage /></Page>} />
              <Route path="settings/workflows" element={<Page name="workflows"><WorkflowsPage /></Page>} />
              <Route path="settings/workflows/:workflowId" element={<Page name="workflow-editor"><WorkflowEditorPage /></Page>} />
              <Route path="settings/fields" element={<Page name="fields"><FieldsPage /></Page>} />
              <Route path="settings/labels" element={<Page name="labels"><LabelsPage /></Page>} />
              <Route path="settings/audit" element={<Page name="project-audit"><ProjectAuditPage /></Page>} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFoundRoute />} />
      </Routes>
    </Suspense>
  );
}
