import Note from '../models/Note.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';
import RecentlyAccessed from '../models/RecentlyAccessed.js';
import { buildNotePDF, buildSubjectNotesPDF } from '../services/pdfExportService.js';

export const getNotes = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = { user: req.user._id };

    if (req.query.subject) {
      query.subject = req.query.subject;
    }
    if (req.query.topic) {
      query.topic = req.query.topic;
    }
    if (req.query.search) {
      const regex = new RegExp(req.query.search.trim(), 'i');
      query.$or = [
        { title: regex },
        { content: regex },
        { tags: regex }
      ];
    }

    const total = await Note.countDocuments(query);
    const notes = await Note.find(query)
      .populate('subject topic')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      notes,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    });
  } catch (error) {
    next(error);
  }
};

export const getNoteById = async (req, res, next) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id })
      .populate('subject topic');

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    // Update lastAccessedAt
    note.lastAccessedAt = new Date();
    await note.save();

    // Track recently accessed
    await RecentlyAccessed.findOneAndUpdate(
      { user: req.user._id, resourceType: 'note', resourceId: note._id },
      {
        resourceTitle: note.title,
        subjectName: note.subject?.name || '',
        accessedAt: new Date()
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, note });
  } catch (error) {
    next(error);
  }
};

export const createNote = async (req, res, next) => {
  try {
    const { subject, topic, title, content, tags } = req.body;
    if (!subject || !title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Subject, Title, and Content are required to create a note.'
      });
    }

    const note = new Note({
      user: req.user._id,
      subject,
      topic: topic || null,
      title,
      content,
      tags: tags || [],
      lastAccessedAt: new Date()
    });
    await note.save();

    const populated = await Note.findById(note._id).populate('subject topic');

    // Track recently accessed
    await RecentlyAccessed.create({
      user: req.user._id,
      resourceType: 'note',
      resourceId: note._id,
      resourceTitle: note.title,
      subjectName: populated.subject?.name || '',
      accessedAt: new Date()
    });

    res.status(201).json({ success: true, note: populated });
  } catch (error) {
    next(error);
  }
};

export const updateNote = async (req, res, next) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    const { subject, topic, title, content, tags } = req.body;
    if (subject) note.subject = subject;
    if (topic !== undefined) note.topic = topic || null;
    if (title) note.title = title;
    if (content) note.content = content;
    if (tags !== undefined) note.tags = tags;
    note.lastAccessedAt = new Date();

    await note.save();
    const populated = await Note.findById(note._id).populate('subject topic');

    res.json({ success: true, note: populated });
  } catch (error) {
    next(error);
  }
};

export const deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    await RecentlyAccessed.deleteMany({ user: req.user._id, resourceId: req.params.id });

    res.json({ success: true, message: 'Note deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

export const exportNotePdf = async (req, res, next) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id })
      .populate('subject topic');

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="StudyFlow_Note_${note._id}.pdf"`);

    buildNotePDF(note, res);
  } catch (error) {
    next(error);
  }
};

export const exportSubjectNotesPdf = async (req, res, next) => {
  try {
    const subject = await Subject.findOne({ _id: req.params.subjectId, user: req.user._id });
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    const notes = await Note.find({ user: req.user._id, subject: subject._id })
      .populate('topic')
      .sort({ createdAt: 1 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="StudyFlow_${subject.name.replace(/[^a-zA-Z0-9]/g, '_')}_Notes.pdf"`);

    buildSubjectNotesPDF(subject, notes, res);
  } catch (error) {
    next(error);
  }
};
