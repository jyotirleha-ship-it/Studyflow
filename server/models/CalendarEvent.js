import mongoose from 'mongoose';

const calendarEventSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  type: { type: String, enum: ['task', 'exam', 'revision', 'reminder'], default: 'task' },
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  allDay: { type: Boolean, default: false },
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'StudyTask' },
  exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' },
  color: { type: String, default: '#6366f1' }
}, { timestamps: true });

export default mongoose.model('CalendarEvent', calendarEventSchema);
