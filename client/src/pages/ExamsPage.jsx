import React, { useEffect, useState } from 'react';
import { GraduationCap, ShieldAlert, Plus, Calendar, AlertTriangle } from 'lucide-react';
import { examAPI, subjectAPI, recentlyAccessedAPI } from '../services/api.js';
import { useTranslation } from 'react-i18next';
import Modal from '../components/common/Modal.jsx';

const ExamsPage = () => {
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [examDate, setExamDate] = useState('');
  const [examTime, setExamTime] = useState('09:30');
  const [targetScore, setTargetScore] = useState(85);
  const { t } = useTranslation();

  const loadData = async () => {
    try {
      const res = await examAPI.getExams();
      setExams(res.data.exams || []);

      const subRes = await subjectAPI.getSubjects();
      setSubjects(subRes.data.subjects || []);
      if (subRes.data.subjects?.length > 0) {
        setSelectedSubject(subRes.data.subjects[0]._id);
      }
    } catch (err) {
      console.error('Failed to load exams', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateExam = async (e) => {
    e.preventDefault();
    if (!title.trim() || !selectedSubject || !examDate) return;

    const res = await examAPI.createExam({
      title,
      subject: selectedSubject,
      examDate,
      examTime,
      targetScore: Number(targetScore)
    });

    recentlyAccessedAPI.recordAccess({
      resourceType: 'exam',
      resourceId: res.data?.exam?._id,
      title: title,
      subtitle: `Target: ${targetScore}% • ${new Date(examDate).toLocaleDateString()}`,
      path: '/exams'
    }).catch(() => {});

    setIsModalOpen(false);
    setTitle('');
    loadData();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{t('exams.title')}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t('exams.subtitle')}</p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> {t('exams.add_exam')}
        </button>
      </div>

      {/* Empty State */}
      {exams.length === 0 && (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', color: 'var(--primary)' }}>
            <GraduationCap size={32} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>No exams scheduled.</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 20px auto', fontSize: '0.9rem' }}>
            Add your upcoming semester exams, tests, or quizzes. The Adaptive AI Study Mentor will calculate deadline risk and adjust your study timetable.
          </p>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Schedule Exam
          </button>
        </div>
      )}

      {/* Exams Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
        {exams.map((exam) => {
          const isHighRisk = exam.riskLevel === 'high';
          const isMediumRisk = exam.riskLevel === 'medium';
          const badgeClass = isHighRisk ? 'badge-urgent' : isMediumRisk ? 'badge-high' : 'badge-low';

          return (
            <div key={exam._id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {exam.subject?.name || 'General Subject'}
                  </span>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '2px' }}>
                    {exam.title}
                  </h3>
                </div>

                <span className={`badge ${badgeClass}`}>
                  {exam.riskLevel || 'low'} risk ({exam.riskScore || 25}%)
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <Calendar size={16} />
                <span>
                  {new Date(exam.examDate).toLocaleDateString()} at {exam.examTime} (<strong>{exam.daysLeft || 5} days left</strong>)
                </span>
              </div>

              {/* Contributing factors */}
              {exam.factors && exam.factors.length > 0 && (
                <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
                    {t('exams.risk_factors')}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {exam.factors.map((f, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                        <span>{f.name}</span>
                        <strong style={{ color: f.status === 'urgent' ? 'var(--accent-rose)' : f.status === 'warning' ? 'var(--accent-amber)' : 'var(--accent-emerald)' }}>
                          {f.value}
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Exam Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register Upcoming Examination">
        <form onSubmit={handleCreateExam} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '6px' }}>Exam Title</label>
            <input
              type="text"
              style={{ width: '100%' }}
              placeholder="e.g. Operating Systems End-Semester Final"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '6px' }}>Subject</label>
            <select
              style={{ width: '100%' }}
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              required
            >
              {subjects.map(s => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '6px' }}>Exam Date</label>
              <input
                type="date"
                style={{ width: '100%' }}
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '6px' }}>Exam Time</label>
              <input
                type="time"
                style={{ width: '100%' }}
                value={examTime}
                onChange={(e) => setExamTime(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Exam
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ExamsPage;
