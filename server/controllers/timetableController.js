import { processTimetableData } from '../services/timetableParserService.js';

export const uploadTimetable = async (req, res, next) => {
  try {
    const fileName = req.file ? req.file.originalname : 'Uploaded_Timetable.pdf';
    const result = await processTimetableData({
      userId: req.user._id,
      fileBuffer: req.file ? req.file.buffer : null,
      fileName
    });

    res.json({
      success: true,
      message: 'Timetable processed successfully! Exams and priority preparation plans have been scheduled.',
      ...result
    });
  } catch (error) {
    next(error);
  }
};
