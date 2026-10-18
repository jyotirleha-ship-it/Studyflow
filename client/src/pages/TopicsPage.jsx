import React, { useEffect, useState } from 'react';
import { GitFork, AlertTriangle, Plus, CheckCircle2, HelpCircle } from 'lucide-react';
import { subjectAPI } from '../services/api.js';
import { useTranslation } from 'react-i18next';
import Modal from '../components/common/Modal.jsx';

const TopicsPage = () => {
  const [topics, setTopics] = useState([]);
  const [prerequisites, setPrerequisites] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [duration, setDuration] = useState(45);
  const { t } = useTranslation();

  const loadData = async () => {
    try {
      const res = await subjectAPI.getTopics();
      setTopics(res.data.topics || []);
      setPrerequisites(res.data.prerequisites || []);

      const subRes = await subjectAPI.getSubjects();
      setSubjects(subRes.data.subjects || []);
      if (subRes.data.subjects?.length > 0) {
        setSelectedSubject(subRes.data.subjects[0]._id);
      }
    } catch (err) {
      console.error('Failed to load topics', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    if (!name.trim() || !selectedSubject) return;

    await subjectAPI.createTopic({
      name,
      subject: selectedSubject,
      difficulty,
      estimatedMinutes: Number(duration),
      masteryScore: 45
    });

    setIsModalOpen(false);
    setName('');
    loadData();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{t('topics.title')}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t('topics.subtitle')}</p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> {t('topics.add_topic')}
        </button>
      </div>

      {/* Prerequisite Dependency Graph Card */}
      <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-purple)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <GitFork size={22} color="var(--accent-purple)" />
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{t('topics.prereq_graph')}</h2>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Visual mapping of foundational concepts. If an upstream prerequisite is weak, downstream mastery suffers.
        </p>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          padding: '18px',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          overflowX: 'auto'
        }}>
          <div style={{ padding: '12px 18px', borderRadius: 'var(--radius-sm)', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid var(--accent-amber)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-amber)', fontWeight: 700 }}>PREREQUISITE</div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>Recursion & Call Stack</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>Mastery: 48% (Gap!)</div>
          </div>

          <div style={{ fontSize: '1.5rem', color: 'var(--primary)', fontWeight: 800 }}>➔</div>

          <div style={{ padding: '12px 18px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>TARGET TOPIC</div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>Binary Search Trees</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>Mastery: 61%</div>
          </div>

          <div style={{ fontSize: '1.5rem', color: 'var(--primary)', fontWeight: 800 }}>➔</div>

          <div style={{ padding: '12px 18px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-card)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>ADVANCED</div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>Graph Traversal & Cycles</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>Status: Not Started</div>
          </div>
        </div>
      </div>

      {/* Topics Mastery Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {topics.map((tItem) => (
          <div key={tItem._id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {tItem.subject?.name || 'General'}
                </span>
                <span className={`badge badge-${tItem.difficulty}`}>
                  {tItem.difficulty}
                </span>
              </div>

              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px' }}>
                {tItem.name}
              </h3>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                Estimated Study: {tItem.estimatedMinutes} mins • Status: {tItem.status}
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                <span>{t('topics.mastery')}</span>
                <span style={{ color: tItem.masteryScore > 70 ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
                  {tItem.masteryScore}%
                </span>
              </div>

              <div style={{ height: '6px', background: 'var(--bg-card)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${tItem.masteryScore}%`,
                  background: tItem.masteryScore > 70 ? 'var(--accent-emerald)' : 'var(--accent-amber)'
                }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Topic Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register Syllabus Topic">
        <form onSubmit={handleCreateTopic} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '6px' }}>Topic Title</label>
            <input
              type="text"
              style={{ width: '100%' }}
              placeholder="e.g. B-Trees & Indexing Mechanics"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '6px' }}>Difficulty</label>
              <select
                style={{ width: '100%' }}
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '6px' }}>Duration (Mins)</label>
              <input
                type="number"
                style={{ width: '100%' }}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Topic
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TopicsPage;
