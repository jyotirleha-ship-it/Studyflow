import express from 'express';
import { createAdaptiveQuiz, submitQuizAttempt, getQuizAttempts } from '../controllers/quizController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.post('/generate', createAdaptiveQuiz);
router.post('/submit', submitQuizAttempt);
router.get('/attempts', getQuizAttempts);

export default router;
