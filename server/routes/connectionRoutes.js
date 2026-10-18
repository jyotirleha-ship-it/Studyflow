import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  searchStudents,
  getConnections,
  sendConnectionRequest,
  respondConnectionRequest,
  getRecommendations
} from '../controllers/connectionController.js';

const router = express.Router();

router.use(protect);

router.get('/search', searchStudents);
router.get('/', getConnections);
router.get('/recommendations', getRecommendations);
router.post('/request', sendConnectionRequest);
router.patch('/request/:id', respondConnectionRequest);

export default router;
