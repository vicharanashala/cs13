const mongoose = require('mongoose');

const knowledgeBaseSchema = new mongoose.Schema({
  question:    { type: String, required: true, trim: true },
  answer:      { type: String, required: true },
  category:    { type: String, default: 'General' },
  tags:        [{ type: String, trim: true }],
  priority:    { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  viewCount:   { type: Number, default: 0 },
  usedInRag:   { type: Number, default: 0 },   // times retrieved by ZORO
  helpfulCount:{ type: Number, default: 0 },   // thumbs-up from chat
  source:      { type: String, enum: ['admin', 'resolved_ticket', 'faq_import', 'manual'], default: 'manual' },
  sourceId:    { type: String, default: null }, // original ticket/escalation/_id if migrated
  status:      { type: String, enum: ['active', 'archived'], default: 'active' },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

knowledgeBaseSchema.index({ question: 'text', answer: 'text', tags: 'text' });
knowledgeBaseSchema.index({ category: 1, status: 1 });
knowledgeBaseSchema.index({ usedInRag: -1 });

module.exports = mongoose.model('KnowledgeBase', knowledgeBaseSchema);