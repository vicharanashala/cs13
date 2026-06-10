const router = require('express').Router();
const Faq = require('../models/Faq');
const { faqData } = require('../data');
const { requireAuth, requireAdmin } = require('../middleware/auth');

function normalizeFaq(item = {}) {
  return {
    id: item.id || item._id,
    q: item.q || item.question || '',
    a: item.a || item.answer || '',
    cat: item.cat || item.category || 'general',
    order: item.order || 0,
  };
}

function buildFaqCorpus(dbDocs = []) {
  const merged = new Map();

  faqData.forEach(item => {
    merged.set(item.q, normalizeFaq(item));
  });

  dbDocs.forEach(doc => {
    const normalized = normalizeFaq(doc);
    if (normalized.q) merged.set(normalized.q, normalized);
  });

  return [...merged.values()].sort((a, b) => (a.order - b.order) || a.q.localeCompare(b.q));
}

// GET /api/faqs — public
router.get('/', async (req, res) => {
  try {
    const { category, q } = req.query;
    const docs = await Faq.find().sort({ order: 1, _id: 1 });
    const categoryFilter = String(category || '').toLowerCase();
    const query = String(q || '').trim().toLowerCase();
    const faqs = buildFaqCorpus(docs).filter(item => {
      const matchesCategory = !categoryFilter || categoryFilter === 'all' || item.cat.toLowerCase() === categoryFilter;
      const matchesQuery = !query || item.q.toLowerCase().includes(query) || item.a.toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });

    res.json(faqs);
  } catch (error) {
    console.error('[FAQ Route]', error.message);
    res.json(buildFaqCorpus());
  }
});

// POST /api/faqs — admin only (seed/manage FAQs)
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const { question, answer, category, order } = req.body;
  if (!question || !answer) return res.status(400).json({ error: 'question and answer required' });

  const faq = await Faq.create({ question, answer, category: category || 'General', order: order || 0 });
  res.status(201).json(normalizeFaq(faq));
});

// PUT /api/faqs — admin only (bulk replace)
router.put('/', requireAuth, requireAdmin, async (req, res) => {
  const faqs = Array.isArray(req.body) ? req.body : [];
  await Faq.deleteMany({});
  if (faqs.length) await Faq.insertMany(faqs.map(f => ({
    question: f.q || f.question,
    answer: f.a || f.answer,
    category: f.cat || f.category || 'General',
    order: f.order || 0,
  })));
  const all = await Faq.find().sort({ order: 1 });
  res.json(all.map(normalizeFaq));
});

module.exports = router;
