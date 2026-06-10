const router = require('express').Router();
const User = require('../models/User');
const SpurtiTransaction = require('../models/SpurtiTransaction');
const { requireAuth } = require('../middleware/auth');

// GET /api/spurti — current user's SP summary
router.get('/', requireAuth, async (req, res) => {
  const student = await User.findById(req.userId);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const transactions = await SpurtiTransaction.find({ student: req.userId })
    .sort({ createdAt: -1 })
    .limit(100);

  const higher = await User.countDocuments({ role: 'student', isActive: true, spurtiPoints: { $gt: student.spurtiPoints } });
  const total = await User.countDocuments({ role: 'student', isActive: true });

  res.json({
    spurtiPoints: student.spurtiPoints,
    rank: higher + 1,
    totalStudents: total,
    percentile: total > 1 ? Math.round((1 - higher / (total - 1)) * 100) : 100,
    transactions,
  });
});

// POST /api/spurti/award — admin awards SP to a student
const awardSpurti = async (studentId, amount, reason, category = 'other', refId = null) => {
  const student = await User.findByIdAndUpdate(
    studentId,
    { $inc: { spurtiPoints: amount } },
    { new: true }
  );
  await SpurtiTransaction.create({
    student: studentId,
    amount,
    balanceAfter: student.spurtiPoints,
    reason,
    category,
    refId,
  });
  return student;
};

module.exports = { router, awardSpurti };