import mongoose from 'mongoose';

const studyTaskSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
  scheduledDate: { type: String, required: true }, // YYYY-MM-DD
  scheduledTime: { type: String, default: '19:00' },
  durationMinutes: { type: Number, default: 30 },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  status: { type: String, enum: ['pending', 'in_progress', 'completed', 'missed'], default: 'pending' },
  isAIGenerated: { type: Boolean, default: false },
  aiReason: { type: String, default: '' },
  completedAt: { type: Date }
}, { timestamps: true });

export default mongoose.model('StudyTask', studyTaskSchema);
