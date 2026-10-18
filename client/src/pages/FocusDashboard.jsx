import React, { useState, useEffect } from 'react';
import {
  Timer,
  ShieldAlert,
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Activity,
  Flame,
  BookOpen,
  Award,
  Zap,
  ArrowRight
} from 'lucide-react';
import { useGlobalFocus } from '../context/FocusContext.jsx';
import { subjectAPI, studyAPI } from '../services/api.js';
import Modal from '../components/common/Modal.jsx';
import './focusDashboard.css';

const FocusDashboard = () => {
  const {
    isActive,
    isPaused,
    focusTime,
    distractionCount,
    studySessionTime,
    warningActive,
    lastDistractionReason,
    focusScore,
    formattedFocusTime,
    formattedTotalTime,
    startSession,
    pauseSession,
    resumeSession,
    stopSession,
    dismissWarning,
    resetSession
  } = useGlobalFocus();

  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [sessionCompletedNotice, setSessionCompletedNotice] = useState('');
  const [savingSession, setSavingSession] = useState(false);

  useEffect(() => {
    subjectAPI.getSubjects().then((res) => {
      setSubjects(res.data?.subjects || []);
      if (res.data?.subjects?.length > 0) {
        setSelectedSubject(res.data.subjects[0]._id);
      }
    }).catch((err) => console.error('Failed to load subjects for focus session', err));
  }, []);

  const handleFinishAndSaveSession = async () => {
    if (studySessionTime < 30) {
      if (!window.confirm('This study session was under 30 seconds. Do you want to stop without saving?')) {
        return;
      }
      stopSession();
      resetSession();
      return;
    }

    setSavingSession(true);
    try {
      const payload = {
        subject: selectedSubject || undefined,
        durationMinutes: Math.max(1, Math.round(studySessionTime / 60)),
        focusTime,
        studySessionTime,
        tabSwitchCount: distractionCount,
        distractionCount,
        focusScore,
        completionStatus: focusScore >= 70 ? 'completed' : 'interrupted'
      };

      await studyAPI.logSession(payload);
      setSessionCompletedNotice(`Great job! Logged ${Math.max(1, Math.round(studySessionTime / 60))} mins of study session with ${focusScore}% focus score.`);
      stopSession();
      resetSession();
    } catch (err) {
      console.error('Failed to log study session', err);
      alert('Failed to log session data to backend.');
    } finally {
      setSavingSession(false);
    }
  };

  const getScoreColor = () => {
    if (focusScore >= 80) return 'score-high';
    if (focusScore >= 60) return 'score-medium';
    return 'score-low';
  };

  return (
    <div className="focus-dashboard-container">
      {/* Header */}
      <div className="focus-header">
        <div>
          <h1 className="focus-title">
            <ShieldAlert size={28} className="text-primary" /> Study Focus & Distraction Warning System
          </h1>
          <p className="focus-subtitle">
            Monitors real-time screen presence, tab switches, and window minimize events to protect your deep study state.
          </p>
        </div>

        {isActive && (
          <div className="live-pulse-badge">
            <span className="live-dot" />
            <span>Active Focus Session Guard</span>
          </div>
        )}
      </div>

      {sessionCompletedNotice && (
        <div className="action-notification-banner">
          <span>{sessionCompletedNotice}</span>
          <button onClick={() => setSessionCompletedNotice('')} className="btn-close-banner">✕</button>
        </div>
      )}

      {/* Main Focus Control Grid */}
      <div className="focus-main-grid">
        {/* Left: Interactive Timer & Controller */}
        <div className="glass-card timer-card">
          <div className="subject-selection-bar">
            <label>Current Study Curriculum:</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              disabled={isActive}
            >
              <option value="">General Self-Study</option>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>{s.name} ({s.code || 'CORE'})</option>
              ))}
            </select>
          </div>

          <div className="timer-display-wrap">
            <div className={`timer-circle ${isActive ? (isPaused ? 'paused' : 'running') : 'idle'}`}>
              <div className="timer-time-text">{formattedFocusTime}</div>
              <div className="timer-label">ACTIVE FOCUS TIME</div>
            </div>
            <div className="total-elapsed-text">
              Total Session Duration: <strong>{formattedTotalTime}</strong>
            </div>
          </div>

          <div className="timer-controls-row">
            {!isActive ? (
              <button className="btn btn-primary btn-lg" onClick={startSession}>
                <Play size={18} /> Start Deep Focus Session
              </button>
            ) : (
              <>
                {isPaused ? (
                  <button className="btn btn-primary" onClick={resumeSession}>
                    <Play size={16} /> Resume Focus
                  </button>
                ) : (
                  <button className="btn btn-secondary" onClick={pauseSession}>
                    <Pause size={16} /> Pause Session
                  </button>
                )}

                <button
                  className="btn btn-emerald"
                  onClick={handleFinishAndSaveSession}
                  disabled={savingSession}
                >
                  <CheckCircle2 size={16} /> Finish & Save Session
                </button>

                <button className="btn btn-secondary" onClick={resetSession} title="Reset timer">
                  <RotateCcw size={15} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right: Live Telemetry & Metrics */}
        <div className="telemetry-cards-column">
          {/* Focus Score Card */}
          <div className="glass-card telemetry-card">
            <div className="telemetry-card-top">
              <span className="telemetry-label">LIVE FOCUS SCORE</span>
              <Zap size={16} className="text-amber" />
            </div>
            <div className={`telemetry-score-val ${getScoreColor()}`}>
              {focusScore}%
            </div>
            <p className="telemetry-desc">
              {focusScore >= 80
                ? '🌟 Elite attention span! High retention state maintained.'
                : focusScore >= 60
                  ? '⚡ Moderate focus. Minimize tab switching to improve retention.'
                  : '⚠️ Frequent context switching detected. Refocus your attention!'}
            </p>
          </div>

          {/* Distractions Detected Card */}
          <div className="glass-card telemetry-card">
            <div className="telemetry-card-top">
              <span className="telemetry-label">DISTRACTIONS DETECTED</span>
              <AlertTriangle size={16} className="text-rose" />
            </div>
            <div className="telemetry-stat-val text-rose">
              {distractionCount}
            </div>
            <p className="telemetry-desc">
              Tab switches, browser minimizes, and window blur events captured via <code>visibilitychange</code>.
            </p>
          </div>

          {/* Focus Guard System Status */}
          <div className="glass-card telemetry-card">
            <div className="telemetry-card-top">
              <span className="telemetry-label">FOCUS GUARD STATUS</span>
              <Eye size={16} className="text-cyan" />
            </div>
            <div className="guard-status-list">
              <div className="guard-status-item">
                <CheckCircle2 size={13} className="text-emerald" />
                <span><code>window.onbeforeunload</code> active</span>
              </div>
              <div className="guard-status-item">
                <CheckCircle2 size={13} className="text-emerald" />
                <span><code>document.visibilitychange</code> tracking</span>
              </div>
              <div className="guard-status-item">
                <CheckCircle2 size={13} className="text-emerald" />
                <span>Zero background drift enabled</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Focus Warning Popup Modal */}
      {warningActive && (
        <div className="focus-warning-overlay">
          <div className="focus-warning-modal glass-card">
            <div className="warning-icon-wrap">
              <AlertTriangle size={48} className="warning-animated-icon" />
            </div>

            <h2 className="warning-title">⚠️ Hey! You are currently studying.</h2>
            <p className="warning-subtitle">
              Do you really want to leave? Your focus score dropped due to:
            </p>

            <div className="warning-reason-badge">
              "{lastDistractionReason || 'Tab switch or window minimized'}"
            </div>

            <div className="warning-quote">
              "Deep work requires uninterrupted attention. Return to your notes and finish strong!"
            </div>

            <button
              className="btn btn-primary btn-lg btn-stay-focused"
              onClick={dismissWarning}
            >
              Stay Focused 📚
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FocusDashboard;
