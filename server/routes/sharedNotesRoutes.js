import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getSharedNotes,
  shareNote,
  updateSharedNote,
  unshareNote
} from '../controllers/sharedNotesController.js';

const router = express.Router();

router.use(protect);

router.get('/', getSharedNotes);
router.post('/:noteId/share', shareNote);
router.put('/:noteId', updateSharedNote);
router.post('/:noteId/unshare', unshareNote);

export default router;
