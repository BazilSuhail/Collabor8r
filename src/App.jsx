import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Layout Components
import SidebarLayout from "./components/layout/SidebarLayout";

// Page Components
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Overview from "./pages/Overview";
import Workflow from "./pages/Workflow";

// Auth Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./components/auth/ForgotPassword";

// Project Pages
import AdminProjectList from "./pages/admin-projects/AdminProjectList";
import JoinedProjectList from "./pages/joined-projects/JoinedProjectList";
import ManagerProjectList from "./pages/joined-projects/ManagerProjectList";
import CreateProject from "./pages/admin-projects/CreateProject";
import AdminProjectDetail from "./pages/admin-projects/AdminProjectDetail";
import JoinedProjectDetail from "./pages/joined-projects/JoinedProjectDetail";
import ManageProjectTasks from "./pages/joined-projects/ManageProjectTasks";
import TaskDependencies from "./pages/projects/TaskDependencies";

// Board & Kanban
import KanbanBoard from "./pages/projects/board/KanbanBoard";
import BoardConfig from "./pages/projects/board/BoardConfig";

// Sprint & Backlog
import SprintPlanning from "./pages/projects/backlog/SprintPlanning";
import SprintDetail from "./pages/projects/sprints/SprintDetail";

// Project Management
import TeamManagement from "./pages/projects/team/TeamManagement";
import ProjectSettings from "./pages/projects/settings/ProjectSettings";
import ActivityLog from "./pages/projects/activity/ActivityLog";
import TimeTracking from "./pages/projects/time/TimeTracking";
import Labels from "./pages/projects/labels/Labels";
import Webhooks from "./pages/projects/webhooks/Webhooks";
import SavedFilters from "./pages/projects/filters/SavedFilters";

// Task & User
import TaskDetail from "./pages/tasks/TaskDetail";
import CreateTask from "./pages/tasks/CreateTask";
import Profile from "./pages/profile/Profile";
import Notifications from "./pages/notifications/Notifications";

// Organizations & Invitations
import OrganizationList from "./pages/organizations/OrganizationList";
import OrganizationDetail from "./pages/organizations/OrganizationDetail";
import Invitations from "./pages/invitations/Invitations";

// AI Assistant
import AIAssistant from "./pages/ai/AIAssistant";

// Store
import useAuthStore from "./stores/authStore";

// ============================================
// ROUTE GUARDS
// ============================================

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
};

// ============================================
// MAIN APP COMPONENT
// ============================================

const App = () => {
  return (
    <Router>
      <Routes>
        {/* ===== PUBLIC ROUTES ===== */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/" element={<Home />} />

        {/* ===== PROTECTED ROUTES ===== */}
        <Route element={<ProtectedRoute><SidebarLayout /></ProtectedRoute>}>
          {/* Core Pages */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/overview" element={<Overview />} />
          <Route path="/workflow" element={<Workflow />} />

          {/* Project Listings */}
          <Route path="/projects" element={<AdminProjectList />} />
          <Route path="/projects/joined" element={<JoinedProjectList />} />
          <Route path="/projects/managing" element={<ManagerProjectList />} />
          <Route path="/projects/new" element={<CreateProject />} />
          <Route path="/projects/:projectId/edit" element={<CreateProject />} />

          {/* Project Details */}
          <Route path="/projects/:projectId" element={<AdminProjectDetail />} />
          <Route path="/projects/:projectId/joined" element={<JoinedProjectDetail />} />
          <Route path="/projects/:projectId/manage" element={<ManageProjectTasks />} />

          {/* Board & Kanban */}
          <Route path="/projects/:projectId/board" element={<KanbanBoard />} />
          <Route path="/projects/:projectId/board/config" element={<BoardConfig />} />

          {/* Sprints & Backlog */}
          <Route path="/projects/:projectId/backlog" element={<SprintPlanning />} />
          <Route path="/projects/:projectId/sprints" element={<SprintDetail />} />

          {/* Team & Settings */}
          <Route path="/projects/:projectId/team" element={<TeamManagement />} />
          <Route path="/projects/:projectId/settings" element={<ProjectSettings />} />

          {/* Project Utilities */}
          <Route path="/projects/:projectId/activity" element={<ActivityLog />} />
          <Route path="/projects/:projectId/time" element={<TimeTracking />} />
          <Route path="/projects/:projectId/labels" element={<Labels />} />
          <Route path="/projects/:projectId/webhooks" element={<Webhooks />} />
          <Route path="/projects/:projectId/filters" element={<SavedFilters />} />
          <Route path="/projects/:projectId/dependencies" element={<TaskDependencies />} />

          {/* AI Assistant */}
          <Route path="/projects/:projectId/ai" element={<AIAssistant />} />
          <Route path="/ai" element={<AIAssistant />} />
          <Route path="/ai/project/:projectId" element={<AIAssistant />} />

          {/* Tasks */}
          <Route path="/tasks/:taskId" element={<TaskDetail />} />
          <Route path="/projects/:projectId/tasks/create" element={<CreateTask />} />

          {/* User */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/notifications" element={<Notifications />} />

          {/* Organizations */}
          <Route path="/organizations" element={<OrganizationList />} />
          <Route path="/organizations/:orgId" element={<OrganizationDetail />} />

          {/* Invitations */}
          <Route path="/invitations" element={<Invitations />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
