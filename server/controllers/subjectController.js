import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import Prerequisite from '../models/Prerequisite.js';

export const getSubjects = async (req, res, next) => {
  try {
    const subjects = await Subject.find({ user: req.user._id });
    const result = [];

    for (const sub of subjects) {
      const topics = await Topic.find({ user: req.user._id, subject: sub._id });
      const completed = topics.filter(t => t.status === 'completed' || t.masteryScore >= 75).length;
      const progress = topics.length > 0 ? Math.round((completed / topics.length) * 100) : 0;

      result.push({
        ...sub.toObject(),
        totalTopics: topics.length,
        completedTopics: completed,
        progress
      });
    }

    res.json({ success: true, subjects: result });
  } catch (error) {
    next(error);
  }
};

export const createSubject = async (req, res, next) => {
  try {
    const { name, code, color, icon, targetExamDate, priority } = req.body;
    const subject = new Subject({
      user: req.user._id,
      name,
      code,
      color: color || '#6366f1',
      icon: icon || 'book',
      targetExamDate,
      priority: priority || 'medium'
    });
    await subject.save();
    res.status(201).json({ success: true, subject });
  } catch (error) {
    next(error);
  }
};

export const getTopics = async (req, res, next) => {
  try {
    const query = { user: req.user._id };
    if (req.query.subject) query.subject = req.query.subject;

    const topics = await Topic.find(query).populate('subject prerequisites');
    const prerequisites = await Prerequisite.find({ user: req.user._id })
      .populate('sourceTopic targetTopic');

    res.json({ success: true, topics, prerequisites });
  } catch (error) {
    next(error);
  }
};

export const createTopic = async (req, res, next) => {
  try {
    const { subject, name, difficulty, estimatedMinutes, prerequisites, masteryScore } = req.body;
    const topic = new Topic({
      user: req.user._id,
      subject,
      name,
      difficulty: difficulty || 'medium',
      estimatedMinutes: estimatedMinutes || 45,
      prerequisites: prerequisites || [],
      masteryScore: masteryScore || 40
    });
    await topic.save();
    res.status(201).json({ success: true, topic });
  } catch (error) {
    next(error);
  }
};
