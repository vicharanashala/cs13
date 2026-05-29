import axios from 'axios'

const api = axios.create({ baseURL: '/api', withCredentials: true })

// Auth
export const auth = {
  login: (username: string, password: string) => api.post('/auth/login', { username, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
}

// FAQs
export const faqs = {
  list: () => api.get('/faqs'),
  search: (q: string) => api.get(`/faqs/search?q=${encodeURIComponent(q)}`),
  vote: (id: number, type: 'helpful' | 'unhelpful') => api.patch(`/faqs/${id}/vote`, { type }),
}

// Doubts
export const doubts = {
  list: () => api.get('/doubts'),
  get: (id: number) => api.get(`/doubts/${id}`),
  create: (title: string, body: string) => api.post('/doubts', { title, body }),
  answer: (id: number, body: string) => api.post(`/doubts/${id}/answers`, { body }),
  upvote: (id: number) => api.post(`/answers/${id}/upvote`),
  resolve: (id: number) => api.post(`/doubts/${id}/resolve`),
}

// Zoro AI
export const zoro = {
  chat: (message: string | { role: string; content: string }[], mini = true) =>
    api.post('/zoro/chat', { message, mini }),
  submitFeedback: (messageId: string, thumbsUp: boolean, feedbackText?: string) =>
    api.post('/zoro/feedback', { messageId, thumbsUp, feedbackText }),
}

// Admin
export const admin = {
  stats: () => api.get('/admin/stats'),
  doubts: () => api.get('/admin/doubts'),
  feedback: () => api.get('/admin/feedback'),
  faq: () => api.get('/admin/faq'),
  announcements: () => api.get('/admin/announcements'),
  users: () => api.get('/admin/users'),
  createAnnouncement: (title: string, body: string) => api.post('/admin/announcements', { title, body }),
  deleteAnnouncement: (id: number) => api.delete(`/admin/announcements/${id}`),
  createFaq: (item: any) => api.post('/admin/faq', item),
  updateFaq: (id: number, item: any) => api.put(`/admin/faq/${id}`, item),
  deleteFaq: (id: number) => api.delete(`/admin/faq/${id}`),
  generateAnswer: (doubt: string) => api.post('/admin/generate-answer', { doubt }),
  updateAnswerStatus: (id: number, status: 'pending' | 'approved' | 'rejected', rejection_reason?: string) =>
    api.patch(`/admin/answers/${id}/status`, { status, rejection_reason }),
  updateDoubtStatus: (id: number, status: 'pending' | 'approved' | 'rejected' | 'resolved', rejection_reason?: string) =>
    api.patch(`/admin/doubts/${id}/status`, { status, rejection_reason }),
  listAnswers: () => api.get('/admin/answers'),
  spStats: () => api.get('/admin/sp-stats'),
  spHistory: (userId: number) => api.get(`/admin/sp-history/${userId}`),
  spTransactions: (userId?: number) =>
    api.get(userId ? `/admin/sp-transactions?user_id=${userId}` : '/admin/sp-transactions'),
  moderationLogs: () => api.get('/admin/moderation-logs'),
}