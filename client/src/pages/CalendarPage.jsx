import React, { useEffect, useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Trash2
} from 'lucide-react';
import { useCalendar } from '../hooks/useCalendar.js';
import { useTranslation } from 'react-i18next';
import Modal from '../components/common/Modal.jsx';

const CalendarPage = () => {
  const { events, currentView, setView, fetchEvents, createEvent, updateEvent, deleteEvent } = useCalendar();
  const { t } = useTranslation();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventType, setNewEventType] = useState('task');
  const [newEventDate, setNewEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [newEventColor, setNewEventColor] = useState('#6366f1');

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    const startDate = new Date(`${newEventDate}T10:00:00`);
    const endDate = new Date(`${newEventDate}T11:00:00`);

    await createEvent({
      title: newEventTitle,
      type: newEventType,
      start: startDate,
      end: endDate,
      color: newEventColor
    });

    setIsModalOpen(false);
    setNewEventTitle('');
    fetchEvents();
  };

  const getEventsForDay = (day) => {
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => {
      const eDate = new Date(e.start).toISOString().split('T')[0];
      return eDate === dayStr;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Calendar Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{t('calendar.title')}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t('calendar.subtitle')}</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-card)', padding: '4px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            {['month', 'week', 'day'].map((v) => (
              <button
                key={v}
                className={`btn ${currentView === v ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '6px 14px', fontSize: '0.8rem', textTransform: 'capitalize' }}
                onClick={() => setView(v)}
              >
                {t(`calendar.${v}_view`)}
              </button>
            ))}
          </div>

          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> {t('calendar.create_event')}
          </button>
        </div>
      </div>

      {/* Month Navigation Banner */}
      <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px' }}>
        <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>
          {monthNames[month]} {year}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="icon-btn" onClick={handlePrevMonth} aria-label="Previous Month">
            <ChevronLeft size={18} />
          </button>
          <button className="btn btn-secondary" onClick={() => setCurrentDate(new Date())}>
            {t('calendar.today')}
          </button>
          <button className="icon-btn" onClick={handleNextMonth} aria-label="Next Month">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Month View Grid */}
      <div className="glass-card" style={{ padding: '16px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          textAlign: 'center',
          fontWeight: 700,
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
          paddingBottom: '12px',
          borderBottom: '1px solid var(--border-color)'
        }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d}>{d}</div>
          ))}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '8px',
          paddingTop: '12px'
        }}>
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} style={{ minHeight: '90px', opacity: 0.3 }} />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dayEvents = getEventsForDay(dayNum);
            const isToday = dayNum === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

            return (
              <div
                key={dayNum}
                style={{
                  minHeight: '100px',
                  background: isToday ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-card)',
                  border: isToday ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div style={{
                  fontSize: '0.825rem',
                  fontWeight: isToday ? 800 : 600,
                  color: isToday ? 'var(--primary)' : 'var(--text-primary)'
                }}>
                  {dayNum}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', maxHeight: '80px' }}>
                  {dayEvents.map(ev => (
                    <div
                      key={ev._id}
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: ev.type === 'exam' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                        borderLeft: `3px solid ${ev.color || '#6366f1'}`,
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ev.title}
                      </span>
                      <button
                        onClick={() => deleteEvent(ev._id)}
                        style={{ color: 'var(--text-muted)', padding: '0 2px' }}
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Event Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Schedule Calendar Event">
        <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '6px' }}>Event Title</label>
            <input
              type="text"
              style={{ width: '100%' }}
              placeholder="e.g. Operating Systems Final Review"
              value={newEventTitle}
              onChange={(e) => setNewEventTitle(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '6px' }}>Date</label>
              <input
                type="date"
                style={{ width: '100%' }}
                value={newEventDate}
                onChange={(e) => setNewEventDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '6px' }}>Event Type</label>
              <select
                style={{ width: '100%' }}
                value={newEventType}
                onChange={(e) => setNewEventType(e.target.value)}
              >
                <option value="task">Study Task</option>
                <option value="exam">Exam</option>
                <option value="revision">Revision Slot</option>
                <option value="reminder">Reminder</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '6px' }}>Color Tag</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'].map(c => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setNewEventColor(c)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: c,
                    border: newEventColor === c ? '3px solid #ffffff' : 'none'
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
              Save Event
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CalendarPage;
