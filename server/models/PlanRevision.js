import mongoose from 'mongoose';

const planRevisionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  missedTaskId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudyTask' },
  reason: { type: String, required: true },
  originalSchedule: [{ type: mongoose.Schema.Types.Mixed }],
  proposedSchedule: [{ type: mongoose.Schema.Types.Mixed }],
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('PlanRevision', planRevisionSchema);
