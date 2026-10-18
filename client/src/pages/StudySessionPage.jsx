import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Play,
  Pause,
  RotateCcw,
  CheckSquare,
  Sparkles,
  BookOpen,
  Maximize2,
  AlertTriangle,
  Eye,
  ShieldAlert
} from 'lucide-react';
import { useStudyTimer } from '../hooks/useStudyTimer.js';
import { studyAPI, quizAPI, subjectAPI, recentlyAccessedAPI } from '../services/api.js';
import { useTranslation } from 'react-i18next';
import Modal from '../components/common/Modal.jsx';

const StudySessionPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { timerRunning, formattedTime, start, pauseResume, reset, finish } = useStudyTimer();

  const [topicName, setTopicName] = useState(location.state?.actionTitle || '');
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [notes, setNotes] = useState('');
  const [isReflectionModalOpen, setIsReflectionModalOpen] = useState(false);
  const [learnedContent, setLearnedContent] = useState('');
  const [difficulties, setDifficulties] = useState('');
  const [confidence, setConfidence] = useState(4);

  // Distraction Detection State
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [distractionWarning, setDistractionWarning] = useState(false);
  const [focusScore, setFocusScore] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fake Understanding Diagnostic State
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [diagnosticQuiz, setDiagnosticQuiz] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [diagnosisResult, setDiagnosisResult] = useState(null);

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const res = await subjectAPI.getSubjects();
        setSubjects(res.data?.subjects || []);
        if (!topicName) {
          if (res.data?.subjects?.length > 0) {
            setTopicName(`${res.data.subjects[0].name} — Core Concepts`);
            setSelectedSubject(res.data.subjects[0]._id);
          } else {
            setTopicName('Focused Study Session');
          }
        }
      } catch (err) {
        console.error('Failed to load subjects', err);
      }
    };
    loadSubjects();
  }, []);

  // Distraction Detection Effect (Visibility Change & Tab Switch)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && timerRunning) {
        setTabSwitchCount(prev => {
          const next = prev + 1;
          setFocusScore(Math.max(40, 100 - next * 8));
          return next;
        });
        setDistractionWarning(true);
      }
    };

    const handleWindowBlur = () => {
      if (timerRunning) {
        setDistractionWarning(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [timerRunning]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleEndSession = () => {
    if (timerRunning) {
      pauseResume();
    }
    setIsReflectionModalOpen(true);
  };

  const handleSaveReflection = async () => {
    await studyAPI.logSession({
      durationMinutes: 25,
      notes,
      learnedContent,
      difficulties,
      confidenceRating: confidence,
      tabSwitchCount,
      distractionCount: tabSwitchCount,
      focusScore,
      activeStudyTimeMinutes: 25,
      completionStatus: 'completed'
    });

    // Auto generate study summary in background
    await studyAPI.createSummary({
      topic: topicName,
      notes: `${learnedContent} Difficulties: ${difficulties}`
    });

    recentlyAccessedAPI.recordAccess({
      resourceType: 'session',
      title: topicName ? `Study: ${topicName}` : 'Focus Study Session',
      subtitle: `Focus Score: ${focusScore}% • 25 mins`,
      path: '/session'
    }).catch(() => {});

    setIsReflectionModalOpen(false);

    // Launch Fake Understanding Quiz
    try {
      const quizRes = await quizAPI.generateQuiz({ topicName });
      if (quizRes.data?.quiz) {
        setDiagnosticQuiz(quizRes.data.quiz);
        setIsQuizModalOpen(true);
      } else {
        finish();
        navigate('/summaries');
      }
    } catch {
      finish();
      navigate('/summaries');
    }
  };

  const handleSubmitQuiz = async () => {
    if (!diagnosticQuiz) return;
    const answersArray = diagnosticQuiz.questions.map((_, i) => selectedAnswers[i] ?? 0);
    const res = await quizAPI.submitAttempt({
      quizId: diagnosticQuiz._id,
      answers: answersArray,
      timeSpentSeconds: 90
    });

    setDiagnosisResult(res.data.diagnosis);
  };

  const handleFinishDiagnostic = () => {
    setIsQuizModalOpen(false);
    finish();
    navigate('/summaries');
  };

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Session Title & Topic */}
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>{t('session.title')}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Distraction-aware study mode with empirical cognitive stamina tracking
        </p>
      </div>

      {/* Distraction Warning Banner */}
      {distractionWarning && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.15)',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          color: '#f59e0b',
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
            <AlertTriangle size={20} />
            <span><strong>⚠️ Focus Mode interrupted:</strong> Tab switch detected ({tabSwitchCount} time(s)). Please return to your study session to preserve your Focus Score!</span>
          </div>
          <button
            onClick={() => setDistractionWarning(false)}
            className="btn btn-secondary"
            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
          >
            Acknowledge
          </button>
        </div>
      )}

      {/* Big Focus Countdown Timer Card */}
      <div className="glass-card" style={{ textAlign: 'center', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', position: 'relative' }}>
        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          className="btn btn-secondary"
          style={{ position: 'absolute', top: '16px', right: '16px', padding: '6px 12px', fontSize: '0.8rem' }}
          title="Toggle Fullscreen Focus"
        >
          <Maximize2 size={14} /> {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        </button>

        {/* Topic Input / Display */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', maxWidth: '500px', width: '100%' }}>
          <BookOpen size={18} color="var(--primary)" />
          <input
            type="text"
            value={topicName}
            onChange={(e) => setTopicName(e.target.value)}
            placeholder="Enter or select topic..."
            style={{ flex: 1, textAlign: 'center', fontWeight: 700, fontSize: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-full)' }}
          />
        </div>

        {/* Focus Timer Display */}
        <div style={{
          fontSize: '5.5rem',
          fontWeight: 900,
          letterSpacing: '4px',
          fontVariantNumeric: 'tabular-nums',
          color: timerRunning ? 'var(--accent-emerald)' : 'var(--text-primary)',
          transition: 'color 0.3s ease'
        }}>
          {formattedTime}
        </div>

        {/* Distraction Telemetry Badges */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <div className="badge badge-low" style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
            🎯 Focus Score: <strong>{focusScore}%</strong>
          </div>
          <div className="badge badge-medium" style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
            👀 Tab Switches: <strong>{tabSwitchCount}</strong>
          </div>
          <div className="badge badge-high" style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
            ⚡ Mode: <strong>Deep Work</strong>
          </div>
        </div>

        {/* Timer Control Buttons */}
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <button
            className={`btn ${timerRunning ? 'btn-secondary' : 'btn-primary'}`}
            style={{ padding: '14px 28px', fontSize: '1.1rem' }}
            onClick={timerRunning ? pauseResume : start}
          >
            {timerRunning ? <><Pause size={20} /> {t('session.pause')}</> : <><Play size={20} /> {t('session.start')}</>}
          </button>

          <button className="btn btn-secondary" onClick={reset} style={{ padding: '14px 20px' }} title="Reset timer">
            <RotateCcw size={18} />
          </button>

          <button className="btn btn-primary" onClick={handleEndSession} style={{ padding: '14px 24px', background: 'var(--accent-purple)', borderColor: 'var(--accent-purple)' }}>
            <CheckSquare size={18} /> {t('session.end_session')}
          </button>
        </div>

        <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: 0 }}>
          💡 Educational resources (Google, documentation, coding platforms) remain fully accessible. Distraction detection records window blur to calculate focus stamina.
        </p>
      </div>

      {/* Quick Scratchpad Notes Area */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '10px' }}>{t('session.scratchpad_notes')}</h3>
        <textarea
          rows={5}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('session.notes_placeholder')}
          style={{ width: '100%', resize: 'vertical' }}
        />
      </div>

      {/* Post-Session Reflection Modal */}
      <Modal isOpen={isReflectionModalOpen} onClose={() => setIsReflectionModalOpen(false)} title={t('session.post_session_title')}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Taking 2 minutes to summarize what you studied reinforces neural connections and updates your Learning DNA.
          </p>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>What key concepts did you master today?</label>
            <textarea
              rows={3}
              value={learnedContent}
              onChange={(e) => setLearnedContent(e.target.value)}
              placeholder="e.g. Invariant states, recursion tree traversal, boundary conditions..."
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>What parts felt challenging or ambiguous?</label>
            <textarea
              rows={2}
              value={difficulties}
              onChange={(e) => setDifficulties(e.target.value)}
              placeholder="e.g. Edge cases when balancing search trees..."
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Confidence Rating (1 to 5)</label>
            <input
              type="range"
              min="1"
              max="5"
              value={confidence}
              onChange={(e) => setConfidence(Number(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ textAlign: 'center', fontWeight: 700, color: 'var(--primary)' }}>{confidence} / 5</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button className="btn btn-secondary" onClick={() => setIsReflectionModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSaveReflection}>
              <Sparkles size={16} /> Save & Verify Understanding
            </button>
          </div>
        </div>
      </Modal>

      {/* Diagnostic Fake Understanding Quiz Modal */}
      <Modal isOpen={isQuizModalOpen} onClose={handleFinishDiagnostic} title="Fake Understanding Diagnostic Check">
        {diagnosticQuiz && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Answer these quick diagnostic questions to distinguish between surface recognition and problem-solving application.
            </p>

            {diagnosticQuiz.questions.map((q, idx) => (
              <div key={idx} style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '8px' }}>
                  {idx + 1}. {q.questionText}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {q.options.map((opt, oIdx) => (
                    <label key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name={`diagnostic_q_${idx}`}
                        checked={selectedAnswers[idx] === oIdx}
                        onChange={() => setSelectedAnswers({ ...selectedAnswers, [idx]: oIdx })}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            ))}

            {diagnosisResult && (
              <div style={{
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                background: diagnosisResult.diagnosis === 'deep_understanding' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                border: `1px solid ${diagnosisResult.diagnosis === 'deep_understanding' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`
              }}>
                <div style={{ fontWeight: 800, marginBottom: '4px' }}>
                  {diagnosisResult.diagnosis === 'deep_understanding' ? '✅ Deep Understanding Confirmed!' : '⚠️ Surface Understanding Detected'}
                </div>
                <p style={{ fontSize: '0.85rem', margin: '0 0 6px 0' }}>{diagnosisResult.alert}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>{diagnosisResult.recommendation}</p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              {!diagnosisResult ? (
                <button className="btn btn-primary" onClick={handleSubmitQuiz}>Submit Diagnostic</button>
              ) : (
                <button className="btn btn-primary" onClick={handleFinishDiagnostic}>Complete & View Summaries</button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StudySessionPage;
