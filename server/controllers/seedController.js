import User from '../models/User.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import StudyTask from '../models/StudyTask.js';
import Exam from '../models/Exam.js';
import CalendarEvent from '../models/CalendarEvent.js';
import Streak from '../models/Streak.js';
import LearningDNA from '../models/LearningDNA.js';
import Notification from '../models/Notification.js';
import StudySummary from '../models/StudySummary.js';
import Prerequisite from '../models/Prerequisite.js';

export const seedDatabase = async (req, res, next) => {
  try {
    let user = await User.findOne({ email: 'student@studyflow.ai' });
    if (!user) {
      user = await User.create({
        name: 'Alex Johnson',
        email: 'student@studyflow.ai',
        password: 'password123',
        dailyStudyGoalMinutes: 120,
        weeklyStudyGoalHours: 15,
        availableHoursPerDay: 4,
        preferredStudyTime: 'evening',
        xp: 680,
        level: 3,
        badges: [
          { id: 'streak-7', name: '7-Day Streak Warrior', icon: 'Flame', description: 'Maintained 7 consecutive study days.' },
          { id: 'exam-prep', name: 'Exam Readiness Champion', icon: 'Trophy', description: 'Reached 80%+ readiness across 3 subjects.' }
        ]
      });
    }

    await Promise.all([
      Subject.deleteMany({ user: user._id }),
      Topic.deleteMany({ user: user._id }),
      StudyTask.deleteMany({ user: user._id }),
      Exam.deleteMany({ user: user._id }),
      CalendarEvent.deleteMany({ user: user._id }),
      Streak.deleteMany({ user: user._id }),
      LearningDNA.deleteMany({ user: user._id }),
      Notification.deleteMany({ user: user._id }),
      StudySummary.deleteMany({ user: user._id }),
      Prerequisite.deleteMany({ user: user._id })
    ]);

    const dbms = await Subject.create({
      user: user._id,
      name: 'Database Management Systems',
      code: 'CS301',
      color: '#3b82f6',
      icon: 'Database',
      priority: 'high'
    });

    const java = await Subject.create({
      user: user._id,
      name: 'Java & Object-Oriented Design',
      code: 'CS302',
      color: '#f59e0b',
      icon: 'Code',
      priority: 'medium'
    });

    const os = await Subject.create({
      user: user._id,
      name: 'Operating Systems & Concurrency',
      code: 'CS303',
      color: '#10b981',
      icon: 'Cpu',
      priority: 'high'
    });

    const dsa = await Subject.create({
      user: user._id,
      name: 'Data Structures & Algorithms',
      code: 'CS304',
      color: '#8b5cf6',
      icon: 'GitBranch',
      priority: 'medium'
    });

    const tRecursion = await Topic.create({
      user: user._id,
      subject: dsa._id,
      name: 'Recursion & Call Stack Basics',
      difficulty: 'medium',
      masteryScore: 48,
      understandingType: 'surface',
      status: 'needs_revision'
    });

    const tTrees = await Topic.create({
      user: user._id,
      subject: dsa._id,
      name: 'Binary Trees & BST Traversals',
      difficulty: 'hard',
      masteryScore: 61,
      prerequisites: [tRecursion._id],
      status: 'in_progress'
    });

    await Prerequisite.create({
      user: user._id,
      subject: dsa._id,
      sourceTopic: tRecursion._id,
      targetTopic: tTrees._id,
      dependencyStrength: 'hard',
      explanation: 'Tree depth and traversal operations directly depend on call stack recursion intuition.'
    });

    const tDeadlocks = await Topic.create({
      user: user._id,
      subject: os._id,
      name: 'Deadlocks & Banker\'s Algorithm',
      difficulty: 'hard',
      masteryScore: 42,
      understandingType: 'surface',
      status: 'needs_revision'
    });

    const tNormalization = await Topic.create({
      user: user._id,
      subject: dbms._id,
      name: 'Relational Normalization (1NF to BCNF)',
      difficulty: 'medium',
      masteryScore: 78,
      understandingType: 'actual',
      status: 'completed'
    });

    const tCollections = await Topic.create({
      user: user._id,
      subject: java._id,
      name: 'Java Collections & Streams API',
      difficulty: 'medium',
      masteryScore: 85,
      understandingType: 'actual',
      status: 'completed'
    });

    const now = new Date();
    const examDBMSDate = new Date(now);
    examDBMSDate.setDate(now.getDate() + 5);

    const examOSDate = new Date(now);
    examOSDate.setDate(now.getDate() + 9);

    const eDBMS = await Exam.create({
      user: user._id,
      subject: dbms._id,
      title: 'DBMS End-Semester Exam',
      examDate: examDBMSDate,
      examTime: '09:30 AM',
      targetScore: 90,
      riskScore: 28,
      riskLevel: 'low'
    });

    const eOS = await Exam.create({
      user: user._id,
      subject: os._id,
      title: 'Operating Systems Final',
      examDate: examOSDate,
      examTime: '02:00 PM',
      targetScore: 85,
      riskScore: 68,
      riskLevel: 'high'
    });

    const todayStr = now.toISOString().split('T')[0];
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const taskToday1 = await StudyTask.create({
      user: user._id,
      title: 'Revise Operating Systems — Deadlocks for 25 minutes',
      subject: os._id,
      topic: tDeadlocks._id,
      scheduledDate: todayStr,
      scheduledTime: '19:00',
      durationMinutes: 25,
      priority: 'urgent',
      status: 'pending',
      isAIGenerated: true,
      aiReason: 'Recommended because OS Exam is in 9 days and current mastery is low (42%).'
    });

    const taskToday2 = await StudyTask.create({
      user: user._id,
      title: 'Practice Java Collections HashMap & TreeMap',
      subject: java._id,
      topic: tCollections._id,
      scheduledDate: todayStr,
      scheduledTime: '20:00',
      durationMinutes: 30,
      priority: 'high',
      status: 'pending'
    });

    const taskCompleted = await StudyTask.create({
      user: user._id,
      title: 'DBMS Normalization Functional Dependencies Practice',
      subject: dbms._id,
      topic: tNormalization._id,
      scheduledDate: yesterdayStr,
      scheduledTime: '18:30',
      durationMinutes: 45,
      priority: 'medium',
      status: 'completed',
      completedAt: yesterday
    });

    await CalendarEvent.create({
      user: user._id,
      title: taskToday1.title,
      type: 'task',
      start: new Date(`${todayStr}T19:00:00`),
      end: new Date(`${todayStr}T19:25:00`),
      task: taskToday1._id,
      color: '#10b981'
    });

    await CalendarEvent.create({
      user: user._id,
      title: `EXAM: DBMS End-Semester`,
      type: 'exam',
      start: examDBMSDate,
      end: new Date(examDBMSDate.getTime() + 3 * 3600000),
      exam: eDBMS._id,
      color: '#ef4444'
    });

    await Streak.create({
      user: user._id,
      currentStreak: 12,
      longestStreak: 14,
      lastStudyDate: yesterdayStr,
      history: [
        { date: yesterdayStr, completedMinutes: 45 },
        { date: todayStr, completedMinutes: 0 }
      ]
    });

    await LearningDNA.create({
      user: user._id,
      peakTime: '7:00 PM – 9:00 PM',
      averageSessionDurationMinutes: 35,
      bestPerformingDays: ['Tuesday', 'Thursday', 'Saturday'],
      averageFocusDuration: 32,
      revisionBehavior: 'Spaced repetition after 48 hours',
      completionConsistencyScore: 84,
      strongestSubject: 'Programming & Data Structures',
      weakestSubject: 'Operating Systems',
      difficultyTolerance: 'High',
      recoveryBehavior: 'Recovers within 24 hours of missed task',
      radarMetrics: {
        focusStamina: 78,
        consistency: 84,
        revisionDiscipline: 72,
        speed: 80,
        problemSolving: 70,
        retention: 76
      }
    });

    await Notification.create({
      user: user._id,
      title: '⏰ Study Session Reminder',
      message: 'You planned Deadlocks revision at 7 PM but haven\'t completed it yet.',
      type: 'reminder',
      read: false
    });

    await Notification.create({
      user: user._id,
      title: '🔥 12-Day Streak Active',
      message: 'Complete today\'s planned tasks to extend your streak to 13 days!',
      type: 'streak',
      read: false
    });

    await StudySummary.create({
      user: user._id,
      topic: 'Relational Database Normalization',
      subject: 'Database Management Systems',
      importantConcepts: [
        'Functional Dependency X -> Y',
        'Lossless-Join Decomposition',
        'Dependency Preservation Property',
        'Boyce-Codd Normal Form (BCNF)'
      ],
      keyPoints: [
        '1NF eliminates repeating groups through atomic values.',
        '2NF requires full functional dependency on the entire candidate key.',
        '3NF removes transitive dependencies.'
      ],
      commonMistakes: [
        'Confusing 3NF with BCNF when multiple overlapping candidate keys exist.',
        'Decomposing relations without verifying the lossless-join property.'
      ],
      difficultAreas: [
        'Minimal cover computation and closure of attribute sets.'
      ],
      questionsToRevise: [
        'Given R(A, B, C, D) and F = {A -> B, B -> C, C -> D}, what is the highest normal form?',
        'Can every relation be decomposed into BCNF while preserving all dependencies?'
      ],
      recommendedNextRevision: 'In 3 days',
      confidenceScore: 88
    });

    res.json({
      success: true,
      message: 'StudyFlow seed database initialized with realistic curriculum, exams, tasks, streak, and Learning DNA!',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        credentials: 'Email: student@studyflow.ai | Password: password123'
      }
    });
  } catch (error) {
    next(error);
  }
};
