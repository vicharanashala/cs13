const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, enum: ['leader', 'member'], default: 'member' },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
}, { timestamps: true });

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  domain: { type: String, default: '' },
  projectTitle: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'active', 'completed', 'rejected'], default: 'pending' },
  members: [teamMemberSchema],
  maxMembers: { type: Number, default: 4 },
  leader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  leaderName: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Team', teamSchema);