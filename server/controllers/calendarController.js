import CalendarEvent from '../models/CalendarEvent.js';
import StudyTask from '../models/StudyTask.js';

export const getEvents = async (req, res, next) => {
  try {
    const events = await CalendarEvent.find({ user: req.user._id })
      .populate('task exam')
      .sort({ start: 1 });
    res.json({ success: true, events });
  } catch (error) {
    next(error);
  }
};

export const createEvent = async (req, res, next) => {
  try {
    const { title, start, end, type, color, allDay } = req.body;
    const event = new CalendarEvent({
      user: req.user._id,
      title,
      start: new Date(start),
      end: new Date(end),
      type: type || 'task',
      color: color || '#6366f1',
      allDay: allDay || false
    });
    await event.save();
    res.status(201).json({ success: true, event });
  } catch (error) {
    next(error);
  }
};

export const updateEvent = async (req, res, next) => {
  try {
    const event = await CalendarEvent.findOne({ _id: req.params.id, user: req.user._id });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    Object.assign(event, req.body);
    await event.save();

    if (event.task && req.body.start) {
      const newDateStr = new Date(req.body.start).toISOString().split('T')[0];
      await StudyTask.findByIdAndUpdate(event.task, { scheduledDate: newDateStr });
    }

    res.json({ success: true, event });
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (req, res, next) => {
  try {
    const event = await CalendarEvent.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, message: 'Event deleted' });
  } catch (error) {
    next(error);
  }
};
