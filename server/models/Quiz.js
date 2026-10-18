import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
  topicName: { type: String, required: true },
  title: { type: String, required: true },
  questions: [{
    questionText: String,
    questionType: { type: String, enum: ['recall', 'application'], default: 'recall' },
    options: [String],
    correctAnswerIndex: Number,
    explanation: String,
    hint: String
  }],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Quiz', quizSchema);
