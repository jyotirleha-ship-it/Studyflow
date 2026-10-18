import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Users,
  UserCheck,
  Timer,
  BookOpen,
  GraduationCap,
  HelpCircle,
  MessageSquare,
  FileEdit,
  CheckSquare,
  Search,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Bell,
  AlertTriangle,
  TrendingDown,
  Plus,
  Trash2,
  Send,
  Activity,
  Award,
  Clock,
  Filter
} from 'lucide-react';
import { adminAPI } from '../services/api.js';
import SearchBar from '../components/SearchBar/SearchBar.jsx';
import Pagination from '../components/Pagination/Pagination.jsx';
import FilterPanel from '../components/FilterPanel/FilterPanel.jsx';
import Modal from '../components/common/Modal.jsx';

const AdminDashboardPage = () => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'students' | 'performance' | 'assessments' | 'broadcast' | 'activity'
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 1. Students State
  const [users, setUsers] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentDept, setStudentDept] = useState('all');
  const [studentStatus, setStudentStatus] = useState('all');
  const [studentPage, setStudentPage] = useState(1);
  const [studentTotalPages, setStudentTotalPages] = useState(1);
  const [studentTotal, setStudentTotal] = useState(0);

  // 2. Performance & Risk State
  const [riskData, setRiskData] = useState(null);
  const [riskLoading, setRiskLoading] = useState(false);

  // 3. Assessments State
  const [assessments, setAssessments] = useState([]);
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [assessmentForm, setAssessmentForm] = useState({
    title: '',
    subject: 'DBMS',
    difficulty: 'Medium',
    durationMinutes: 30,
    passingScore: 60,
    questions: [
      { question: 'What is 1NF in relational theory?', options: ['Atomic values only', 'No partial keys', 'No transitive keys', 'None'], correctOptionIndex: 0, explanation: '1NF demands atomic columns.' }
    ]
  });

  // 4. Broadcast State
  const [broadcastForm, setBroadcastForm] = useState({ title: '', message: '', priority: 'normal' });
  const [broadcastSending, setBroadcastSending] = useState(false);

  // 5. Activity Logs State
  const [logs, setLogs] = useState([]);
  const [logPage, setLogPage] = useState(1);
  const [logTotalPages, setLogTotalPages] = useState(1);
  const [logActionFilter, setLogActionFilter] = useState('all');

  const loadStats = useCallback(async () => {
    try {
      const res = await adminAPI.getStats();
      setStats(res.data?.stats || null);
    } catch (err) {
      console.error('Failed to load stats', err);
    }
  }, []);

  const loadStudents = useCallback(async () => {
    try {
      const res = await adminAPI.getUsers({
        search: studentSearch,
        department: studentDept !== 'all' ? studentDept : undefined,
        status: studentStatus !== 'all' ? studentStatus : undefined,
        page: studentPage,
        limit: 10
      });
      setUsers(res.data?.users || []);
      setStudentTotalPages(res.data?.totalPages || 1);
      setStudentTotal(res.data?.total || 0);
    } catch (err) {
      console.error('Failed to load students', err);
    }
  }, [studentSearch, studentDept, studentStatus, studentPage]);

  const loadRiskMetrics = useCallback(async () => {
    setRiskLoading(true);
    try {
      const res = await adminAPI.getPerformanceRisk();
      setRiskData(res.data || null);
    } catch (err) {
      console.error('Failed to load risk metrics', err);
    } finally {
      setRiskLoading(false);
    }
  }, []);

  const loadAssessments = useCallback(async () => {
    try {
      const res = await adminAPI.getAssessments();
      setAssessments(res.data?.assessments || []);
    } catch (err) {
      console.error('Failed to load assessments', err);
    }
  }, []);

  const loadActivityLogs = useCallback(async () => {
    try {
      const res = await adminAPI.getActivityLogs({
        page: logPage,
        action: logActionFilter !== 'all' ? logActionFilter : undefined
      });
      setLogs(res.data?.logs || []);
      setLogTotalPages(res.data?.totalPages || 1);
    } catch (err) {
      console.error('Failed to load activity logs', err);
    }
  }, [logPage, logActionFilter]);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([
      loadStats(),
      loadStudents(),
      loadRiskMetrics(),
      loadAssessments(),
      loadActivityLogs()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (activeTab === 'students') loadStudents();
    if (activeTab === 'performance') loadRiskMetrics();
    if (activeTab === 'assessments') loadAssessments();
    if (activeTab === 'activity') loadActivityLogs();
  }, [activeTab, loadStudents, loadRiskMetrics, loadAssessments, loadActivityLogs]);

  const handleToggleActive = async (userId, currentName, currentActive) => {
    const actionName = currentActive ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${actionName} student "${currentName}"?`)) return;

    setActionLoading(true);
    setMessage('');
    try {
      const res = await adminAPI.toggleUserActive(userId);
      setMessage(res.data?.message || 'Student account status updated');
      loadStudents();
      loadStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateAssessment = async (e) => {
    e.preventDefault();
    try {
      const res = await adminAPI.createAssessment(assessmentForm);
      if (res.data?.success) {
        setIsAssessmentModalOpen(false);
        setMessage('Assessment created successfully!');
        loadAssessments();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create assessment');
    }
  };

  const handleDeleteAssessment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this assessment?')) return;
    try {
      await adminAPI.deleteAssessment(id);
      setMessage('Assessment deleted.');
      loadAssessments();
    } catch (err) {
      alert('Failed to delete assessment');
    }
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastForm.title || !broadcastForm.message) return;

    setBroadcastSending(true);
    try {
      const res = await adminAPI.broadcastNotification(broadcastForm);
      setMessage(res.data?.message || 'Broadcast notification dispatched!');
      setBroadcastForm({ title: '', message: '', priority: 'normal' });
    } catch (err) {
      alert('Failed to send broadcast');
    } finally {
      setBroadcastSending(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={28} color="#ef4444" /> StudyFlow Administration Panel
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Multi-tenant governance, student performance analytics, risk prediction, assessment control & audit telemetry
          </p>
        </div>

        <button className="btn btn-secondary" onClick={loadAll} disabled={loading}>
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh Telemetry
        </button>
      </div>

      {message && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--accent-emerald)', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', fontWeight: 600 }}>
          {message}
        </div>
      )}

      {/* Admin Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', overflowX: 'auto' }}>
        <button
          className={`connections-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Activity size={16} /> Overview Metrics
        </button>
        <button
          className={`connections-tab-btn ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          <Users size={16} /> Student Management
        </button>
        <button
          className={`connections-tab-btn ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          <AlertTriangle size={16} /> Performance & AI Risk
        </button>
        <button
          className={`connections-tab-btn ${activeTab === 'assessments' ? 'active' : ''}`}
          onClick={() => setActiveTab('assessments')}
        >
          <Award size={16} /> Assessment Manager
        </button>
        <button
          className={`connections-tab-btn ${activeTab === 'broadcast' ? 'active' : ''}`}
          onClick={() => setActiveTab('broadcast')}
        >
          <Bell size={16} /> Broadcast System
        </button>
        <button
          className={`connections-tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          <Clock size={16} /> Activity Logs
        </button>
      </div>

      {/* TAB 1: OVERVIEW METRICS */}
      {activeTab === 'overview' && stats && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Key 4 Highlights */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="glass-card" style={{ padding: '20px' }}>
              <div style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                <Users size={16} /> TOTAL STUDENTS
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900 }}>{stats.totalStudents || stats.totalUsers}</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered learners</span>
            </div>

            <div className="glass-card" style={{ padding: '20px' }}>
              <div style={{ color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                <UserCheck size={16} /> ACTIVE STUDENTS
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900 }}>{stats.activeStudents || stats.activeUsers}</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Verified accounts</span>
            </div>

            <div className="glass-card" style={{ padding: '20px' }}>
              <div style={{ color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                <Timer size={16} /> TOTAL STUDY HOURS
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900 }}>{stats.totalStudyHours || 12}h</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Accumulated focus time</span>
            </div>

            <div className="glass-card" style={{ padding: '20px' }}>
              <div style={{ color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                <AlertTriangle size={16} /> AT-RISK STUDENTS
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900 }}>{stats.atRiskStudents || 0}</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Requires academic intervention</span>
            </div>
          </div>

          {/* Subsystem Telemetry Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
            <div className="glass-card" style={{ padding: '16px' }}>
              <div style={{ color: 'var(--accent-purple)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>SUBJECTS</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{stats.totalSubjects}</div>
            </div>
            <div className="glass-card" style={{ padding: '16px' }}>
              <div style={{ color: 'var(--streak-fire)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>EXAMS TRACKED</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{stats.totalExams}</div>
            </div>
            <div className="glass-card" style={{ padding: '16px' }}>
              <div style={{ color: '#38bdf8', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>NOTES & SHARED</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{stats.totalNotes}</div>
            </div>
            <div className="glass-card" style={{ padding: '16px' }}>
              <div style={{ color: '#f59e0b', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>QUIZ ATTEMPTS</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{stats.totalQuizAttempts}</div>
            </div>
            <div className="glass-card" style={{ padding: '16px' }}>
              <div style={{ color: '#ec4899', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>STUDY GROUPS</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{stats.totalGroups || 4}</div>
            </div>
            <div className="glass-card" style={{ padding: '16px' }}>
              <div style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>PARTNER CONNECTIONS</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{stats.totalConnections || 2}</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STUDENT MANAGEMENT */}
      {activeTab === 'students' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Student Directory & Access Governance</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Search, filter by department/year, and enforce account state</p>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <SearchBar
                value={studentSearch}
                onChange={setStudentSearch}
                placeholder="Search by student name or email..."
              />
              <select
                value={studentDept}
                onChange={(e) => { setStudentDept(e.target.value); setStudentPage(1); }}
                className="dept-select-box"
              >
                <option value="all">All Departments</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Electronics">Electronics</option>
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px 8px' }}>Student</th>
                  <th style={{ padding: '12px 8px' }}>Department</th>
                  <th style={{ padding: '12px 8px' }}>Tier</th>
                  <th style={{ padding: '12px 8px' }}>Study Hours</th>
                  <th style={{ padding: '12px 8px' }}>Avg Focus</th>
                  <th style={{ padding: '12px 8px' }}>Status</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '14px 8px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{u.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                    </td>
                    <td style={{ padding: '14px 8px' }}>
                      {u.department || 'Computer Science'} ({u.year || '3rd Year'})
                    </td>
                    <td style={{ padding: '14px 8px' }}>
                      <span className={`badge ${u.performanceLevel === 'High' ? 'badge-low' : u.performanceLevel === 'Needs Attention' ? 'badge-high' : 'badge-medium'}`}>
                        {u.performanceLevel || 'Medium'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 8px', fontWeight: 600 }}>{u.studyHoursPerDay || 3}h / day</td>
                    <td style={{ padding: '14px 8px', fontWeight: 600 }}>{u.avgFocusScore || 90}%</td>
                    <td style={{ padding: '14px 8px' }}>
                      {u.isActive !== false ? (
                        <span style={{ color: 'var(--accent-emerald)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                          <CheckCircle2 size={13} /> Active
                        </span>
                      ) : (
                        <span style={{ color: 'var(--accent-rose)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                          <XCircle size={13} /> Deactivated
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 8px', textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary"
                        style={{
                          padding: '4px 10px',
                          fontSize: '0.75rem',
                          borderColor: u.isActive !== false ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)',
                          color: u.isActive !== false ? 'var(--accent-rose)' : 'var(--accent-emerald)'
                        }}
                        disabled={actionLoading}
                        onClick={() => handleToggleActive(u._id, u.name, u.isActive !== false)}
                      >
                        {u.isActive !== false ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={studentPage}
            totalPages={studentTotalPages}
            totalItems={studentTotal}
            pageSize={10}
            onPageChange={setStudentPage}
          />
        </div>
      )}

      {/* TAB 3: PERFORMANCE MONITORING & AI PREDICTIONS */}
      {activeTab === 'performance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {riskData?.distribution && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--accent-rose)' }}>
                <div style={{ color: 'var(--accent-rose)', fontWeight: 700, fontSize: '0.85rem' }}>HIGH RISK STUDENTS</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--accent-rose)' }}>
                  {riskData.distribution.highRisk}
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                  Immediate tutoring, study schedule repair, and intervention suggested.
                </p>
              </div>

              <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #f59e0b' }}>
                <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.85rem' }}>MEDIUM RISK STUDENTS</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#f59e0b' }}>
                  {riskData.distribution.mediumRisk}
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                  Moderate velocity. Benefit from peer connections and focus tracking.
                </p>
              </div>

              <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--accent-emerald)' }}>
                <div style={{ color: 'var(--accent-emerald)', fontWeight: 700, fontSize: '0.85rem' }}>LOW RISK (OPTIMAL)</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--accent-emerald)' }}>
                  {riskData.distribution.lowRisk}
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                  High mastery retention and consistent study habits.
                </p>
              </div>
            </div>
          )}

          {/* At-Risk Intervention Table */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '14px' }}>
              Intervention Required: Students with Academic Risk Flags
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '10px 8px' }}>Student</th>
                    <th style={{ padding: '10px 8px' }}>Department</th>
                    <th style={{ padding: '10px 8px' }}>Risk Tier</th>
                    <th style={{ padding: '10px 8px' }}>Detected Risk Factors</th>
                  </tr>
                </thead>
                <tbody>
                  {(riskData?.atRiskStudents || []).map((s) => (
                    <tr key={s._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 8px', fontWeight: 700 }}>{s.name}</td>
                      <td style={{ padding: '12px 8px' }}>{s.department || 'Computer Science'}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <span className={`badge ${s.riskTier === 'High' ? 'badge-high' : 'badge-medium'}`}>
                          {s.riskTier} Risk
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>
                        {(s.riskFactors || []).join(' • ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ASSESSMENT MANAGEMENT */}
      {activeTab === 'assessments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Curriculum Assessment Management</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Create, update, and manage official evaluation quizzes and practice tests</p>
            </div>
            <button className="btn btn-primary" onClick={() => setIsAssessmentModalOpen(true)}>
              <Plus size={16} /> Create Assessment
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
            {assessments.map((a) => (
              <div key={a._id} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge badge-low">{a.subject}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.difficulty} Difficulty</span>
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{a.title}</h3>
                <div style={{ display: 'flex', gap: '14px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <span>⏱ {a.durationMinutes} Mins</span>
                  <span>📋 {a.totalQuestions || a.questions?.length} Questions</span>
                  <span>🎯 Pass: {a.passingScore}%</span>
                </div>
                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '10px' }}>
                  <button className="btn btn-secondary btn-sm" style={{ color: 'var(--accent-rose)' }} onClick={() => handleDeleteAssessment(a._id)}>
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: BROADCAST NOTIFICATIONS */}
      {activeTab === 'broadcast' && (
        <div className="glass-card" style={{ padding: '26px', maxWidth: '640px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px' }}>Dispatch Broadcast Notification</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
            Publish an urgent or academic alert to all active student dashboards across the university.
          </p>

          <form onSubmit={handleBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-field-group">
              <label>Announcement Headline *</label>
              <input
                type="text"
                placeholder="e.g. Campus Placement Mock Test Tomorrow"
                value={broadcastForm.title}
                onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                required
              />
            </div>

            <div className="form-field-group">
              <label>Message Content *</label>
              <textarea
                rows="4"
                placeholder="Provide instructions, venue details, or scheduled times..."
                value={broadcastForm.message}
                onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                required
              />
            </div>

            <div className="form-field-group">
              <label>Priority Tier</label>
              <select
                value={broadcastForm.priority}
                onChange={(e) => setBroadcastForm({ ...broadcastForm, priority: e.target.value })}
              >
                <option value="normal">Normal Announcement</option>
                <option value="high">High Priority Alert</option>
                <option value="urgent">Urgent Reminder</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" disabled={broadcastSending} style={{ alignSelf: 'flex-start' }}>
              <Send size={15} /> Dispatch Broadcast to All Students
            </button>
          </form>
        </div>
      )}

      {/* TAB 6: ACTIVITY LOGS AUDIT TRAIL */}
      {activeTab === 'activity' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>System Telemetry & Audit Logs</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Track all student registrations, session commits, shared notes, and group events</p>
            </div>

            <select
              value={logActionFilter}
              onChange={(e) => { setLogActionFilter(e.target.value); setLogPage(1); }}
              className="dept-select-box"
            >
              <option value="all">All Actions</option>
              <option value="NOTE_SHARED">NOTE_SHARED</option>
              <option value="STUDY_GROUP_CREATED">STUDY_GROUP_CREATED</option>
              <option value="CONNECTION_REQUEST_SENT">CONNECTION_REQUEST_SENT</option>
              <option value="ADMIN_BROADCAST_SENT">ADMIN_BROADCAST_SENT</option>
            </select>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px 8px' }}>User</th>
                  <th style={{ padding: '10px 8px' }}>Action</th>
                  <th style={{ padding: '10px 8px' }}>Metadata / Details</th>
                  <th style={{ padding: '10px 8px' }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 8px', fontWeight: 600 }}>{log.user?.name || 'System User'}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <span className="badge badge-medium">{log.action}</span>
                    </td>
                    <td style={{ padding: '12px 8px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      {JSON.stringify(log.details)}
                    </td>
                    <td style={{ padding: '12px 8px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={logPage}
            totalPages={logTotalPages}
            totalItems={logs.length}
            pageSize={20}
            onPageChange={setLogPage}
          />
        </div>
      )}

      {/* Create Assessment Modal */}
      <Modal isOpen={isAssessmentModalOpen} onClose={() => setIsAssessmentModalOpen(false)} title="Create New Assessment">
        <form onSubmit={handleCreateAssessment} className="create-group-form">
          <div className="form-field-group">
            <label>Title *</label>
            <input
              type="text"
              placeholder="e.g. DBMS Normalization Evaluation"
              value={assessmentForm.title}
              onChange={(e) => setAssessmentForm({ ...assessmentForm, title: e.target.value })}
              required
            />
          </div>

          <div className="form-field-group">
            <label>Subject Domain *</label>
            <select
              value={assessmentForm.subject}
              onChange={(e) => setAssessmentForm({ ...assessmentForm, subject: e.target.value })}
            >
              <option value="DBMS">DBMS</option>
              <option value="Java">Java</option>
              <option value="Placement">Placement</option>
              <option value="Blockchain">Blockchain</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-field-group">
              <label>Duration (Minutes)</label>
              <input
                type="number"
                value={assessmentForm.durationMinutes}
                onChange={(e) => setAssessmentForm({ ...assessmentForm, durationMinutes: Number(e.target.value) })}
              />
            </div>
            <div className="form-field-group">
              <label>Passing Score (%)</label>
              <input
                type="number"
                value={assessmentForm.passingScore}
                onChange={(e) => setAssessmentForm({ ...assessmentForm, passingScore: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="modal-actions-bar">
            <button type="button" className="btn btn-secondary" onClick={() => setIsAssessmentModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Publish Assessment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminDashboardPage;
