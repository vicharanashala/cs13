const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const Noc = require('../models/Noc');
const User = require('../models/User');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Multer: store uploads in /uploads/nocs/
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads/nocs')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `noc-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only PDF, JPG, PNG allowed'));
  },
});

// GET /api/nocs — admin sees all; student sees own
router.get('/', requireAuth, async (req, res) => {
  const filter = req.userRole === 'admin' ? {} : { student: req.userId };
  const nocs = await Noc.find(filter).sort({ submittedAt: -1 });
  res.json(nocs);
});

// POST /api/nocs — submit NOC (with file upload)
router.post('/', requireAuth, upload.single('file'), async (req, res) => {
  const user = await User.findById(req.userId);
  const file = req.file;

  const existing = await Noc.findOne({ student: req.userId, status: { $in: ['pending', 'approved'] } });
  if (existing) return res.status(409).json({ error: 'You already have a pending or approved NOC' });

  const noc = await Noc.create({
    student: req.userId,
    studentName: user.name,
    studentEmail: user.email,
    college: user.college,
    fileName: file?.originalname || '',
    fileUrl: file ? `/uploads/nocs/${file.filename}` : '',
    status: 'pending',
  });

  // Update user NOC status
  await User.findByIdAndUpdate(req.userId, { nocStatus: 'pending', nocSubmittedAt: new Date() });

  res.status(201).json(noc);
});

// PATCH /api/nocs/:id — admin approves/rejects
router.patch('/:id', requireAuth, requireAdmin, async (req, res) => {
  const { status, rejectionReason } = req.body;
  if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const noc = await Noc.findById(req.params.id);
  if (!noc) return res.status(404).json({ error: 'NOC not found' });

  noc.status = status;
  noc.rejectionReason = rejectionReason || '';
  noc.reviewedBy = req.userId;
  await noc.save();

  await User.findByIdAndUpdate(noc.student, { nocStatus: status });

  res.json(noc);
});

module.exports = router;