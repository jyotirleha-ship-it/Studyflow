import ChatConversation from '../models/ChatConversation.js';
import ChatMessage from '../models/ChatMessage.js';
import StudyTask from '../models/StudyTask.js';
import CalendarEvent from '../models/CalendarEvent.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import StudySession from '../models/StudySession.js';
import Exam from '../models/Exam.js';
import Streak from '../models/Streak.js';
import LearningDNA from '../models/LearningDNA.js';
import User from '../models/User.js';
import { searchNotes } from '../services/noteContextService.js';
import { generateMentorResponse } from '../services/aiService.js';

export const sendMessage = async (req, res, next) => {
  try {
    const { message, conversationId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required.' });
    }

    let conversation;
    if (conversationId) {
      conversation = await ChatConversation.findOne({ _id: conversationId, user: req.user._id });
    }
    if (!conversation) {
      conversation = new ChatConversation({
        user: req.user._id,
        title: (message.trim()).slice(0, 32) + '...'
      });
      await conversation.save();
    }

    // Save user message
    const userMsg = new ChatMessage({
      conversation: conversation._id,
      user: req.user._id,
      role: 'user',
      content: message
    });
    await userMsg.save();

    // 1. Gather Real Authenticated User Context
    const user = await User.findById(req.user._id);

    // Yesterday bounds
    const yesterdayStart = new Date();
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    yesterdayStart.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date(yesterdayStart);
    yesterdayEnd.setHours(23, 59, 59, 999);

    const [
      subjects,
      topics,
      notes,
      recentSessions,
      yesterdaySessions,
      upcomingExams,
      streak,
      learningDNA,
      recentHistory
    ] = await Promise.all([
      Subject.find({ user: req.user._id }),
      Topic.find({ user: req.user._id }).populate('subject'),
      searchNotes(req.user._id, message),
      StudySession.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(10).populate('subject topic'),
      StudySession.find({
        user: req.user._id,
        createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd }
      }).populate('subject topic'),
      Exam.find({ user: req.user._id, examDate: { $gte: new Date() } }).populate('subject').sort({ examDate: 1 }),
      Streak.findOne({ user: req.user._id }),
      LearningDNA.findOne({ user: req.user._id }),
      ChatMessage.find({ conversation: conversation._id }).sort({ createdAt: -1 }).limit(8)
    ]);

    const formattedNotesContext = notes.slice(0, 4).map(n =>
      `[Note: "${n.title}" (${n.subject?.name || 'General'})]: ${n.content}`
    ).join('\n\n');

    // 2. Generate Grounded Mentor Response
    const response = await generateMentorResponse({
      message,
      context: {
        userName: user?.name || req.user.name,
        preferredLanguage: user?.preferredLanguage || 'en',
        availableHoursPerDay: user?.availableHoursPerDay || 4,
        dailyStudyGoalMinutes: user?.dailyStudyGoalMinutes || 120,
        streak: streak ? streak.currentStreak : 0,
        subjects,
        topics,
        notes,
        noteContextString: formattedNotesContext,
        recentSessions,
        yesterdaySessions,
        upcomingExams,
        learningDNA: learningDNA ? learningDNA.toObject() : {}
      },
      history: recentHistory.reverse()
    });

    // 3. Save Assistant Message
    const assistantMsg = new ChatMessage({
      conversation: conversation._id,
      user: req.user._id,
      role: 'assistant',
      content: response.content,
      suggestedTask: response.suggestedTask || null,
      suggestedSchedule: response.suggestedSchedule || []
    });
    await assistantMsg.save();

    conversation.updatedAt = new Date();
    await conversation.save();

    res.json({
      success: true,
      conversationId: conversation._id,
      userMessage: userMsg,
      assistantMessage: assistantMsg
    });
  } catch (error) {
    next(error);
  }
};

export const getHistory = async (req, res, next) => {
  try {
    const messages = await ChatMessage.find({ user: req.user._id })
      .sort({ createdAt: 1 })
      .limit(60);
    res.json({ success: true, messages });
  } catch (error) {
    next(error);
  }
};

export const acceptSuggestedTask = async (req, res, next) => {
  try {
    const { messageId } = req.body;
    const msg = await ChatMessage.findOne({ _id: messageId, user: req.user._id });
    if (!msg || !msg.suggestedTask) {
      return res.status(400).json({ success: false, message: 'No suggested task found for this message' });
    }

    const payload = msg.suggestedTask;
    const todayStr = new Date().toISOString().split('T')[0];

    const task = new StudyTask({
      user: req.user._id,
      title: payload.title,
      scheduledDate: payload.scheduledDate || todayStr,
      scheduledTime: '19:00',
      durationMinutes: payload.durationMinutes || 45,
      priority: payload.priority || 'high',
      isAIGenerated: true,
      aiReason: payload.reason || 'Assigned by StudyFlow Personal Mentor',
      status: 'pending'
    });
    await task.save();

    const startDate = new Date(`${task.scheduledDate}T19:00:00`);
    const endDate = new Date(startDate.getTime() + (task.durationMinutes || 45) * 60000);

    const event = new CalendarEvent({
      user: req.user._id,
      title: task.title,
      type: 'task',
      start: startDate,
      end: endDate,
      task: task._id
    });
    await event.save();

    msg.suggestedTask.status = 'accepted';
    await msg.save();

    res.json({
      success: true,
      message: 'Task successfully accepted and added to your Planner and Calendar!',
      task
    });
  } catch (error) {
    next(error);
  }
};

export const acceptSuggestedSchedule = async (req, res, next) => {
  try {
    const { messageId, scheduleItems } = req.body;
    let items = scheduleItems;
    let msg = null;

    if (messageId) {
      msg = await ChatMessage.findOne({ _id: messageId, user: req.user._id });
      if (msg && msg.suggestedSchedule && msg.suggestedSchedule.length > 0) {
        items = msg.suggestedSchedule;
      }
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No suggested schedule found.' });
    }

    const createdTasks = [];
    for (const item of items) {
      const task = new StudyTask({
        user: req.user._id,
        title: item.title,
        scheduledDate: item.scheduledDate || new Date().toISOString().split('T')[0],
        scheduledTime: item.scheduledTime || '18:00',
        durationMinutes: item.durationMinutes || 45,
        priority: item.priority || 'medium',
        isAIGenerated: true,
        aiReason: item.reason || 'Generated by StudyFlow Adaptive Mentor Schedule',
        status: 'pending'
      });
      await task.save();
      createdTasks.push(task);

      const startDate = new Date(`${task.scheduledDate}T${task.scheduledTime}:00`);
      const endDate = new Date(startDate.getTime() + task.durationMinutes * 60000);

      const event = new CalendarEvent({
        user: req.user._id,
        title: task.title,
        type: 'task',
        start: isNaN(startDate.getTime()) ? new Date() : startDate,
        end: isNaN(endDate.getTime()) ? new Date(Date.now() + 45 * 60000) : endDate,
        task: task._id
      });
      await event.save();
    }

    if (msg) {
      msg.scheduleStatus = 'accepted';
      await msg.save();
    }

    res.status(201).json({
      success: true,
      message: `Schedule accepted! ${createdTasks.length} study tasks added to your Planner and Calendar.`,
      tasksCreated: createdTasks.length,
      tasks: createdTasks
    });
  } catch (error) {
    next(error);
  }
};
