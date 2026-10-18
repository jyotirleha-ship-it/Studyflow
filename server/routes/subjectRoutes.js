import express from 'express';
import { getSubjects, createSubject, getTopics, createTopic } from '../controllers/subjectController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/', getSubjects);
router.post('/', createSubject);
router.get('/topics', getTopics);
router.post('/topics', createTopic);

export default router;
