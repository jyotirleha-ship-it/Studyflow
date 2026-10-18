import { createSlice } from '@reduxjs/toolkit';

const learningDNASlice = createSlice({
  name: 'learningDNA',
  initialState: {
    data: null,
    loading: false
  },
  reducers: {
    setLearningDNA: (state, action) => {
      state.data = action.payload;
      state.loading = false;
    }
  }
});

export const { setLearningDNA } = learningDNASlice.actions;
export default learningDNASlice.reducer;
