const router = require('express').Router();
const User = require('../models/User');
const Review = require('../models/Review');
const Noc = require('../models/Noc');
const { Task, TaskSubmission } = require('../models/Task');
const SpurtiTransaction = require('../models/SpurtiTransaction');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// GET /api/students — admin only: list all students
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  const { search, phase, page = 1 } = req.query;
  const filter = { role: 'student' };
  if (phase && phase !== 'all') filter.currentPhase = phase;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { college: { $regex: search, $options: 'i' } },
    ];
  }

  const limit = 20;
  const skip = (Number(page) - 1) * limit;
  const [students, total] = await Promise.all([
    User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  res.json({ students, total, page: Number(page), pages: Math.ceil(total / limit) });
});

// GET /api/students/stats — admin dashboard stats
router.get('/stats', requireAuth, requireAdmin, async (req, res) => {
  const [total, active, byPhase, nocPending, reviewsPending, doubtsPending] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'student', isActive: true }),
    User.aggregate([
      { $match: { role: 'student' } },
      { $group: { _id: '$currentPhase', count: { $sum: 1 } } },
    ]),
    Noc.countDocuments({ status: 'pending' }),
    Review.countDocuments({ status: 'submitted' }),
    require('../models/Doubt').countDocuments({ status: 'pending' }),
  ]);

  res.json({
    total, active,
    byPhase: Object.fromEntries(byPhase.map(p => [p._id || 'none', p.count])),
    nocPending, reviewsPending, doubtsPending,
  });
});

// GET /api/students/:id — admin view single student
router.get('/:id', requireAuth, requireAdmin, async (req, res) => {
  const student = await User.findById(req.params.id).select('-password');
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const [submissions, reviews, transactions] = await Promise.all([
    TaskSubmission.find({ student: req.params.id }).populate('task'),
    Review.find({ student: req.params.id }).sort({ createdAt: -1 }),
    SpurtiTransaction.find({ student: req.params.id }).sort({ createdAt: -1 }).limit(20),
  ]);

  res.json({ student, submissions, reviews, transactions });
});

// PUT /api/students/:id/phase — admin update student phase
router.put('/:id/phase', requireAuth, requireAdmin, async (req, res) => {
  const { phase } = req.body;
  if (!['bronze', 'silver', 'gold', 'platinum', 'none'].includes(phase)) {
    return res.status(400).json({ error: 'Invalid phase' });
  }
  const student = await User.findByIdAndUpdate(req.params.id, { currentPhase: phase }, { new: true }).select('-password');
  res.json(student);
});

// PUT /api/students/:id/spurti — admin adjust SP
router.put('/:id/spurti', requireAuth, requireAdmin, async (req, res) => {
  const { amount, reason } = req.body;
  if (typeof amount !== 'number') return res.status(400).json({ error: 'amount must be a number' });

  const student = await User.findByIdAndUpdate(
    req.params.id,
    { $inc: { spurtiPoints: amount } },
    { new: true }
  ).select('-password');

  await SpurtiTransaction.create({
    student: req.params.id,
    amount,
    balanceAfter: student.spurtiPoints,
    reason: reason || `Admin adjustment: ${amount > 0 ? 'bonus' : 'deduction'}`,
    category: amount > 0 ? 'leaderboard_bonus' : 'penalty',
  });

  res.json(student);
});

module.exports = router;