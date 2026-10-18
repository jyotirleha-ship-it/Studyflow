import React from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  LayoutDashboard,
  CalendarDays,
  Calendar,
  BookOpen,
  GitFork,
  Timer,
  BarChart3,
  Dna,
  GraduationCap,
  UploadCloud,
  FileText,
  FileEdit,
  CheckSquare,
  Bot,
  Bell,
  Settings,
  UserCheck,
  Shield,
  Users,
  Sparkles,
  MessagesSquare,
  Share2,
  ShieldAlert
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './sidebar.css';

const Sidebar = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { user } = useSelector((state) => state.auth);

  const navGroups = [
    {
      title: 'Study Engine',
      items: [
        { path: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
        { path: '/planner', label: t('nav.planner'), icon: CalendarDays },
        { path: '/calendar', label: t('nav.calendar'), icon: Calendar },
        { path: '/session', label: t('nav.study_session'), icon: Timer },
        { path: '/tasks', label: t('nav.tasks'), icon: CheckSquare },
      ]
    },
    {
      title: 'Curriculum & Mastery',
      items: [
        { path: '/subjects', label: t('nav.subjects'), icon: BookOpen },
        { path: '/topics', label: t('nav.topics'), icon: GitFork },
        { path: '/notes', label: t('nav.notes') || 'Personal Notes', icon: FileEdit },
        { path: '/exams', label: t('nav.exams'), icon: GraduationCap },
        { path: '/timetable', label: t('nav.timetable_upload'), icon: UploadCloud },
        { path: '/summaries', label: t('nav.study_summaries'), icon: FileText },
      ]
    },
    {
      title: 'Collaboration & Focus',
      items: [
        { path: '/connections', label: 'Study Partners', icon: Users },
        { path: '/recommendations', label: 'Partner Matches', icon: Sparkles },
        { path: '/study-groups', label: 'Study Groups', icon: MessagesSquare },
        { path: '/shared-notes', label: 'Shared Notes', icon: Share2 },
        { path: '/focus-dashboard', label: 'Focus Tracker', icon: ShieldAlert },
      ]
    },
    {
      title: 'Intelligence & Analytics',
      items: [
        { path: '/mentor', label: t('nav.ai_mentor'), icon: Bot },
        { path: '/analytics', label: t('nav.analytics'), icon: BarChart3 },
        { path: '/learning-dna', label: t('nav.learning_dna'), icon: Dna },
        { path: '/notifications', label: t('nav.notifications'), icon: Bell },
        { path: '/profile', label: t('nav.profile'), icon: UserCheck },
        { path: '/settings', label: t('nav.settings'), icon: Settings },
      ]
    }
  ];

  if (user?.role === 'admin') {
    navGroups.push({
      title: 'Administration',
      items: [
        { path: '/admin', label: t('nav.admin') || 'Admin Dashboard', icon: Shield }
      ]
    });
  }

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
        {navGroups.map((group, gIdx) => (
          <div key={gIdx}>
            <div className="nav-section-title">{group.title}</div>
            <ul className="sidebar-nav-list">
              {group.items.map((item) => {
                const IconComponent = item.icon;
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                    >
                      <IconComponent size={18} />
                      <span>{item.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </aside>
    </>
  );
};

export default Sidebar;
