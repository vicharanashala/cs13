const router = require('express').Router();
const mongoose = require('mongoose');
const Announcement = require('../models/Announcement');
const User = require('../models/User');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// GET /api/announcements — public (students and visitors)
router.get('/', async (req, res) => {
  const { status, urgency, target, pinned, q } = req.query;
  const filter = {};

  if (status && status !== 'all') filter.status = status;
  if (urgency) filter.urgencyLevel = urgency;
  if (target && target !== 'All Students') filter.targetAudience = target;
  if (pinned === 'true') filter.pinned = true;
  if (q) filter.$or = [
    { title: { $regex: q, $options: 'i' } },
    { content: { $regex: q, $options: 'i' } },
    { category: { $regex: q, $options: 'i' } },
  ];

  const announcements = await Announcement.find(filter)
    .sort({ createdAt: -1 })
    .limit(100);
  res.json(announcements);
});

// GET /api/announcements/read-state/:userId — get which announcements a user has read
router.get('/read-state/:userId', async (req, res) => {
  try {
    const isId = mongoose.Types.ObjectId.isValid(req.params.userId);
    const user = isId 
      ? await User.findById(req.params.userId) 
      : await User.findOne({ email: req.params.userId });

    if (!user) return res.json({ readIds: [], readAt: {} });
    const readIds = user.announcementReadIds || [];
    const readAt = user.announcementReadAt || {};
    res.json({ readIds, readAt });
  } catch (error) {
    res.json({ readIds: [], readAt: {} });
  }
});

// POST /api/announcements/read-state — mark an announcement as read
router.post('/read-state', async (req, res) => {
  const { userId, announcementId } = req.body;
  if (!userId || !announcementId) return res.status(400).json({ error: 'userId and announcementId required' });

  try {
    const isId = mongoose.Types.ObjectId.isValid(userId);
    const filter = isId ? { _id: userId } : { email: userId };
    await User.findOneAndUpdate(filter, {
      $addToSet: { announcementReadIds: announcementId },
      [`announcementReadAt.${announcementId}`]: new Date().toISOString(),
    });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/announcements/read-state/all — mark all as read for a user
router.post('/read-state/all', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  try {
    const announcements = await Announcement.find({ status: 'published' }).select('_id');
    const ids = announcements.map(a => a._id.toString());
    const readAt = {};
    ids.forEach(id => { readAt[id] = new Date().toISOString(); });

    const isId = mongoose.Types.ObjectId.isValid(userId);
    const filter = isId ? { _id: userId } : { email: userId };
    await User.findOneAndUpdate(filter, {
      announcementReadIds: ids,
      announcementReadAt: readAt,
    });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// POST /api/announcements — admin only
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const { title, content, message, category, urgencyLevel, targetAudience, target, deadline, attachmentUrl, attachmentName, links, pinned, postedBy } = req.body;

  if (!title || (!content && !message)) return res.status(400).json({ error: 'title and content/message are required' });

  let audience = targetAudience || 'All Students';
  if (target) {
    if (target === 'all') audience = 'All Students';
    else if (target === 'bronze') audience = 'Bronze Phase';
    else if (target === 'silver') audience = 'Silver Phase';
    else if (target === 'gold') audience = 'Gold Phase';
    else audience = target;
  }

  const announcement = await Announcement.create({
    title,
    content: content || message || '',
    preview: (content || message || '').replace(/\s+/g, ' ').slice(0, 110),
    category: category || 'Announcement',
    urgencyLevel: urgencyLevel || 'Medium',
    targetAudience: audience,
    deadline: deadline || '',
    attachmentUrl: attachmentUrl || '',
    attachmentName: attachmentName || '',
    links: links || [],
    pinned: pinned || false,
    publishedAt: new Date(),
    createdBy: req.userId || postedBy || null,
  });

  res.status(201).json(announcement);
});

// PATCH /api/announcements/:id — admin only
router.patch('/:id', requireAuth, requireAdmin, async (req, res) => {
  const allowed = ['title', 'content', 'category', 'urgencyLevel', 'targetAudience', 'deadline', 'attachmentUrl', 'attachmentName', 'links', 'pinned'];
  const updates = {};
  allowed.forEach(field => { if (req.body[field] !== undefined) updates[field] = req.body[field]; });
  if (updates.content) updates.preview = updates.content.replace(/\s+/g, ' ').slice(0, 110);

  const announcement = await Announcement.findByIdAndUpdate(req.params.id, updates, { new: true });
  if (!announcement) return res.status(404).json({ error: 'Announcement not found' });
  res.json(announcement);
});

// DELETE /api/announcements/:id — admin only
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  const result = await Announcement.findByIdAndDelete(req.params.id);
  if (!result) return res.status(404).json({ error: 'Announcement not found' });
  res.json({ ok: true });
});

module.exports = router;