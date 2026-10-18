import express from 'express';
import { getExams, createExam, getExamRiskDetails } from '../controllers/examController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/', getExams);
router.post('/', createExam);
router.get('/:id/risk', getExamRiskDetails);

export default router;
