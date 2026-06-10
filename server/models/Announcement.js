const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  preview: { type: String, default: '' },
  content: { type: String, required: true },
  category: { type: String, enum: ['Meeting', 'General', 'Deadline', 'Achievement', 'Announcement'], default: 'Announcement' },
  urgencyLevel: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  targetAudience: { type: String, default: 'All Students' },
  deadline: { type: String, default: '' },
  attachmentUrl: { type: String, default: '' },
  attachmentName: { type: String, default: '' },
  links: [{
    label: { type: String, default: '' },
    url: { type: String, default: '' },
  }],
  pinned: { type: Boolean, default: false },
  status: { type: String, enum: ['draft', 'published', 'scheduled', 'expired'], default: 'published' },
  publishedAt: { type: Date, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);