import React, { useEffect, useState } from 'react';
import { Bell, CheckCheck, Clock, Flame, AlertCircle, Mail, Send, CheckCircle2, Smartphone } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications.js';
import { notificationAPI } from '../services/api.js';
import { useTranslation } from 'react-i18next';
import Pagination from '../components/common/Pagination.jsx';

const NotificationsPage = () => {
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotifications();
  const { t } = useTranslation();

  const [preferences, setPreferences] = useState({
    dailySchedule: true,
    studyReminders: true,
    examReminders: true,
    achievements: true,
    weeklyProgress: false
  });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState('');
  const [pushStatus, setPushStatus] = useState('');

  useEffect(() => {
    fetchNotifications();
    notificationAPI.getPreferences()
      .then(res => {
        if (res.data.preferences) setPreferences(res.data.preferences);
      })
      .catch(() => {});
  }, [fetchNotifications]);

  const handleTogglePref = async (key) => {
    const updated = { ...preferences, [key]: !preferences[key] };
    setPreferences(updated);
    try {
      await notificationAPI.updatePreferences(updated);
    } catch (err) {
      console.error('Failed to save notification preferences', err);
    }
  };

  const handleSendDailyScheduleEmail = async () => {
    setSendingEmail(true);
    setEmailStatus('');
    try {
      const res = await notificationAPI.sendDailySchedule();
      setEmailStatus(res.data.message || "Today's study schedule email dispatched successfully!");
    } catch (err) {
      setEmailStatus(err.response?.data?.message || 'Failed to dispatch email.');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleEnablePush = async () => {
    if (!('Notification' in window)) {
      setPushStatus('Browser notifications not supported in this browser.');
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      try {
        await notificationAPI.subscribePush({ userAgent: navigator.userAgent });
        setPushStatus('Browser push notifications enabled successfully!');
      } catch (err) {
        setPushStatus('Notification permission granted.');
      }
    } else {
      setPushStatus('Notification permission denied by browser.');
    }
  };

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{t('nav.notifications')}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {unreadCount} unread reminder(s) and milestone alerts
          </p>
        </div>

        <button className="btn btn-secondary" onClick={markAllAsRead} disabled={unreadCount === 0}>
          <CheckCheck size={16} /> Mark All as Read
        </button>
      </div>

      {/* Email & Push Delivery Controls Card */}
      <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail size={18} color="var(--primary)" />
              Daily Study Schedule & Email Notifications
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              StudyFlow delivers your personalized daily plan, study reminders, and exam alerts directly to your registered inbox.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn btn-primary"
              onClick={handleSendDailyScheduleEmail}
              disabled={sendingEmail}
              style={{ fontSize: '0.85rem', padding: '8px 14px' }}
            >
              <Send size={15} /> {sendingEmail ? 'Dispatching...' : "Send Today's Schedule Now"}
            </button>

            <button
              className="btn btn-secondary"
              onClick={handleEnablePush}
              style={{ fontSize: '0.85rem', padding: '8px 14px' }}
            >
              <Smartphone size={15} /> Enable Push
            </button>
          </div>
        </div>

        {emailStatus && (
          <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--accent-emerald)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} /> {emailStatus}
          </div>
        )}

        {pushStatus && (
          <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid var(--primary)', color: 'var(--primary)', fontSize: '0.85rem' }}>
            {pushStatus}
          </div>
        )}

        {/* Email Preferences Checkboxes */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
            <input
              type="checkbox"
              checked={preferences.dailySchedule}
              onChange={() => handleTogglePref('dailySchedule')}
            />
            <span>Today's Study Schedule</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
            <input
              type="checkbox"
              checked={preferences.studyReminders}
              onChange={() => handleTogglePref('studyReminders')}
            />
            <span>Study Session Reminders</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
            <input
              type="checkbox"
              checked={preferences.examReminders}
              onChange={() => handleTogglePref('examReminders')}
            />
            <span>Exam Deadline Alerts</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
            <input
              type="checkbox"
              checked={preferences.achievements}
              onChange={() => handleTogglePref('achievements')}
            />
            <span>Streak Milestones</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
            <input
              type="checkbox"
              checked={preferences.weeklyProgress}
              onChange={() => handleTogglePref('weeklyProgress')}
            />
            <span>Weekly Summary Report</span>
          </label>
        </div>
      </div>

      {/* Notifications List */}
      <div className="glass-card" style={{ padding: '14px' }}>
        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <Bell size={40} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
            <p>No notifications at this time.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {notifications.map((n) => (
              <div
                key={n._id}
                onClick={() => markAsRead(n._id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  background: n.read ? 'var(--bg-card)' : 'rgba(99, 102, 241, 0.12)',
                  border: n.read ? '1px solid var(--border-color)' : '1px solid var(--primary)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: n.type === 'streak' ? 'rgba(255, 87, 34, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {n.type === 'streak' ? <Flame size={18} color="var(--streak-fire)" /> : <Clock size={18} color="var(--primary)" />}
                  </div>

                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.925rem' }}>{n.title}</div>
                    <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{n.message}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                {!n.read && (
                  <span className="badge badge-urgent">New</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
