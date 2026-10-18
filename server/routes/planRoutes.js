import express from 'express';
import { getNextAction, getPlanRepair, submitPlanRepairAction, runWhatIfSkipSimulator } from '../controllers/planController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/next-action', getNextAction);
router.post('/repair', getPlanRepair);
router.post('/repair/apply', submitPlanRepairAction);
router.post('/what-if', runWhatIfSkipSimulator);

export default router;
