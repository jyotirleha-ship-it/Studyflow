import mongoose from 'mongoose';

const recentlyAccessedSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  resourceType: {
    type: String,
    enum: ['subject', 'topic', 'exam', 'summary', 'session', 'note', 'planner'],
    required: true
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  resourceTitle: {
    type: String,
    required: true
  },
  subjectName: {
    type: String,
    default: ''
  },
  accessedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { timestamps: true });

// Ensure compound index for fast lookups per user and resource
recentlyAccessedSchema.index({ user: 1, accessedAt: -1 });

export default mongoose.model('RecentlyAccessed', recentlyAccessedSchema);
