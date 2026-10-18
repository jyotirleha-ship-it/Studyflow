import StudySession from '../models/StudySession.js';
import StudySummary from '../models/StudySummary.js';
import StudyTask from '../models/StudyTask.js';
import Topic from '../models/Topic.js';
import RecentlyAccessed from '../models/RecentlyAccessed.js';
import User from '../models/User.js';
import { buildSummaryPDF, buildWeeklyReportPDF } from '../services/pdfExportService.js';

export const logSession = async (req, res, next) => {
  try {
    const {
      subject,
      topic,
      durationMinutes,
      breakDurationMinutes,
      notes,
      learnedContent,
      difficulties,
      confidenceRating,
      difficultyRating,
      tabSwitchCount,
      distractionCount,
      focusScore,
      activeStudyTimeMinutes,
      completionStatus
    } = req.body;

    const session = new StudySession({
      user: req.user._id,
      subject: subject || null,
      topic: topic || null,
      durationMinutes: durationMinutes || 25,
      breakDurationMinutes: breakDurationMinutes || 5,
      notes: notes || '',
      learnedContent: learnedContent || '',
      difficulties: difficulties || '',
      confidenceRating: confidenceRating || 3,
      difficultyRating: difficultyRating || 3,
      tabSwitchCount: tabSwitchCount || 0,
      distractionCount: distractionCount || 0,
      focusScore: focusScore !== undefined ? focusScore : 100,
      activeStudyTimeMinutes: activeStudyTimeMinutes || durationMinutes || 25,
      completionStatus: completionStatus || 'completed'
    });
    await session.save();

    if (topic) {
      await Topic.findByIdAndUpdate(topic, {
        lastStudiedAt: new Date(),
        confidenceRating: confidenceRating || 3
      });
    }

    // Track recently accessed
    await RecentlyAccessed.create({
      user: req.user._id,
      resourceType: 'session',
      resourceId: session._id,
      resourceTitle: `Focus Session (${session.durationMinutes}m, Focus: ${session.focusScore}%)`,
      accessedAt: new Date()
    });

    res.status(201).json({ success: true, session });
  } catch (error) {
    next(error);
  }
};

export const getSessions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await StudySession.countDocuments({ user: req.user._id });
    const sessions = await StudySession.find({ user: req.user._id })
      .populate('subject topic')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      data: sessions,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    });
  } catch (error) {
    next(error);
  }
};

export const createSummary = async (req, res, next) => {
  try {
    const { topic, subject, notes } = req.body;

    const summary = new StudySummary({
      user: req.user._id,
      topic: topic || 'General Topic',
      subject: subject || 'General',
      importantConcepts: [
        `Key invariant definition for ${topic || 'study module'}`,
        'Modular decomposition and resource bounds',
        'State transition rules and edge conditions'
      ],
      keyPoints: [
        'Active recall spaced within 48 hours boosts retention by 3x',
        'Practice application-based questions to confirm real understanding',
        'Focus stamina preserved when breaking work into 25-35 minute blocks'
      ],
      commonMistakes: [
        'Assuming familiarity with definitions equates to problem-solving ability',
        'Skipping edge cases in concurrent executions or boundary constraints'
      ],
      questionsToRevise: [
        `What is the formal proof/mechanism behind ${topic || 'this concept'}?`,
        'How does this module behave when dependencies fail?'
      ],
      confidenceScore: 80,
      recommendedNextRevision: '48 hours'
    });
    await summary.save();

    // Track in recently accessed
    await RecentlyAccessed.create({
      user: req.user._id,
      resourceType: 'summary',
      resourceId: summary._id,
      resourceTitle: `Summary: ${summary.topic}`,
      accessedAt: new Date()
    });

    res.status(201).json({ success: true, summary });
  } catch (error) {
    next(error);
  }
};

export const getSummaries = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await StudySummary.countDocuments({ user: req.user._id });
    const summaries = await StudySummary.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      data: summaries,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    });
  } catch (error) {
    next(error);
  }
};

export const exportSummaryPDF = async (req, res, next) => {
  try {
    const summary = await StudySummary.findOne({ _id: req.params.id, user: req.user._id });
    if (!summary) return res.status(404).json({ success: false, message: 'Summary not found' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${summary.topic.replace(/\s+/g, '_')}_summary.pdf`);

    buildSummaryPDF(summary, res);
  } catch (error) {
    next(error);
  }
};

export const exportWeeklyReportPDF = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [sessions, tasks] = await Promise.all([
      StudySession.find({ user: req.user._id, createdAt: { $gte: oneWeekAgo } }).populate('subject topic'),
      StudyTask.find({ user: req.user._id, scheduledDate: { $gte: oneWeekAgo.toISOString().split('T')[0] } })
    ]);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="StudyFlow_Weekly_Report_${user.name.replace(/\s+/g, '_')}.pdf"`);

    buildWeeklyReportPDF(user, sessions, tasks, res);
  } catch (error) {
    next(error);
  }
};
