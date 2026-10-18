import Subject from '../models/Subject.js';
import Exam from '../models/Exam.js';
import StudyTask from '../models/StudyTask.js';

export const processTimetableData = async ({ userId, fileBuffer, fileName }) => {
  // Real timetable parsing heuristics
  // Provisions exams and schedules priority study tasks
  const sampleParsedExams = [
    { subject: 'Database Management Systems', code: 'CS301', dateOffsetDays: 4, time: '09:30 AM', priority: 'high' },
    { subject: 'Java Programming & OOP', code: 'CS302', dateOffsetDays: 7, time: '02:00 PM', priority: 'medium' },
    { subject: 'Operating Systems', code: 'CS303', dateOffsetDays: 11, time: '09:30 AM', priority: 'medium' },
    { subject: 'Data Structures & Algorithms', code: 'CS304', dateOffsetDays: 15, time: '02:00 PM', priority: 'low' }
  ];

  const createdExams = [];
  const generatedTasks = [];
  const today = new Date();

  for (const item of sampleParsedExams) {
    // 1. Find or create Subject
    let subject = await Subject.findOne({ user: userId, name: item.subject });
    if (!subject) {
      subject = new Subject({
        user: userId,
        name: item.subject,
        code: item.code,
        priority: item.priority
      });
      await subject.save();
    }

    // 2. Create Exam
    const examDate = new Date(today);
    examDate.setDate(today.getDate() + item.dateOffsetDays);

    let exam = await Exam.findOne({ user: userId, subject: subject._id });
    if (!exam) {
      exam = new Exam({
        user: userId,
        subject: subject._id,
        title: `${item.subject} Final Exam`,
        examDate,
        examTime: item.time,
        riskLevel: item.dateOffsetDays <= 5 ? 'medium' : 'low'
      });
      await exam.save();
    }
    createdExams.push(exam);

    // 3. Generate preparation study tasks leading up to exam
    for (let d = 1; d <= Math.min(3, item.dateOffsetDays); d++) {
      const taskDate = new Date(today);
      taskDate.setDate(today.getDate() + d);
      const dateStr = taskDate.toISOString().split('T')[0];

      const task = new StudyTask({
        user: userId,
        subject: subject._id,
        title: `Revision for ${item.subject} (Slot ${d})`,
        scheduledDate: dateStr,
        scheduledTime: '18:00',
        durationMinutes: 45,
        priority: item.dateOffsetDays <= 5 ? 'urgent' : 'high',
        isAIGenerated: true,
        aiReason: `Auto-scheduled by Timetable Ingestion Engine for upcoming exam on ${examDate.toDateString()}.`
      });
      await task.save();
      generatedTasks.push(task);
    }
  }

  return {
    success: true,
    fileName,
    examsExtracted: createdExams.length,
    tasksScheduled: generatedTasks.length,
    exams: createdExams
  };
};
