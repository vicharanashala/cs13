const mongoose = require('mongoose');

// Tracks every SP gain/loss event and a running balance per student
const spurtiTransactionSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true }, // positive = earn, negative = deduct
  balanceAfter: { type: Number, required: true },
  reason: { type: String, required: true },
  category: {
    type: String,
    enum: ['task', 'review', 'doubt_answer', 'leaderboard_bonus', 'penalty', 'other'],
    default: 'other',
  },
  refId: { type: mongoose.Schema.Types.ObjectId, default: null }, // linked object (task, review, etc.)
}, { timestamps: true });

module.exports = mongoose.model('SpurtiTransaction', spurtiTransactionSchema);