import StudyTask from '../models/StudyTask.js';
import PlanRevision from '../models/PlanRevision.js';
import User from '../models/User.js';

export const repairMissedSchedule = async (userId) => {
  const user = await User.findById(userId);
  const maxDailyMinutes = (user?.availableHoursPerDay || 4) * 60;

  // Find missed tasks
  const missedTasks = await StudyTask.find({
    user: userId,
    status: { $in: ['missed', 'pending'] },
    scheduledDate: { $lt: new Date().toISOString().split('T')[0] }
  }).populate('subject topic');

  if (missedTasks.length === 0) {
    return {
      needsRepair: false,
      message: 'No missed tasks detected. Your schedule is currently on track!'
    };
  }

  const today = new Date();
  const proposedSchedule = [];

  // Rebalance missed tasks across the next 3 days
  missedTasks.forEach((task, index) => {
    const shiftDays = (index % 3) + 1;
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + shiftDays);
    const dateStr = targetDate.toISOString().split('T')[0];

    proposedSchedule.push({
      taskId: task._id,
      title: task.title,
      originalDate: task.scheduledDate,
      proposedDate: dateStr,
      durationMinutes: task.durationMinutes,
      priority: 'high',
      reason: 'Rebalanced to prevent cognitive overload while ensuring full coverage'
    });
  });

  const planRevision = new PlanRevision({
    user: userId,
    reason: `Automatically rebalanced ${missedTasks.length} missed study task(s) into realistic study slots.`,
    originalSchedule: missedTasks.map(t => ({ taskId: t._id, title: t.title, date: t.scheduledDate })),
    proposedSchedule,
    status: 'pending'
  });

  await planRevision.save();

  return {
    needsRepair: true,
    planRevisionId: planRevision._id,
    message: `Your schedule needs adjustment. ${missedTasks.length} task(s) have been redistributed across the next 3 days.`,
    proposedSchedule
  };
};

export const applyPlanRevision = async (revisionId, approve = true) => {
  const revision = await PlanRevision.findById(revisionId);
  if (!revision) throw new Error('Plan revision record not found');

  if (!approve) {
    revision.status = 'rejected';
    await revision.save();
    return { success: true, message: 'Proposed plan adjustment was rejected.' };
  }

  // Apply new dates to StudyTasks
  for (const item of revision.proposedSchedule) {
    await StudyTask.findByIdAndUpdate(item.taskId, {
      scheduledDate: item.proposedDate,
      status: 'pending',
      priority: item.priority
    });
  }

  revision.status = 'approved';
  await revision.save();

  return { success: true, message: 'Plan repair successfully applied to your schedule!' };
};
