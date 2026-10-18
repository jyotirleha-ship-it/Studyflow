import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Topic from '../models/Topic.js';
import { generateQuizQuestions } from '../services/aiService.js';
import { analyzeUnderstanding } from '../services/fakeUnderstandingService.js';

export const createAdaptiveQuiz = async (req, res, next) => {
  try {
    const { topicName, topicId, subjectId } = req.body;
    const questions = await generateQuizQuestions({ topicName: topicName || 'General Topic' });

    const quiz = new Quiz({
      user: req.user._id,
      topicName: topicName || 'Adaptive Understanding Check',
      topic: topicId || null,
      subject: subjectId || null,
      title: `Adaptive Diagnostic: ${topicName || 'Topic Understanding'}`,
      questions
    });
    await quiz.save();

    res.status(201).json({ success: true, quiz });
  } catch (error) {
    next(error);
  }
};

export const submitQuizAttempt = async (req, res, next) => {
  try {
    const { quizId, answers, timeSpentSeconds, hintsUsed } = req.body;
    const quiz = await Quiz.findOne({ _id: quizId, user: req.user._id });
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

    let recallCorrect = 0, recallTotal = 0;
    let appCorrect = 0, appTotal = 0;

    quiz.questions.forEach((q, idx) => {
      const studentAnswer = answers[idx];
      const isCorrect = studentAnswer === q.correctAnswerIndex;

      if (q.questionType === 'application') {
        appTotal++;
        if (isCorrect) appCorrect++;
      } else {
        recallTotal++;
        if (isCorrect) recallCorrect++;
      }
    });

    const recallAccuracy = recallTotal > 0 ? Math.round((recallCorrect / recallTotal) * 100) : 100;
    const applicationAccuracy = appTotal > 0 ? Math.round((appCorrect / appTotal) * 100) : 0;
    const overallScore = Math.round(((recallCorrect + appCorrect) / quiz.questions.length) * 100);

    const diagnosis = analyzeUnderstanding({
      recallAccuracy,
      applicationAccuracy,
      hintsUsedCount: hintsUsed || 0
    });

    const attempt = new QuizAttempt({
      quiz: quiz._id,
      user: req.user._id,
      topicName: quiz.topicName,
      totalQuestions: quiz.questions.length,
      recallAccuracy,
      applicationAccuracy,
      overallScore,
      totalTimeSeconds: timeSpentSeconds || 60,
      hintsUsedCount: hintsUsed || 0,
      diagnosis
    });
    await attempt.save();

    if (quiz.topic) {
      await Topic.findByIdAndUpdate(quiz.topic, {
        understandingType: diagnosis.type,
        $inc: { masteryScore: diagnosis.masteryAdjustment || 0 }
      });
    }

    res.json({
      success: true,
      attempt,
      diagnosis
    });
  } catch (error) {
    next(error);
  }
};

export const getQuizAttempts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await QuizAttempt.countDocuments({ user: req.user._id });
    const attempts = await QuizAttempt.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      data: attempts,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    });
  } catch (error) {
    next(error);
  }
};
