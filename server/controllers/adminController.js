import User from '../models/User.js';
import StudySession from '../models/StudySession.js';
import Subject from '../models/Subject.js';
import Exam from '../models/Exam.js';
import QuizAttempt from '../models/QuizAttempt.js';
import ChatConversation from '../models/ChatConversation.js';
import Note from '../models/Note.js';
import Notification from '../models/Notification.js';
import StudyTask from '../models/StudyTask.js';
import Assessment from '../models/Assessment.js';
import ActivityLog from '../models/ActivityLog.js';
import Connection from '../models/Connection.js';
import StudyGroup from '../models/StudyGroup.js';

export const getAdminStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalStudents,
      activeStudents,
      totalSessions,
      totalSubjects,
      totalExams,
      totalQuizAttempts,
      totalConversations,
      totalNotes,
      totalNotifications,
      totalTasks,
      totalGroups,
      totalConnections,
      sessionMinutesAgg,
      atRiskCount
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'user', isActive: true }),
      StudySession.countDocuments(),
      Subject.countDocuments(),
      Exam.countDocuments(),
      QuizAttempt.countDocuments(),
      ChatConversation.countDocuments(),
      Note.countDocuments(),
      Notification.countDocuments(),
      StudyTask.countDocuments(),
      StudyGroup.countDocuments(),
      Connection.countDocuments({ status: 'accepted' }),
      StudySession.aggregate([
        { $group: { _id: null, totalMinutes: { $sum: '$durationMinutes' } } }
      ]),
      User.countDocuments({
        role: 'user',
        $or: [
          { performanceLevel: 'Needs Attention' },
          { studyHoursPerDay: { $lt: 2 } }
        ]
      })
    ]);

    const totalMinutes = sessionMinutesAgg[0]?.totalMinutes || 0;
    const totalStudyHours = Math.round(totalMinutes / 60);

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        totalStudents,
        activeStudents,
        totalStudyHours,
        atRiskStudents: atRiskCount,
        totalSessions,
        totalSubjects,
        totalExams,
        totalQuizAttempts,
        totalConversations,
        totalNotes,
        totalNotifications,
        totalTasks,
        totalGroups,
        totalConnections
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;
    const { search = '', department = '', year = '', performanceLevel = '', status = '' } = req.query;

    const query = { role: 'user' };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }

    if (department && department !== 'all') {
      query.department = department;
    }

    if (year && year !== 'all') {
      query.year = year;
    }

    if (performanceLevel && performanceLevel !== 'all') {
      query.performanceLevel = performanceLevel;
    }

    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'deactivated') {
      query.isActive = false;
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Attach student stats
    const usersWithStats = await Promise.all(
      users.map(async (u) => {
        const [sessionCount, noteCount, taskCount, sessions] = await Promise.all([
          StudySession.countDocuments({ user: u._id }),
          Note.countDocuments({ user: u._id }),
          StudyTask.countDocuments({ user: u._id }),
          StudySession.find({ user: u._id }).select('durationMinutes distractionCount focusScore').lean()
        ]);

        const totalMins = sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
        const avgFocusScore = sessions.length > 0
          ? Math.round(sessions.reduce((acc, s) => acc + (s.focusScore || 100), 0) / sessions.length)
          : 90;

        return {
          ...u,
          sessionCount,
          noteCount,
          taskCount,
          totalStudyHours: Math.round(totalMins / 60),
          avgFocusScore
        };
      })
    );

    res.json({
      success: true,
      users: usersWithStats,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    });
  } catch (error) {
    next(error);
  }
};

export const toggleUserActive = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own administrator account.'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    await ActivityLog.create({
      user: req.user._id,
      action: user.isActive ? 'ADMIN_USER_ACTIVATED' : 'ADMIN_USER_DEACTIVATED',
      details: { targetUserId: user._id, targetUserName: user.name }
    });

    res.json({
      success: true,
      message: `User ${user.name} account ${user.isActive ? 'activated' : 'deactivated'} successfully.`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// AI Performance & Risk Distribution
export const getPerformanceRiskMetrics = async (req, res, next) => {
  try {
    const students = await User.find({ role: 'user' })
      .select('name email department year performanceLevel studyHoursPerDay createdAt')
      .lean();

    let highRiskCount = 0;
    let mediumRiskCount = 0;
    let lowRiskCount = 0;
    const atRiskStudents = [];

    for (const student of students) {
      const hours = student.studyHoursPerDay || 0;
      const perf = student.performanceLevel || 'Medium';

      let riskTier = 'Low';
      const riskFactors = [];

      if (perf === 'Needs Attention' || hours < 2) {
        riskTier = 'High';
        highRiskCount++;
        if (perf === 'Needs Attention') riskFactors.push('Academic performance below target');
        if (hours < 2) riskFactors.push(`Low daily study commitment (${hours}h/day)`);
      } else if (perf === 'Medium' || hours <= 3) {
        riskTier = 'Medium';
        mediumRiskCount++;
        riskFactors.push('Moderate pacing; needs consistent focus');
      } else {
        riskTier = 'Low';
        lowRiskCount++;
      }

      if (riskTier === 'High' || riskTier === 'Medium') {
        atRiskStudents.push({
          ...student,
          riskTier,
          riskFactors
        });
      }
    }

    // Department breakdown
    const deptMap = {};
    for (const s of students) {
      const dept = s.department || 'Other';
      if (!deptMap[dept]) deptMap[dept] = { total: 0, hoursSum: 0 };
      deptMap[dept].total++;
      deptMap[dept].hoursSum += (s.studyHoursPerDay || 3);
    }

    const departmentStats = Object.keys(deptMap).map(dept => ({
      department: dept,
      studentCount: deptMap[dept].total,
      avgStudyHours: (deptMap[dept].hoursSum / deptMap[dept].total).toFixed(1)
    }));

    res.json({
      success: true,
      distribution: {
        highRisk: highRiskCount,
        mediumRisk: mediumRiskCount,
        lowRisk: lowRiskCount,
        total: students.length
      },
      atRiskStudents: atRiskStudents.slice(0, 20),
      departmentStats
    });
  } catch (error) {
    next(error);
  }
};

// Assessment Management (CRUD)
export const getAssessments = async (req, res, next) => {
  try {
    const assessments = await Assessment.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      assessments
    });
  } catch (error) {
    next(error);
  }
};

export const createAssessment = async (req, res, next) => {
  try {
    const { title, subject, difficulty, durationMinutes, totalQuestions, passingScore, questions } = req.body;

    if (!title || !subject) {
      return res.status(400).json({ success: false, message: 'Title and subject are required' });
    }

    const assessment = await Assessment.create({
      title: title.trim(),
      subject: subject.trim(),
      difficulty: difficulty || 'Medium',
      durationMinutes: durationMinutes || 30,
      totalQuestions: questions?.length || totalQuestions || 5,
      passingScore: passingScore || 60,
      questions: questions || [],
      createdBy: req.user._id
    });

    await ActivityLog.create({
      user: req.user._id,
      action: 'ADMIN_ASSESSMENT_CREATED',
      details: { assessmentId: assessment._id, title: assessment.title }
    });

    res.status(201).json({
      success: true,
      message: 'Assessment created successfully',
      assessment
    });
  } catch (error) {
    next(error);
  }
};

export const updateAssessment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const assessment = await Assessment.findByIdAndUpdate(id, req.body, { new: true });

    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    res.json({
      success: true,
      message: 'Assessment updated successfully',
      assessment
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAssessment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const assessment = await Assessment.findByIdAndDelete(id);

    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    await ActivityLog.create({
      user: req.user._id,
      action: 'ADMIN_ASSESSMENT_DELETED',
      details: { assessmentId: id }
    });

    res.json({
      success: true,
      message: 'Assessment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Broadcast Notifications
export const broadcastNotification = async (req, res, next) => {
  try {
    const { title, message, priority = 'normal' } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required' });
    }

    const activeUsers = await User.find({ isActive: true, role: 'user' }).select('_id');

    const notifications = activeUsers.map(u => ({
      user: u._id,
      title: `📢 ${title.trim()}`,
      message: message.trim(),
      type: 'system',
      priority,
      createdAt: new Date()
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    await ActivityLog.create({
      user: req.user._id,
      action: 'ADMIN_BROADCAST_SENT',
      details: { title, recipientsCount: notifications.length }
    });

    res.json({
      success: true,
      message: `Broadcast notification successfully sent to ${notifications.length} students`
    });
  } catch (error) {
    next(error);
  }
};

// Activity Logs with pagination & filters
export const getActivityLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { action = '', search = '' } = req.query;

    const query = {};
    if (action && action !== 'all') {
      query.action = action;
    }

    const total = await ActivityLog.countDocuments(query);
    const logs = await ActivityLog.find(query)
      .populate('user', 'name email role department')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({
      success: true,
      logs,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    });
  } catch (error) {
    next(error);
  }
};
