import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { setTasksData, setTaskLoading, addTask, updateTaskItem, removeTaskItem } from '../redux/slices/taskSlice.js';
import { updateUser } from '../redux/slices/authSlice.js';
import { taskAPI } from '../services/api.js';
import { useStreak } from './useStreak.js';

export const useTasks = () => {
  const dispatch = useDispatch();
  const { tasks, page, limit, total, totalPages, loading } = useSelector((state) => state.tasks);
  const { triggerStreakCelebration } = useStreak();

  const fetchTasks = useCallback(async (params = {}) => {
    dispatch(setTaskLoading(true));
    try {
      const res = await taskAPI.getTasks({ page, limit, ...params });
      dispatch(setTasksData(res.data));
    } catch (err) {
      dispatch(setTaskLoading(false));
      console.error('Error fetching tasks', err);
    }
  }, [dispatch, page, limit]);

  const createTask = useCallback(async (taskData) => {
    try {
      const res = await taskAPI.createTask(taskData);
      dispatch(addTask(res.data.task));
      return { success: true, task: res.data.task };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }, [dispatch]);

  const toggleComplete = useCallback(async (taskId) => {
    try {
      const res = await taskAPI.toggleComplete(taskId);
      dispatch(updateTaskItem(res.data.task));

      if (res.data.streakUpdated) {
        dispatch(updateUser({
          streak: res.data.currentStreak,
          longestStreak: res.data.longestStreak
        }));

        triggerStreakCelebration({
          streak: res.data.currentStreak,
          isNewRecord: res.data.isNewRecord
        });
      }

      return { success: true, ...res.data };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }, [dispatch, triggerStreakCelebration]);

  const deleteTask = useCallback(async (taskId) => {
    try {
      await taskAPI.deleteTask(taskId);
      dispatch(removeTaskItem(taskId));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }, [dispatch]);

  return {
    tasks,
    page,
    limit,
    total,
    totalPages,
    loading,
    fetchTasks,
    createTask,
    toggleComplete,
    deleteTask
  };
};
