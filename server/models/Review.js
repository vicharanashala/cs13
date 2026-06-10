const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: { type: String, required: true },
  weekNumber: { type: Number, required: true },
  rating: { type: Number, min: 1, max: 5, default: 5 },
  workSummary: { type: String, default: '' },
  challenges: { type: String, default: '' },
  nextWeekGoals: { type: String, default: '' },
  status: { type: String, enum: ['submitted', 'approved', 'rejected'], default: 'submitted' },
  feedback: { type: String, default: '' }, // admin optional feedback
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);