import RecentlyAccessed from '../models/RecentlyAccessed.js';

export const getRecentlyAccessed = async (req, res, next) => {
  try {
    const items = await RecentlyAccessed.find({ user: req.user._id })
      .sort({ accessedAt: -1 })
      .limit(10);

    const formatted = items.map(item => ({
      _id: item._id,
      resourceType: item.resourceType,
      resourceId: item.resourceId,
      title: item.resourceTitle,
      resourceTitle: item.resourceTitle,
      subtitle: item.subjectName,
      subjectName: item.subjectName,
      path: item.resourceType === 'note' ? '/notes' : item.resourceType === 'subject' ? '/subjects' : item.resourceType === 'exam' ? '/exams' : item.resourceType === 'session' ? '/session' : '/dashboard',
      accessedAt: item.accessedAt
    }));

    res.json({ success: true, data: formatted, items: formatted });
  } catch (error) {
    next(error);
  }
};

export const recordRecentlyAccessed = async (req, res, next) => {
  try {
    const { resourceType, resourceId, resourceTitle, title, subjectName, subtitle } = req.body;
    const finalTitle = resourceTitle || title;
    const finalSub = subjectName || subtitle || '';
    if (!resourceType || !resourceId || !finalTitle) {
      return res.status(400).json({ success: false, message: 'Resource details required.' });
    }

    const item = await RecentlyAccessed.findOneAndUpdate(
      { user: req.user._id, resourceType, resourceId },
      {
        resourceTitle: finalTitle,
        subjectName: finalSub,
        accessedAt: new Date()
      },
      { upsert: true, new: true }
    );

    res.status(201).json({ success: true, data: item, item });
  } catch (error) {
    next(error);
  }
};
