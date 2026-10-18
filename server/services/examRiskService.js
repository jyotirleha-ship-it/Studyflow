import Exam from '../models/Exam.js';
import Topic from '../models/Topic.js';
import StudySession from '../models/StudySession.js';

export const calculateExamRisk = async (examId, userId) => {
  const exam = await Exam.findOne({ _id: examId, user: userId }).populate('subject');
  if (!exam) throw new Error('Exam not found');

  const now = new Date();
  const examDate = new Date(exam.examDate);
  const daysLeft = Math.max(1, Math.ceil((examDate - now) / (1000 * 60 * 60 * 24)));

  // Topics for this subject
  const topics = await Topic.find({ user: userId, subject: exam.subject._id });
  const totalTopics = topics.length || 1;
  const completedTopics = topics.filter(t => t.status === 'completed' || t.masteryScore >= 70).length;
  const syllabusCompletionRate = (completedTopics / totalTopics) * 100;

  // Average mastery
  const avgMastery = topics.reduce((acc, t) => acc + (t.masteryScore || 40), 0) / totalTopics;

  // Recent study sessions
  const sessions = await StudySession.find({ user: userId, subject: exam.subject._id });
  const totalHours = sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0) / 60;

  // Risk calculation formula (0 - 100%)
  // High days left -> lower risk; low syllabus completion -> higher risk; low mastery -> higher risk
  let riskScore = 100;
  riskScore -= Math.min(30, (syllabusCompletionRate * 0.3));
  riskScore -= Math.min(30, (avgMastery * 0.3));
  riskScore -= Math.min(20, (daysLeft * 2));
  riskScore -= Math.min(20, (totalHours * 3));

  riskScore = Math.max(5, Math.min(95, Math.round(riskScore)));

  let riskLevel = 'low';
  if (riskScore >= 60) riskLevel = 'high';
  else if (riskScore >= 35) riskLevel = 'medium';

  exam.riskScore = riskScore;
  exam.riskLevel = riskLevel;
  await exam.save();

  return {
    examTitle: exam.title,
    subject: exam.subject.name,
    daysLeft,
    riskScore,
    riskLevel,
    factors: [
      { name: 'Syllabus Completion', value: `${Math.round(syllabusCompletionRate)}%`, status: syllabusCompletionRate > 65 ? 'good' : 'warning' },
      { name: 'Average Topic Mastery', value: `${Math.round(avgMastery)}%`, status: avgMastery > 60 ? 'good' : 'warning' },
      { name: 'Time to Exam', value: `${daysLeft} day(s)`, status: daysLeft > 7 ? 'good' : 'urgent' },
      { name: 'Subject Study Hours Logged', value: `${totalHours.toFixed(1)} hrs`, status: totalHours > 5 ? 'good' : 'warning' }
    ]
  };
};
