import { createSlice } from '@reduxjs/toolkit';

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    messages: [],
    isOpen: false,
    loading: false
  },
  reducers: {
    setChatMessages: (state, action) => {
      state.messages = action.payload;
    },
    addChatMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    setChatLoading: (state, action) => {
      state.loading = action.payload;
    },
    toggleChatOpen: (state) => {
      state.isOpen = !state.isOpen;
    },
    setChatOpen: (state, action) => {
      state.isOpen = action.payload;
    },
    updateSuggestedTaskStatus: (state, action) => {
      const { messageId, status } = action.payload;
      const msg = state.messages.find(m => m._id === messageId);
      if (msg && msg.suggestedTask) {
        msg.suggestedTask.status = status;
      }
    }
  }
});

export const {
  setChatMessages,
  addChatMessage,
  setChatLoading,
  toggleChatOpen,
  setChatOpen,
  updateSuggestedTaskStatus
} = chatSlice.actions;
export default chatSlice.reducer;
