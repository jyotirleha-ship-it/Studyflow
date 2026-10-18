import Exam from '../models/Exam.js';
import CalendarEvent from '../models/CalendarEvent.js';
import { calculateExamRisk } from '../services/examRiskService.js';

export const getExams = async (req, res, next) => {
  try {
    const exams = await Exam.find({ user: req.user._id })
      .populate('subject')
      .sort({ examDate: 1 });
    
    const enriched = [];
    for (const exam of exams) {
      try {
        const riskData = await calculateExamRisk(exam._id, req.user._id);
        enriched.push({
          ...exam.toObject(),
          daysLeft: riskData.daysLeft,
          factors: riskData.factors
        });
      } catch (err) {
        enriched.push(exam.toObject());
      }
    }

    res.json({ success: true, exams: enriched });
  } catch (error) {
    next(error);
  }
};

export const createExam = async (req, res, next) => {
  try {
    const { subject, title, examDate, examTime, targetScore } = req.body;
    const exam = new Exam({
      user: req.user._id,
      subject,
      title,
      examDate: new Date(examDate),
      examTime: examTime || '09:00',
      targetScore: targetScore || 85
    });
    await exam.save();

    const event = new CalendarEvent({
      user: req.user._id,
      title: `EXAM: ${title}`,
      type: 'exam',
      start: new Date(examDate),
      end: new Date(new Date(examDate).getTime() + 3 * 3600000),
      exam: exam._id,
      color: '#ef4444'
    });
    await event.save();

    res.status(201).json({ success: true, exam });
  } catch (error) {
    next(error);
  }
};

export const getExamRiskDetails = async (req, res, next) => {
  try {
    const risk = await calculateExamRisk(req.params.id, req.user._id);
    res.json({ success: true, ...risk });
  } catch (error) {
    next(error);
  }
};
