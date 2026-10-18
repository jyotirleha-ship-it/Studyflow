import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  code: { type: String, default: '' },
  color: { type: String, default: '#6366f1' },
  icon: { type: String, default: 'book' },
  targetExamDate: { type: Date },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' }
}, { timestamps: true });

export default mongoose.model('Subject', subjectSchema);
