import StudyTask from '../models/StudyTask.js';
import CalendarEvent from '../models/CalendarEvent.js';
import Streak from '../models/Streak.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

export const getTasks = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { user: req.user._id };
    if (req.query.status) query.status = req.query.status;
    if (req.query.priority) query.priority = req.query.priority;
    if (req.query.subject) query.subject = req.query.subject;
    if (req.query.date) query.scheduledDate = req.query.date;
    if (req.query.search) {
      query.title = { $regex: req.query.search, $options: 'i' };
    }

    const total = await StudyTask.countDocuments(query);
    const tasks = await StudyTask.find(query)
      .populate('subject topic')
      .sort({ scheduledDate: 1, scheduledTime: 1 })
      .skip(skip)
      .limit(limit);

    res.json({
      data: tasks,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req, res, next) => {
  try {
    const { title, subject, topic, scheduledDate, scheduledTime, durationMinutes, priority, isAIGenerated, aiReason } = req.body;

    const task = new StudyTask({
      user: req.user._id,
      title,
      subject: subject || null,
      topic: topic || null,
      scheduledDate: scheduledDate || new Date().toISOString().split('T')[0],
      scheduledTime: scheduledTime || '19:00',
      durationMinutes: durationMinutes || 30,
      priority: priority || 'medium',
      isAIGenerated: isAIGenerated || false,
      aiReason: aiReason || ''
    });
    await task.save();

    // Create Calendar Event
    const startDate = new Date(`${task.scheduledDate}T${task.scheduledTime || '19:00'}:00`);
    const endDate = new Date(startDate.getTime() + (task.durationMinutes || 30) * 60000);

    const event = new CalendarEvent({
      user: req.user._id,
      title: task.title,
      type: 'task',
      start: startDate,
      end: endDate,
      task: task._id
    });
    await event.save();

    res.status(201).json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const task = await StudyTask.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    Object.assign(task, req.body);
    await task.save();

    if (req.body.scheduledDate || req.body.scheduledTime || req.body.title) {
      const startDate = new Date(`${task.scheduledDate}T${task.scheduledTime || '19:00'}:00`);
      const endDate = new Date(startDate.getTime() + (task.durationMinutes || 30) * 60000);
      await CalendarEvent.findOneAndUpdate({ task: task._id }, {
        title: task.title,
        start: startDate,
        end: endDate
      });
    }

    res.json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const task = await StudyTask.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    await CalendarEvent.findOneAndDelete({ task: task._id });
    res.json({ success: true, message: 'Task removed successfully' });
  } catch (error) {
    next(error);
  }
};

export const toggleTaskComplete = async (req, res, next) => {
  try {
    const task = await StudyTask.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const willBeCompleted = task.status !== 'completed';
    task.status = willBeCompleted ? 'completed' : 'pending';
    task.completedAt = willBeCompleted ? new Date() : null;
    await task.save();

    let streak = await Streak.findOne({ user: req.user._id });
    if (!streak) {
      streak = new Streak({ user: req.user._id, currentStreak: 0, longestStreak: 0 });
    }

    let streakResult = {
      streakUpdated: false,
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      isNewRecord: false
    };

    if (willBeCompleted) {
      const user = await User.findById(req.user._id);
      if (user) {
        user.xp = (user.xp || 0) + 50;
        if (user.xp >= user.level * 300) {
          user.level += 1;
        }
        await user.save();
      }

      const today = new Date().toISOString().split('T')[0];
      if (streak.lastStudyDate !== today) {
        streak.currentStreak += 1;
        let isRecord = false;
        if (streak.currentStreak > streak.longestStreak) {
          streak.longestStreak = streak.currentStreak;
          isRecord = true;
        }
        streak.lastStudyDate = today;
        streak.history.push({ date: today, completedMinutes: task.durationMinutes || 30 });
        await streak.save();

        streakResult = {
          streakUpdated: true,
          currentStreak: streak.currentStreak,
          longestStreak: streak.longestStreak,
          isNewRecord: isRecord
        };

        await Notification.create({
          user: req.user._id,
          title: isRecord ? '🔥 New Streak Record!' : '🎉 Streak Extended!',
          message: `You completed today's study! Your streak is now ${streak.currentStreak} days!`,
          type: 'streak'
        });
      }
    }

    res.json({
      success: true,
      task,
      ...streakResult
    });
  } catch (error) {
    next(error);
  }
};
