import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, CheckCircle2, Sparkles, Calendar } from 'lucide-react';
import { useChatbot } from '../../hooks/useChatbot.js';
import { useTasks } from '../../hooks/useTasks.js';
import { useTranslation } from 'react-i18next';
import { chatAPI } from '../../services/api.js';
import './floatingMentor.css';

const cleanMentorText = (text = '') => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/(?<!\*)\*(?!\*)(.*?)\*(?!\*)/g, '$1')
    .replace(/^#{1,6}\s?/gm, '')
    .trim();
};

const FloatingMentor = () => {
  const { messages, isOpen, loading, fetchHistory, sendMessage, acceptTask, toggleOpen } = useChatbot();
  const { fetchTasks } = useTasks();
  const { t } = useTranslation();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim() || loading) return;
    sendMessage(inputText);
    setInputText('');
  };

  const handleQuickPrompt = (prompt) => {
    sendMessage(prompt);
  };

  const handleAccept = async (messageId) => {
    const res = await acceptTask(messageId);
    if (res.success) {
      fetchTasks();
    }
  };

  const handleAcceptSchedule = async (messageId) => {
    try {
      const res = await chatAPI.acceptSchedule(messageId);
      if (res.data?.success) {
        fetchTasks();
        fetchHistory();
      }
    } catch (err) {
      console.error('Failed to accept schedule', err);
    }
  };

  return (
    <div className="floating-mentor-wrapper">
      {isOpen && (
        <div className="mentor-chat-window">
          <div className="mentor-header">
            <div className="mentor-header-info">
              <div className="mentor-avatar-badge">
                <Bot size={18} />
              </div>
              <div>
                <h4>{t('ai_mentor.title')}</h4>
                <span>● Online & Grounded in your Data</span>
              </div>
            </div>
            <button className="btn-secondary" style={{ padding: '4px', borderRadius: '50%' }} onClick={toggleOpen}>
              <X size={16} />
            </button>
          </div>

          <div className="mentor-messages">
            {messages.length === 0 && (
              <div className="mentor-bubble assistant">
                Hello! I am your <strong>StudyFlow Academic Mentor</strong>. I monitor your study sessions, personal notes, prerequisites, and exams. How can I guide your preparation today?
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={msg._id || i} className={`mentor-bubble ${msg.role}`}>
                <div>{cleanMentorText(msg.content)}</div>

                {msg.suggestedTask && (
                  <div className="task-proposal-card">
                    <h5>📋 {msg.suggestedTask.title}</h5>
                    <p>
                      ⏱ {msg.suggestedTask.durationMinutes} mins | 🎯 Priority: {msg.suggestedTask.priority}
                    </p>
                    {msg.suggestedTask.status === 'accepted' ? (
                      <span className="badge badge-low" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={12} /> Task Added to Schedule
                      </span>
                    ) : (
                      <div className="task-proposal-actions">
                        <button
                          className="btn-primary"
                          onClick={() => handleAccept(msg._id)}
                        >
                          Accept Task
                        </button>
                        <button
                          className="btn-secondary"
                          onClick={() => sendMessage(`I want to modify the task "${msg.suggestedTask.title}"`)}
                        >
                          Modify
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {msg.suggestedSchedule && msg.suggestedSchedule.length > 0 && (
                  <div className="task-proposal-card" style={{ borderLeftColor: 'var(--accent-emerald)' }}>
                    <h5>📅 Adaptive Schedule ({msg.suggestedSchedule.length} blocks)</h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', margin: '6px 0' }}>
                      {msg.suggestedSchedule.map((item, sIdx) => (
                        <div key={sIdx} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          • <strong>{item.scheduledTime || '18:00'}</strong>: {item.title} ({item.durationMinutes}m)
                        </div>
                      ))}
                    </div>
                    {msg.scheduleStatus === 'accepted' ? (
                      <span className="badge badge-low" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={12} /> Schedule Added
                      </span>
                    ) : (
                      <button
                        className="btn-primary"
                        style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)' }}
                        onClick={() => handleAcceptSchedule(msg._id)}
                      >
                        Accept Schedule
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="mentor-bubble assistant">
                <Sparkles size={14} className="animate-spin" /> Analyzing your study context...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="mentor-quick-prompts">
            <button className="prompt-chip" onClick={() => handleQuickPrompt("What did I study yesterday?")}>
              🕒 Yesterday's Study
            </button>
            <button className="prompt-chip" onClick={() => handleQuickPrompt("What are my weak subjects?")}>
              🧩 Weak Subjects
            </button>
            <button className="prompt-chip" onClick={() => handleQuickPrompt("Explain 2NF based on my notes")}>
              📘 My Notes
            </button>
            <button className="prompt-chip" onClick={() => handleQuickPrompt("Create a schedule for tomorrow")}>
              📅 Schedule
            </button>
          </div>

          <form className="mentor-input-bar" onSubmit={handleSend}>
            <input
              type="text"
              placeholder={t('ai_mentor.input_placeholder')}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '8px 12px' }}>
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default FloatingMentor;
