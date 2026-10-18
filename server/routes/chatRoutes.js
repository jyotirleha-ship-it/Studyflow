import express from 'express';
import { sendMessage, getHistory, acceptSuggestedTask, acceptSuggestedSchedule } from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.post('/', sendMessage);
router.get('/history', getHistory);
router.post('/accept-task', acceptSuggestedTask);
router.post('/accept-schedule', acceptSuggestedSchedule);

export default router;
