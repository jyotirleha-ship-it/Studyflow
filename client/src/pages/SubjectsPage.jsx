import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Sparkles, Target, ArrowRight } from 'lucide-react';
import { subjectAPI, recentlyAccessedAPI } from '../services/api.js';
import { useTranslation } from 'react-i18next';
import Modal from '../components/common/Modal.jsx';

const SubjectsPage = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [priority, setPriority] = useState('medium');
  const { t } = useTranslation();

  const handleSubjectClick = (sub) => {
    recentlyAccessedAPI.recordAccess({
      resourceType: 'subject',
      resourceId: sub._id,
      title: sub.name,
      subtitle: `${sub.code || 'Course'} • ${sub.priority || 'medium'} priority`,
      path: `/topics?subject=${sub._id}`
    }).catch(() => {});
    navigate(`/topics?subject=${sub._id}`);
  };

  const loadSubjects = async () => {
    try {
      const res = await subjectAPI.getSubjects();
      setSubjects(res.data.subjects || []);
    } catch (err) {
      console.error('Failed to load subjects', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    await subjectAPI.createSubject({
      name,
      code,
      color,
      priority
    });

    setIsModalOpen(false);
    setName('');
    setCode('');
    loadSubjects();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{t('subjects.title')}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t('subjects.subtitle')}</p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> {t('subjects.add_subject')}
        </button>
      </div>

      {/* Empty State */}
      {!loading && subjects.length === 0 && (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', color: 'var(--primary)' }}>
            <BookOpen size={32} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>No subjects yet.</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 20px auto', fontSize: '0.9rem' }}>
            Create your first subject to begin structuring your curriculum, topics, and personal notes.
          </p>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Add Subject
          </button>
        </div>
      )}

      {/* Subject Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        {subjects.map((sub) => (
          <div
            key={sub._id}
            onClick={() => handleSubjectClick(sub)}
            className="glass-card interactive-card"
            style={{
              borderTop: `4px solid ${sub.color || '#6366f1'}`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  {sub.code || 'COURSE'}
                </span>
                <span className={`badge badge-${sub.priority || 'medium'}`}>
                  {sub.priority} priority
                </span>
              </div>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px' }}>
                {sub.name}
              </h3>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '18px' }}>
                {sub.totalTopics || 0} Syllabus Topics Registered
              </p>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                <span>{t('subjects.progress')}</span>
                <span>{sub.progress || 0}%</span>
              </div>

              <div style={{
                height: '8px',
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-full)',
                overflow: 'hidden',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{
                  height: '100%',
                  width: `${sub.progress || 0}%`,
                  background: sub.color || 'var(--primary)',
                  borderRadius: 'var(--radius-full)',
                  transition: 'width 0.4s ease'
                }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Subject Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Subject / Course">
        <form onSubmit={handleCreateSubject} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '6px' }}>Subject Name</label>
            <input
              type="text"
              style={{ width: '100%' }}
              placeholder="e.g. Distributed Computing & Cloud"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '6px' }}>Course Code</label>
              <input
                type="text"
                style={{ width: '100%' }}
                placeholder="e.g. CS402"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '6px' }}>Priority</label>
              <select
                style={{ width: '100%' }}
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '6px' }}>Theme Color</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899'].map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: c,
                    border: color === c ? '3px solid #ffffff' : 'none'
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Subject
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SubjectsPage;
