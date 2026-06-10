const router = require('express').Router();
const Doubt = require('../models/Doubt');
const { requireAuth, requireAdmin, optionalAuth } = require('../middleware/auth');

// GET /api/doubts
// ?status=approved (public/student) | ?status=pending (admin) | no filter (admin sees all)
router.get('/', requireAuth, async (req, res) => {
  const { tag, q, status } = req.query;
  const filter = {};

  if (req.userRole !== 'admin') {
    filter.$or = [{ status: 'approved' }, { author: req.userId }];
  } else if (status) {
    filter.status = status;
  }

  if (tag && tag !== 'All') filter.tags = tag;
  if (q) filter.title = { $regex: q, $options: 'i' };

  const doubts = await Doubt.find(filter)
    .populate('author', 'name email')
    .populate('answers.user', 'name')
    .sort({ createdAt: -1 })
    .limit(100);
  res.json(doubts);
});

// POST /api/doubts — create a new doubt
router.post('/', requireAuth, async (req, res) => {
  const { title, body, tags } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const doubt = await Doubt.create({
    title, body: body || '',
    tags: Array.isArray(tags) && tags.length ? tags : ['Other'],
    author: req.userId,
    authorName: (await require('../models/User').findById(req.userId))?.name || 'Anonymous',
    votes: 0,
    voters: [],
  });

  await doubt.populate('author', 'name email');
  res.status(201).json(doubt);
});

// POST /api/doubts/:id/approve — admin approve
router.post('/:id/approve', requireAuth, requireAdmin, async (req, res) => {
  const doubt = await Doubt.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true })
    .populate('author', 'name email').populate('answers.user', 'name');
  if (!doubt) return res.status(404).json({ error: 'Doubt not found' });
  res.json(doubt);
});

// POST /api/doubts/:id/reject — admin reject
router.post('/:id/reject', requireAuth, requireAdmin, async (req, res) => {
  const doubt = await Doubt.findByIdAndUpdate(req.params.id, { status: 'rejected' }, { new: true })
    .populate('author', 'name email').populate('answers.user', 'name');
  if (!doubt) return res.status(404).json({ error: 'Doubt not found' });
  res.json(doubt);
});

// POST /api/doubts/:id/answers — alias for /answer (backend compatibility)
router.post('/:id/answers', requireAuth, async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Answer text is required' });

  const doubt = await Doubt.findById(req.params.id);
  if (!doubt) return res.status(404).json({ error: 'Doubt not found' });
  if (doubt.status !== 'approved') return res.status(400).json({ error: 'Doubt not open for answers' });

  const user = await require('../models/User').findById(req.userId);
  doubt.answers.push({ user: req.userId, userName: user?.name || 'Anonymous', text });
  await doubt.save();
  await doubt.populate('author', 'name email');
  await doubt.populate('answers.user', 'name');
  res.status(201).json(doubt);
});

// POST /api/doubts/:id/solved — toggle solved
router.post('/:id/solved', requireAuth, async (req, res) => {
  const doubt = await Doubt.findById(req.params.id);
  if (!doubt) return res.status(404).json({ error: 'Doubt not found' });
  if (doubt.author.toString() !== req.userId && req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Not authorized' });
  }
  doubt.solved = !doubt.solved;
  await doubt.save();
  await doubt.populate('author', 'name email');
  await doubt.populate('answers.user', 'name');
  res.json(doubt);
});

// POST /api/doubts/:id/vote — upvote
router.post('/:id/vote', requireAuth, async (req, res) => {
  const doubt = await Doubt.findById(req.params.id);
  if (!doubt) return res.status(404).json({ error: 'Doubt not found' });

  const alreadyVoted = doubt.voters.includes(req.userId);
  if (alreadyVoted) {
    doubt.votes = Math.max(0, doubt.votes - 1);
    doubt.voters = doubt.voters.filter(v => v.toString() !== req.userId);
  } else {
    doubt.votes += 1;
    doubt.voters.push(req.userId);
  }
  await doubt.save();
  await doubt.populate('author', 'name email');
  res.json({ votes: doubt.votes, voted: !alreadyVoted });
});

// POST /api/doubts/:id/answers — post an answer
router.post('/:id/answer', requireAuth, async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Answer text is required' });

  const doubt = await Doubt.findById(req.params.id);
  if (!doubt) return res.status(404).json({ error: 'Doubt not found' });
  if (doubt.status !== 'approved') return res.status(400).json({ error: 'Doubt not open for answers' });

  const user = await require('../models/User').findById(req.userId);
  doubt.answers.push({ user: req.userId, userName: user?.name || 'Anonymous', text });
  await doubt.save();
  await doubt.populate('author', 'name email');
  await doubt.populate('answers.user', 'name');
  res.status(201).json(doubt);
});

module.exports = router;