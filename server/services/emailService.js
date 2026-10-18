import nodemailer from 'nodemailer';

// Configure nodemailer transporter using environment variables
const createTransporter = () => {
  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  const port = parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || '587');
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });
  }

  // Graceful fallback logger transporter when SMTP credentials not provided in .env
  return {
    sendMail: async (mailOptions) => {
      console.log(`\n=================== [EMAIL DISPATCH LOG] ===================`);
      console.log(`To: ${mailOptions.to}`);
      console.log(`From: ${mailOptions.from}`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log(`Body (Text Preview):\n${mailOptions.text}`);
      console.log(`============================================================\n`);
      return {
        messageId: `simulated-${Date.now()}@studyflow.ai`,
        simulated: true
      };
    }
  };
};

const transporter = createTransporter();
const EMAIL_FROM = process.env.EMAIL_FROM || 'notifications@studyflow.ai';

export const sendDailyScheduleEmail = async (user, todayTasks = []) => {
  if (!user || !user.email) return null;

  // Check user notification preferences
  if (user.notificationPreferences && user.notificationPreferences.dailySchedule === false) {
    console.log(`[Email Service] Daily schedule skipped for ${user.email} (disabled in preferences)`);
    return { skipped: true };
  }

  const taskLines = todayTasks.length > 0
    ? todayTasks.map(t => `• ${t.scheduledTime || 'Flexible'} — ${t.title} (${t.durationMinutes || 30} mins)`).join('\n')
    : '• No study tasks scheduled yet for today. Use StudyFlow to add your first goal!';

  const totalMinutes = todayTasks.reduce((acc, t) => acc + (t.durationMinutes || 0), 0);

  const textContent = `Hello ${user.name},\n\nHere is your intelligent study plan for today (${new Date().toLocaleDateString()}):\n\n${taskLines}\n\nToday's Study Target: ${totalMinutes} minutes\n\nGood luck with your study session!\nStudyFlow — Intelligent Study Planner & Personal Learning Mentor`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background: #4f46e5; padding: 24px; color: #ffffff; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">⚡ StudyFlow</h1>
        <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">Your Study Schedule for Today</p>
      </div>
      <div style="padding: 24px;">
        <p style="font-size: 16px; color: #1e293b;">Hello <strong>${user.name}</strong>,</p>
        <p style="color: #475569; font-size: 14px; line-height: 1.5;">Here is your structured study plan generated from your actual curriculum:</p>
        
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0;">
          ${todayTasks.length > 0
            ? todayTasks.map(t => `
              <div style="padding: 10px 0; border-bottom: 1px solid #edf2f7; display: flex; justify-content: space-between;">
                <div>
                  <strong style="color: #1e293b;">${t.title}</strong>
                  <div style="font-size: 12px; color: #64748b;">${t.subject?.name || 'Curriculum'}</div>
                </div>
                <div style="text-align: right;">
                  <span style="background: #e0e7ff; color: #4338ca; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">${t.scheduledTime || '19:00'}</span>
                  <div style="font-size: 12px; color: #64748b;">${t.durationMinutes || 30} mins</div>
                </div>
              </div>
            `).join('')
            : '<p style="color: #64748b; margin: 0;">No tasks scheduled yet today. Open your planner to add your goals!</p>'
          }
        </div>

        <div style="background: #f1f5f9; padding: 12px 16px; border-radius: 6px; font-size: 14px; color: #334155; margin-bottom: 20px;">
          🎯 <strong>Today\'s Study Target:</strong> ${totalMinutes} minutes
        </div>

        <p style="color: #64748b; font-size: 13px;">Consistent daily effort powers your Learning DNA and keeps your streak alive!</p>
      </div>
      <div style="background: #f8fafc; padding: 14px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
        StudyFlow Intelligent Learning Operating System • Automated Daily Schedule Dispatch
      </div>
    </div>
  `;

  return await transporter.sendMail({
    from: `"StudyFlow Mentor" <${EMAIL_FROM}>`,
    to: user.email,
    subject: `StudyFlow — Your Study Schedule for Today (${new Date().toLocaleDateString()})`,
    text: textContent,
    html: htmlContent
  });
};

export const sendStudyReminderEmail = async (user, task) => {
  if (!user || !user.email) return null;
  if (user.notificationPreferences && user.notificationPreferences.studyReminders === false) {
    return { skipped: true };
  }

  return await transporter.sendMail({
    from: `"StudyFlow Reminder" <${EMAIL_FROM}>`,
    to: user.email,
    subject: `⏰ Reminder: Time for "${task.title}"`,
    text: `Hello ${user.name},\n\nYour planned study session for "${task.title}" is due now (${task.scheduledTime || 'Today'}).\n\nOpen StudyFlow to start your Focus Mode session.\n\nHappy Learning!`,
    html: `<p>Hello <strong>${user.name}</strong>,</p><p>Your planned study session for <strong>${task.title}</strong> is scheduled for now.</p><p><a href="http://localhost:5173/session">Start Focus Session</a></p>`
  });
};

export const sendExamAlertEmail = async (user, exam, daysLeft) => {
  if (!user || !user.email) return null;
  if (user.notificationPreferences && user.notificationPreferences.examReminders === false) {
    return { skipped: true };
  }

  return await transporter.sendMail({
    from: `"StudyFlow Exam Alert" <${EMAIL_FROM}>`,
    to: user.email,
    subject: `⚠️ Exam Alert: ${exam.title} in ${daysLeft} days`,
    text: `Hello ${user.name},\n\nYour exam "${exam.title}" is scheduled in ${daysLeft} days (${new Date(exam.examDate).toLocaleDateString()}).\n\nCheck your StudyFlow Adaptive Planner for high-priority revision topics.`,
    html: `<p>Hello <strong>${user.name}</strong>,</p><p>Your exam <strong>${exam.title}</strong> is in <strong>${daysLeft} days</strong>.</p>`
  });
};

export const sendPasswordResetEmail = async (user, resetUrl, resetToken) => {
  if (!user || !user.email) return null;

  const textContent = `Hello ${user.name},\n\nYou have requested to reset your StudyFlow account password.\n\nPlease navigate to the following link or enter this code in the reset form to set a new password:\n\n${resetUrl}\n\nReset Code / Token: ${resetToken}\n\nThis reset request will expire in 30 minutes.\n\nIf you did not request this, please safely ignore this email and your password will remain unchanged.\n\n— The StudyFlow Team`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background: #4f46e5; padding: 24px; color: #ffffff; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">⚡ StudyFlow</h1>
        <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">Password Reset Request</p>
      </div>
      <div style="padding: 24px; color: #334155; line-height: 1.6;">
        <p>Hello <strong>${user.name}</strong>,</p>
        <p>You requested to reset your StudyFlow password. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${resetUrl}" style="background: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="font-size: 13px; color: #64748b;">Or copy and paste this link into your browser:</p>
        <p style="font-size: 12px; color: #4f46e5; word-break: break-all;">${resetUrl}</p>
        <div style="margin-top: 16px; padding: 12px; background: #f8fafc; border-radius: 6px; border: 1px dashed #cbd5e1;">
          <p style="margin: 0; font-size: 13px; color: #475569;">
            Reset Code / Token: <strong style="font-family: monospace; font-size: 14px; color: #1e293b;">${resetToken}</strong>
          </p>
        </div>
        <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">
          This link will expire in 30 minutes. If you did not request this change, you can safely ignore this email.
        </p>
      </div>
    </div>
  `;

  return await transporter.sendMail({
    from: `"StudyFlow Security" <${EMAIL_FROM}>`,
    to: user.email,
    subject: '🔒 Reset Your StudyFlow Password',
    text: textContent,
    html: htmlContent
  });
};
