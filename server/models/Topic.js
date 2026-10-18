import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  name: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  estimatedMinutes: { type: Number, default: 45 },
  prerequisites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Topic' }],
  masteryScore: { type: Number, min: 0, max: 100, default: 40 },
  understandingType: { type: String, enum: ['unassessed', 'surface', 'actual', 'struggling'], default: 'unassessed' },
  confidenceRating: { type: Number, min: 1, max: 5, default: 3 },
  status: { type: String, enum: ['not_started', 'in_progress', 'completed', 'needs_revision'], default: 'not_started' },
  lastStudiedAt: { type: Date }
}, { timestamps: true });

export default mongoose.model('Topic', topicSchema);
