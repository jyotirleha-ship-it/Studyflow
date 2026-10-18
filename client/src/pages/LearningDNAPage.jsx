import React, { useEffect } from 'react';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';
import { useLearningDNA } from '../hooks/useLearningDNA.js';
import { useTranslation } from 'react-i18next';
import { Dna, Clock, Flame, Zap, Compass, RotateCcw } from 'lucide-react';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const LearningDNAPage = () => {
  const { learningDNA, fetchLearningDNA } = useLearningDNA();
  const { t } = useTranslation();

  useEffect(() => {
    fetchLearningDNA();
  }, [fetchLearningDNA]);

  const metrics = learningDNA?.radarMetrics || {
    focusStamina: 78,
    consistency: 84,
    revisionDiscipline: 72,
    speed: 80,
    problemSolving: 70,
    retention: 76
  };

  const radarData = {
    labels: ['Focus Stamina', 'Consistency', 'Revision Discipline', 'Speed', 'Problem Solving', 'Retention'],
    datasets: [
      {
        label: 'Cognitive Attributes',
        data: [
          metrics.focusStamina,
          metrics.consistency,
          metrics.revisionDiscipline,
          metrics.speed,
          metrics.problemSolving,
          metrics.retention
        ],
        backgroundColor: 'rgba(99, 102, 241, 0.25)',
        borderColor: '#6366f1',
        pointBackgroundColor: '#a855f7',
        pointBorderColor: '#ffffff'
      }
    ]
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        pointLabels: { color: '#94a3b8', font: { size: 11 } },
        ticks: { display: false, min: 0, max: 100 }
      }
    },
    plugins: {
      legend: { display: false }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{t('learning_dna.title')}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t('learning_dna.subtitle')}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Radar Visualization */}
        <div className="glass-card" style={{ height: '380px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '14px' }}>
            {t('learning_dna.radar_title')}
          </h3>
          <div style={{ flex: 1, position: 'relative' }}>
            <Radar data={radarData} options={radarOptions} />
          </div>
        </div>

        {/* Behavioral Attributes Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ padding: '12px', background: 'rgba(99, 102, 241, 0.15)', borderRadius: 'var(--radius-sm)', color: 'var(--primary)' }}>
              <Clock size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t('learning_dna.peak_hours')}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{learningDNA?.peakTime || '7:00 PM – 9:00 PM'}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Your recall accuracy is 22% higher during this window.
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.15)', borderRadius: 'var(--radius-sm)', color: 'var(--accent-emerald)' }}>
              <Zap size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t('learning_dna.session_duration')}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{learningDNA?.averageSessionDurationMinutes || 35} Minutes</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Ideal block before focus decay occurs.
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ padding: '12px', background: 'rgba(245, 158, 11, 0.15)', borderRadius: 'var(--radius-sm)', color: 'var(--accent-amber)' }}>
              <RotateCcw size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t('learning_dna.recovery')}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{learningDNA?.recoveryBehavior || 'Recovers within 24 hours of missed task'}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Quick re-engagement avoids compound syllabus backlog.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningDNAPage;
