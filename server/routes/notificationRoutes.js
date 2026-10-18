import express from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getNotificationPreferences,
  updateNotificationPreferences,
  triggerDailyScheduleEmail,
  subscribePushNotification
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/', getNotifications);
router.patch('/:id/read', markAsRead);
router.patch('/read-all', markAllAsRead);
router.get('/preferences', getNotificationPreferences);
router.put('/preferences', updateNotificationPreferences);
router.post('/send-daily-schedule', triggerDailyScheduleEmail);
router.post('/subscribe-push', subscribePushNotification);

export default router;
