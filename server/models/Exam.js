import mongoose from 'mongoose';

const examSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  title: { type: String, required: true },
  examDate: { type: Date, required: true },
  examTime: { type: String, default: '09:00' },
  targetScore: { type: Number, default: 85 },
  riskScore: { type: Number, default: 25 },
  riskLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'low' }
}, { timestamps: true });

export default mongoose.model('Exam', examSchema);
