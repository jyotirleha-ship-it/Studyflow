import React, { useState } from 'react';
import { Sparkles, MessageSquare, X, ChevronRight, Award, Target, Flame } from 'lucide-react';
import { useMentorRobot } from '../../hooks/useMentorRobot.js';
import { useChatbot } from '../../hooks/useChatbot.js';
import './mentorRobot.css';

const MentorRobot = () => {
  const { toggleOpen: toggleChatOpen, isOpen: isChatOpen } = useChatbot();
  const {
    isBubbleOpen,
    robotMood,
    studentName,
    todayTarget,
    currentSpeech,
    toggleBubble,
    nextMessage,
    setIsBubbleOpen
  } = useMentorRobot();

  const [isWaving, setIsWaving] = useState(false);

  // If full chat drawer is open, hide robot speech bubble
  if (isChatOpen) return null;

  const handleRobotClick = () => {
    setIsWaving(true);
    setTimeout(() => setIsWaving(false), 1200);
    toggleBubble();
  };

  return (
    <aside className="mentor-robot-container" aria-label="AI Study Mentor Companion">
      {/* Interactive Speech Bubble */}
      {isBubbleOpen && (
        <div className="robot-speech-bubble" role="dialog" aria-label="Mentor message">
          <button
            className="speech-close-btn"
            onClick={() => setIsBubbleOpen(false)}
            aria-label="Dismiss message bubble"
          >
            <X size={13} />
          </button>

          <div className="speech-header">
            <span className="speech-tag">
              <Sparkles size={12} className="sparkle-icon" /> Academic Companion
            </span>
          </div>

          <div className="speech-title">{currentSpeech.title}</div>

          <div className="speech-body">
            {currentSpeech.type === 'target' ? (
              <div className="target-checklist">
                <div className="target-item">
                  <Target size={14} className="target-icon text-cyan" />
                  <span><strong>{todayTarget.subjects}</strong> Subjects Mastery</span>
                </div>
                <div className="target-item">
                  <Award size={14} className="target-icon text-purple" />
                  <span><strong>{todayTarget.quizzes}</strong> Quick Assessment</span>
                </div>
                <div className="target-item">
                  <Flame size={14} className="target-icon text-amber" />
                  <span><strong>{todayTarget.revisionMinutes}</strong> Mins Active Recall</span>
                </div>
              </div>
            ) : (
              <p className="motivation-quote">{currentSpeech.content}</p>
            )}
          </div>

          <div className="speech-actions">
            <button className="speech-action-btn secondary" onClick={toggleChatOpen} title="Open full tutor conversation">
              <MessageSquare size={13} />
              <span>Ask Doubt</span>
            </button>
            <button className="speech-action-btn" onClick={nextMessage}>
              <span>{currentSpeech.actionText}</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Speech bubble pointy arrow */}
          <div className="speech-arrow" />
        </div>
      )}

      {/* Cute Floating Animated Robot */}
      <div
        className={`cute-robot-wrapper ${isWaving ? 'waving' : ''} mood-${robotMood}`}
        onClick={handleRobotClick}
        title="StudyFlow AI Mentor Companion — Click to chat!"
        role="button"
        tabIndex={0}
      >
        <div className="robot-pulse-aura" />

        {/* SVG Robot Character */}
        <div className="robot-avatar-svg">
          <svg
            viewBox="0 0 100 110"
            width="64"
            height="70"
            className="robot-svg"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Antenna */}
            <line x1="50" y1="22" x2="50" y2="8" stroke="#818cf8" strokeWidth="3" strokeLinecap="round" />
            <circle cx="50" cy="7" r="5" fill="#38bdf8" className="antenna-glow" />

            {/* Left Ear / Audio Sensor */}
            <rect x="18" y="28" width="6" height="14" rx="3" fill="#6366f1" />
            {/* Right Ear / Audio Sensor */}
            <rect x="76" y="28" width="6" height="14" rx="3" fill="#6366f1" />

            {/* Robot Head */}
            <rect x="22" y="18" width="56" height="38" rx="12" fill="#1e1b4b" stroke="#818cf8" strokeWidth="2.5" />

            {/* Screen Face */}
            <rect x="28" y="24" width="44" height="26" rx="8" fill="#0f172a" />

            {/* Left Eye */}
            <circle cx="40" cy="36" r="4.5" fill="#38bdf8" className="robot-eye" />
            {/* Right Eye */}
            <circle cx="60" cy="36" r="4.5" fill="#38bdf8" className="robot-eye" />

            {/* Smile / Mouth */}
            <path
              d="M 44 43 Q 50 48 56 43"
              stroke="#38bdf8"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              className="robot-smile"
            />

            {/* Cute Cheek Blushes */}
            <circle cx="34" cy="42" r="2.5" fill="rgba(244, 63, 94, 0.6)" />
            <circle cx="66" cy="42" r="2.5" fill="rgba(244, 63, 94, 0.6)" />

            {/* Neck */}
            <rect x="44" y="56" width="12" height="6" rx="2" fill="#4f46e5" />

            {/* Body */}
            <rect x="26" y="62" width="48" height="34" rx="10" fill="#1e1b4b" stroke="#818cf8" strokeWidth="2" />

            {/* Chest Core Indicator */}
            <circle cx="50" cy="76" r="6" fill="#10b981" className="robot-core-pulse" />

            {/* Left Arm */}
            <path
              d="M 26 70 Q 14 78 18 88"
              stroke="#818cf8"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
              className="left-arm"
            />

            {/* Right Arm (Waving) */}
            <path
              d="M 74 70 Q 86 65 84 56"
              stroke="#818cf8"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
              className="right-arm"
            />
          </svg>
        </div>

        {/* Floating companion status badge */}
        <div className="robot-status-dot" />
      </div>
    </aside>
  );
};

export default MentorRobot;
