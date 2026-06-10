require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Import routes
const authRoutes = require('./routes/auth');
const announcementRoutes = require('./routes/announcements');
const faqRoutes = require('./routes/faqs');
const doubtRoutes = require('./routes/doubts');
const leaderboardRoutes = require('./routes/leaderboard');
const { router: spurtiRoutes } = require('./routes/spurti');
const teamRoutes = require('./routes/teams');
const studentRoutes = require('./routes/students');
const reviewRoutes = require('./routes/reviews');
const nocRoutes = require('./routes/nocs');
const yakshaRoutes = require('./routes/yaksha');
const taskRoutes = require('./routes/tasks');
const knowledgeBaseRoutes = require('./routes/knowledgeBase');
const Faq = require('./models/Faq');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const { faqData } = require('./data');
const { demoLeaderboardStudents } = require('./demoFixtures');

const app = express();
const PORT = process.env.PORT || 4000;

// ── Security middleware ───────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] }));

// Rate limiting: 100 requests/min per IP
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
}));

// ── Body parsing ──────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Static files (uploaded NOCs) ──────────────────────────────────
const uploadsDir = path.join(__dirname, 'uploads', 'nocs');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── API Routes ────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/doubts', doubtRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/spurti', spurtiRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/admin/teams', teamRoutes);  // same router handles /teams and /admin/teams
app.use('/api/students', studentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/nocs', nocRoutes);
app.use('/api/yaksha', yakshaRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/knowledge-base', knowledgeBaseRoutes);

// ── Health check ──────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: Math.round(process.uptime()),
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// ── 404 fallback ──────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ── Global error handler ──────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.message);
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'File too large (max 5MB)' });
  if (err.message?.includes('Only PDF')) return res.status(400).json({ error: err.message });
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────
async function start() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/samagama';

  try {
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected:', mongoUri);

    const faqCount = await Faq.countDocuments();
    if (faqCount === 0) {
      await Faq.insertMany(faqData.map((item, index) => ({
        question: item.q,
        answer: item.a,
        category: item.cat,
        order: index + 1,
      })));
      console.log(`✅ Seeded ${faqData.length} FAQ records`);
    }

    const demoPassword = await bcrypt.hash('demo123', 10);
    const adminInPassword = await bcrypt.hash('admin123', 10);
    const demoUsers = [
      {
        email: 'admin@demo',
        name: 'Samagama Admin',
        role: 'admin',
        college: '',
        department: '',
        spurtiPoints: 0,
        streak: 0,
      },
      {
        email: 'admin@samagama.in',
        name: 'Samagama Admin',
        role: 'admin',
        college: '',
        department: '',
        spurtiPoints: 0,
        streak: 0,
      },
      {
        email: 'student@demo',
        name: 'Arushi Singh',
        role: 'student',
        college: 'IIT Ropar',
        department: 'Computer Science',
        spurtiPoints: 177,
        streak: 5,
      },
      ...demoLeaderboardStudents.map(student => ({
        ...student,
        role: 'student',
        isActive: true,
      })),
    ];

    for (const demoUser of demoUsers) {
      await User.findOneAndUpdate(
        { email: demoUser.email },
        {
          name: demoUser.name,
          email: demoUser.email,
          password: demoUser.email === 'admin@samagama.in' ? adminInPassword : demoPassword,
          role: demoUser.role,
          college: demoUser.college || '',
          department: demoUser.department || '',
          spurtiPoints: demoUser.spurtiPoints || 0,
          currentPhase: demoUser.currentPhase || 'none',
          streak: demoUser.streak || 0,
          isActive: demoUser.isActive !== false,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    console.log(`✅ Demo leaderboard users ensured (${demoUsers.length})`);
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    console.log('   Server will start without database (in-memory fallback only)');
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health`);
  });
}

start();
