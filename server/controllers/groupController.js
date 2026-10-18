import StudyGroup from '../models/StudyGroup.js';
import GroupMessage from '../models/GroupMessage.js';
import ActivityLog from '../models/ActivityLog.js';
import Notification from '../models/Notification.js';

// Get all study groups (user's groups & discoverable public groups)
export const getGroups = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { search = '', subject = '' } = req.query;

    const query = {};
    if (search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { subject: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } }
      ];
    }
    if (subject && subject !== 'all') {
      query.subject = { $regex: subject, $options: 'i' };
    }

    const groups = await StudyGroup.find(query)
      .populate('creator', 'name email avatar')
      .populate('members.user', 'name email avatar department')
      .sort({ updatedAt: -1 })
      .lean();

    const formatted = groups.map(g => {
      const isMember = (g.members || []).some(
        m => m.user?._id?.toString() === currentUserId.toString()
      );
      const isAdmin = g.creator?._id?.toString() === currentUserId.toString();

      return {
        ...g,
        memberCount: g.members?.length || 0,
        isMember,
        isAdmin
      };
    });

    res.json({
      success: true,
      groups: formatted
    });
  } catch (error) {
    next(error);
  }
};

// Get single group details
export const getGroupById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id;

    const group = await StudyGroup.findById(id)
      .populate('creator', 'name email avatar department')
      .populate('members.user', 'name email avatar department year')
      .populate('announcements.author', 'name avatar')
      .lean();

    if (!group) {
      return res.status(404).json({ success: false, message: 'Study group not found' });
    }

    const isMember = (group.members || []).some(
      m => m.user?._id?.toString() === currentUserId.toString()
    );

    res.json({
      success: true,
      group: {
        ...group,
        isMember,
        memberCount: group.members?.length || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create a new study group
export const createGroup = async (req, res, next) => {
  try {
    const { name, subject, description = '' } = req.body;
    const currentUserId = req.user._id;

    if (!name || !subject) {
      return res.status(400).json({ success: false, message: 'Group name and subject are required' });
    }

    const group = await StudyGroup.create({
      name: name.trim(),
      subject: subject.trim(),
      description: description.trim(),
      creator: currentUserId,
      members: [{
        user: currentUserId,
        role: 'admin',
        joinedAt: new Date()
      }],
      announcements: [{
        title: 'Welcome to ' + name.trim(),
        content: `Welcome everyone to the ${subject.trim()} study cohort! Let's collaborate, discuss doubts, and share notes.`,
        author: currentUserId,
        createdAt: new Date()
      }]
    });

    await ActivityLog.create({
      user: currentUserId,
      action: 'STUDY_GROUP_CREATED',
      details: { groupId: group._id, groupName: group.name, subject: group.subject }
    });

    res.status(201).json({
      success: true,
      message: 'Study group created successfully',
      group
    });
  } catch (error) {
    next(error);
  }
};

// Join a study group
export const joinGroup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id;

    const group = await StudyGroup.findById(id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Study group not found' });
    }

    const alreadyMember = group.members.some(
      m => m.user.toString() === currentUserId.toString()
    );

    if (alreadyMember) {
      return res.status(400).json({ success: false, message: 'Already a member of this group' });
    }

    group.members.push({
      user: currentUserId,
      role: 'member',
      joinedAt: new Date()
    });
    await group.save();

    await ActivityLog.create({
      user: currentUserId,
      action: 'STUDY_GROUP_JOINED',
      details: { groupId: group._id, groupName: group.name }
    });

    res.json({
      success: true,
      message: `Joined ${group.name} successfully`,
      group
    });
  } catch (error) {
    next(error);
  }
};

// Leave a study group
export const leaveGroup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user._id;

    const group = await StudyGroup.findById(id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Study group not found' });
    }

    group.members = group.members.filter(
      m => m.user.toString() !== currentUserId.toString()
    );
    await group.save();

    res.json({
      success: true,
      message: `Left ${group.name} successfully`
    });
  } catch (error) {
    next(error);
  }
};

// Add announcement to study group
export const addAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const currentUserId = req.user._id;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    const group = await StudyGroup.findById(id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Study group not found' });
    }

    const isMember = group.members.some(
      m => m.user.toString() === currentUserId.toString()
    );
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Must be a member to post announcements' });
    }

    group.announcements.unshift({
      title,
      content,
      author: currentUserId,
      createdAt: new Date()
    });
    await group.save();

    res.status(201).json({
      success: true,
      message: 'Announcement posted',
      announcements: group.announcements
    });
  } catch (error) {
    next(error);
  }
};

// Get group chat messages
export const getGroupMessages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const messages = await GroupMessage.find({ group: id })
      .populate('sender', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({
      success: true,
      messages: messages.reverse()
    });
  } catch (error) {
    next(error);
  }
};

// Send group chat message
export const sendGroupMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const currentUserId = req.user._id;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Message content cannot be empty' });
    }

    const group = await StudyGroup.findById(id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Study group not found' });
    }

    const isMember = group.members.some(
      m => m.user.toString() === currentUserId.toString()
    );
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Join group first to chat' });
    }

    const message = await GroupMessage.create({
      group: id,
      sender: currentUserId,
      content: content.trim()
    });

    const populated = await GroupMessage.findById(message._id)
      .populate('sender', 'name email avatar')
      .lean();

    res.status(201).json({
      success: true,
      message: populated
    });
  } catch (error) {
    next(error);
  }
};
