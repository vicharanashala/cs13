const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

function sendAuthError(res, error, status = 500) {
  const message = error?.message || 'Authentication service unavailable';
  console.error('[Auth Route]', message);
  return res.status(status).json({ error: message });
}

// POST /api/auth/register
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().notEmpty().withMessage('Username or email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password, college, department, role } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name, email, password: hashed,
      role: role || 'student',
      college: college || '',
      department: department || '',
    });

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'samagama_jwt_secret_2026',
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role,
        college: user.college, department: user.department, currentPhase: user.currentPhase,
        spurtiPoints: user.spurtiPoints, streak: user.streak },
    });
  } catch (error) {
    return sendAuthError(res, error);
  }
});

// POST /api/auth/login
router.post('/login', [
  body('email').notEmpty().withMessage('Email is required'),
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Support demo login for the prototype
    if (email === 'student@demo' && password === 'demo123') {
      let student = await User.findOne({ email: 'student@demo' });
      if (!student) {
        student = await User.create({
          name: 'Demo Student', email: 'student@demo',
          password: await bcrypt.hash('demo123', 10), role: 'student',
        });
      }
      const token = jwt.sign({ userId: student._id, role: student.role }, process.env.JWT_SECRET || 'samagama_jwt_secret_2026', { expiresIn: '7d' });
      return res.json({
        token,
        user: { _id: student._id, name: student.name, email: student.email, role: student.role,
          college: student.college, currentPhase: student.currentPhase, spurtiPoints: student.spurtiPoints, streak: student.streak },
      });
    }

    if (email === 'admin@demo' && password === 'demo123') {
      let admin = await User.findOne({ email: 'admin@demo' });
      if (!admin) {
        admin = await User.create({
          name: 'Samagama Admin', email: 'admin@demo',
          password: await bcrypt.hash('demo123', 10), role: 'admin',
        });
      }
      const token = jwt.sign({ userId: admin._id, role: admin.role }, process.env.JWT_SECRET || 'samagama_jwt_secret_2026', { expiresIn: '7d' });
      return res.json({
        token,
        user: { _id: admin._id, name: admin.name, email: admin.email, role: admin.role },
      });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || 'samagama_jwt_secret_2026', { expiresIn: '7d' });
    return res.json({
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role,
        college: user.college, department: user.department,
        currentPhase: user.currentPhase, spurtiPoints: user.spurtiPoints, streak: user.streak,
        avatar: user.avatar, phone: user.phone },
    });
  } catch (error) {
    return sendAuthError(res, error);
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ user });
  } catch (error) {
    return sendAuthError(res, error);
  }
});

// PUT /api/auth/profile
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const allowed = ['name', 'college', 'department', 'phone', 'avatar'];
    const updates = {};
    allowed.forEach(field => { if (req.body[field] !== undefined) updates[field] = req.body[field]; });
    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true }).select('-password');
    return res.json({ user });
  } catch (error) {
    return sendAuthError(res, error);
  }
});

module.exports = router;
