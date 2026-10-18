import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.js';

// Layout
import AppLayout from './components/layout/AppLayout.jsx';

// Pages
import LandingPage from './pages/LandingPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import AdminLoginPage from './pages/AdminLoginPage.jsx';
import AdminDashboardPage from './pages/AdminDashboardPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import PlannerPage from './pages/PlannerPage.jsx';
import CalendarPage from './pages/CalendarPage.jsx';
import SubjectsPage from './pages/SubjectsPage.jsx';
import TopicsPage from './pages/TopicsPage.jsx';
import NotesPage from './pages/NotesPage.jsx';
import StudySessionPage from './pages/StudySessionPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import LearningDNAPage from './pages/LearningDNAPage.jsx';
import ExamsPage from './pages/ExamsPage.jsx';
import TimetableUploadPage from './pages/TimetableUploadPage.jsx';
import StudySummariesPage from './pages/StudySummariesPage.jsx';
import TasksPage from './pages/TasksPage.jsx';
import AIMentorPage from './pages/AIMentorPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import Connections from './pages/Connections.jsx';
import Recommendations from './pages/Recommendations.jsx';
import StudyGroups from './pages/StudyGroups.jsx';
import GroupChat from './pages/GroupChat.jsx';
import SharedNotes from './pages/SharedNotes.jsx';
import FocusDashboard from './pages/FocusDashboard.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* Authenticated Dashboard Routes */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/planner" element={<PlannerPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/subjects" element={<SubjectsPage />} />
          <Route path="/topics" element={<TopicsPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/session" element={<StudySessionPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/learning-dna" element={<LearningDNAPage />} />
          <Route path="/exams" element={<ExamsPage />} />
          <Route path="/timetable" element={<TimetableUploadPage />} />
          <Route path="/summaries" element={<StudySummariesPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/mentor" element={<AIMentorPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          {/* Collaborative Learning & Focus Tracking */}
          <Route path="/connections" element={<Connections />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/study-groups" element={<StudyGroups />} />
          <Route path="/group-chat/:groupId" element={<GroupChat />} />
          <Route path="/shared-notes" element={<SharedNotes />} />
          <Route path="/focus-dashboard" element={<FocusDashboard />} />

          {/* Admin Protected Dashboard */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            }
          />
        </Route>

        {/* 404 Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
