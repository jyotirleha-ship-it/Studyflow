import mongoose from 'mongoose';

const studyAnalyticsSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  weekStartDate: { type: String },
  dailyHours: [{ day: String, hours: Number }],
  totalHours: { type: Number, default: 0 },
  completedTasks: { type: Number, default: 0 },
  pendingTasks: { type: Number, default: 0 },
  completionRate: { type: Number, default: 0 },
  consistencyScore: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('StudyAnalytics', studyAnalyticsSchema);
