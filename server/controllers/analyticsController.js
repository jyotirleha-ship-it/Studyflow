import StudySession from '../models/StudySession.js';
import StudyTask from '../models/StudyTask.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import { computeLearningDNA } from '../services/learningDNAService.js';

export const getStudyAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Calculate real study sessions in the last 7 days
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentSessions = await StudySession.find({
      user: userId,
      createdAt: { $gte: sevenDaysAgo }
    });

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    // Group sessions by day of week
    const dayHoursMap = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
    const activeDaysSet = new Set();

    recentSessions.forEach(session => {
      const d = new Date(session.createdAt || session.startTime || Date.now());
      const dayName = days[d.getDay()];
      const durationMins = session.activeStudyTimeMinutes || session.durationMinutes || 0;
      dayHoursMap[dayName] += durationMins / 60;
      activeDaysSet.add(dayName);
    });

    const displayDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeklyHours = displayDays.map(day => ({
      day,
      hours: Number(dayHoursMap[day].toFixed(1))
    }));

    const totalWeeklyHours = Number(
      Object.values(dayHoursMap).reduce((a, b) => a + b, 0).toFixed(1)
    );

    const subjects = await Subject.find({ user: userId });
    const subjectProgress = [];
    for (const sub of subjects) {
      const topics = await Topic.find({ user: userId, subject: sub._id });
      const completed = topics.filter(t => t.status === 'completed' || t.masteryScore >= 70).length;
      subjectProgress.push({
        subject: sub.name,
        color: sub.color || '#6366f1',
        totalTopics: topics.length,
        completedTopics: completed,
        percentage: topics.length > 0 ? Math.round((completed / topics.length) * 100) : 0
      });
    }

    const tasks = await StudyTask.find({ user: userId });
    const completedCount = tasks.filter(t => t.status === 'completed').length;
    const pendingCount = tasks.filter(t => t.status === 'pending').length;
    const completionRate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

    // Real consistency: active days out of 7
    const studyConsistencyScore = Math.round((activeDaysSet.size / 7) * 100);

    res.json({
      success: true,
      weeklyHours,
      totalWeeklyHours,
      subjectProgress,
      completionRate,
      studyConsistencyScore,
      completedTasks: completedCount,
      pendingTasks: pendingCount
    });
  } catch (error) {
    next(error);
  }
};

export const getLearningDNAData = async (req, res, next) => {
  try {
    const dna = await computeLearningDNA(req.user._id);
    res.json({ success: true, learningDNA: dna });
  } catch (error) {
    next(error);
  }
};
