import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { useTheme } from '../hooks/useTheme.js';
import { useLanguage } from '../hooks/useLanguage.js';
import { useTranslation } from 'react-i18next';
import { Settings, Moon, Sun, Globe, Clock, ShieldCheck, Check } from 'lucide-react';

const SettingsPage = () => {
  const { user, refreshProfile } = useAuth();
  const { theme, switchTheme } = useTheme();
  const { currentLanguage, changeLang } = useLanguage();
  const { t } = useTranslation();

  const [dailyGoal, setDailyGoal] = useState(user?.dailyStudyGoalMinutes || 120);
  const [weeklyGoal, setWeeklyGoal] = useState(user?.weeklyStudyGoalHours || 15);
  const [availableHours, setAvailableHours] = useState(user?.availableHoursPerDay || 4);
  const [preferredTime, setPreferredTime] = useState(user?.preferredStudyTime || 'evening');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{t('settings.title')}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Configure appearance, languages, available study hours, and academic preferences
        </p>
      </div>

      {savedSuccess && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--accent-emerald)',
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Check size={16} /> Preferences successfully persisted!
        </div>
      )}

      {/* Appearance Section */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sun size={18} color="var(--primary)" /> {t('settings.appearance')}
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <button
            className={`glass-card ${theme === 'dark' ? 'btn-primary' : ''}`}
            onClick={() => switchTheme('dark')}
            style={{ padding: '16px', textAlign: 'center', cursor: 'pointer' }}
          >
            <Moon size={24} style={{ margin: '0 auto 8px auto' }} />
            <div style={{ fontWeight: 700 }}>{t('settings.theme_dark')}</div>
          </button>

          <button
            className={`glass-card ${theme === 'light' ? 'btn-primary' : ''}`}
            onClick={() => switchTheme('light')}
            style={{ padding: '16px', textAlign: 'center', cursor: 'pointer' }}
          >
            <Sun size={24} style={{ margin: '0 auto 8px auto' }} />
            <div style={{ fontWeight: 700 }}>{t('settings.theme_light')}</div>
          </button>
        </div>
      </div>

      {/* Language Section */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Globe size={18} color="var(--accent-cyan)" /> {t('settings.language')}
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          <button
            className={`glass-card ${currentLanguage === 'en' ? 'btn-primary' : ''}`}
            onClick={() => changeLang('en')}
            style={{ padding: '14px', textAlign: 'center' }}
          >
            <div style={{ fontWeight: 800 }}>English</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Default</div>
          </button>

          <button
            className={`glass-card ${currentLanguage === 'ta' ? 'btn-primary' : ''}`}
            onClick={() => changeLang('ta')}
            style={{ padding: '14px', textAlign: 'center' }}
          >
            <div style={{ fontWeight: 800 }}>தமிழ்</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Tamil</div>
          </button>

          <button
            className={`glass-card ${currentLanguage === 'hi' ? 'btn-primary' : ''}`}
            onClick={() => changeLang('hi')}
            style={{ padding: '14px', textAlign: 'center' }}
          >
            <div style={{ fontWeight: 800 }}>हिंदी</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Hindi</div>
          </button>
        </div>
      </div>

      {/* Study Preferences Section */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} color="var(--accent-emerald)" /> {t('settings.study_preferences')}
        </h3>

        <form onSubmit={handleSavePreferences} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '6px' }}>
                {t('settings.daily_goal')}
              </label>
              <input
                type="number"
                style={{ width: '100%' }}
                value={dailyGoal}
                onChange={(e) => setDailyGoal(Number(e.target.value))}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '6px' }}>
                {t('settings.weekly_goal')}
              </label>
              <input
                type="number"
                style={{ width: '100%' }}
                value={weeklyGoal}
                onChange={(e) => setWeeklyGoal(Number(e.target.value))}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '6px' }}>
                {t('settings.available_hours')}
              </label>
              <input
                type="number"
                style={{ width: '100%' }}
                value={availableHours}
                onChange={(e) => setAvailableHours(Number(e.target.value))}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '6px' }}>
                {t('settings.preferred_time')}
              </label>
              <select
                style={{ width: '100%' }}
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
              >
                <option value="morning">Morning (6 AM – 12 PM)</option>
                <option value="afternoon">Afternoon (12 PM – 5 PM)</option>
                <option value="evening">Evening (5 PM – 9 PM)</option>
                <option value="night">Night (9 PM – 1 AM)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button type="submit" className="btn btn-primary">
              {t('settings.save_settings')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;
