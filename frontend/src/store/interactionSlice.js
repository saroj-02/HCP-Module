import { createSlice } from '@reduxjs/toolkit';

export const interactionSlice = createSlice({
  name: 'interaction',
  initialState: {
    logs: [],
    chatHistory: [],
    loading: false,
    formData: {
      hcp_name: '',
      interaction_type: 'Meeting',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0].substring(0, 5),
      attendees: '',
      topics: '',
      sentiment: 'Neutral',
      outcomes: '',
      follow_ups: '',
      preferred_channel: 'Digital',
      channel_preference_reason: '',
      is_hybrid_event: false,
      event_type: 'Physical',
      engagement_channel: 'Email',
      hcp_persona: 'Early Adopter',
      next_best_action: 'Send Clinical Study PDF',
      predicted_channel: 'LinkedIn',
      predicted_time: 'Tuesday 10:00 AM',
      compliance_check: 'Verified',
      roi_potential: 'High'
    }
  },
  reducers: {
    setLogs: (state, action) => {
        state.logs = action.payload;
    },
    addLog: (state, action) => { 
        state.logs.unshift(action.payload); 
    },
    addChatMessage: (state, action) => { 
        state.chatHistory.push(action.payload); 
    },
    setLoading: (state, action) => { 
        state.loading = action.payload; 
    },
    updateFormData: (state, action) => {
        state.formData = { ...state.formData, ...action.payload };
    }
  }
});

export const { setLogs, addLog, addChatMessage, setLoading, updateFormData } = interactionSlice.actions;
export default interactionSlice.reducer;
