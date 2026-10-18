import mongoose from 'mongoose';

const studySummarySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topic: { type: String, required: true },
  subject: { type: String, default: 'General' },
  importantConcepts: [{ type: String }],
  keyPoints: [{ type: String }],
  commonMistakes: [{ type: String }],
  difficultAreas: [{ type: String }],
  questionsToRevise: [{ type: String }],
  recommendedNextRevision: { type: String },
  confidenceScore: { type: Number, default: 80 },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('StudySummary', studySummarySchema);
