import React from 'react';
import { Flame, X } from 'lucide-react';
import { useStreak } from '../../hooks/useStreak.js';
import { useTranslation } from 'react-i18next';
import './streakCelebration.css';

const StreakCelebration = () => {
  const { celebration, dismissCelebration } = useStreak();
  const { t } = useTranslation();

  if (!celebration) return null;

  const isRecord = celebration.isNewRecord;
  const title = isRecord
    ? t('dashboard.new_streak_record')
    : t('dashboard.streak_celebration', { days: celebration.streak });

  return (
    <div className="streak-celebration-overlay">
      <div className="streak-card">
        <div className="streak-icon-wrap">🔥</div>
        <div className="streak-text">
          <h4>{title}</h4>
          <p>{t('dashboard.streak_building')}</p>
        </div>
        <button className="streak-close-btn" onClick={dismissCelebration} aria-label="Close">
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default StreakCelebration;
