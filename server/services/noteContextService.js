import Note from '../models/Note.js';
import Subject from '../models/Subject.js';
import Topic from '../models/Topic.js';

export const searchNotes = async (userId, queryText) => {
  if (!queryText || !queryText.trim()) {
    return await Note.find({ user: userId })
      .populate('subject topic')
      .sort({ updatedAt: -1 })
      .limit(20);
  }

  // Extract keywords (filter out stop words)
  const stopWords = new Set(['explain', 'based', 'on', 'my', 'notes', 'note', 'the', 'what', 'did', 'i', 'write', 'about', 'summarize', 'show', 'all', 'a', 'an', 'is', 'in', 'and', 'for', 'of', 'to', 'me', 'please']);
  const tokens = queryText
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(t => t.length >= 2 && !stopWords.has(t));

  const searchWords = tokens.length > 0 ? tokens : [queryText.trim()];
  const wordRegexes = searchWords.map(w => new RegExp(w, 'i'));

  // Search by title, content, tags, or populated subject name
  const matchingSubjects = await Subject.find({
    user: userId,
    $or: wordRegexes.map(r => ({ name: r }))
  }).select('_id');
  const subjectIds = matchingSubjects.map(s => s._id);

  const notes = await Note.find({
    user: userId,
    $or: [
      ...wordRegexes.map(r => ({ title: r })),
      ...wordRegexes.map(r => ({ content: r })),
      ...wordRegexes.map(r => ({ tags: r })),
      { subject: { $in: subjectIds } }
    ]
  })
    .populate('subject topic')
    .sort({ updatedAt: -1 })
    .limit(20);

  if (notes.length === 0) {
    return await Note.find({ user: userId })
      .populate('subject topic')
      .sort({ updatedAt: -1 })
      .limit(5);
  }

  return notes;
};

export const getSubjectNotes = async (userId, subjectId) => {
  return await Note.find({ user: userId, subject: subjectId })
    .populate('subject topic')
    .sort({ createdAt: 1 });
};

export const getTopicNotes = async (userId, topicId) => {
  return await Note.find({ user: userId, topic: topicId })
    .populate('subject topic')
    .sort({ createdAt: 1 });
};

export const getRecentNotes = async (userId, limit = 5) => {
  return await Note.find({ user: userId })
    .populate('subject topic')
    .sort({ lastAccessedAt: -1, updatedAt: -1 })
    .limit(limit);
};

export const buildNoteContext = async (userId, queryText) => {
  const notes = await searchNotes(userId, queryText);
  if (!notes || notes.length === 0) {
    return {
      hasNotes: false,
      contextString: 'No relevant personal notes found for this inquiry.',
      notes: []
    };
  }

  const formattedNotes = notes.slice(0, 5).map(n => {
    const subName = n.subject ? n.subject.name : 'General';
    const topName = n.topic ? n.topic.name : 'General Topic';
    return `[Note Title: "${n.title}" | Subject: ${subName} | Topic: ${topName}]\nContent: ${n.content}`;
  }).join('\n\n---\n\n');

  return {
    hasNotes: true,
    count: notes.length,
    contextString: formattedNotes,
    notes
  };
};

export const extractQuestionsFromNotes = (notes, targetCount = 4) => {
  const questions = [];
  
  for (const note of notes) {
    if (questions.length >= targetCount) break;
    const content = note.content || '';
    const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 20);
    const title = note.title;
    const subjectName = note.subject?.name || 'Subject';

    if (lines.length > 0) {
      const focalLine = lines[0];
      questions.push({
        questionText: `Based on your note "${title}" in ${subjectName}: Which statement accurately reflects the note content?`,
        options: [
          focalLine,
          `The opposite assertion regarding ${title}`,
          `A generic unoptimized implementation without constraints`,
          `None of the recorded points in your notes`
        ],
        correctAnswerIndex: 0,
        explanation: `Sourced directly from your personal note "${title}": "${focalLine}"`,
        sourceNote: {
          id: note._id,
          title: note.title
        }
      });
    }
  }

  return questions;
};
