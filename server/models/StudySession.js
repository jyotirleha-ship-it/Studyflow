import mongoose from 'mongoose';

const studySessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'StudyTask' },
  durationMinutes: { type: Number, required: true },
  breakDurationMinutes: { type: Number, default: 5 },
  notes: { type: String, default: '' },
  learnedContent: { type: String, default: '' },
  difficulties: { type: String, default: '' },
  confidenceRating: { type: Number, min: 1, max: 5, default: 3 },
  difficultyRating: { type: Number, min: 1, max: 5, default: 3 },
  tabSwitchCount: { type: Number, default: 0 },
  distractionCount: { type: Number, default: 0 },
  focusScore: { type: Number, min: 0, max: 100, default: 100 },
  focusTime: { type: Number, default: 0 },
  studySessionTime: { type: Number, default: 0 },
  activeStudyTimeMinutes: { type: Number, default: 0 },
  completionStatus: { type: String, enum: ['completed', 'partial', 'interrupted'], default: 'completed' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('StudySession', studySessionSchema);
