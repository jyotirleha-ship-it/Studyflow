import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { 
    type: String, 
    required: function() { return this.oauthProvider === 'local'; } 
  },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  emailVerified: { type: Boolean, default: true },
  oauthProvider: { type: String, enum: ['local', 'google'], default: 'local' },
  oauthProviderId: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  preferredLanguage: { type: String, enum: ['en', 'ta', 'hi'], default: 'en' },
  notificationPreferences: {
    dailySchedule: { type: Boolean, default: true },
    studyReminders: { type: Boolean, default: true },
    examReminders: { type: Boolean, default: true },
    achievements: { type: Boolean, default: true },
    weeklySummary: { type: Boolean, default: false }
  },
  pushSubscription: { type: mongoose.Schema.Types.Mixed, default: null },
  avatar: { type: String, default: '' },
  targetExamsCount: { type: Number, default: 0 },
  dailyStudyGoalMinutes: { type: Number, default: 120 },
  weeklyStudyGoalHours: { type: Number, default: 15 },
  availableHoursPerDay: { type: Number, default: 4 },
  preferredStudyTime: { type: String, enum: ['morning', 'afternoon', 'evening', 'night'], default: 'evening' },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  badges: [{
    id: String,
    name: String,
    icon: String,
    description: String,
    earnedAt: { type: Date, default: Date.now }
  }],
  department: { type: String, default: 'Computer Science' },
  year: { type: String, default: '3rd Year' },
  performanceLevel: { type: String, enum: ['High', 'Medium', 'Needs Attention'], default: 'Medium' },
  studyHoursPerDay: { type: Number, default: 3 },
  interestedSubjects: { type: [String], default: ['DBMS', 'Java', 'Data Structures'] },
  studyGoals: { type: String, default: 'Placement Preparation & Core Mastery' },
  resetPasswordToken: String,
  resetPasswordExpire: Date
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.getResetPasswordToken = function () {
  // Generate random token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire time (30 minutes)
  this.resetPasswordExpire = Date.now() + 30 * 60 * 1000;

  return resetToken;
};

export default mongoose.model('User', userSchema);
