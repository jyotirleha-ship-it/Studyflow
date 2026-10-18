import express from 'express';
import multer from 'multer';
import { uploadTimetable } from '../controllers/timetableController.js';
import { protect } from '../middleware/authMiddleware.js';

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const router = express.Router();
router.use(protect);

router.post('/upload', upload.single('timetable'), uploadTimetable);

export default router;
