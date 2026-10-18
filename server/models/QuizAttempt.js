import mongoose from 'mongoose';

const quizAttemptSchema = new mongoose.Schema({
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topicName: { type: String, default: '' },
  totalQuestions: { type: Number, required: true },
  recallAccuracy: { type: Number, default: 0 },
  applicationAccuracy: { type: Number, default: 0 },
  overallScore: { type: Number, default: 0 },
  totalTimeSeconds: { type: Number, default: 0 },
  hintsUsedCount: { type: Number, default: 0 },
  retriesCount: { type: Number, default: 0 },
  diagnosis: {
    type: { type: String, enum: ['surface_understanding', 'actual_understanding', 'struggling', 'mastered'] },
    message: String,
    recommendation: String
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('QuizAttempt', quizAttemptSchema);
