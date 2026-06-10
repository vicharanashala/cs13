const ANNOUNCEMENTS_KEY = 'samagama-announcements';
const READ_STATE_KEY = 'samagama-announcement-read-state';

const announcementTypes = ['General', 'Internship', 'Meeting', 'Deadline', 'Certificate', 'Placement', 'Emergency'];
const urgencyLevels = ['Low', 'Medium', 'High', 'Critical'];
const targetAudiences = ['All Students', 'Department-specific', 'Internship Students', 'Final Year', 'Selected Batch'];

const defaultAnnouncements = [
  {
    id: 'ann-zoom-meeting',
    title: 'Zoom Meeting Tomorrow',
    preview: 'Meeting starts at 10:00 AM IST. Join the orientation session on time.',
    content:
      'The internship orientation meeting will be conducted tomorrow at 10:00 AM IST.\n\nZoom Link: https://zoom.us/j/123456789\nMeeting ID: 123456789\n\nPlease keep your camera ready and join 5 minutes early.',
    postedBy: 'Samagama Admin Team',
    dateTime: '2026-06-01T08:30:00.000Z',
    category: 'Meeting',
    type: 'Meeting',
    pinned: true,
    priority: 'High',
    urgencyLevel: 'High',
    status: 'published',
    targetAudience: 'All Students',
    deadline: '2026-06-02',
    archived: false,
    isPinned: true,
    createdAt: '2026-06-01T08:30:00.000Z',
    createdBy: 'Samagama Admin Team',
    updatedAt: '2026-06-01T08:30:00.000Z',
    links: [
      { label: 'Zoom Link', url: 'https://zoom.us/j/123456789' },
    ],
  },
  {
    id: 'ann-noc-guidelines',
    title: 'NOC Submission Guidelines',
    preview: 'Please ensure signed copies and correct dates before uploading your NOC.',
    content:
      'Please make sure your NOC contains a handwritten signature from the authorized signatory, the correct internship start/end dates, and a clear student signature.\n\nYou can upload it from the dashboard once you are ready.',
    postedBy: 'Samagama Admin Team',
    dateTime: '2026-06-01T06:50:00.000Z',
    category: 'NOC',
    type: 'General',
    pinned: false,
    priority: 'Medium',
    urgencyLevel: 'Medium',
    status: 'published',
    targetAudience: 'Internship Students',
    deadline: '2026-06-05',
    archived: false,
    isPinned: false,
    createdAt: '2026-06-01T06:50:00.000Z',
    createdBy: 'Samagama Admin Team',
    updatedAt: '2026-06-01T06:50:00.000Z',
    links: [],
  },
  {
    id: 'ann-certificate-window',
    title: 'Certificate Release Window',
    preview: 'E-certificates will be released after the completion review cycle.',
    content:
      'Certificates will be released after the completion checks are processed for the current cohort.\n\nPlease keep an eye on your dashboard and official announcements for the release timeline.',
    postedBy: 'Samagama Admin Team',
    dateTime: '2026-05-31T14:00:00.000Z',
    category: 'Certificate',
    type: 'Certificate',
    pinned: false,
    priority: 'Medium',
    urgencyLevel: 'Low',
    status: 'published',
    targetAudience: 'All Students',
    deadline: '2026-06-20',
    archived: false,
    isPinned: false,
    createdAt: '2026-05-31T14:00:00.000Z',
    createdBy: 'Samagama Admin Team',
    updatedAt: '2026-05-31T14:00:00.000Z',
    links: [],
  },
  {
    id: 'ann-sp-points',
    title: 'SP Points Update',
    preview: 'Helpful answers and accepted solutions now reflect faster in Spurti Points.',
    content:
      'We have improved the Spurti Points update flow. Accepted answers, helpful marks, and resolved questions should now reflect more quickly in your profile and leaderboard.\n\nIf you notice delays, refresh your dashboard after a few minutes.',
    postedBy: 'Samagama Admin Team',
    dateTime: '2026-05-31T10:10:00.000Z',
    category: 'SP Points',
    type: 'General',
    pinned: false,
    priority: 'Low',
    urgencyLevel: 'Low',
    status: 'published',
    targetAudience: 'All Students',
    deadline: '2026-06-30',
    archived: false,
    isPinned: false,
    createdAt: '2026-05-31T10:10:00.000Z',
    createdBy: 'Samagama Admin Team',
    updatedAt: '2026-05-31T10:10:00.000Z',
    links: [],
  },
];

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function safeDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeAudience(value) {
  const audience = String(value || '').trim();
  return targetAudiences.includes(audience) ? audience : 'All Students';
}

function normalizeUrgency(value) {
  const urgency = String(value || '').trim();
  return urgencyLevels.includes(urgency) ? urgency : 'Medium';
}

function normalizeType(value, fallbackCategory = 'General') {
  const type = String(value || '').trim();
  if (announcementTypes.includes(type)) return type;
  return announcementTypes.includes(fallbackCategory) ? fallbackCategory : 'General';
}

function buildPreview(message) {
  return String(message || '').trim().replace(/\s+/g, ' ').slice(0, 110);
}

function enrichAnnouncement(raw = {}) {
  const createdAt = raw.createdAt || raw.dateTime || new Date().toISOString();
  const deadlineDate = raw.deadline ? String(raw.deadline).slice(0, 10) : '';
  const publishAt = raw.publishAt || '';
  const archived = raw.archived || raw.status === 'expired';
  const isExpired = Boolean(deadlineDate && safeDate(`${deadlineDate}T23:59:59`) && new Date() > new Date(`${deadlineDate}T23:59:59`));
  const isScheduled = Boolean(publishAt && safeDate(publishAt) && new Date() < new Date(publishAt));
  const status = archived || isExpired ? 'expired' : (raw.status === 'scheduled' || isScheduled ? 'scheduled' : (raw.status || 'published'));
  return {
    id: raw.id || `ann-${Date.now()}`,
    title: String(raw.title || '').trim(),
    preview: raw.preview || buildPreview(raw.message || raw.content || ''),
    content: String(raw.content || raw.message || '').trim(),
    postedBy: raw.postedBy || 'Samagama Admin Team',
    dateTime: raw.dateTime || createdAt,
    createdAt,
    updatedAt: raw.updatedAt || createdAt,
    createdBy: raw.createdBy || raw.postedBy || 'Samagama Admin Team',
    category: raw.category || raw.type || 'Announcement',
    type: normalizeType(raw.type, raw.category || 'General'),
    urgencyLevel: normalizeUrgency(raw.urgencyLevel || raw.priority),
    priority: raw.priority || raw.urgencyLevel || 'Medium',
    targetAudience: normalizeAudience(raw.targetAudience),
    deadline: deadlineDate,
    publishAt,
    attachmentUrl: raw.attachmentUrl || raw.attachmentLink || '',
    attachmentName: raw.attachmentName || raw.attachmentLabel || 'Attachment',
    attachmentType: raw.attachmentType || '',
    attachmentFileName: raw.attachmentFileName || '',
    attachmentMimeType: raw.attachmentMimeType || '',
    attachmentData: raw.attachmentData || '',
    pinned: Boolean(raw.pinned || raw.isPinned),
    isPinned: Boolean(raw.pinned || raw.isPinned),
    archived,
    status,
    links: Array.isArray(raw.links) ? raw.links : raw.attachmentUrl ? [{ label: raw.attachmentName || raw.attachmentLabel || 'Attachment', url: raw.attachmentUrl }] : [],
  };
}

function sortAnnouncements(items = []) {
  return [...items].sort((a, b) => {
    const aPinned = Boolean(a.pinned || a.isPinned);
    const bPinned = Boolean(b.pinned || b.isPinned);
    if (aPinned !== bPinned) return aPinned ? -1 : 1;
    const urgencyOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    const urgencyDiff = (urgencyOrder[a.urgencyLevel] ?? 9) - (urgencyOrder[b.urgencyLevel] ?? 9);
    if (urgencyDiff !== 0) return urgencyDiff;
    return new Date(b.dateTime || b.createdAt || 0) - new Date(a.dateTime || a.createdAt || 0);
  });
}

function hydrateAnnouncements(items = []) {
  return sortAnnouncements(items.map(enrichAnnouncement));
}

function persistAnnouncementsToServer(announcements) {
  if (typeof window === 'undefined' || !window.fetch) return;
  try {
    fetch('http://localhost:4000/api/announcements', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ announcements }),
    }).catch(() => {});
  } catch {
    // ignore sync errors in local development
  }
}

export function getInitialAnnouncements() {
  if (typeof window === 'undefined') return defaultAnnouncements;
  const saved = readJson(ANNOUNCEMENTS_KEY, null);
  if (Array.isArray(saved) && saved.length > 0) return hydrateAnnouncements(saved);
  writeJson(ANNOUNCEMENTS_KEY, hydrateAnnouncements(defaultAnnouncements));
  return hydrateAnnouncements(defaultAnnouncements);
}

export function getAnnouncements() {
  if (typeof window === 'undefined') return defaultAnnouncements;
  const announcements = readJson(ANNOUNCEMENTS_KEY, defaultAnnouncements);
  const hydrated = hydrateAnnouncements(Array.isArray(announcements) ? announcements : defaultAnnouncements);
  if (JSON.stringify(announcements) !== JSON.stringify(hydrated)) {
    writeJson(ANNOUNCEMENTS_KEY, hydrated);
  }
  return hydrated;
}

export function saveAnnouncements(announcements) {
  if (typeof window === 'undefined') return;
  const hydrated = hydrateAnnouncements(announcements);
  writeJson(ANNOUNCEMENTS_KEY, hydrated);
  persistAnnouncementsToServer(hydrated);
  window.dispatchEvent(new Event('samagama-announcements-updated'));
}

export function getPinnedAnnouncement(announcements = getAnnouncements()) {
  return announcements.find(item => item.pinned) || null;
}

function getReadState() {
  if (typeof window === 'undefined') return {};
  return readJson(READ_STATE_KEY, {});
}

function saveReadState(state) {
  if (typeof window === 'undefined') return;
  writeJson(READ_STATE_KEY, state);
  window.dispatchEvent(new Event('samagama-announcements-updated'));
}

export function getReadMap(userId) {
  const state = getReadState();
  return state[userId] || { ids: [], readAt: {} };
}

export function isAnnouncementRead(userId, announcementId) {
  const readMap = getReadMap(userId);
  return readMap.ids.includes(announcementId);
}

export function getUnreadAnnouncementCount(userId, announcements = getAnnouncements()) {
  return announcements.filter(item => !isAnnouncementRead(userId, item.id)).length;
}

export function markAnnouncementRead(userId, announcementId) {
  if (!userId) return;
  const state = getReadState();
  const current = state[userId] || { ids: [], readAt: {} };
  if (!current.ids.includes(announcementId)) {
    current.ids = [announcementId, ...current.ids];
    current.readAt = {
      ...current.readAt,
      [announcementId]: new Date().toISOString(),
    };
    state[userId] = current;
    saveReadState(state);
  }
}

export function markAllAnnouncementsRead(userId, announcements = getAnnouncements()) {
  if (!userId) return;
  const state = getReadState();
  const now = new Date().toISOString();
  state[userId] = {
    ids: announcements.map(item => item.id),
    readAt: Object.fromEntries(announcements.map(item => [item.id, now])),
  };
  saveReadState(state);
}

export function createAnnouncement(input) {
  const existing = getAnnouncements();
  const pinnedExisting = getPinnedAnnouncement(existing);
  const shouldReplacePinned = Boolean(input.replacePinned);
  const wantPinned = Boolean(input.pinned);
  const shouldPinNew = wantPinned && (!pinnedExisting || shouldReplacePinned);
  const now = new Date().toISOString();
  const next = [
    enrichAnnouncement({
      id: `ann-${Date.now()}`,
      title: input.title.trim(),
      preview: buildPreview(input.message),
      content: input.message.trim(),
      postedBy: input.postedBy || 'Samagama Admin Team',
      createdBy: input.postedBy || 'Samagama Admin Team',
      createdAt: now,
      updatedAt: now,
      dateTime: now,
      category: input.category || 'Announcement',
      type: input.type || input.category || 'General',
      pinned: shouldPinNew,
      isPinned: shouldPinNew,
      priority: input.priority || input.urgencyLevel || 'Medium',
      urgencyLevel: input.urgencyLevel || input.priority || 'Medium',
      targetAudience: input.targetAudience || 'All Students',
      deadline: input.deadline || '',
      publishAt: input.publishAt || '',
      status: input.status || 'published',
      attachmentUrl: input.attachmentUrl || input.attachmentLink || '',
      attachmentName: input.attachmentName || input.attachmentLabel || 'Attachment',
      attachmentType: input.attachmentType || '',
      attachmentFileName: input.attachmentFileName || '',
      attachmentMimeType: input.attachmentMimeType || '',
      attachmentData: input.attachmentData || '',
      links: input.attachmentUrl || input.attachmentLink
        ? [{ label: input.attachmentName || input.attachmentLabel || 'Attachment', url: input.attachmentUrl || input.attachmentLink }]
        : [],
      archived: false,
    }),
    ...existing.map(item => ({
      ...item,
      pinned: shouldPinNew ? false : item.pinned,
      isPinned: shouldPinNew ? false : item.isPinned,
    })),
  ];
  saveAnnouncements(next);
  return next;
}

export function setAnnouncementPinned(announcementId, pinned, { replacePinned = false } = {}) {
  const existing = getAnnouncements();
  const pinnedExisting = getPinnedAnnouncement(existing);

  if (pinned && pinnedExisting && pinnedExisting.id !== announcementId && !replacePinned) {
    return { status: 'needs-replace', pinnedExisting, announcements: existing };
  }

  const next = existing.map(item => ({
    ...item,
    pinned: pinned ? item.id === announcementId : (item.id === announcementId ? false : item.pinned),
    isPinned: pinned ? item.id === announcementId : (item.id === announcementId ? false : item.isPinned),
  }));

  saveAnnouncements(next);
  return { status: 'ok', announcements: next };
}

export function updateAnnouncement(announcementId, patch = {}) {
  const existing = getAnnouncements();
  const next = existing.map(item => {
    if (item.id !== announcementId) return item;
    const merged = enrichAnnouncement({
      ...item,
      ...patch,
      id: item.id,
      createdAt: item.createdAt || item.dateTime,
      updatedAt: new Date().toISOString(),
      dateTime: item.dateTime || item.createdAt,
      pinned: typeof patch.pinned === 'boolean' ? patch.pinned : item.pinned,
      isPinned: typeof patch.isPinned === 'boolean' ? patch.isPinned : item.isPinned,
    });
    return merged;
  });
  saveAnnouncements(next);
  return next;
}

export function deleteAnnouncement(announcementId) {
  const next = getAnnouncements().filter(item => item.id !== announcementId);
  saveAnnouncements(next);
  return next;
}

export function archiveAnnouncement(announcementId) {
  return updateAnnouncement(announcementId, {
    archived: true,
    status: 'expired',
  });
}

export function getAnnouncementDeadlineInfo(announcement) {
  if (!announcement?.deadline) {
    return { label: 'No expiry', daysRemaining: null, expired: false };
  }
  const deadline = new Date(`${announcement.deadline}T23:59:59`);
  if (Number.isNaN(deadline.getTime())) {
    return { label: 'No expiry', daysRemaining: null, expired: false };
  }
  const now = new Date();
  const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysRemaining < 0) {
    return { label: 'Expired', daysRemaining, expired: true };
  }
  if (daysRemaining === 0) {
    return { label: 'Due today', daysRemaining, expired: false };
  }
  if (daysRemaining === 1) {
    return { label: '1 day left', daysRemaining, expired: false };
  }
  return { label: `${daysRemaining} days left`, daysRemaining, expired: false };
}

export function isAnnouncementActive(announcement) {
  if (!announcement) return false;
  if (announcement.archived || announcement.status === 'draft' || announcement.status === 'expired') return false;
  if (announcement.publishAt) {
    const publishDate = new Date(announcement.publishAt);
    if (!Number.isNaN(publishDate.getTime()) && new Date() < publishDate) return false;
  }
  return !getAnnouncementDeadlineInfo(announcement).expired;
}

export function getAnnouncementsForAudience(announcements = getAnnouncements(), audience = 'All Students') {
  return sortAnnouncements(
    announcements.filter(item => {
      if (item.archived || item.status === 'expired' || item.status === 'draft') return false;
      if (!isAnnouncementActive(item)) return false;
      if (audience === 'All Students') return true;
      if (item.targetAudience === 'All Students') return true;
      return item.targetAudience === audience;
    }),
  );
}

export function formatAnnouncementTime(dateTime) {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(dateTime));
  } catch {
    return new Date(dateTime).toLocaleString();
  }
}

export function getAnnouncementCategoryIcon(category) {
  const map = {
    Announcement: '📢',
    Meeting: '📅',
    Internship: '🎓',
    NOC: '📄',
    Certificate: '🏆',
    'SP Points': '⭐',
    Important: '⚠',
  };
  return map[category] || '📢';
}
