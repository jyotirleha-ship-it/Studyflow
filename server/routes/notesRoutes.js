import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  exportNotePdf,
  exportSubjectNotesPdf
} from '../controllers/notesController.js';

const router = express.Router();

router.use(protect);

router.get('/', getNotes);
router.post('/', createNote);
router.get('/:id', getNoteById);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);
router.get('/:id/pdf', exportNotePdf);
router.get('/subject/:subjectId/pdf', exportSubjectNotesPdf);

export default router;
