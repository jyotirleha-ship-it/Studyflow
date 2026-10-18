import React, { useEffect, useState } from 'react';
import {
  CalendarDays,
  Wrench,
  Flame,
  CheckCircle2,
  Clock,
  Plus,
  AlertCircle,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { useTasks } from '../hooks/useTasks.js';
import { useStudyPlanner } from '../hooks/useStudyPlanner.js';
import { useTranslation } from 'react-i18next';
import Modal from '../components/common/Modal.jsx';
import Pagination from '../components/common/Pagination.jsx';

const PlannerPage = () => {
  const { tasks, page, totalPages, total, limit, loading, fetchTasks, toggleComplete, createTask } = useTasks();
  const { repairData, checkPlanRepair, applyPlanRepair, runWhatIfSimulator, simulationResult, clearSimulation } = useStudyPlanner();
  const { t } = useTranslation();

  const [activeFilter, setActiveFilter] = useState('all');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isRepairModalOpen, setIsRepairModalOpen] = useState(false);
  const [isWhatIfModalOpen, setIsWhatIfModalOpen] = useState(false);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTaskTime, setNewTaskTime] = useState('19:00');
  const [newTaskDuration, setNewTaskDuration] = useState(45);
  const [newTaskPriority, setNewTaskPriority] = useState('medium');

  useEffect(() => {
    const params = {};
    if (activeFilter === 'pending') params.status = 'pending';
    if (activeFilter === 'completed') params.status = 'completed';
    if (activeFilter === 'urgent') params.priority = 'urgent';
    fetchTasks(params);
    checkPlanRepair();
  }, [fetchTasks, checkPlanRepair, activeFilter]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    await createTask({
      title: newTaskTitle,
      scheduledDate: newTaskDate,
      scheduledTime: newTaskTime,
      durationMinutes: Number(newTaskDuration),
      priority: newTaskPriority
    });

    setIsTaskModalOpen(false);
    setNewTaskTitle('');
    fetchTasks();
  };

  const handleOpenRepair = async () => {
    await checkPlanRepair();
    setIsRepairModalOpen(true);
  };

  const handleApplyRepair = async (approve) => {
    if (repairData?.planRevisionId) {
      await applyPlanRepair(repairData.planRevisionId, approve);
      setIsRepairModalOpen(false);
      fetchTasks();
    }
  };

  const handleRunWhatIf = async () => {
    await runWhatIfSimulator(new Date().toISOString().split('T')[0]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{t('planner.title')}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t('planner.subtitle')}</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={handleOpenRepair}>
            <Wrench size={16} color="var(--accent-amber)" />
            {t('planner.repair_plan_btn')}
          </button>

          <button className="btn btn-secondary" onClick={() => { setIsWhatIfModalOpen(true); handleRunWhatIf(); }}>
            <Flame size={16} color="var(--streak-fire)" />
            {t('planner.what_if_btn')}
          </button>

          <button className="btn btn-primary" onClick={() => setIsTaskModalOpen(true)}>
            <Plus size={16} /> {t('planner.add_task')}
          </button>
        </div>
      </div>

      {/* Automatic Plan Repair Banner if tasks need repair */}
      {repairData?.needsRepair && (
        <div style={{
          padding: '16px 20px',
          background: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertCircle size={22} color="var(--accent-amber)" />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Schedule Adjustment Recommended</div>
              <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                {repairData.message}
              </div>
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleOpenRepair} style={{ padding: '8px 16px', fontSize: '0.825rem' }}>
            Review Proposed Schedule <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        {['all', 'pending', 'completed', 'urgent'].map((tab) => (
          <button
            key={tab}
            className={`btn ${activeFilter === tab ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 16px', fontSize: '0.825rem', textTransform: 'capitalize' }}
            onClick={() => setActiveFilter(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="glass-card" style={{ padding: '16px' }}>
        {tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <HelpCircle size={40} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
            <p>{t('planner.empty_tasks')}</p>
          </div>
        ) : (
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
                  opacity: task.status === 'completed' ? 0.65 : 1,
                  transition: 'all 0.2s'
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
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                      📅 {task.scheduledDate} at {task.scheduledTime || '19:00'} • ⏱ {task.durationMinutes} mins
                      {task.isAIGenerated && (
                        <span style={{ marginLeft: '8px', color: 'var(--primary)', fontWeight: 600 }}>
                          🤖 AI Assigned
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className={`badge badge-${task.priority || 'medium'}`}>
                    {task.priority}
                  </span>
                  <span className={`badge ${task.status === 'completed' ? 'badge-low' : 'badge-high'}`}>
                    {task.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPageChange={(p) => fetchTasks({ page: p })}
        />
      </div>

      {/* Plan Repair Modal */}
      <Modal isOpen={isRepairModalOpen} onClose={() => setIsRepairModalOpen(false)} title="🔄 Automatic Plan Repair Engine">
        <div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            When tasks are missed, StudyFlow rebalances your calendar so that no individual day exceeds your configured available hours.
          </p>

          {repairData?.proposedSchedule && repairData.proposedSchedule.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {repairData.proposedSchedule.map((item, idx) => (
                <div key={idx} style={{ padding: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item.title}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--accent-emerald)', marginTop: '4px' }}>
                    Shifted from <strong>{item.originalDate}</strong> ➔ New Date: <strong>{item.proposedDate}</strong> (⏱ {item.durationMinutes} mins)
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--accent-emerald)', fontSize: '0.9rem', marginBottom: '20px' }}>
              ✅ All planned tasks are currently on track! No schedule repair needed.
            </p>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={() => handleApplyRepair(false)}>
              Reject Changes
            </button>
            <button className="btn btn-primary" onClick={() => handleApplyRepair(true)} disabled={!repairData?.needsRepair}>
              Approve & Update Schedule
            </button>
          </div>
        </div>
      </Modal>

      {/* What-If Skip Simulator Modal */}
      <Modal isOpen={isWhatIfModalOpen} onClose={() => setIsWhatIfModalOpen(false)} title="🔥 What-If Skip Simulator">
        <div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Simulate the projected cognitive and schedule impact if you skip today's planned study session.
          </p>

          {simulationResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-emerald)' }}>If You Study Today</div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, marginTop: '6px' }}>{simulationResult.baselineReadiness}%</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Projected Exam Readiness</div>
                </div>

                <div style={{ padding: '16px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-rose)' }}>If You Skip Today</div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, marginTop: '6px', color: 'var(--accent-rose)' }}>{simulationResult.simulatedReadiness}%</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Projected Exam Readiness</div>
                </div>
              </div>

              <div style={{ padding: '14px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '4px' }}>Impact Analysis</div>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {simulationResult.explanation}
                </p>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button className="btn btn-secondary" onClick={() => setIsWhatIfModalOpen(false)}>
              Close Simulation
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Task Modal */}
      <Modal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} title="Create New Study Task">
        <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '6px' }}>Task Title</label>
            <input
              type="text"
              style={{ width: '100%' }}
              placeholder="e.g. Implement Banker's Algorithm simulation"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '6px' }}>Scheduled Date</label>
              <input
                type="date"
                style={{ width: '100%' }}
                value={newTaskDate}
                onChange={(e) => setNewTaskDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '6px' }}>Scheduled Time</label>
              <input
                type="time"
                style={{ width: '100%' }}
                value={newTaskTime}
                onChange={(e) => setNewTaskTime(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '6px' }}>Duration (Minutes)</label>
              <input
                type="number"
                style={{ width: '100%' }}
                value={newTaskDuration}
                onChange={(e) => setNewTaskDuration(e.target.value)}
                min="10"
                max="240"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, marginBottom: '6px' }}>Priority</label>
              <select
                style={{ width: '100%' }}
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsTaskModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Task
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PlannerPage;
