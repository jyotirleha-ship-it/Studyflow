import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getGroups,
  getGroupById,
  createGroup,
  joinGroup,
  leaveGroup,
  addAnnouncement,
  getGroupMessages,
  sendGroupMessage
} from '../controllers/groupController.js';

const router = express.Router();

router.use(protect);

router.get('/', getGroups);
router.post('/', createGroup);
router.get('/:id', getGroupById);
router.post('/:id/join', joinGroup);
router.post('/:id/leave', leaveGroup);
router.post('/:id/announcements', addAnnouncement);
router.get('/:id/messages', getGroupMessages);
router.post('/:id/messages', sendGroupMessage);

export default router;
