import React, { useState } from 'react';
import {
  Sparkles,
  UserPlus,
  CheckCircle2,
  BookOpen,
  Clock,
  Award,
  ArrowLeft,
  GraduationCap,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStudyPartners } from '../hooks/useStudyPartners.js';
import './recommendations.css';

const Recommendations = () => {
  const { recommendations, sendRequest } = useStudyPartners();
  const [requestedMap, setRequestedMap] = useState({});
  const [actionNotice, setActionNotice] = useState('');

  const handleConnect = async (studentId, studentName) => {
    setRequestedMap(prev => ({ ...prev, [studentId]: 'loading' }));
    const res = await sendRequest(studentId);
    if (res.success) {
      setRequestedMap(prev => ({ ...prev, [studentId]: 'sent' }));
      setActionNotice(`Connection request dispatched to ${studentName}!`);
    } else {
      setRequestedMap(prev => ({ ...prev, [studentId]: 'error' }));
      setActionNotice(res.message);
    }
  };

  return (
    <div className="recommendations-page-container">
      {/* Top Header */}
      <div className="recommendations-header">
        <Link to="/connections" className="back-link">
          <ArrowLeft size={16} />
          <span>Back to Study Partners</span>
        </Link>

        <div className="title-banner">
          <div className="sparkle-badge">
            <Sparkles size={14} /> AI Recommendation Engine
          </div>
          <h1>Suggested Study Partners</h1>
          <p>
            StudyFlow matches you with peers based on shared subject curricula, daily study velocity, performance tier, and academic department.
          </p>
        </div>
      </div>

      {actionNotice && (
        <div className="action-notification-banner">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice('')} className="btn-close-banner">✕</button>
        </div>
      )}

      {/* Recommendations Cards Grid */}
      {recommendations.length === 0 ? (
        <div className="glass-card empty-rec-card">
          <Sparkles size={40} className="empty-sparkle-icon" />
          <h3>Analyzing Study Patterns...</h3>
          <p>No new peer recommendations at this moment. You are connected or all available students have pending requests.</p>
          <Link to="/connections" className="btn btn-primary" style={{ marginTop: '12px' }}>
            Go to Directory
          </Link>
        </div>
      ) : (
        <div className="recommendations-grid">
          {recommendations.map((student) => {
            const requestStatus = requestedMap[student._id];

            return (
              <div key={student._id} className="rec-card glass-card">
                {/* Score Pill */}
                <div className="rec-top-row">
                  <div className="match-score-pill">
                    <Zap size={13} className="text-amber" />
                    <span><strong>{student.matchScore}%</strong> Match</span>
                  </div>
                  <span className="rec-tier-badge">
                    {student.performanceLevel || 'Medium'} Tier
                  </span>
                </div>

                {/* Profile Header */}
                <div className="rec-profile-header">
                  <div className="rec-avatar-circle">
                    {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                  </div>
                  <div className="rec-profile-info">
                    <h3>{student.name}</h3>
                    <div className="rec-dept-text">
                      {student.department || 'Computer Science'} • {student.year || '3rd Year'}
                    </div>
                  </div>
                </div>

                {/* Recommendation Reasons Breakdown */}
                <div className="reasons-box">
                  <div className="reasons-header">
                    <ShieldCheck size={13} className="text-primary" />
                    <span>Why you are recommended together:</span>
                  </div>
                  <ul className="reasons-list">
                    {(student.reasons || []).map((reason, rIdx) => (
                      <li key={rIdx} className="reason-item">
                        <CheckCircle2 size={13} className="reason-check" />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Subject Interests Tags */}
                <div className="rec-subjects-section">
                  <div className="section-label">Target Curriculum:</div>
                  <div className="rec-tags-wrap">
                    {(student.interestedSubjects || ['DBMS', 'Java']).map((subj, idx) => (
                      <span key={idx} className="rec-subject-pill">{subj}</span>
                    ))}
                  </div>
                </div>

                {/* Study Pace Snapshot */}
                <div className="study-velocity-row">
                  <div className="velocity-metric">
                    <Clock size={13} className="text-muted" />
                    <span><strong>{student.studyHoursPerDay || 3}h</strong> / day pace</span>
                  </div>
                  <div className="velocity-metric">
                    <BookOpen size={13} className="text-muted" />
                    <span>Goal: <em>{student.studyGoals || 'Core Mastery'}</em></span>
                  </div>
                </div>

                {/* Connect Action */}
                <div className="rec-footer-action">
                  {requestStatus === 'sent' ? (
                    <button className="btn btn-secondary btn-block" disabled>
                      <CheckCircle2 size={15} color="#10b981" /> Request Sent
                    </button>
                  ) : requestStatus === 'loading' ? (
                    <button className="btn btn-primary btn-block" disabled>
                      Sending Request...
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary btn-block"
                      onClick={() => handleConnect(student._id, student.name)}
                    >
                      <UserPlus size={15} /> Connect as Study Partner
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Recommendations;
