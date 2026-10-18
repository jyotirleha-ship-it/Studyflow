import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/adminMiddleware.js';
import {
  getAdminStats,
  getAdminUsers,
  toggleUserActive,
  getPerformanceRiskMetrics,
  getAssessments,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  broadcastNotification,
  getActivityLogs
} from '../controllers/adminController.js';

const router = express.Router();

// All routes require both valid JWT and admin role
router.use(protect, requireAdmin);

router.get('/stats', getAdminStats);
router.get('/users', getAdminUsers);
router.patch('/users/:id/toggle-active', toggleUserActive);

// AI Performance & Risk
router.get('/performance-risk', getPerformanceRiskMetrics);

// Assessments CRUD
router.get('/assessments', getAssessments);
router.post('/assessments', createAssessment);
router.put('/assessments/:id', updateAssessment);
router.delete('/assessments/:id', deleteAssessment);

// Broadcast notifications
router.post('/broadcast', broadcastNotification);

// Activity logs
router.get('/activity-logs', getActivityLogs);

export default router;
