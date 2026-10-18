import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
    index: true
  },
  topic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    default: null
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  isShared: {
    type: Boolean,
    default: false
  },
  sharedWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  sharedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  sharedGroups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudyGroup'
  }],
  subjectName: {
    type: String,
    default: ''
  },
  topicName: {
    type: String,
    default: ''
  }
}, { timestamps: true });

noteSchema.index({ title: 'text', content: 'text', tags: 'text' });

export default mongoose.model('Note', noteSchema);
