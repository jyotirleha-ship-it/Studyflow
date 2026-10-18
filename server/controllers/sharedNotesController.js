import Note from '../models/Note.js';
import User from '../models/User.js';
import StudyGroup from '../models/StudyGroup.js';
import Notification from '../models/Notification.js';
import ActivityLog from '../models/ActivityLog.js';

// Get notes shared with current user and shared by current user
export const getSharedNotes = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;

    // Get groups user is in
    const userGroups = await StudyGroup.find({ 'members.user': currentUserId }).select('_id');
    const groupIds = userGroups.map(g => g._id);

    // Notes shared with me
    const sharedWithMe = await Note.find({
      $or: [
        { sharedWith: currentUserId },
        { sharedGroups: { $in: groupIds } }
      ],
      user: { $ne: currentUserId }
    })
      .populate('user', 'name email avatar department')
      .populate('sharedBy', 'name email avatar department')
      .populate('subject', 'name color code')
      .populate('topic', 'name')
      .populate('sharedGroups', 'name subject')
      .sort({ updatedAt: -1 })
      .lean();

    // Notes shared by me
    const sharedByMe = await Note.find({
      user: currentUserId,
      isShared: true
    })
      .populate('sharedWith', 'name email avatar department')
      .populate('sharedGroups', 'name subject')
      .populate('subject', 'name color code')
      .populate('topic', 'name')
      .sort({ updatedAt: -1 })
      .lean();

    // Format output
    const formatNote = (note) => ({
      _id: note._id,
      id: note._id,
      title: note.title,
      content: note.content,
      tags: note.tags || [],
      subject: note.subject?.name || note.subjectName || 'General',
      subjectDetails: note.subject,
      topic: note.topic?.name || note.topicName || '',
      owner: note.user,
      sharedBy: note.sharedBy || note.user,
      sharedWith: note.sharedWith || [],
      sharedGroups: note.sharedGroups || [],
      isShared: note.isShared,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt
    });

    res.json({
      success: true,
      sharedWithMe: sharedWithMe.map(formatNote),
      sharedByMe: sharedByMe.map(formatNote)
    });
  } catch (error) {
    next(error);
  }
};

// Share an existing note with students or groups
export const shareNote = async (req, res, next) => {
  try {
    const { noteId } = req.params;
    const { recipientIds = [], groupIds = [] } = req.body;
    const currentUserId = req.user._id;

    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    if (note.user.toString() !== currentUserId.toString()) {
      return res.status(403).json({ success: false, message: 'Only the note creator can manage sharing' });
    }

    note.isShared = true;
    note.sharedBy = currentUserId;

    // Merge recipient IDs without duplicates
    const currentSharedWith = (note.sharedWith || []).map(id => id.toString());
    recipientIds.forEach(id => {
      if (!currentSharedWith.includes(id) && id !== currentUserId.toString()) {
        note.sharedWith.push(id);
      }
    });

    // Merge group IDs
    const currentSharedGroups = (note.sharedGroups || []).map(id => id.toString());
    groupIds.forEach(gid => {
      if (!currentSharedGroups.includes(gid)) {
        note.sharedGroups.push(gid);
      }
    });

    await note.save();

    // Send notifications to recipients
    for (const rId of recipientIds) {
      await Notification.create({
        user: rId,
        title: '📚 New Shared Study Note',
        message: `${req.user.name} shared the note "${note.title}" with you.`,
        type: 'social',
        metadata: { noteId: note._id, sharedById: currentUserId }
      });
    }

    // Log Activity
    await ActivityLog.create({
      user: currentUserId,
      action: 'NOTE_SHARED',
      details: { noteId: note._id, noteTitle: note.title, recipientsCount: recipientIds.length, groupsCount: groupIds.length }
    });

    res.json({
      success: true,
      message: 'Note shared successfully',
      note
    });
  } catch (error) {
    next(error);
  }
};

// Collaborative update of shared note
export const updateSharedNote = async (req, res, next) => {
  try {
    const { noteId } = req.params;
    const { title, content, tags } = req.body;
    const currentUserId = req.user._id;

    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    // Check if user is owner OR has shared access
    const isOwner = note.user.toString() === currentUserId.toString();
    const isSharedRecipient = (note.sharedWith || []).some(
      id => id.toString() === currentUserId.toString()
    );

    if (!isOwner && !isSharedRecipient) {
      return res.status(403).json({ success: false, message: 'You do not have permission to edit this shared note' });
    }

    if (title !== undefined) note.title = title.trim();
    if (content !== undefined) note.content = content;
    if (tags !== undefined) {
      note.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()).filter(Boolean);
    }
    note.lastAccessedAt = new Date();

    await note.save();

    await ActivityLog.create({
      user: currentUserId,
      action: 'SHARED_NOTE_UPDATED',
      details: { noteId: note._id, isOwner }
    });

    res.json({
      success: true,
      message: 'Shared note updated successfully',
      note
    });
  } catch (error) {
    next(error);
  }
};

// Unshare note
export const unshareNote = async (req, res, next) => {
  try {
    const { noteId } = req.params;
    const { recipientId, groupId, unshareAll = false } = req.body;
    const currentUserId = req.user._id;

    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    if (note.user.toString() !== currentUserId.toString()) {
      return res.status(403).json({ success: false, message: 'Only owner can unshare notes' });
    }

    if (unshareAll) {
      note.isShared = false;
      note.sharedWith = [];
      note.sharedGroups = [];
    } else {
      if (recipientId) {
        note.sharedWith = note.sharedWith.filter(id => id.toString() !== recipientId);
      }
      if (groupId) {
        note.sharedGroups = note.sharedGroups.filter(id => id.toString() !== groupId);
      }
      if (note.sharedWith.length === 0 && note.sharedGroups.length === 0) {
        note.isShared = false;
      }
    }

    await note.save();

    res.json({
      success: true,
      message: 'Note unshared successfully',
      note
    });
  } catch (error) {
    next(error);
  }
};
