const router = require('express').Router();
const Review = require('../models/Review');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// GET /api/reviews — student sees own reviews; admin sees all
router.get('/', requireAuth, async (req, res) => {
  const filter = req.userRole === 'admin' ? {} : { student: req.userId };
  const reviews = await Review.find(filter)
    .sort({ createdAt: -1 })
    .populate('reviewedBy', 'name');
  res.json(reviews);
});

// GET /api/reviews/pending — admin: pending reviews
router.get('/pending', requireAuth, requireAdmin, async (req, res) => {
  const reviews = await Review.find({ status: 'submitted' })
    .sort({ createdAt: 1 })
    .populate('student', 'name email college');
  res.json(reviews);
});

// POST /api/reviews — submit a weekly review
router.post('/', requireAuth, async (req, res) => {
  const { weekNumber, rating, workSummary, challenges, nextWeekGoals } = req.body;
  if (!weekNumber) return res.status(400).json({ error: 'weekNumber is required' });

  const user = await require('../models/User').findById(req.userId);
  const review = await Review.create({
    student: req.userId,
    studentName: user.name,
    weekNumber,
    rating: rating || 5,
    workSummary: workSummary || '',
    challenges: challenges || '',
    nextWeekGoals: nextWeekGoals || '',
  });

  res.status(201).json(review);
});

// PATCH /api/reviews/:id — admin approves/rejects
router.patch('/:id', requireAuth, requireAdmin, async (req, res) => {
  const { status, feedback } = req.body;
  if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const review = await Review.findByIdAndUpdate(
    req.params.id,
    { status, feedback: feedback || '', reviewedBy: req.userId },
    { new: true }
  );
  if (!review) return res.status(404).json({ error: 'Review not found' });
  res.json(review);
});

module.exports = router;