import React, { useEffect, useState } from 'react';
import { CheckSquare, Plus, Search, Trash2, Clock } from 'lucide-react';
import { useTasks } from '../hooks/useTasks.js';
import { useTranslation } from 'react-i18next';
import Pagination from '../components/common/Pagination.jsx';
import Modal from '../components/common/Modal.jsx';

const TasksPage = () => {
  const { tasks, page, totalPages, total, limit, loading, fetchTasks, toggleComplete, createTask, deleteTask } = useTasks();
  const { t } = useTranslation();

  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [duration, setDuration] = useState(30);
  const [priority, setPriority] = useState('medium');

  useEffect(() => {
    fetchTasks({ search, priority: priorityFilter });
  }, [fetchTasks, search, priorityFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    await createTask({
      title,
      scheduledDate: date,
      durationMinutes: Number(duration),
      priority
    });

    setIsModalOpen(false);
    setTitle('');
    fetchTasks();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{t('tasks.title')}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t('tasks.subtitle')}</p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> {t('tasks.new_task')}
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-card" style={{ padding: '14px 20px', display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '220px' }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search study tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          style={{ width: '160px' }}
        >
          <option value="">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Task List */}
      <div className="glass-card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {tasks.map((task) => (
            <div
              key={task._id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                opacity: task.status === 'completed' ? 0.65 : 1
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <input
                  type="checkbox"
                  checked={task.status === 'completed'}
                  onChange={() => toggleComplete(task._id)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <div>
                  <div style={{
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    textDecoration: task.status === 'completed' ? 'line-through' : 'none'
                  }}>
                    {task.title}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Scheduled: {task.scheduledDate} at {task.scheduledTime || '19:00'} • ⏱ {task.durationMinutes} mins
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className={`badge badge-${task.priority || 'medium'}`}>
                  {task.priority}
                </span>

                <button
                  className="icon-btn"
                  onClick={() => deleteTask(task._id)}
                  title="Delete"
                  aria-label="Delete"
                  style={{ width: '32px', height: '32px' }}
                >
                  <Trash2 size={14} color="var(--accent-rose)" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPageChange={(p) => fetchTasks({ page: p, search, priority: priorityFilter })}
        />
      </div>

      {/* Add Task Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Study Task">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '6px' }}>Task Title</label>
            <input
              type="text"
              style={{ width: '100%' }}
              placeholder="e.g. Read BCNF decomposition examples"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '6px' }}>Scheduled Date</label>
              <input
                type="date"
                style={{ width: '100%' }}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '6px' }}>Duration (Mins)</label>
              <input
                type="number"
                style={{ width: '100%' }}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min="10"
                max="240"
              />
            </div>
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
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Task
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TasksPage;
