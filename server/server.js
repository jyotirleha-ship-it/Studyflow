import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import connectDB from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import calendarRoutes from './routes/calendarRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';
import examRoutes from './routes/examRoutes.js';
import timetableRoutes from './routes/timetableRoutes.js';
import studyRoutes from './routes/studyRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import planRoutes from './routes/planRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import notesRoutes from './routes/notesRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import recentlyAccessedRoutes from './routes/recentlyAccessedRoutes.js';
import seedRoutes from './routes/seedRoutes.js';
import connectionRoutes from './routes/connectionRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import sharedNotesRoutes from './routes/sharedNotesRoutes.js';

// Models for cron
import User from './models/User.js';
import StudyTask from './models/StudyTask.js';
import Notification from './models/Notification.js';
import { sendDailyScheduleEmail } from './services/emailService.js';
import { initCollaborationSeed } from './services/collaborationSeedService.js';

// Connect to Database
connectDB().then(() => {
  initCollaborationSeed();
});

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'StudyFlow Intelligent Study Planner & Personal Learning Mentor API',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/study', studyRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/plan', planRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/recently-accessed', recentlyAccessedRoutes);
app.use('/api/seed', seedRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/shared-notes', sharedNotesRoutes);

// Error handling middleware
app.use(errorHandler);

// Background Cron for Study Reminders (runs every 30 minutes)
cron.schedule('*/30 * * * *', async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const pendingTasks = await StudyTask.find({
      status: 'pending',
      scheduledDate: today
    });

    for (const task of pendingTasks) {
      const exists = await Notification.findOne({
        user: task.user,
        'metadata.taskId': task._id
      });

      if (!exists) {
        await Notification.create({
          user: task.user,
          title: '⏰ Study Session Reminder',
          message: `You planned "${task.title}" today at ${task.scheduledTime || '19:00'} but haven't completed it yet.`,
          type: 'reminder',
          metadata: { taskId: task._id }
        });
      }
    }
  } catch (err) {
    console.error('[Cron Reminder Error]', err.message);
  }
});

// Background Cron for Daily Study Schedule Email (runs at 07:00 AM daily)
cron.schedule('0 7 * * *', async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const users = await User.find({
      isActive: true,
      'notificationPreferences.dailySchedule': { $ne: false }
    });

    for (const user of users) {
      const todayTasks = await StudyTask.find({
        user: user._id,
        scheduledDate: today
      }).populate('subject topic');

      if (todayTasks.length > 0) {
        await sendDailyScheduleEmail(user, todayTasks);
      }
    }
  } catch (err) {
    console.error('[Cron Daily Schedule Email Error]', err.message);
  }
});

const PORT = process.env.PORT || 5000;

let server;
const startServer = (port) => {
  server = app.listen(port, () => {
    console.log(`[StudyFlow API] Server running in ${process.env.NODE_ENV || 'development'} mode on port ${port}`);
  });

  server.on('error', async (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`\n⚠️  [StudyFlow Alert] Port ${port} is currently in use by an existing process.`);
      console.log(`👉 Automatically freeing up port ${port}...\n`);
      try {
        const { execSync } = await import('child_process');
        if (process.platform === 'win32') {
          try {
            execSync(`powershell -Command "Stop-Process -Id (Get-NetTCPConnection -LocalPort ${port}).OwningProcess -Force -ErrorAction SilentlyContinue"`, { stdio: 'ignore' });
          } catch (e) {
            try {
              const stdout = execSync(`netstat -ano | findstr :${port}`).toString();
              const lines = stdout.trim().split('\n');
              for (const line of lines) {
                const parts = line.trim().split(/\s+/);
                const pid = parts[parts.length - 1];
                if (pid && pid !== '0' && pid !== process.pid.toString()) {
                  execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
                }
              }
            } catch (e2) {}
          }
        } else {
          try {
            execSync(`fuser -k ${port}/tcp`, { stdio: 'ignore' });
          } catch (e) {}
        }

        setTimeout(() => {
          startServer(port);
        }, 1200);
      } catch (recoveryErr) {
        console.error(`Could not auto-clear port ${port}. Please run in PowerShell:`);
        console.error(`Stop-Process -Id (Get-NetTCPConnection -LocalPort ${port}).OwningProcess -Force\n`);
        process.exit(1);
      }
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });

  return server;
};

server = startServer(PORT);

export { app, server };
export default app;
