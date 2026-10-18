import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { setChatMessages, addChatMessage, setChatLoading, toggleChatOpen, setChatOpen, updateSuggestedTaskStatus } from '../redux/slices/chatSlice.js';
import { chatAPI } from '../services/api.js';

export const useChatbot = () => {
  const dispatch = useDispatch();
  const { messages, isOpen, loading } = useSelector((state) => state.chat);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await chatAPI.getHistory();
      if (res.data.messages && res.data.messages.length > 0) {
        dispatch(setChatMessages(res.data.messages));
      }
    } catch (err) {
      console.error('Failed to fetch chat history', err);
    }
  }, [dispatch]);

  const sendMessage = useCallback(async (content) => {
    if (!content.trim()) return;
    const tempUserMsg = {
      _id: 'temp-' + Date.now(),
      role: 'user',
      content,
      createdAt: new Date()
    };
    dispatch(addChatMessage(tempUserMsg));
    dispatch(setChatLoading(true));

    try {
      const res = await chatAPI.sendMessage({ message: content });
      dispatch(setChatLoading(false));
      dispatch(addChatMessage(res.data.assistantMessage));
    } catch (err) {
      dispatch(setChatLoading(false));
      dispatch(addChatMessage({
        _id: 'err-' + Date.now(),
        role: 'assistant',
        content: 'I apologize, but I had trouble processing your request. Please try again.',
        createdAt: new Date()
      }));
    }
  }, [dispatch]);

  const acceptTask = useCallback(async (messageId) => {
    try {
      const res = await chatAPI.acceptTask(messageId);
      dispatch(updateSuggestedTaskStatus({ messageId, status: 'accepted' }));
      return { success: true, task: res.data.task };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }, [dispatch]);

  return {
    messages,
    isOpen,
    loading,
    fetchHistory,
    sendMessage,
    acceptTask,
    toggleOpen: () => dispatch(toggleChatOpen()),
    setOpen: (v) => dispatch(setChatOpen(v))
  };
};
