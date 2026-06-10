const API_BASE = import.meta?.env?.VITE_API_URL || '';

async function readJsonResponse(response) {
  const text = await response.text();
  if (!text.trim()) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

// ── Auth ──────────────────────────────────────────────────────────
export async function apiLogin(email, password) {
  try {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalizedEmail, password }),
    });
    const data = await readJsonResponse(res);
    if (!res.ok) throw new Error(data?.error || data?.message || 'Login failed');
    if (!data || typeof data !== 'object') throw new Error('Login response was empty');
    return data; // { token, user }
  } catch (error) {
    if (error instanceof Error && error.message === 'Failed to fetch') {
      throw new Error('Unable to reach the server. Please try again.');
    }
    throw error;
  }
}

export async function apiRegister(payload) {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await readJsonResponse(res);
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  return data;
}

export async function apiGetMe() {
  const token = sessionStorage.getItem('samagama-token');
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await readJsonResponse(res);
  if (!res.ok) throw new Error(data.error || 'Failed to get profile');
  return data; // { user }
}

export async function apiUpdateProfile(payload) {
  const token = sessionStorage.getItem('samagama-token');
  const res = await fetch(`${API_BASE}/api/auth/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  return res.json();
}

// ── Announcements ─────────────────────────────────────────────────
export async function fetchAnnouncements(query = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, value);
  });
  const suffix = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`${API_BASE}/api/announcements${suffix}`);
  return res.json();
}

export async function publishAnnouncement(payload) {
  const token = sessionStorage.getItem('samagama-token');
  const res = await fetch(`${API_BASE}/api/announcements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function updateAnnouncement(id, payload) {
  const token = sessionStorage.getItem('samagama-token');
  const res = await fetch(`${API_BASE}/api/announcements/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function removeAnnouncement(id) {
  const token = sessionStorage.getItem('samagama-token');
  const res = await fetch(`${API_BASE}/api/announcements/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function fetchAnnouncementReadState(userId) {
  const res = await fetch(`${API_BASE}/api/announcements/read-state/${encodeURIComponent(userId)}`);
  return res.json();
}

export async function markAnnouncementRead(userId, announcementId) {
  const res = await fetch(`${API_BASE}/api/announcements/read-state`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, announcementId }),
  });
  return res.json();
}

export async function markAllAnnouncementsRead(userId) {
  const res = await fetch(`${API_BASE}/api/announcements/read-state/all`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  return res.json();
}

// ── FAQs ──────────────────────────────────────────────────────────
export async function fetchFaq() {
  const res = await fetch(`${API_BASE}/api/faqs`);
  const data = await readJsonResponse(res);
  return Array.isArray(data) ? data : [];
}

// ── Doubts ────────────────────────────────────────────────────────
export async function fetchDoubts(role = 'intern') {
  // role param kept for compatibility, actual role comes from JWT on backend
  const token = sessionStorage.getItem('samagama-token');
  const res = await fetch(`${API_BASE}/api/doubts`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.json();
}

export async function submitDoubt(payload) {
  const token = sessionStorage.getItem('samagama-token');
  const res = await fetch(`${API_BASE}/api/doubts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function approveDoubt(id) {
  const token = sessionStorage.getItem('samagama-token');
  const res = await fetch(`${API_BASE}/api/doubts/${id}/approve`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function rejectDoubt(id) {
  const token = sessionStorage.getItem('samagama-token');
  const res = await fetch(`${API_BASE}/api/doubts/${id}/reject`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function answerDoubt(id, payload) {
  const token = sessionStorage.getItem('samagama-token');
  const res = await fetch(`${API_BASE}/api/doubts/${id}/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function voteDoubt(id) {
  const token = sessionStorage.getItem('samagama-token');
  const res = await fetch(`${API_BASE}/api/doubts/${id}/vote`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

// ── Knowledge Base ───────────────────────────────────────────────
export async function fetchKnowledgeBase(query = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => { if (v !== undefined && v !== '') params.set(k, v); });
  const suffix = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`${API_BASE}/api/knowledge-base${suffix}`);
  return res.json();
}

export async function fetchKnowledgeBaseById(id) {
  const res = await fetch(`${API_BASE}/api/knowledge-base/${id}`);
  return res.json();
}

export async function createKnowledgeBase(payload) {
  const token = sessionStorage.getItem('samagama-token');
  const res = await fetch(`${API_BASE}/api/knowledge-base`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function updateKnowledgeBase(id, payload) {
  const token = sessionStorage.getItem('samagama-token');
  const res = await fetch(`${API_BASE}/api/knowledge-base/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function archiveKnowledgeBase(id) {
  const token = sessionStorage.getItem('samagama-token');
  const res = await fetch(`${API_BASE}/api/knowledge-base/${id}/archive`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function deleteKnowledgeBase(id) {
  const token = sessionStorage.getItem('samagama-token');
  const res = await fetch(`${API_BASE}/api/knowledge-base/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

// ── Leaderboard ───────────────────────────────────────────────────
export async function fetchLeaderboard(period = 'all') {
  const token = sessionStorage.getItem('samagama-token');
  const res = await fetch(`${API_BASE}/api/leaderboard?period=${encodeURIComponent(period)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await readJsonResponse(res);
  return Array.isArray(data) ? data : [];
}

export async function fetchMyRank() {
  const token = sessionStorage.getItem('samagama-token');
  if (!token) return { rank: null, spurtiPoints: 0 };
  const res = await fetch(`${API_BASE}/api/leaderboard/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await readJsonResponse(res);
  return data && typeof data === 'object' ? data : { rank: null, spurtiPoints: 0 };
}

// ── Teams ─────────────────────────────────────────────────────────
export async function fetchMyTeam(studentId, studentEmail) {
  const params = new URLSearchParams();
  if (studentId) params.set('studentId', studentId);
  if (studentEmail) params.set('studentEmail', studentEmail);
  const token = sessionStorage.getItem('samagama-token');
  const res = await fetch(`${API_BASE}/api/teams/me?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function createTeam(payload) {
  const token = sessionStorage.getItem('samagama-token');
  const res = await fetch(`${API_BASE}/api/teams`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function requestJoinTeam(teamId, note = '') {
  const token = sessionStorage.getItem('samagama-token');
  const res = await fetch(`${API_BASE}/api/teams/${teamId}/join-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ note }),
  });
  return res.json();
}

export async function respondJoinRequest(requestId, action) {
  const token = sessionStorage.getItem('samagama-token');
  const res = await fetch(`${API_BASE}/api/teams/${encodeURIComponent(requestId)}/members/respond`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status: action }),
  });
  return res.json();
}

export async function respondTeamInvite(inviteId, action) {
  const token = sessionStorage.getItem('samagama-token');
  const res = await fetch(`${API_BASE}/api/teams/${encodeURIComponent(inviteId)}/invites/respond`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action }),
  });
  return res.json();
}

export async function fetchAdminTeams() {
  const token = sessionStorage.getItem('samagama-token');
  const res = await fetch(`${API_BASE}/api/admin/teams`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function decideAdminTeam(teamId, action) {
  const token = sessionStorage.getItem('samagama-token');
  const res = await fetch(`${API_BASE}/api/teams/${encodeURIComponent(teamId)}/decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ decision: action }),
  });
  return res.json();
}

// ── Spurti Points ─────────────────────────────────────────────────
export async function fetchSpurtiPoints() {
  const token = sessionStorage.getItem('samagama-token');
  if (!token) return { spurtiPoints: 0, transactions: [] };
  const res = await fetch(`${API_BASE}/api/spurti`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function fetchStudentStats(studentId) {
  const token = sessionStorage.getItem('samagama-token');
  const res = await fetch(`${API_BASE}/api/students/${studentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function fetchAdminStats() {
  const token = sessionStorage.getItem('samagama-token');
  const res = await fetch(`${API_BASE}/api/students/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

// ── Tasks ─────────────────────────────────────────────────────────
export async function fetchTasks(phase) {
  const params = phase ? `?phase=${encodeURIComponent(phase)}` : '';
  const res = await fetch(`${API_BASE}/api/tasks${params}`);
  return res.json();
}

export async function fetchMyTasks() {
  const token = sessionStorage.getItem('samagama-token');
  const res = await fetch(`${API_BASE}/api/tasks/my`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function submitTask(taskId, payload) {
  const token = sessionStorage.getItem('samagama-token');
  const res = await fetch(`${API_BASE}/api/tasks/${taskId}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function createTask(payload) {
  const token = sessionStorage.getItem('samagama-token');
  const res = await fetch(`${API_BASE}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  return res.json();
}

// ── Reviews ───────────────────────────────────────────────────────
export async function fetchReviews() {
  const token = sessionStorage.getItem('samagama-token');
  const res = await fetch(`${API_BASE}/api/reviews`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function fetchPendingReviews() {
  const token = sessionStorage.getItem('samagama-token');
  const res = await fetch(`${API_BASE}/api/reviews/pending`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function submitReview(payload) {
  const token = sessionStorage.getItem('samagama-token');
  const res = await fetch(`${API_BASE}/api/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function reviewSubmission(reviewId, status, feedback) {
  const token = sessionStorage.getItem('samagama-token');
  const res = await fetch(`${API_BASE}/api/reviews/${reviewId}/grade`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ grade: status, feedback }),
  });
  return res.json();
}

// ── NOC ───────────────────────────────────────────────────────────
export async function fetchNocs() {
  const token = sessionStorage.getItem('samagama-token');
  const res = await fetch(`${API_BASE}/api/nocs`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function uploadNoc(file) {
  const token = sessionStorage.getItem('samagama-token');
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/api/nocs`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  return res.json();
}

// ── Yaksha AI ─────────────────────────────────────────────────────
export async function yakshaChat(messages) {
  const token = sessionStorage.getItem('samagama-token');
  const res = await fetch(`${API_BASE}/api/yaksha`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ messages }),
  });
  return res.json();
}

// ── Admin student management ──────────────────────────────────────
export async function fetchAllStudents(params = {}) {
  const queryParams = new URLSearchParams(params).toString();
  const token = sessionStorage.getItem('samagama-token');
  const res = await fetch(`${API_BASE}/api/students?${queryParams}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function updateStudentPhase(studentId, phase) {
  const token = sessionStorage.getItem('samagama-token');
  const res = await fetch(`${API_BASE}/api/students/${studentId}/phase`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ phase }),
  });
  return res.json();
}

export async function awardSpurti(studentId, amount, reason) {
  const token = sessionStorage.getItem('samagama-token');
  const res = await fetch(`${API_BASE}/api/students/${studentId}/spurti`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ amount, reason }),
  });
  return res.json();
}
