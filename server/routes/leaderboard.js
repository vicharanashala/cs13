const router = require('express').Router();
const User = require('../models/User');
const SpurtiTransaction = require('../models/SpurtiTransaction');
const { requireAuth } = require('../middleware/auth');
const { publicLeaderboardFallback } = require('../demoFixtures');

function normalizeLeaderboardRow(row = {}, rank = 0) {
  return {
    rank,
    id: row.id || row._id,
    name: row.name || 'Student',
    college: row.college || 'IIT Ropar',
    totalSp: typeof row.totalSp === 'number' ? row.totalSp : (row.spurtiPoints || row.sp || 0),
    periodSp: typeof row.periodSp === 'number' ? row.periodSp : 0,
    phase: row.phase || row.currentPhase || 'bronze',
    streak: row.streak || 0,
  };
}

// GET /api/leaderboard — public
router.get('/', async (req, res) => {
  try {
    const { period } = req.query; // 'all' | 'monthly' | 'weekly'
    const since = period === 'weekly'
      ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      : period === 'monthly'
        ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        : new Date(0);

    // Build a map of SP earned in period
    const pipeline = [
      { $match: { createdAt: { $gte: since }, amount: { $gt: 0 } } },
      { $group: { _id: '$student', spInPeriod: { $sum: '$amount' } } },
      { $sort: { spInPeriod: -1 } },
      { $limit: 50 },
    ];

    const periodPoints = await SpurtiTransaction.aggregate(pipeline);
    const periodMap = Object.fromEntries(periodPoints.map(p => [p._id.toString(), p.spInPeriod]));

    // Get all active students ordered by total SP
    const students = await User.find({ role: 'student', isActive: true })
      .select('name college spurtiPoints currentPhase streak lastActiveDate')
      .sort({ spurtiPoints: -1 })
      .limit(100);

    const leaderboard = (students.length >= 3 ? students.map((s, i) => normalizeLeaderboardRow({
      id: s._id,
      name: s.name,
      college: s.college,
      totalSp: s.spurtiPoints,
      periodSp: periodMap[s._id.toString()] || 0,
      phase: s.currentPhase,
      streak: s.streak,
    }, i + 1)) : publicLeaderboardFallback.map((item, i) => normalizeLeaderboardRow(item, i + 1)));

    res.json(leaderboard);
  } catch (error) {
    console.error('[Leaderboard Route]', error.message);
    res.json(publicLeaderboardFallback.map((item, i) => normalizeLeaderboardRow(item, i + 1)));
  }
});

// GET /api/leaderboard/me — student's own rank
router.get('/me', requireAuth, async (req, res) => {
  const student = await User.findById(req.userId);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const higher = await User.countDocuments({ role: 'student', isActive: true, spurtiPoints: { $gt: student.spurtiPoints } });
  const total = await User.countDocuments({ role: 'student', isActive: true });

  res.json({
    rank: higher + 1,
    total,
    percentile: total > 1 ? Math.round((1 - higher / (total - 1)) * 100) : 100,
    spurtiPoints: student.spurtiPoints,
    streak: student.streak,
  });
});

module.exports = router;
