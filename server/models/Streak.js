import mongoose from 'mongoose';

const streakSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  currentStreak: { type: Number, default: 12 },
  longestStreak: { type: Number, default: 14 },
  lastStudyDate: { type: String, default: '' },
  history: [{ date: String, completedMinutes: Number }]
}, { timestamps: true });

export default mongoose.model('Streak', streakSchema);
