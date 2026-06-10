const express = require('express');
const router = express.Router();
const KnowledgeBase = require('../models/KnowledgeBase');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// GET /api/knowledge-base  – search/filter
router.get('/', async (req, res) => {
  try {
    const { q, category, tag, status = 'active', limit = 20, page = 1 } = req.query;
    const filter = { status };
    if (category) filter.category = category;
    if (tag)      filter.tags = tag;
    if (q) {
      filter.$text = { $search: q };
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      KnowledgeBase.find(filter)
        .sort(q ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
        .skip(skip).limit(Number(limit))
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email'),
      KnowledgeBase.countDocuments(filter),
    ]);
    res.json({ items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/knowledge-base/:id
router.get('/:id', async (req, res) => {
  try {
    const item = await KnowledgeBase.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');
    if (!item) return res.status(404).json({ error: 'Not found' });
    item.viewCount = (item.viewCount || 0) + 1;
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/knowledge-base  – create
router.post('/', requireAuth, async (req, res) => {
  try {
    const { question, answer, category, tags, priority, source } = req.body;
    if (!question || !answer) return res.status(400).json({ error: 'question and answer required' });
    const item = await KnowledgeBase.create({
      question, answer, category, tags, priority, source,
      createdBy: req.userId,
      updatedBy: req.userId,
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/knowledge-base/:id
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const item = await KnowledgeBase.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.userId },
      { new: true, runValidators: true },
    );
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/knowledge-base/:id/archive
router.patch('/:id/archive', requireAuth, async (req, res) => {
  try {
    const item = await KnowledgeBase.findByIdAndUpdate(
      req.params.id,
      { status: 'archived', updatedBy: req.userId },
      { new: true },
    );
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/knowledge-base/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const item = await KnowledgeBase.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/knowledge-base/categories/list  – distinct categories
router.get('/meta/categories', async (req, res) => {
  try {
    const cats = await KnowledgeBase.distinct('category', { status: 'active' });
    res.json(cats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;