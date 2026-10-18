import Connection from '../models/Connection.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import ActivityLog from '../models/ActivityLog.js';

// Search students by keyword (name, email, department, subject)
export const searchStudents = async (req, res, next) => {
  try {
    const { q = '', department = '', year = '' } = req.query;
    const currentUserId = req.user._id;

    const query = {
      _id: { $ne: currentUserId },
      role: 'user',
      isActive: true
    };

    if (q.trim()) {
      query.$or = [
        { name: { $regex: q.trim(), $options: 'i' } },
        { email: { $regex: q.trim(), $options: 'i' } },
        { department: { $regex: q.trim(), $options: 'i' } },
        { interestedSubjects: { $regex: q.trim(), $options: 'i' } }
      ];
    }

    if (department) {
      query.department = department;
    }

    if (year) {
      query.year = year;
    }

    const students = await User.find(query)
      .select('name email avatar department year performanceLevel studyHoursPerDay interestedSubjects studyGoals')
      .limit(30)
      .lean();

    // Attach connection status with current user
    const existingConnections = await Connection.find({
      $or: [
        { requester: currentUserId, recipient: { $in: students.map(s => s._id) } },
        { recipient: currentUserId, requester: { $in: students.map(s => s._id) } }
      ]
    }).lean();

    const connectionMap = {};
    for (const conn of existingConnections) {
      const otherId = conn.requester.toString() === currentUserId.toString()
        ? conn.recipient.toString()
        : conn.requester.toString();

      let relation = 'none';
      if (conn.status === 'accepted') {
        relation = 'connected';
      } else if (conn.status === 'pending') {
        relation = conn.requester.toString() === currentUserId.toString() ? 'pending_sent' : 'pending_received';
      } else {
        relation = 'rejected';
      }

      connectionMap[otherId] = {
        connectionId: conn._id,
        relation
      };
    }

    const results = students.map(s => ({
      ...s,
      connectionStatus: connectionMap[s._id.toString()]?.relation || 'none',
      connectionId: connectionMap[s._id.toString()]?.connectionId || null
    }));

    res.json({
      success: true,
      students: results
    });
  } catch (error) {
    next(error);
  }
};

// Get current user's connections (accepted & pending)
export const getConnections = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;

    const connections = await Connection.find({
      $or: [
        { requester: currentUserId },
        { recipient: currentUserId }
      ]
    })
      .populate('requester', 'name email avatar department year performanceLevel studyHoursPerDay interestedSubjects')
      .populate('recipient', 'name email avatar department year performanceLevel studyHoursPerDay interestedSubjects')
      .sort({ updatedAt: -1 })
      .lean();

    const accepted = [];
    const pendingIncoming = [];
    const pendingOutgoing = [];

    for (const conn of connections) {
      const isRequester = conn.requester._id.toString() === currentUserId.toString();
      const partner = isRequester ? conn.recipient : conn.requester;

      if (conn.status === 'accepted') {
        accepted.push({
          connectionId: conn._id,
          partner,
          connectedSince: conn.updatedAt
        });
      } else if (conn.status === 'pending') {
        if (isRequester) {
          pendingOutgoing.push({
            connectionId: conn._id,
            partner,
            sentAt: conn.createdAt
          });
        } else {
          pendingIncoming.push({
            connectionId: conn._id,
            partner,
            sentAt: conn.createdAt
          });
        }
      }
    }

    res.json({
      success: true,
      connected: accepted,
      pendingIncoming,
      pendingOutgoing
    });
  } catch (error) {
    next(error);
  }
};

// Send connection request
export const sendConnectionRequest = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { recipientId, notes = '' } = req.body;

    if (!recipientId) {
      return res.status(400).json({ success: false, message: 'Recipient ID is required' });
    }

    if (recipientId === currentUserId.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot connect with yourself' });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'Recipient student not found' });
    }

    // Check existing
    let connection = await Connection.findOne({
      $or: [
        { requester: currentUserId, recipient: recipientId },
        { requester: recipientId, recipient: currentUserId }
      ]
    });

    if (connection) {
      if (connection.status === 'accepted') {
        return res.status(400).json({ success: false, message: 'Already connected as study partners' });
      }
      if (connection.status === 'pending') {
        return res.status(400).json({ success: false, message: 'Connection request already pending' });
      }
      // If rejected, allow re-request
      connection.status = 'pending';
      connection.requester = currentUserId;
      connection.recipient = recipientId;
      connection.notes = notes;
      await connection.save();
    } else {
      connection = await Connection.create({
        requester: currentUserId,
        recipient: recipientId,
        status: 'pending',
        notes
      });
    }

    // Send notification to recipient
    await Notification.create({
      user: recipientId,
      title: '🤝 New Study Partner Request',
      message: `${req.user.name} sent you a study partner connection request.`,
      type: 'social',
      metadata: { connectionId: connection._id, requesterId: currentUserId }
    });

    // Log Activity
    await ActivityLog.create({
      user: currentUserId,
      action: 'CONNECTION_REQUEST_SENT',
      details: { recipientId, recipientName: recipient.name }
    });

    res.status(201).json({
      success: true,
      message: 'Connection request sent successfully',
      connection
    });
  } catch (error) {
    next(error);
  }
};

// Accept or Reject connection request
export const respondConnectionRequest = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const { id } = req.params;
    const { action } = req.body; // 'accept' or 'reject'

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action must be accept or reject' });
    }

    const connection = await Connection.findById(id).populate('requester', 'name email');
    if (!connection) {
      return res.status(404).json({ success: false, message: 'Connection request not found' });
    }

    if (connection.recipient.toString() !== currentUserId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to respond to this request' });
    }

    connection.status = action === 'accept' ? 'accepted' : 'rejected';
    await connection.save();

    if (action === 'accept') {
      await Notification.create({
        user: connection.requester._id,
        title: '🎉 Study Partner Connected!',
        message: `${req.user.name} accepted your study partner request. You can now share notes and study together!`,
        type: 'social',
        metadata: { connectionId: connection._id, partnerId: currentUserId }
      });
    }

    // Log Activity
    await ActivityLog.create({
      user: currentUserId,
      action: action === 'accept' ? 'CONNECTION_ACCEPTED' : 'CONNECTION_REJECTED',
      details: { connectionId: connection._id, requesterId: connection.requester._id }
    });

    res.json({
      success: true,
      message: `Connection request ${action}ed successfully`,
      connection
    });
  } catch (error) {
    next(error);
  }
};

// Study Partner Recommendation Engine
export const getRecommendations = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const currentUser = await User.findById(currentUserId).lean();

    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get all existing connections/pending
    const existing = await Connection.find({
      $or: [{ requester: currentUserId }, { recipient: currentUserId }]
    }).lean();

    const excludedIds = [
      currentUserId.toString(),
      ...existing.map(c => c.requester.toString() === currentUserId.toString() ? c.recipient.toString() : c.requester.toString())
    ];

    // Find other active students
    const candidates = await User.find({
      _id: { $nin: excludedIds },
      role: 'user',
      isActive: true
    })
      .select('name email avatar department year performanceLevel studyHoursPerDay interestedSubjects studyGoals')
      .lean();

    const mySubjects = (currentUser.interestedSubjects || []).map(s => s.toLowerCase().trim());
    const myHours = currentUser.studyHoursPerDay || 3;
    const myLevel = currentUser.performanceLevel || 'Medium';
    const myDept = (currentUser.department || '').toLowerCase().trim();
    const myYear = (currentUser.year || '').toLowerCase().trim();

    const scored = candidates.map(candidate => {
      let score = 50; // base score
      const reasons = [];

      // 1. Subject interest overlap
      const candSubjects = (candidate.interestedSubjects || []).map(s => s.toLowerCase().trim());
      const commonSubjects = candSubjects.filter(s => mySubjects.includes(s));

      if (commonSubjects.length > 0) {
        score += 25;
        const formatted = commonSubjects.map(s => s.toUpperCase()).join(', ');
        reasons.push(`Interested in ${formatted}`);
      } else if (candSubjects.length > 0) {
        reasons.push(`Explores ${candSubjects[0].toUpperCase()}`);
      }

      // 2. Study hours similarity (within ±1.5 hours)
      const candHours = candidate.studyHoursPerDay || 3;
      const hoursDiff = Math.abs(candHours - myHours);
      if (hoursDiff <= 1.5) {
        score += 15;
        reasons.push(`Studies ${candHours} hours/day (matches your schedule)`);
      } else {
        reasons.push(`Active learner (${candHours}h/day)`);
      }

      // 3. Similar performance level
      const candLevel = candidate.performanceLevel || 'Medium';
      if (candLevel === myLevel) {
        score += 10;
        reasons.push(`Similar academic pace (${candLevel} tier)`);
      }

      // 4. Same department / year
      const candDept = (candidate.department || '').toLowerCase().trim();
      const candYear = (candidate.year || '').toLowerCase().trim();

      if (myDept && candDept && myDept === candDept) {
        score += 10;
        reasons.push(`Same department: ${candidate.department}`);
      }
      if (myYear && candYear && myYear === candYear) {
        score += 5;
        reasons.push(`Classmate (${candidate.year})`);
      }

      const matchPercentage = Math.min(Math.round(score), 98);

      return {
        _id: candidate._id,
        name: candidate.name,
        email: candidate.email,
        avatar: candidate.avatar,
        department: candidate.department,
        year: candidate.year,
        performanceLevel: candidate.performanceLevel,
        studyHoursPerDay: candidate.studyHoursPerDay,
        interestedSubjects: candidate.interestedSubjects,
        studyGoals: candidate.studyGoals,
        matchScore: matchPercentage,
        reasons: reasons.slice(0, 3)
      };
    });

    // Sort by highest match score
    scored.sort((a, b) => b.matchScore - a.matchScore);

    res.json({
      success: true,
      recommendations: scored.slice(0, 12)
    });
  } catch (error) {
    next(error);
  }
};
