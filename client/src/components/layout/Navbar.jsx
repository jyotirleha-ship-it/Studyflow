import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Flame, Moon, Sun, Bell, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { useTheme } from '../../hooks/useTheme.js';
import { useLanguage } from '../../hooks/useLanguage.js';
import { useNotifications } from '../../hooks/useNotifications.js';
import { useStreak } from '../../hooks/useStreak.js';
import { useTranslation } from 'react-i18next';
import './navbar.css';

const Navbar = ({ onToggleSidebar }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { currentLanguage, changeLang } = useLanguage();
  const { unreadCount } = useNotifications();
  const { currentStreak } = useStreak();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="app-navbar">
      <div className="navbar-left">
        <button className="mobile-nav-toggle" onClick={onToggleSidebar} aria-label="Toggle Navigation">
          <Menu size={22} />
        </button>

        <Link to="/dashboard" className="navbar-brand">
          <span>⚡ StudyFlow</span>
        </Link>
      </div>

      <div className="navbar-right">
        {isAuthenticated && (
          <div className="streak-pill streak-flame" title="Active Study Streak">
            <Flame size={18} />
            <span>{currentStreak} {t('dashboard.current_streak')}</span>
          </div>
        )}

        <select
          className="lang-select"
          value={currentLanguage}
          onChange={(e) => changeLang(e.target.value)}
          aria-label="Language Switcher"
        >
          <option value="en">English</option>
          <option value="ta">தமிழ்</option>
          <option value="hi">हिंदी</option>
        </select>

        <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle Theme" title="Toggle Theme">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {isAuthenticated && (
          <>
            <Link to="/notifications" className="icon-btn" aria-label="Notifications" title="Notifications">
              <Bell size={18} />
              {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </Link>

            <Link to="/profile" className="user-profile-widget" title="View Profile">
              <div className="user-avatar-circle">
                {user?.name ? user.name[0].toUpperCase() : 'A'}
              </div>
              <div className="user-details-mini">
                <span className="user-name-text">{user?.name || 'Student'}</span>
                <span className="user-level-pill">Lv. {user?.level || 1} • {user?.xp || 0} XP</span>
              </div>
            </Link>

            <button className="icon-btn" onClick={handleLogout} title={t('nav.logout')} aria-label={t('nav.logout')}>
              <LogOut size={18} />
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default Navbar;
