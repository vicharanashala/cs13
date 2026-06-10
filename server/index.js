const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { faqData, doubtPosts } = require('./data');

const app = express();
app.use(cors());
app.use(express.json());

let posts = [...doubtPosts];
const ANNOUNCEMENT_STATE_FILE = path.join(__dirname, 'announcement-read-state.json');
const ANNOUNCEMENT_STORE_FILE = path.join(__dirname, 'announcement-store.json');
const TEAM_STATE_FILE = path.join(__dirname, 'team-store.json');

function readJsonFile(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, 'utf8');
    if (!raw.trim()) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJsonFile(filePath, value) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
  } catch {
    // Ignore persistence errors in the local dev server.
  }
}

let announcementReadState = readJsonFile(ANNOUNCEMENT_STATE_FILE, {});
let announcementStore = readJsonFile(ANNOUNCEMENT_STORE_FILE, [
  {
    id: 'ann-zoom-meeting',
    title: 'Zoom Meeting Tomorrow',
    preview: 'Meeting starts at 10:00 AM IST. Join the orientation session on time.',
    content: 'The internship orientation meeting will be conducted tomorrow at 10:00 AM IST.\n\nZoom Link: https://zoom.us/j/123456789\nMeeting ID: 123456789\n\nPlease keep your camera ready and join 5 minutes early.',
    postedBy: 'Samagama Admin Team',
    dateTime: '2026-06-01T08:30:00.000Z',
    createdAt: '2026-06-01T08:30:00.000Z',
    updatedAt: '2026-06-01T08:30:00.000Z',
    createdBy: 'Samagama Admin Team',
    category: 'Meeting',
    type: 'Meeting',
    urgencyLevel: 'High',
    priority: 'High',
    targetAudience: 'All Students',
    deadline: '2026-06-02',
    attachmentUrl: 'https://zoom.us/j/123456789',
    attachmentName: 'Zoom Link',
    pinned: true,
    isPinned: true,
    status: 'published',
    archived: false,
    links: [{ label: 'Zoom Link', url: 'https://zoom.us/j/123456789' }],
  },
]);
let teamStore = readJsonFile(TEAM_STATE_FILE, {
  teams: [],
  teamMembers: [],
  teamInvites: [],
  joinRequests: [],
});

function saveAnnouncementReadState() {
  writeJsonFile(ANNOUNCEMENT_STATE_FILE, announcementReadState);
}

function saveTeamStore() {
  writeJsonFile(TEAM_STATE_FILE, teamStore);
}

function saveAnnouncementStore() {
  writeJsonFile(ANNOUNCEMENT_STORE_FILE, announcementStore);
}

function normalizeIdentity(value) {
  return String(value || '').trim().toLowerCase();
}

function isTeamActiveStatus(status) {
  return ['draft', 'pending', 'active', 'completed'].includes(status);
}

function normalizeAnnouncementRecord(item = {}) {
  const now = new Date().toISOString();
  const deadline = item.deadline ? String(item.deadline).slice(0, 10) : '';
  const publishAt = item.publishAt || '';
  const isScheduled = Boolean(publishAt && !Number.isNaN(new Date(publishAt).getTime()) && new Date() < new Date(publishAt));
  const status = item.status === 'draft'
    ? 'draft'
    : item.archived || item.status === 'expired'
      ? 'expired'
      : item.status === 'scheduled' || isScheduled
        ? 'scheduled'
        : (item.status || 'published');
  return {
    id: item.id || `ann-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: String(item.title || '').trim(),
    preview: String(item.preview || item.message || item.content || '').trim().replace(/\s+/g, ' ').slice(0, 110),
    content: String(item.content || item.message || '').trim(),
    postedBy: item.postedBy || 'Samagama Admin Team',
    dateTime: item.dateTime || item.createdAt || now,
    createdAt: item.createdAt || item.dateTime || now,
    updatedAt: item.updatedAt || now,
    createdBy: item.createdBy || item.postedBy || 'Samagama Admin Team',
    category: item.category || item.type || 'Announcement',
    type: item.type || item.category || 'General',
    urgencyLevel: item.urgencyLevel || item.priority || 'Medium',
    priority: item.priority || item.urgencyLevel || 'Medium',
    deadline,
    targetAudience: item.targetAudience || 'All Students',
    attachmentUrl: item.attachmentUrl || item.attachmentLink || '',
    publishAt,
    attachmentName: item.attachmentName || item.attachmentLabel || 'Attachment',
    attachmentType: item.attachmentType || '',
    attachmentFileName: item.attachmentFileName || '',
    attachmentMimeType: item.attachmentMimeType || '',
    attachmentData: item.attachmentData || '',
    pinned: Boolean(item.pinned || item.isPinned),
    isPinned: Boolean(item.pinned || item.isPinned),
    status,
    archived: Boolean(item.archived || item.status === 'expired'),
    links: Array.isArray(item.links) ? item.links : item.attachmentUrl ? [{ label: item.attachmentName || item.attachmentLabel || 'Attachment', url: item.attachmentUrl }] : [],
  };
}

function sortAnnouncementRecords(records = []) {
  const urgencyOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  return [...records].sort((a, b) => {
    const aPinned = Boolean(a.pinned || a.isPinned);
    const bPinned = Boolean(b.pinned || b.isPinned);
    if (aPinned !== bPinned) return aPinned ? -1 : 1;
    const urgencyDiff = (urgencyOrder[a.urgencyLevel] ?? 9) - (urgencyOrder[b.urgencyLevel] ?? 9);
    if (urgencyDiff !== 0) return urgencyDiff;
    return new Date(b.dateTime || b.createdAt || 0) - new Date(a.dateTime || a.createdAt || 0);
  });
}

function persistAnnouncementStore(records) {
  announcementStore = sortAnnouncementRecords(records.map(normalizeAnnouncementRecord));
  saveAnnouncementStore();
}

function buildTeamView(team) {
  if (!team) return null;
  const members = teamStore.teamMembers.filter(item => item.teamId === team._id);
  const invites = teamStore.teamInvites.filter(item => item.teamId === team._id);
  const joinRequests = teamStore.joinRequests.filter(item => item.teamId === team._id);
  const acceptedMembers = members.filter(item => item.status === 'accepted');
  const invitedMembers = members.filter(item => item.status === 'invited');
  const rejectedMembers = members.filter(item => item.status === 'rejected');

  return {
    ...team,
    memberCount: 1 + acceptedMembers.length + invitedMembers.length,
    pendingInviteCount: invites.filter(item => item.status === 'pending').length,
    acceptedMemberCount: acceptedMembers.length + 1,
    invitedMemberCount: invitedMembers.length,
    rejectedMemberCount: rejectedMembers.length,
    members,
    invites,
    joinRequests,
  };
}

function getStudentTeamContext(studentId, studentEmail) {
  const normalizedId = normalizeIdentity(studentId);
  const normalizedEmail = normalizeIdentity(studentEmail || studentId);

  const leaderTeam = teamStore.teams.find(team => normalizeIdentity(team.leaderId) === normalizedId && isTeamActiveStatus(team.status));
  const memberRecord = teamStore.teamMembers.find(member => normalizeIdentity(member.studentId) === normalizedId && isTeamActiveStatus(teamStore.teams.find(team => team._id === member.teamId)?.status));
  const inviteRecord = teamStore.teamInvites.find(invite => normalizeIdentity(invite.receiverEmail) === normalizedEmail && invite.status === 'pending');
  const joinRequest = teamStore.joinRequests.find(request => normalizeIdentity(request.studentId) === normalizedId && request.status === 'pending');

  const team = leaderTeam
    || (memberRecord ? teamStore.teams.find(team => team._id === memberRecord.teamId) : null)
    || (inviteRecord ? teamStore.teams.find(team => team._id === inviteRecord.teamId) : null)
    || (joinRequest ? teamStore.teams.find(team => team._id === joinRequest.teamId) : null)
    || null;

  if (!team) {
    return {
      team: null,
      role: null,
      invites: inviteRecord ? [inviteRecord] : [],
      joinRequests: joinRequest ? [joinRequest] : [],
      journeyReady: false,
    };
  }

  const members = teamStore.teamMembers.filter(item => item.teamId === team._id);
  const invites = teamStore.teamInvites.filter(item => item.teamId === team._id && normalizeIdentity(item.receiverEmail) === normalizedEmail);
  const leaderJoinRequests = teamStore.joinRequests.filter(item => item.teamId === team._id);
  const role = normalizeIdentity(team.leaderId) === normalizedId
    ? 'leader'
    : members.find(member => normalizeIdentity(member.studentId) === normalizedId && member.status === 'accepted')
      ? 'member'
      : invites.length
        ? 'invitee'
        : joinRequest
          ? 'applicant'
          : null;
  const journeyReady = Boolean(
    role === 'leader'
    || members.find(member => normalizeIdentity(member.studentId) === normalizedId && member.status === 'accepted')
    || invites.find(invite => invite.status === 'accepted')
  );

  return {
    team: buildTeamView(team),
    role,
    invites,
    joinRequests: leaderJoinRequests,
    journeyReady,
  };
}

function respondJoinRequestRecord(requestId, action) {
  const request = teamStore.joinRequests.find(item => item._id === requestId);
  if (!request) return null;

  const team = teamStore.teams.find(item => item._id === request.teamId);
  if (!team) return null;

  const now = new Date().toISOString();
  request.status = action === 'accept' ? 'accepted' : 'rejected';
  request.updatedAt = now;

  if (action === 'accept') {
    let member = teamStore.teamMembers.find(item => item.teamId === team._id && normalizeIdentity(item.studentId) === normalizeIdentity(request.studentId));
    if (!member) {
      member = {
        _id: `member-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        teamId: team._id,
        studentId: request.studentId,
        studentName: request.studentName,
        studentEmail: request.studentEmail,
        role: 'member',
        status: 'accepted',
        joinedAt: now,
      };
      teamStore.teamMembers.push(member);
    } else {
      member.status = 'accepted';
      member.joinedAt = member.joinedAt || now;
    }
    team.status = 'active';
  }
  team.updatedAt = now;

  saveTeamStore();
  return { request, team };
}

function respondInviteRecord(inviteId, action) {
  const invite = teamStore.teamInvites.find(item => item._id === inviteId);
  if (!invite) return null;

  const team = teamStore.teams.find(item => item._id === invite.teamId);
  if (!team) return null;

  const now = new Date().toISOString();
  invite.status = action === 'accept' ? 'accepted' : 'rejected';
  invite.updatedAt = now;

  let member = teamStore.teamMembers.find(item => item.teamId === team._id && normalizeIdentity(item.studentEmail) === normalizeIdentity(invite.receiverEmail));
  if (action === 'accept') {
    if (!member) {
      member = {
        _id: `member-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        teamId: team._id,
        studentId: invite.receiverEmail,
        studentName: invite.receiverName || invite.receiverEmail,
        studentEmail: invite.receiverEmail,
        role: 'member',
        status: 'accepted',
        joinedAt: now,
      };
      teamStore.teamMembers.push(member);
    } else {
      member.status = 'accepted';
      member.joinedAt = member.joinedAt || now;
    }
    team.status = 'active';
  } else if (member) {
    member.status = 'rejected';
  }
  team.updatedAt = now;

  saveTeamStore();
  return { invite, team };
}

app.get('/api/faq', (req, res) => {
  res.json(faqData);
});

app.get('/api/faqs', (req, res) => {
  res.json(faqData.map((item, index) => ({
    id: item.id || index + 1,
    q: item.q,
    a: item.a,
    cat: item.cat,
  })));
});

app.get('/api/announcements', (req, res) => {
  const audience = String(req.query.audience || 'All Students').trim();
  const status = String(req.query.status || '').trim();
  const urgency = String(req.query.urgency || '').trim();
  const pinned = String(req.query.pinned || '').trim();
  const q = String(req.query.q || '').trim().toLowerCase();

  let next = sortAnnouncementRecords(announcementStore).filter(item => !item.archived || status === 'all');
  if (status && status !== 'all') {
    next = next.filter(item => item.status === status);
  }
  if (audience && audience !== 'All Students') {
    next = next.filter(item => item.targetAudience === 'All Students' || item.targetAudience === audience);
  }
  if (urgency) {
    next = next.filter(item => item.urgencyLevel === urgency);
  }
  if (pinned === 'true') {
    next = next.filter(item => item.pinned || item.isPinned);
  }
  if (q) {
    next = next.filter(item => [
      item.title,
      item.content,
      item.preview,
      item.category,
      item.type,
      item.targetAudience,
      item.urgencyLevel,
    ].filter(Boolean).join(' ').toLowerCase().includes(q));
  }
  res.json(next);
});

app.put('/api/announcements', (req, res) => {
  const announcements = Array.isArray(req.body.announcements) ? req.body.announcements : [];
  persistAnnouncementStore(announcements);
  res.json(announcementStore);
});

app.post('/api/announcements', (req, res) => {
  const announcement = normalizeAnnouncementRecord(req.body || {});
  announcementStore.unshift(announcement);
  saveAnnouncementStore();
  res.status(201).json(announcement);
});

app.patch('/api/announcements/:id', (req, res) => {
  const id = String(req.params.id || '').trim();
  const index = announcementStore.findIndex(item => item.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Announcement not found' });
  }
  announcementStore[index] = normalizeAnnouncementRecord({
    ...announcementStore[index],
    ...req.body,
    id,
    updatedAt: new Date().toISOString(),
  });
  saveAnnouncementStore();
  res.json(announcementStore[index]);
});

app.delete('/api/announcements/:id', (req, res) => {
  const id = String(req.params.id || '').trim();
  const before = announcementStore.length;
  announcementStore = announcementStore.filter(item => item.id !== id);
  if (announcementStore.length === before) {
    return res.status(404).json({ error: 'Announcement not found' });
  }
  saveAnnouncementStore();
  res.json({ ok: true });
});

app.get('/api/doubts', (req, res) => {
  const role = req.query.role || 'intern';
  if (role === 'admin') {
    return res.json(posts);
  }
  const visible = posts.filter(post => post.status === 'approved');
  res.json(visible);
});

app.get('/api/announcements/read-state', (req, res) => {
  const userId = String(req.query.userId || '').trim();
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  res.json(announcementReadState[userId] || { ids: [], readAt: {} });
});

app.post('/api/announcements/read-state', (req, res) => {
  const userId = String(req.body.userId || '').trim();
  const announcementId = String(req.body.announcementId || '').trim();
  if (!userId || !announcementId) {
    return res.status(400).json({ error: 'userId and announcementId are required' });
  }

  const current = announcementReadState[userId] || { ids: [], readAt: {} };
  if (!current.ids.includes(announcementId)) {
    current.ids = [announcementId, ...current.ids];
    current.readAt = {
      ...current.readAt,
      [announcementId]: new Date().toISOString(),
    };
    announcementReadState[userId] = current;
    saveAnnouncementReadState();
  }

  res.json(current);
});

app.post('/api/announcements/read-state/all', (req, res) => {
  const userId = String(req.body.userId || '').trim();
  const announcementIds = Array.isArray(req.body.announcementIds) ? req.body.announcementIds.map(String).filter(Boolean) : [];
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  const now = new Date().toISOString();
  const next = {
    ids: announcementIds,
    readAt: Object.fromEntries(announcementIds.map(id => [id, now])),
  };
  announcementReadState[userId] = next;
  saveAnnouncementReadState();
  res.json(next);
});

app.get('/api/teams/me', (req, res) => {
  const studentId = String(req.query.studentId || '').trim();
  const studentEmail = String(req.query.studentEmail || studentId).trim();
  if (!studentId) {
    return res.status(400).json({ error: 'studentId is required' });
  }
  res.json(getStudentTeamContext(studentId, studentEmail));
});

app.get('/api/teams/invitations', (req, res) => {
  const studentEmail = String(req.query.studentEmail || req.query.studentId || '').trim();
  if (!studentEmail) {
    return res.status(400).json({ error: 'studentEmail is required' });
  }
  const invites = teamStore.teamInvites.filter(invite => normalizeIdentity(invite.receiverEmail) === normalizeIdentity(studentEmail));
  res.json(invites);
});

app.get('/api/teams/requests', (req, res) => {
  const leaderId = String(req.query.leaderId || '').trim();
  if (!leaderId) {
    return res.status(400).json({ error: 'leaderId is required' });
  }
  const requests = teamStore.joinRequests.filter(request => normalizeIdentity(request.leaderId) === normalizeIdentity(leaderId));
  res.json(requests);
});

app.get('/api/admin/teams', (req, res) => {
  res.json(teamStore.teams.map(team => buildTeamView(team)));
});

app.post('/api/admin/teams/:teamId/decision', (req, res) => {
  const teamId = String(req.params.teamId || '').trim();
  const action = String(req.body.action || '').trim();
  const team = teamStore.teams.find(item => item._id === teamId);
  if (!team) {
    return res.status(404).json({ error: 'Team not found' });
  }
  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action' });
  }

  team.status = action === 'approve' ? 'active' : 'rejected';
  team.updatedAt = new Date().toISOString();
  teamStore.teamMembers = teamStore.teamMembers.map(member => member.teamId === teamId && member.role === 'leader'
    ? { ...member, status: team.status === 'active' ? 'accepted' : 'rejected' }
    : member);
  saveTeamStore();
  res.json(buildTeamView(team));
});

app.post('/api/teams/create', (req, res) => {
  const studentId = normalizeIdentity(req.body.studentId);
  const studentName = String(req.body.studentName || '').trim();
  const studentEmail = normalizeIdentity(req.body.studentEmail || studentId);
  const name = String(req.body.name || '').trim();
  const description = String(req.body.description || '').trim();
  const domain = String(req.body.domain || '').trim();
  const membersInput = Array.isArray(req.body.members) ? req.body.members : [];
  const maxMembers = Math.max(2, Math.min(20, Number(req.body.maxMembers || 10) || 10));

  if (!studentId || !studentName || !name || !description || !domain) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (teamStore.teams.some(team => normalizeIdentity(team.leaderId) === studentId && isTeamActiveStatus(team.status))) {
    return res.status(409).json({ error: 'You already lead a team' });
  }

  if (teamStore.teamMembers.some(member => normalizeIdentity(member.studentId) === studentId && ['invited', 'accepted'].includes(member.status))) {
    return res.status(409).json({ error: 'You are already part of a team' });
  }

  const now = new Date().toISOString();
  const team = {
    _id: `team-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    description,
    domain,
    leaderId: studentId,
    leaderName: studentName,
    leaderEmail: studentEmail,
    maxMembers,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };

  const invitedRows = membersInput
    .map(member => ({
      name: String(member?.name || '').trim(),
      email: normalizeIdentity(member?.email || ''),
    }))
    .filter(member => member.email && member.email !== studentEmail);

  if (1 + invitedRows.length > maxMembers) {
    return res.status(400).json({ error: 'Team exceeds max members' });
  }

  teamStore.teams.unshift(team);
  teamStore.teamMembers.unshift({
    _id: `member-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    teamId: team._id,
    studentId,
    studentName,
    studentEmail,
    role: 'leader',
    status: 'accepted',
    joinedAt: now,
  });

  invitedRows.forEach(row => {
    teamStore.teamInvites.unshift({
      _id: `invite-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      teamId: team._id,
      senderId: studentId,
      senderName: studentName,
      receiverEmail: row.email,
      receiverName: row.name || row.email,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    });
    teamStore.teamMembers.unshift({
      _id: `member-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      teamId: team._id,
      studentId: row.email,
      studentName: row.name || row.email,
      studentEmail: row.email,
      role: 'member',
      status: 'invited',
      joinedAt: '',
    });
  });

  saveTeamStore();
  res.status(201).json(buildTeamView(team));
});

app.post('/api/teams/request-join', (req, res) => {
  const studentId = normalizeIdentity(req.body.studentId);
  const studentName = String(req.body.studentName || '').trim();
  const studentEmail = normalizeIdentity(req.body.studentEmail || studentId);
  const leaderEmail = normalizeIdentity(req.body.leaderEmail);
  if (!studentId || !studentName || !leaderEmail) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const team = teamStore.teams.find(item => normalizeIdentity(item.leaderEmail) === leaderEmail || normalizeIdentity(item.leaderId) === leaderEmail);
  if (!team) {
    return res.status(404).json({ error: 'Team lead not found' });
  }

  if (teamStore.teamMembers.some(member => normalizeIdentity(member.studentId) === studentId && ['invited', 'accepted'].includes(member.status))) {
    return res.status(409).json({ error: 'You are already part of a team' });
  }

  if (teamStore.joinRequests.some(request => normalizeIdentity(request.studentId) === studentId && request.status === 'pending')) {
    return res.status(409).json({ error: 'You already have a pending join request' });
  }

  if (teamStore.teamMembers.some(member => member.teamId === team._id && normalizeIdentity(member.studentId) === studentId && ['accepted', 'invited'].includes(member.status))) {
    return res.status(409).json({ error: 'You are already linked to this team' });
  }

  if (teamStore.joinRequests.some(request => request.teamId === team._id && normalizeIdentity(request.studentId) === studentId && request.status === 'pending')) {
    return res.status(409).json({ error: 'Join request already pending' });
  }

  const now = new Date().toISOString();
  const request = {
    _id: `join-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    teamId: team._id,
    teamName: team.name,
    studentId,
    studentName,
    studentEmail,
    leaderId: team.leaderId,
    leaderEmail: team.leaderEmail,
    note: String(req.body.note || '').trim(),
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };
  teamStore.joinRequests.unshift(request);
  saveTeamStore();
  res.status(201).json({ request, team: buildTeamView(team) });
});

app.post('/api/teams/join-requests/:requestId/respond', (req, res) => {
  const requestId = String(req.params.requestId || '').trim();
  const action = String(req.body.action || '').trim();
  if (!['accept', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action' });
  }
  const result = respondJoinRequestRecord(requestId, action);
  if (!result) {
    return res.status(404).json({ error: 'Join request not found' });
  }
  res.json({ request: result.request, team: buildTeamView(result.team) });
});

app.post('/api/teams/invites/:inviteId/respond', (req, res) => {
  const inviteId = String(req.params.inviteId || '').trim();
  const action = String(req.body.action || '').trim();
  if (!['accept', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action' });
  }
  const result = respondInviteRecord(inviteId, action);
  if (!result) {
    return res.status(404).json({ error: 'Invite not found' });
  }
  res.json({ invite: result.invite, team: buildTeamView(result.team) });
});

app.post('/api/doubts', (req, res) => {
  const { title, body, tags, user } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  const newPost = {
    id: Date.now(),
    title,
    body: body || '',
    tags: tags && tags.length ? tags : ['Other'],
    votes: 1,
    status: 'pending',
    solved: false,
    user: user || 'Anonymous',
    time: 'just now',
    answers: []
  };
  posts.unshift(newPost);
  res.status(201).json(newPost);
});

app.post('/api/doubts/:id/approve', (req, res) => {
  const id = Number(req.params.id);
  const post = posts.find(p => p.id === id);
  if (!post) return res.status(404).json({ error: 'Doubt not found' });
  post.status = 'approved';
  res.json(post);
});

app.post('/api/doubts/:id/reject', (req, res) => {
  const id = Number(req.params.id);
  const post = posts.find(p => p.id === id);
  if (!post) return res.status(404).json({ error: 'Doubt not found' });
  post.status = 'rejected';
  res.json(post);
});

app.post('/api/doubts/:id/answer', (req, res) => {
  const id = Number(req.params.id);
  const { user, text } = req.body;
  const post = posts.find(p => p.id === id);
  if (!post) return res.status(404).json({ error: 'Doubt not found' });
  if (post.status !== 'approved') return res.status(400).json({ error: 'Cannot answer unapproved doubt' });
  const answer = {
    id: Date.now(),
    user: user || 'Anonymous',
    text,
    time: 'just now'
  };
  post.answers.push(answer);
  res.json(answer);
});

app.listen(4000, () => {
  console.log('Server running on http://localhost:4000');
});
