import mongoose from 'mongoose';

const learningDNASchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  peakTime: { type: String, default: '7:00 PM – 9:00 PM' },
  averageSessionDurationMinutes: { type: Number, default: 35 },
  bestPerformingDays: [{ type: String }],
  averageFocusDuration: { type: Number, default: 32 },
  revisionBehavior: { type: String, default: 'Spaced repetition within 48-72 hours' },
  completionConsistencyScore: { type: Number, default: 82 },
  strongestSubject: { type: String, default: 'Programming & Data Structures' },
  weakestSubject: { type: String, default: 'Operating Systems' },
  difficultyTolerance: { type: String, default: 'High' },
  recoveryBehavior: { type: String, default: 'Recovers missed topics on subsequent day' },
  radarMetrics: {
    focusStamina: { type: Number, default: 78 },
    consistency: { type: Number, default: 84 },
    revisionDiscipline: { type: Number, default: 72 },
    speed: { type: Number, default: 80 },
    problemSolving: { type: Number, default: 70 },
    retention: { type: Number, default: 76 }
  }
}, { timestamps: true });

export default mongoose.model('LearningDNA', learningDNASchema);
