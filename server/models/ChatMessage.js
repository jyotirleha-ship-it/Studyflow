import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatConversation', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content: { type: String, required: true },
  suggestedTask: {
    title: String,
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
    durationMinutes: Number,
    scheduledDate: String,
    priority: String,
    reason: String,
    status: { type: String, enum: ['pending', 'accepted', 'modified', 'rejected'], default: 'pending' }
  },
  suggestedSchedule: [{
    title: String,
    durationMinutes: Number,
    scheduledDate: String,
    scheduledTime: String,
    priority: String,
    reason: String
  }],
  scheduleStatus: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('ChatMessage', chatMessageSchema);
