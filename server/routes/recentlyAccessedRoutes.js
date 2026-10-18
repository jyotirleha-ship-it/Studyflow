import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getRecentlyAccessed, recordRecentlyAccessed } from '../controllers/recentlyAccessedController.js';

const router = express.Router();

router.use(protect);

router.get('/', getRecentlyAccessed);
router.post('/', recordRecentlyAccessed);

export default router;
