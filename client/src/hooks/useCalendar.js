import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { setEvents, setView, setSelectedDate, addEvent, updateEventItem, removeEventItem } from '../redux/slices/calendarSlice.js';
import { calendarAPI } from '../services/api.js';

export const useCalendar = () => {
  const dispatch = useDispatch();
  const { events, currentView, selectedDate, loading } = useSelector((state) => state.calendar);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await calendarAPI.getEvents();
      dispatch(setEvents(res.data.events || []));
    } catch (err) {
      console.error('Error fetching calendar events', err);
    }
  }, [dispatch]);

  const createEvent = useCallback(async (eventData) => {
    try {
      const res = await calendarAPI.createEvent(eventData);
      dispatch(addEvent(res.data.event));
      return { success: true, event: res.data.event };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }, [dispatch]);

  const updateEvent = useCallback(async (id, eventData) => {
    try {
      const res = await calendarAPI.updateEvent(id, eventData);
      dispatch(updateEventItem(res.data.event));
      return { success: true, event: res.data.event };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }, [dispatch]);

  const deleteEvent = useCallback(async (id) => {
    try {
      await calendarAPI.deleteEvent(id);
      dispatch(removeEventItem(id));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }, [dispatch]);

  return {
    events,
    currentView,
    selectedDate,
    loading,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    setView: (v) => dispatch(setView(v)),
    setSelectedDate: (d) => dispatch(setSelectedDate(d))
  };
};
