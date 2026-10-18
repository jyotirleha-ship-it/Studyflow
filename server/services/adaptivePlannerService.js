import Topic from '../models/Topic.js';
import Exam from '../models/Exam.js';
import StudyTask from '../models/StudyTask.js';
import Subject from '../models/Subject.js';
import Prerequisite from '../models/Prerequisite.js';

export const calculateNextBestAction = async (userId) => {
  // 1. Find upcoming exams
  const upcomingExams = await Exam.find({ user: userId, examDate: { $gte: new Date() } })
    .populate('subject')
    .sort({ examDate: 1 });

  // 2. Find weak topics (< 65 mastery)
  const weakTopics = await Topic.find({ user: userId, masteryScore: { $lt: 65 } })
    .populate('subject')
    .sort({ masteryScore: 1 });

  // 3. Check for prerequisite gaps
  const prerequisites = await Prerequisite.find({ user: userId })
    .populate('sourceTopic')
    .populate('targetTopic');

  for (const prereq of prerequisites) {
    if (prereq.sourceTopic && prereq.targetTopic) {
      if (prereq.sourceTopic.masteryScore < 55 && prereq.targetTopic.masteryScore > 50) {
        return {
          recommendedAction: `Revise Foundation: ${prereq.sourceTopic.name} (Prerequisite Gap)`,
          reason: `Your mastery in ${prereq.sourceTopic.name} is only ${prereq.sourceTopic.masteryScore}%, which is blocking higher performance in ${prereq.targetTopic.name}.`,
          priority: 'urgent',
          estimatedDuration: 25,
          deadline: 'Today',
          confidence: 94,
          topicId: prereq.sourceTopic._id,
          subjectId: prereq.sourceTopic.subject
        };
      }
    }
  }

  // 4. If an exam is within 7 days, prioritize its weakest topic
  if (upcomingExams.length > 0) {
    const nearestExam = upcomingExams[0];
    const diffDays = Math.ceil((new Date(nearestExam.examDate) - new Date()) / (1000 * 60 * 60 * 24));
    
    // Find weakest topic for this subject
    const subjectTopic = await Topic.findOne({ user: userId, subject: nearestExam.subject._id })
      .sort({ masteryScore: 1 });

    if (subjectTopic) {
      return {
        recommendedAction: `Study ${nearestExam.subject.name} — ${subjectTopic.name} for ${subjectTopic.estimatedMinutes || 30} minutes`,
        reason: `Your ${nearestExam.title} exam is in ${diffDays} days and your current mastery in ${subjectTopic.name} is ${subjectTopic.masteryScore}%.`,
        priority: diffDays <= 3 ? 'urgent' : 'high',
        estimatedDuration: subjectTopic.estimatedMinutes || 30,
        deadline: `Exam in ${diffDays} days`,
        confidence: 89,
        topicId: subjectTopic._id,
        subjectId: nearestExam.subject._id
      };
    }
  }

  // 5. Fallback to weakest general topic or default
  if (weakTopics.length > 0) {
    const topic = weakTopics[0];
    return {
      recommendedAction: `Practice ${topic.subject ? topic.subject.name : 'Curriculum'} — ${topic.name}`,
      reason: `Identified as your lowest mastery area (${topic.masteryScore}%). Practicing will directly raise your Learning DNA consistency.`,
      priority: 'medium',
      estimatedDuration: 30,
      deadline: 'Today',
      confidence: 82,
      topicId: topic._id,
      subjectId: topic.subject ? topic.subject._id : null
    };
  }

  return {
    recommendedAction: 'Complete scheduled daily study session',
    reason: 'Maintain your active study streak and reinforce weekly syllabus goals.',
    priority: 'medium',
    estimatedDuration: 30,
    deadline: 'Today',
    confidence: 80,
    topicId: null,
    subjectId: null
  };
};
