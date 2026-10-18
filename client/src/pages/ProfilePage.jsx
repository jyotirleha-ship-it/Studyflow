import React from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { useStreak } from '../hooks/useStreak.js';
import { useTranslation } from 'react-i18next';
import { User, Award, Flame, Zap, Shield, Trophy } from 'lucide-react';

const ProfilePage = () => {
  const { user } = useAuth();
  const { currentStreak, longestStreak } = useStreak();
  const { t } = useTranslation();

  const badges = user?.badges || [
    { id: 'streak-7', name: '7-Day Streak Warrior', icon: 'Flame', description: 'Maintained 7 consecutive study days.' },
    { id: 'exam-prep', name: 'Exam Readiness Champion', icon: 'Trophy', description: 'Reached 80%+ readiness across 3 subjects.' },
    { id: 'pioneer', name: 'StudyFlow Pioneer', icon: 'Rocket', description: 'Joined StudyFlow and initiated intelligent study planning.' }
  ];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
        <div style={{
          width: '74px',
          height: '74px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary), var(--accent-purple))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontSize: '2rem',
          fontWeight: 800
        }}>
          {user?.name ? user.name[0].toUpperCase() : 'A'}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>{user?.name || 'Alex Johnson'}</h1>
            <span className="badge badge-low">Level {user?.level || 3} Scholar</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {user?.email || 'student@studyflow.ai'}
          </div>

          <div style={{ marginTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 600, marginBottom: '4px' }}>
              <span>XP Progress</span>
              <span>{user?.xp || 680} / {(user?.level || 3) * 300} XP</span>
            </div>
            <div style={{ height: '8px', background: 'var(--bg-card)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.min(100, ((user?.xp || 680) / ((user?.level || 3) * 300)) * 100)}%`,
                background: 'linear-gradient(90deg, var(--primary), var(--accent-cyan))'
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Streak Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <Flame size={28} color="var(--streak-fire)" style={{ margin: '0 auto 6px auto' }} />
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--streak-fire)' }}>{currentStreak} Days</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Current Study Streak</div>
        </div>

        <div className="glass-card" style={{ textAlign: 'center' }}>
          <Trophy size={28} color="var(--accent-amber)" style={{ margin: '0 auto 6px auto' }} />
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent-amber)' }}>{longestStreak} Days</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>All-Time Best Record</div>
        </div>
      </div>

      {/* Earned Badges */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Award size={20} color="var(--primary)" /> {t('profile.badges')}
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
          {badges.map((b, idx) => (
            <div key={idx} style={{ padding: '14px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '4px' }}>
                🏆 {b.name}
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {b.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
