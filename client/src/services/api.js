import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('studyflow_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  googleLogin: (data) => api.post('/auth/google', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (token, data) => api.post(`/auth/reset-password/${token}`, data),
};

export const taskAPI = {
  getTasks: (params) => api.get('/tasks', { params }),
  createTask: (data) => api.post('/tasks', data),
  updateTask: (id, data) => api.put(`/tasks/${id}`, data),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
  toggleComplete: (id) => api.patch(`/tasks/${id}/complete`),
};

export const calendarAPI = {
  getEvents: () => api.get('/calendar'),
  createEvent: (data) => api.post('/calendar', data),
  updateEvent: (id, data) => api.put(`/calendar/${id}`, data),
  deleteEvent: (id) => api.delete(`/calendar/${id}`),
};

export const subjectAPI = {
  getSubjects: () => api.get('/subjects'),
  createSubject: (data) => api.post('/subjects', data),
  getTopics: (params) => api.get('/subjects/topics', { params }),
  createTopic: (data) => api.post('/subjects/topics', data),
};

export const examAPI = {
  getExams: () => api.get('/exams'),
  createExam: (data) => api.post('/exams', data),
  getRiskDetails: (id) => api.get(`/exams/${id}/risk`),
};

export const timetableAPI = {
  uploadTimetable: (formData) => api.post('/timetable/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export const studyAPI = {
  logSession: (data) => api.post('/study/sessions', data),
  getSessions: (params) => api.get('/study/sessions', { params }),
  createSummary: (data) => api.post('/study/summary', data),
  getSummaries: (params) => api.get('/study/summary', { params }),
  exportSummaryPDF: (id) => `/api/study/summary/${id}/pdf`,
  exportWeeklyReportPDF: () => `/api/study/reports/weekly/pdf`,
};

export const notesAPI = {
  getNotes: (params) => api.get('/notes', { params }),
  getNoteById: (id) => api.get(`/notes/${id}`),
  createNote: (data) => api.post('/notes', data),
  updateNote: (id, data) => api.put(`/notes/${id}`, data),
  deleteNote: (id) => api.delete(`/notes/${id}`),
  exportNotePDF: (id) => `/api/notes/${id}/pdf`,
  exportSubjectNotesPDF: (subjectId) => `/api/notes/subject/${subjectId}/pdf`,
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  toggleUserActive: (id) => api.patch(`/admin/users/${id}/toggle-active`),
  getPerformanceRisk: () => api.get('/admin/performance-risk'),
  getAssessments: () => api.get('/admin/assessments'),
  createAssessment: (data) => api.post('/admin/assessments', data),
  updateAssessment: (id, data) => api.put(`/admin/assessments/${id}`, data),
  deleteAssessment: (id) => api.delete(`/admin/assessments/${id}`),
  broadcastNotification: (data) => api.post('/admin/broadcast', data),
  getActivityLogs: (params) => api.get('/admin/activity-logs', { params }),
};

export const connectionAPI = {
  searchStudents: (params) => api.get('/connections/search', { params }),
  getConnections: () => api.get('/connections'),
  getRecommendations: () => api.get('/connections/recommendations'),
  sendRequest: (data) => api.post('/connections/request', data),
  respondRequest: (id, data) => api.patch(`/connections/request/${id}`, data),
};

export const groupAPI = {
  getGroups: (params) => api.get('/groups', { params }),
  getGroupById: (id) => api.get(`/groups/${id}`),
  createGroup: (data) => api.post('/groups', data),
  joinGroup: (id) => api.post(`/groups/${id}/join`),
  leaveGroup: (id) => api.post(`/groups/${id}/leave`),
  addAnnouncement: (id, data) => api.post(`/groups/${id}/announcements`, data),
  getMessages: (id, params) => api.get(`/groups/${id}/messages`, { params }),
  sendMessage: (id, data) => api.post(`/groups/${id}/messages`, data),
};

export const sharedNotesAPI = {
  getSharedNotes: () => api.get('/shared-notes'),
  shareNote: (noteId, data) => api.post(`/shared-notes/${noteId}/share`, data),
  updateSharedNote: (noteId, data) => api.put(`/shared-notes/${noteId}`, data),
  unshareNote: (noteId, data) => api.post(`/shared-notes/${noteId}/unshare`, data),
};

export const recentlyAccessedAPI = {
  getRecentlyAccessed: () => api.get('/recently-accessed'),
  recordAccess: (data) => api.post('/recently-accessed', data),
};

export const chatAPI = {
  sendMessage: (data) => api.post('/chat', data),
  getHistory: () => api.get('/chat/history'),
  acceptTask: (messageId) => api.post('/chat/accept-task', { messageId }),
  acceptSchedule: (messageId) => api.post('/chat/accept-schedule', { messageId }),
};

export const quizAPI = {
  generateQuiz: (data) => api.post('/quiz/generate', data),
  submitAttempt: (data) => api.post('/quiz/submit', data),
  getAttempts: (params) => api.get('/quiz/attempts', { params }),
};

export const analyticsAPI = {
  getAnalytics: () => api.get('/analytics'),
  getLearningDNA: () => api.get('/analytics/learning-dna'),
};

export const planAPI = {
  getNextAction: () => api.get('/plan/next-action'),
  getPlanRepair: () => api.post('/plan/repair'),
  applyRepair: (data) => api.post('/plan/repair/apply', data),
  runWhatIf: (data) => api.post('/plan/what-if', data),
};

export const notificationAPI = {
  getNotifications: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  getPreferences: () => api.get('/notifications/preferences'),
  updatePreferences: (data) => api.put('/notifications/preferences', data),
  sendDailySchedule: () => api.post('/notifications/send-daily-schedule'),
  subscribePush: (subscription) => api.post('/notifications/subscribe-push', { subscription }),
};

export default api;
