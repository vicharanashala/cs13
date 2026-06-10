const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },

  // Student profile fields
  college: { type: String, trim: true, default: '' },
  department: { type: String, trim: true, default: '' },
  phone: { type: String, trim: true, default: '' },
  avatar: { type: String, default: '' },

  // Internship tracking
  currentPhase: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum', 'none'], default: 'none' },
  startDate: { type: Date, default: null },
  endDate: { type: Date, default: null },

  // Gamification
  spurtiPoints: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  lastActiveDate: { type: Date, default: null },

  // Status
  isActive: { type: Boolean, default: true },
  onboardingComplete: { type: Boolean, default: false },

  // NOC
  nocStatus: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
  nocSubmittedAt: { type: Date, default: null },

  // Announcement read tracking
  announcementReadIds: [{ type: String }],
  announcementReadAt: { type: Map, of: String, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);