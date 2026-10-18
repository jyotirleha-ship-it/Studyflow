import mongoose from 'mongoose';

const prerequisiteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  sourceTopic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
  targetTopic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
  dependencyStrength: { type: String, enum: ['soft', 'hard'], default: 'hard' },
  explanation: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('Prerequisite', prerequisiteSchema);
