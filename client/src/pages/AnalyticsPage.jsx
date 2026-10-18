import React, { useEffect } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { useStudyAnalytics } from '../hooks/useStudyAnalytics.js';
import { useTranslation } from 'react-i18next';
import { BarChart3, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AnalyticsPage = () => {
  const { weeklyHours, totalWeeklyHours, subjectProgress, completionRate, studyConsistencyScore, fetchAnalytics } = useStudyAnalytics();
  const { t } = useTranslation();

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const barData = {
    labels: weeklyHours.map(d => d.day),
    datasets: [
      {
        label: 'Study Hours',
        data: weeklyHours.map(d => d.hours),
        backgroundColor: '#6366f1',
        borderRadius: 8
      }
    ]
  };

  const lineData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Consistency Score (%)',
        data: [68, 74, 79, studyConsistencyScore || 84],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const doughnutData = {
    labels: subjectProgress.map(s => s.subject),
    datasets: [
      {
        data: subjectProgress.map(s => s.percentage),
        backgroundColor: ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6'],
        borderWidth: 0
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.06)' },
        ticks: { color: '#94a3b8' }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8' }
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{t('analytics.title')}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t('analytics.subtitle')}</p>
      </div>

      {/* Top 3 KPI stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <div className="glass-card">
          <div style={{ color: 'var(--text-muted)', fontSize: '0.825rem', fontWeight: 600, marginBottom: '6px' }}>
            Total Weekly Velocity
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>
            {totalWeeklyHours || 20.8} Hours
          </div>
        </div>

        <div className="glass-card">
          <div style={{ color: 'var(--text-muted)', fontSize: '0.825rem', fontWeight: 600, marginBottom: '6px' }}>
            Overall Task Completion
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
            {completionRate}%
          </div>
        </div>

        <div className="glass-card">
          <div style={{ color: 'var(--text-muted)', fontSize: '0.825rem', fontWeight: 600, marginBottom: '6px' }}>
            Study Consistency Index
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
            {studyConsistencyScore}%
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        <div className="glass-card" style={{ height: '340px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '14px' }}>{t('analytics.hours_chart')}</h3>
          <div style={{ flex: 1, position: 'relative' }}>
            <Bar data={barData} options={chartOptions} />
          </div>
        </div>

        <div className="glass-card" style={{ height: '340px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '14px' }}>{t('analytics.consistency_chart')}</h3>
          <div style={{ flex: 1, position: 'relative' }}>
            <Line data={lineData} options={chartOptions} />
          </div>
        </div>

        <div className="glass-card" style={{ height: '340px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '14px' }}>{t('analytics.subject_chart')}</h3>
          <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '14px' }}>Subject Completion Breakdown</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {subjectProgress.map(s => (
                <div key={s.subject}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', fontWeight: 600, marginBottom: '4px' }}>
                    <span>{s.subject}</span>
                    <span>{s.percentage}%</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--bg-card)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${s.percentage}%`, background: s.color || 'var(--primary)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
