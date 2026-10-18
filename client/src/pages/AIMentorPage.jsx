import React, { useEffect, useState, useRef } from 'react';
import { Bot, Send, Sparkles, CheckCircle2, Calendar } from 'lucide-react';
import { useChatbot } from '../hooks/useChatbot.js';
import { useTasks } from '../hooks/useTasks.js';
import { useTranslation } from 'react-i18next';
import { chatAPI } from '../services/api.js';

const cleanMentorText = (text = '') => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/(?<!\*)\*(?!\*)(.*?)\*(?!\*)/g, '$1')
    .replace(/^#{1,6}\s?/gm, '')
    .trim();
};

const AIMentorPage = () => {
  const { messages, loading, fetchHistory, sendMessage, acceptTask } = useChatbot();
  const { fetchTasks } = useTasks();
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    sendMessage(input);
    setInput('');
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
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div style={{ marginBottom: '14px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{t('ai_mentor.title')}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Personalized Academic Mentor grounded in your curriculum, personal notes, and historical Learning DNA
        </p>
      </div>

      {/* Main Chat Conversation Container */}
      <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
        {/* Messages Scroll Area */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {messages.length === 0 && (
            <div style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', maxWidth: '80%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 700, marginBottom: '6px' }}>
                <Bot size={18} /> StudyFlow Personal Mentor
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.5, margin: 0 }}>
                Welcome to your personal mentorship space! I evaluate your syllabus progress, personal study notes, past sessions, and upcoming exams to provide adaptive guidance. How can I assist you today?
              </p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={msg._id || idx}
              style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '82%',
                padding: '14px 18px',
                borderRadius: 'var(--radius-md)',
                background: msg.role === 'user' ? 'var(--primary)' : 'var(--bg-card)',
                color: msg.role === 'user' ? '#ffffff' : 'var(--text-primary)',
                border: msg.role === 'user' ? 'none' : '1px solid var(--border-color)',
                fontSize: '0.9rem',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap'
              }}
            >
              <div>{cleanMentorText(msg.content)}</div>

              {/* Suggested Task Proposal */}
              {msg.suggestedTask && (
                <div style={{
                  marginTop: '12px',
                  padding: '12px',
                  background: 'rgba(99, 102, 241, 0.15)',
                  border: '1px dashed var(--primary)',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.925rem' }}>
                    📋 {msg.suggestedTask.title}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 10px 0' }}>
                    ⏱ {msg.suggestedTask.durationMinutes} mins • 🎯 Priority: {msg.suggestedTask.priority}
                  </div>

                  {msg.suggestedTask.status === 'accepted' ? (
                    <span className="badge badge-low">
                      <CheckCircle2 size={12} /> {t('ai_mentor.task_accepted')}
                    </span>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.8rem' }} onClick={() => handleAccept(msg._id)}>
                        {t('ai_mentor.accept_task')}
                      </button>
                      <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => sendMessage(`I want to adjust the task: ${msg.suggestedTask.title}`)}>
                        {t('ai_mentor.modify_task')}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Suggested Schedule Proposal */}
              {msg.suggestedSchedule && msg.suggestedSchedule.length > 0 && (
                <div style={{
                  marginTop: '12px',
                  padding: '14px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px dashed var(--accent-emerald)',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  <div style={{ fontWeight: 800, color: 'var(--accent-emerald)', fontSize: '0.925rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={16} /> Adaptive Schedule Proposal ({msg.suggestedSchedule.length} session blocks)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
                    {msg.suggestedSchedule.map((item, sIdx) => (
                      <div key={sIdx} style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                        • <strong>{item.scheduledTime || '18:00'}</strong>: {item.title} ({item.durationMinutes}m)
                      </div>
                    ))}
                  </div>

                  {msg.scheduleStatus === 'accepted' ? (
                    <span className="badge badge-low">
                      <CheckCircle2 size={12} /> Schedule Added to Calendar & Planner
                    </span>
                  ) : (
                    <button
                      className="btn btn-primary"
                      style={{ padding: '6px 14px', fontSize: '0.8rem', background: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)' }}
                      onClick={() => handleAcceptSchedule(msg._id)}
                    >
                      Accept Schedule & Add to Calendar
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ alignSelf: 'flex-start', padding: '12px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} className="animate-spin" color="var(--primary)" /> Mentor is analyzing your syllabus and notes...
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Quick Prompts Bar */}
        <div style={{ display: 'flex', gap: '8px', padding: '10px 18px', borderTop: '1px solid var(--border-color)', overflowX: 'auto', background: 'var(--bg-card)' }}>
          <button className="prompt-chip" onClick={() => sendMessage("What did I study yesterday?")}>
            🕒 Yesterday's Study
          </button>
          <button className="prompt-chip" onClick={() => sendMessage("What are my weak subjects?")}>
            🧩 Weak Subject Analysis
          </button>
          <button className="prompt-chip" onClick={() => sendMessage("Explain 2NF based on my notes")}>
            📘 Explain My Notes
          </button>
          <button className="prompt-chip" onClick={() => sendMessage("Create a schedule for tomorrow")}>
            📅 Schedule Tomorrow
          </button>
          <button className="prompt-chip" onClick={() => sendMessage("Create a sample exam for DBMS")}>
            📝 Practice Exam
          </button>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px', padding: '14px 18px', borderTop: '1px solid var(--border-color)' }}>
          <input
            type="text"
            placeholder={t('ai_mentor.input_placeholder')}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '10px 20px' }}>
            <Send size={16} /> {t('ai_mentor.send')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIMentorPage;
