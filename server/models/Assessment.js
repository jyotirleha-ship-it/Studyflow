import mongoose from 'mongoose';

const assessmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  durationMinutes: {
    type: Number,
    default: 30
  },
  totalQuestions: {
    type: Number,
    default: 5
  },
  passingScore: {
    type: Number,
    default: 60
  },
  questions: [{
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctOptionIndex: { type: Number, required: true, default: 0 },
    explanation: { type: String, default: '' }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

export default mongoose.model('Assessment', assessmentSchema);
