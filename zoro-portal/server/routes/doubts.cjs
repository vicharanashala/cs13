const express = require('express')
const { getDb } = require('../db.cjs')
const { authenticate } = require('../middleware/auth.cjs')

const router = express.Router()

const CATEGORY_KEYWORDS = {
  NOC: ['noc', 'no objection', 'certificate', 'document'],
  Samagama: ['samagama', 'portal', 'account', 'login', 'profile'],
  Internship: ['internship', 'company', 'offer', 'verification'],
  Feedback: ['feedback', 'review', 'rating', 'submit'],
  'SP Points': ['sp', 'points', 'leaderboard', 'skill points'],
  'Doubt Solver': ['doubt', 'question', 'stuck'],
  Zoro: ['zoro', 'ai', 'chatbot'],
}

function detectCategory(title) {
  const lower = title.toLowerCase()
  for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS)) {
    if (kws.some(k => lower.includes(k))) return cat
  }
  return 'General'
}

router.get('/', authenticate, (req, res) => {
  // Non-admins only see approved or resolved doubts (pending/rejected are not public)
  const isAdmin = req.user.role === 'admin'
  const filter = isAdmin ? '' : " WHERE COALESCE(d.status, 'pending') IN ('approved', 'resolved')"
  const doubts = getDb().prepare(`
    SELECT d.*, u.username as creator_name
    FROM doubts d
    LEFT JOIN users u ON d.creator_id = u.id
    ${filter}
    ORDER BY d.created_at DESC
  `).all()
  res.json({ doubts })
})

router.get('/:id', authenticate, (req, res) => {
  const isAdmin = req.user.role === 'admin'
  const doubt = getDb().prepare(`
    SELECT d.*, u.username as creator_name
    FROM doubts d LEFT JOIN users u ON d.creator_id = u.id
    WHERE d.id = ?
  `).get(req.params.id)
  if (!doubt) return res.status(404).json({ error: 'Not found' })

  // Non-admins cannot see pending/rejected doubts
  if (!isAdmin && doubt.status !== 'approved' && doubt.status !== 'resolved') {
    return res.status(404).json({ error: 'Not found' })
  }

  // Non-admins only see approved answers
  const ansFilter = isAdmin ? '' : "AND COALESCE(a.status, 'pending') = 'approved'"
  const answers = getDb().prepare(`
    SELECT a.*, u.username as creator_name, COALESCE(a.status, 'pending') as status
    FROM answers a LEFT JOIN users u ON a.creator_id = u.id
    WHERE a.doubt_id = ? ${ansFilter}
    ORDER BY upvotes DESC, created_at ASC
  `).all(req.params.id)
  res.json({ doubt, answers })
})

router.post('/', authenticate, (req, res) => {
  const { title, body } = req.body
  if (!title || !body) return res.status(400).json({ error: 'Title and body required' })

  const category = detectCategory(title)
  const result = getDb().prepare('INSERT INTO doubts (title, body, category, creator_id) VALUES (?, ?, ?, ?)')
    .run(title, body, category, req.user.id)
  const doubt = getDb().prepare('SELECT d.*, u.username as creator_name FROM doubts d LEFT JOIN users u ON d.creator_id = u.id WHERE d.id = ?').get(result.lastInsertRowid)
  res.json({ doubt })
})

router.post('/:id/answer', authenticate, (req, res) => {
  const { body } = req.body
  // Only allow answering approved/resolved doubts
  const doubt = getDb().prepare('SELECT status FROM doubts WHERE id = ?').get(req.params.id)
  if (!doubt) return res.status(404).json({ error: 'Doubt not found' })
  const isAdmin = req.user.role === 'admin'
  if (!isAdmin && doubt.status !== 'approved' && doubt.status !== 'resolved') {
    return res.status(403).json({ error: 'Cannot answer a doubt that is not public' })
  }
  const result = getDb().prepare('INSERT INTO answers (doubt_id, body, creator_id) VALUES (?, ?, ?)')
    .run(req.params.id, body, req.user.id)
  const answer = getDb().prepare(`
    SELECT a.*, u.username as creator_name, COALESCE(a.status, 'pending') as status
    FROM answers a LEFT JOIN users u ON a.creator_id = u.id
    WHERE a.id = ?
  `).get(result.lastInsertRowid)
  res.json({ answer })
})

router.post('/:id/upvote', authenticate, (req, res) => {
  getDb().prepare('UPDATE answers SET upvotes = upvotes + 1 WHERE id = ?').run(req.params.id)
  getDb().prepare('UPDATE users SET sp_points = sp_points + 5 WHERE id = ?').run(req.user.id)
  const answer = getDb().prepare('SELECT * FROM answers WHERE id = ?').get(req.params.id)
  res.json({ answer })
})

router.post('/:id/resolve', authenticate, (req, res) => {
  getDb().prepare("UPDATE doubts SET status = 'resolved' WHERE id = ?").run(req.params.id)
  getDb().prepare('UPDATE users SET sp_points = sp_points + 20 WHERE id = ?').run(req.user.id)
  const doubt = getDb().prepare('SELECT * FROM doubts WHERE id = ?').get(req.params.id)
  res.json({ doubt })
})

router.post('/:id/accept/:answerId', authenticate, (req, res) => {
  getDb().prepare('UPDATE answers SET is_accepted = 1 WHERE id = ?').run(req.params.answerId)
  getDb().prepare('UPDATE users SET sp_points = sp_points + 15 WHERE id = ?').run(req.user.id)
  res.json({ ok: true })
})

module.exports = router