import express from 'express';
import { logSession, getSessions, createSummary, getSummaries, exportSummaryPDF, exportWeeklyReportPDF } from '../controllers/studyController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.post('/sessions', logSession);
router.get('/sessions', getSessions);
router.post('/summary', createSummary);
router.get('/summary', getSummaries);
router.get('/summary/:id/pdf', exportSummaryPDF);
router.get('/reports/weekly/pdf', exportWeeklyReportPDF);

export default router;
