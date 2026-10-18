import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flame,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Clock,
  Sparkles,
  CheckCircle2,
  Calendar,
  ShieldAlert,
  Play,
  Plus
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { useTasks } from '../hooks/useTasks.js';
import { useStudyPlanner } from '../hooks/useStudyPlanner.js';
import { useStudyAnalytics } from '../hooks/useStudyAnalytics.js';
import { useLearningDNA } from '../hooks/useLearningDNA.js';
import { recentlyAccessedAPI, examAPI, subjectAPI } from '../services/api.js';
import { useTranslation } from 'react-i18next';
import Modal from '../components/common/Modal.jsx';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const DashboardPage = () => {
  const { user } = useAuth();
  const { tasks, fetchTasks, toggleComplete, createTask } = useTasks();
  const { nextAction, fetchNextAction } = useStudyPlanner();
  const { weeklyHours, totalWeeklyHours, subjectProgress, completionRate, studyConsistencyScore, fetchAnalytics } = useStudyAnalytics();
  const { learningDNA, fetchLearningDNA } = useLearningDNA();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDuration, setNewTaskDuration] = useState(30);
  const [recentItems, setRecentItems] = useState([]);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [weakTopicsList, setWeakTopicsList] = useState([]);

  useEffect(() => {
    fetchTasks({ date: new Date().toISOString().split('T')[0] });
    fetchNextAction();
    fetchAnalytics();
    fetchLearningDNA();

    recentlyAccessedAPI.getRecentlyAccessed()
      .then(res => setRecentItems(res.data.data || []))
      .catch(() => {});

    examAPI.getExams()
      .then(res => setUpcomingExams(res.data.data || res.data.exams || []))
      .catch(() => {});

    subjectAPI.getTopics()
      .then(res => {
        const allTopics = res.data.data || res.data.topics || [];
        const weak = allTopics.filter(t => (t.masteryScore || 0) < 60 || t.status === 'struggling');
        setWeakTopicsList(weak.slice(0, 3));
      })
      .catch(() => {});
  }, [fetchTasks, fetchNextAction, fetchAnalytics, fetchLearningDNA]);

  // Greeting based on hour
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12
    ? t('dashboard.greeting_morning')
    : currentHour < 18
    ? t('dashboard.greeting_afternoon')
    : t('dashboard.greeting_evening');

  const handleStartNextAction = () => {
    if (nextAction?.topicId) {
      navigate('/session', { state: { topicId: nextAction.topicId, actionTitle: nextAction.recommendedAction } });
    } else {
      navigate('/session');
    }
  };

  const handleCreateQuickTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    await createTask({
      title: newTaskTitle,
      durationMinutes: Number(newTaskDuration),
      priority: 'high',
      scheduledDate: new Date().toISOString().split('T')[0]
    });
    setNewTaskTitle('');
    setIsTaskModalOpen(false);
    fetchTasks();
  };

  // Chart datasets
  const barChartData = {
    labels: weeklyHours.map(d => d.day),
    datasets: [
      {
        label: 'Study Hours',
        data: weeklyHours.map(d => d.hours),
        backgroundColor: '#6366f1',
        borderRadius: 6
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
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8' }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8' }
      }
    }
  };

  return (
    <div className="dashboard-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner: Greeting & Streak */}
      <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '6px' }}>
            {greeting}, {user?.name || 'Scholar'} 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            {user?.streak > 0
              ? `${t('dashboard.streak_alive', { days: user.streak })} ${t('dashboard.streak_building')}`
              : 'Start a study session today to build your consistency streak!'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="streak-flame" style={{
            background: 'linear-gradient(135deg, rgba(255, 87, 34, 0.2), rgba(245, 158, 11, 0.2))',
            border: '1px solid rgba(255, 87, 34, 0.4)',
            padding: '12px 20px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <Flame size={28} color="#ff5722" />
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ff5722' }}>
                {user?.streak || 0} Day Streak
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Longest Record: {user?.longestStreak || 0} Days
              </div>
            </div>
          </div>

          <button className="btn btn-primary" onClick={() => setIsTaskModalOpen(true)}>
            <Plus size={16} /> {t('dashboard.quick_task')}
          </button>
        </div>
      </div>

      {/* Next Best Study Action Card */}
      {nextAction && (
        <div className="glass-card" style={{
          borderLeft: '4px solid var(--accent-emerald)',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(6, 182, 212, 0.05))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="badge badge-urgent">🎯 {t('dashboard.next_best_action')}</span>
              <span className="badge badge-low">Confidence {nextAction.confidence || 90}%</span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px' }}>
              {nextAction.recommendedAction}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '750px' }}>
              {nextAction.reason}
            </p>
          </div>

          <button className="btn btn-accent" onClick={handleStartNextAction} style={{ padding: '12px 24px' }}>
            <Play size={16} /> {t('dashboard.start_now')}
          </button>
        </div>
      )}

      {/* 4 Overview Statistics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 600 }}>{t('dashboard.today_progress')}</span>
            <CheckCircle2 size={18} color="var(--accent-emerald)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{completionRate}%</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', marginTop: '4px' }}>
            {tasks.filter(t => t.status === 'completed').length} of {tasks.length} tasks completed
          </div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 600 }}>{t('dashboard.weekly_hours')}</span>
            <Clock size={18} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{totalWeeklyHours || 0} hrs</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '4px' }}>
            Active study this week
          </div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 600 }}>{t('dashboard.consistency_score')}</span>
            <TrendingUp size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{studyConsistencyScore}%</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', marginTop: '4px' }}>
            {studyConsistencyScore >= 70 ? 'Optimal study consistency' : studyConsistencyScore > 0 ? 'Building consistency' : 'No study logged this week'}
          </div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 600 }}>{t('dashboard.exam_risk')}</span>
            <ShieldAlert size={18} color="var(--accent-rose)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: upcomingExams.length > 0 ? 'var(--accent-amber)' : 'var(--accent-emerald)' }}>
            {upcomingExams.length > 0 ? `${upcomingExams.length} Scheduled` : 'Low Risk'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {upcomingExams.length > 0
              ? `Next: ${upcomingExams[0]?.title || 'Upcoming Exam'}`
              : 'No immediate exam deadlines'}
          </div>
        </div>
      </div>

      {/* Grid: Charts & Tasks */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {/* Weekly Study Hours Chart */}
        <div className="glass-card" style={{ height: '320px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>{t('analytics.hours_chart')}</h3>
          <div style={{ flex: 1, position: 'relative' }}>
            <Bar data={barChartData} options={chartOptions} />
          </div>
        </div>

        {/* Today's Tasks */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Today's Scheduled Tasks</h3>
            <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => navigate('/planner')}>
              View All
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
            {tasks.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No pending tasks for today.</p>
            ) : (
              tasks.slice(0, 4).map((task) => (
                <div
                  key={task._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    opacity: task.status === 'completed' ? 0.6 : 1
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="checkbox"
                      checked={task.status === 'completed'}
                      onChange={() => toggleComplete(task._id)}
                      style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                    />
                    <div>
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        textDecoration: task.status === 'completed' ? 'line-through' : 'none'
                      }}>
                        {task.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        ⏱ {task.durationMinutes} mins | Scheduled {task.scheduledTime || '19:00'}
                      </div>
                    </div>
                  </div>

                  <span className={`badge badge-${task.priority || 'medium'}`}>
                    {task.priority}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Grid: Weak Areas / Prerequisite Gaps & Learning DNA Snapshot */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: 'var(--accent-amber)' }}>
            <AlertTriangle size={20} />
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{t('dashboard.weak_topics')}</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {weakTopicsList.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No weak areas detected yet. Complete practice quizzes and study sessions to identify mastery gaps.
              </p>
            ) : (
              weakTopicsList.map((topic) => (
                <div key={topic._id} style={{ padding: '12px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700 }}>
                    <span>{topic.name}</span>
                    <span style={{ color: 'var(--accent-amber)' }}>{topic.masteryScore || 0}% Mastery</span>
                  </div>
                  {topic.prerequisites && topic.prerequisites.length > 0 && (
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Prerequisite gap blocking downstream learning.
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: 'var(--accent-cyan)' }}>
            <Sparkles size={20} />
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{t('dashboard.learning_dna_summary')}</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('dashboard.peak_time')}</span>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '2px' }}>
                {learningDNA?.peakTime || 'Analyzing...'}
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Focus Session Stamina</span>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '2px' }}>
                {learningDNA?.averageSessionDurationMinutes ? `${learningDNA.averageSessionDurationMinutes} mins` : 'Pending sessions'}
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Optimal Study Days</span>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '2px' }}>
                {learningDNA?.optimalStudyDays?.length ? learningDNA.optimalStudyDays.join(', ') : 'Pending sessions'}
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cognitive Style</span>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '2px' }}>
                {learningDNA?.learningPace || 'Active Recall Spaced'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recently Accessed Activities */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} color="var(--primary)" />
            Recently Accessed
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {recentItems.length} activities recorded
          </span>
        </div>

        {recentItems.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No recently accessed items yet. Visit subjects, notes, exams, or sessions to see fast access shortcuts here.
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            {recentItems.slice(0, 6).map((item) => (
              <div
                key={item._id}
                onClick={() => item.path && navigate(item.path)}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  cursor: item.path ? 'pointer' : 'default',
                  transition: 'border-color 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge badge-low" style={{ fontSize: '0.7rem', textTransform: 'capitalize' }}>
                    {item.resourceType}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {new Date(item.accessedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.title}</div>
                {item.subtitle && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.subtitle}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Add Task Modal */}
      <Modal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} title="Quick Add Study Task">
        <form onSubmit={handleCreateQuickTask} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '6px' }}>Task Title</label>
            <input
              type="text"
              style={{ width: '100%' }}
              placeholder="e.g. Solve 3 BCNF Normalization problems"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '6px' }}>Estimated Duration (Minutes)</label>
            <input
              type="number"
              style={{ width: '100%' }}
              value={newTaskDuration}
              onChange={(e) => setNewTaskDuration(e.target.value)}
              min="10"
              max="180"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsTaskModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Schedule Task
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DashboardPage;
