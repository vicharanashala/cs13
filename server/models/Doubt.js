const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  text: { type: String, required: true },
}, { timestamps: true });

const doubtSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  body: { type: String, default: '' },
  tags: [{ type: String, default: 'Other' }],
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  solved: { type: Boolean, default: false },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, required: true },
  votes: { type: Number, default: 1 },
  voters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  answers: [answerSchema],
}, { timestamps: true });

module.exports = mongoose.model('Doubt', doubtSchema);