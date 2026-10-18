import Notification from '../models/Notification.js';
import User from '../models/User.js';
import StudyTask from '../models/StudyTask.js';
import { sendDailyScheduleEmail } from '../services/emailService.js';

export const getNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Notification.countDocuments({ user: req.user._id });
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const unreadCount = await Notification.countDocuments({ user: req.user._id, read: false });

    res.json({
      data: notifications,
      unreadCount,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { read: true });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ user: req.user._id }, { read: true });
    res.json({ success: true, message: 'All marked as read' });
  } catch (error) {
    next(error);
  }
};

export const getNotificationPreferences = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      success: true,
      preferences: user.notificationPreferences || {
        dailySchedule: true,
        studyReminders: true,
        examReminders: true,
        achievements: true,
        weeklySummary: false
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateNotificationPreferences = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    user.notificationPreferences = {
      ...user.notificationPreferences,
      ...req.body
    };
    await user.save();
    res.json({
      success: true,
      message: 'Notification preferences updated successfully.',
      preferences: user.notificationPreferences
    });
  } catch (error) {
    next(error);
  }
};

export const triggerDailyScheduleEmail = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const today = new Date().toISOString().split('T')[0];

    const todayTasks = await StudyTask.find({
      user: req.user._id,
      scheduledDate: today
    }).populate('subject topic');

    const emailResult = await sendDailyScheduleEmail(user, todayTasks);

    // Also record in-app notification
    await Notification.create({
      user: user._id,
      title: '📧 Daily Study Schedule Dispatched',
      message: `Your personalized schedule with ${todayTasks.length} task(s) for today has been sent to ${user.email}.`,
      type: 'reminder'
    });

    res.json({
      success: true,
      message: `Today's study schedule email dispatched to ${user.email}.`,
      taskCount: todayTasks.length,
      emailResult
    });
  } catch (error) {
    next(error);
  }
};

export const subscribePushNotification = async (req, res, next) => {
  try {
    const { subscription } = req.body;
    await User.findByIdAndUpdate(req.user._id, { pushSubscription: subscription });
    res.json({ success: true, message: 'Push subscription registered successfully.' });
  } catch (error) {
    next(error);
  }
};
