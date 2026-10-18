import express from 'express';
import { getStudyAnalytics, getLearningDNAData } from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/', getStudyAnalytics);
router.get('/learning-dna', getLearningDNAData);

export default router;
