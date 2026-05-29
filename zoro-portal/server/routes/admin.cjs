const express = require('express')
const { getDb } = require('../db.cjs')
const { authenticate, requireAdmin } = require('../middleware/auth.cjs')
const Anthropic = require('@anthropic-ai/sdk')

const router = express.Router()
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' })

// Helper: write a moderation log entry
function logModeration(db, moderatorId, targetType, targetId, action, detail) {
  db.prepare(
    'INSERT INTO moderation_logs (moderator_id, target_type, target_id, action, detail) VALUES (?, ?, ?, ?, ?)'
  ).run(moderatorId, targetType, targetId, action, detail)
}

router.get('/stats', authenticate, requireAdmin, (req, res) => {
  const db = getDb()
  const total = db.prepare('SELECT COUNT(*) as c FROM doubts').get().c
  const resolved = db.prepare("SELECT COUNT(*) as c FROM doubts WHERE status = 'resolved'").get().c
  const approved = db.prepare("SELECT COUNT(*) as c FROM doubts WHERE status = 'approved'").get().c
  const pendingD = db.prepare("SELECT COUNT(*) as c FROM doubts WHERE COALESCE(status, 'pending') = 'pending'").get().c
  const rejectedD = db.prepare("SELECT COUNT(*) as c FROM doubts WHERE status = 'rejected'").get().c
  const feedback = db.prepare('SELECT COUNT(*) as c FROM zoro_feedback').get().c
  const users = db.prepare('SELECT COUNT(*) as c FROM users WHERE role = "user"').get().c
  const faqs = db.prepare('SELECT COUNT(*) as c FROM faq_items').get().c
  const pendingAns = db.prepare("SELECT COUNT(*) as c FROM answers WHERE COALESCE(status, 'pending') = 'pending'").get().c
  res.json({ total, resolved, approved, pendingD, rejectedD, feedback, users, faqs, pendingAns })
})

router.get('/doubts', authenticate, requireAdmin, (req, res) => {
  const doubts = getDb().prepare(`
    SELECT d.*, u.username as creator_name
    FROM doubts d LEFT JOIN users u ON d.creator_id = u.id
    ORDER BY d.created_at DESC
  `).all()
  res.json({ doubts })
})

router.get('/feedback', authenticate, requireAdmin, (req, res) => {
  const feedback = getDb().prepare(`
    SELECT f.*, u.username
    FROM zoro_feedback f LEFT JOIN users u ON f.user_id = u.id
    ORDER BY f.created_at DESC
  `).all()
  res.json({ feedback })
})

router.get('/users', authenticate, requireAdmin, (req, res) => {
  const users = getDb().prepare('SELECT id, username, role, created_at FROM users ORDER BY created_at DESC').all()
  res.json({ users })
})

router.get('/faq', authenticate, requireAdmin, (req, res) => {
  const items = getDb().prepare('SELECT * FROM faq_items ORDER BY created_at DESC').all()
  res.json({ items })
})

router.get('/moderation-logs', authenticate, requireAdmin, (req, res) => {
  const db = getDb()
  const logs = db.prepare(`
    SELECT m.*, u.username as moderator_name
    FROM moderation_logs m
    LEFT JOIN users u ON m.moderator_id = u.id
    ORDER BY m.created_at DESC
    LIMIT 200
  `).all()
  res.json({ logs })
})

router.get('/announcements', authenticate, (req, res) => {
  const announcements = getDb().prepare(`
    SELECT a.*, u.username as creator_name
    FROM announcements a LEFT JOIN users u ON a.created_by = u.id
    ORDER BY a.created_at DESC
  `).all()
  res.json({ announcements })
})

router.post('/announcements', authenticate, requireAdmin, (req, res) => {
  const { title, body } = req.body
  if (!title || !body) return res.status(400).json({ error: 'title and body required' })
  const result = getDb().prepare('INSERT INTO announcements (title, body, created_by) VALUES (?, ?, ?)')
    .run(title, body, req.user.id)
  res.json({ id: result.lastInsertRowid, title, body, created_by: req.user.id })
})

router.delete('/announcements/:id', authenticate, requireAdmin, (req, res) => {
  getDb().prepare('DELETE FROM announcements WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

router.post('/faq', authenticate, requireAdmin, (req, res) => {
  const { title, body, category, keywords } = req.body
  const result = getDb().prepare('INSERT INTO faq_items (title, body, category, keywords) VALUES (?, ?, ?, ?)')
    .run(title, body, category, JSON.stringify(keywords || []))
  res.json({ id: result.lastInsertRowid })
})

router.put('/faq/:id', authenticate, requireAdmin, (req, res) => {
  const { title, body, category, keywords } = req.body
  getDb().prepare('UPDATE faq_items SET title = ?, body = ?, category = ?, keywords = ? WHERE id = ?')
    .run(title, body, category, JSON.stringify(keywords || []), req.params.id)
  res.json({ ok: true })
})

router.delete('/faq/:id', authenticate, requireAdmin, (req, res) => {
  getDb().prepare('DELETE FROM faq_items WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

router.get('/answers', authenticate, requireAdmin, (req, res) => {
  const answers = getDb().prepare(`
    SELECT a.*, u.username as creator_name, d.title as doubt_title
    FROM answers a
    LEFT JOIN users u ON a.creator_id = u.id
    LEFT JOIN doubts d ON a.doubt_id = d.id
    ORDER BY a.created_at DESC
  `).all()
  res.json({ answers })
})

// Approve or reject an answer
router.patch('/answers/:id/status', authenticate, requireAdmin, (req, res) => {
  const { status, rejection_reason } = req.body
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Must be pending, approved, or rejected.' })
  }

  const db = getDb()
  const answer = db.prepare('SELECT * FROM answers WHERE id = ?').get(req.params.id)
  if (!answer) return res.status(404).json({ error: 'Answer not found' })

  if (status === 'approved') {
    db.prepare('UPDATE answers SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(status, req.params.id)
    logModeration(db, req.user.id, 'answer', answer.id, 'approved',
      `Approved answer by ${answer.creator_id}`)
  } else if (status === 'rejected') {
    db.prepare('UPDATE answers SET status = ?, rejection_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(status, rejection_reason || null, req.params.id)
    logModeration(db, req.user.id, 'answer', answer.id, 'rejected',
      `Rejected answer${rejection_reason ? `: ${rejection_reason}` : ''}`)
  } else {
    db.prepare('UPDATE answers SET status = ?, rejection_reason = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(status, req.params.id)
    logModeration(db, req.user.id, 'answer', answer.id, 'reset_pending',
      'Reset answer to pending')
  }

  const updated = db.prepare(`
    SELECT a.*, u.username as creator_name, d.title as doubt_title
    FROM answers a
    LEFT JOIN users u ON a.creator_id = u.id
    LEFT JOIN doubts d ON a.doubt_id = d.id
    WHERE a.id = ?
  `).get(req.params.id)
  res.json({ answer: updated })
})

// Approve or reject a doubt
router.patch('/doubts/:id/status', authenticate, requireAdmin, (req, res) => {
  const { status, rejection_reason } = req.body
  if (!['pending', 'approved', 'rejected', 'resolved'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Must be pending, approved, rejected, or resolved.' })
  }

  const db = getDb()
  const doubt = db.prepare('SELECT * FROM doubts WHERE id = ?').get(req.params.id)
  if (!doubt) return res.status(404).json({ error: 'Doubt not found' })

  if (status === 'approved') {
    db.prepare('UPDATE doubts SET status = ?, rejection_reason = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(status, req.params.id)
    logModeration(db, req.user.id, 'doubt', doubt.id, 'approved',
      `Approved doubt: "${(doubt.title || '').slice(0, 60)}"`)
  } else if (status === 'rejected') {
    db.prepare('UPDATE doubts SET status = ?, rejection_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(status, rejection_reason || null, req.params.id)
    logModeration(db, req.user.id, 'doubt', doubt.id, 'rejected',
      `Rejected doubt${rejection_reason ? `: ${rejection_reason}` : ''}`)
  } else {
    db.prepare('UPDATE doubts SET status = ?, rejection_reason = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(status, req.params.id)
    logModeration(db, req.user.id, 'doubt', doubt.id, status, `Set doubt status to ${status}`)
  }

  const updated = db.prepare(`
    SELECT d.*, u.username as creator_name
    FROM doubts d
    LEFT JOIN users u ON d.creator_id = u.id
    WHERE d.id = ?
  `).get(req.params.id)
  res.json({ doubt: updated })
})

router.post('/generate-answer', authenticate, requireAdmin, async (req, res) => {
  const { doubt_body } = req.body
  if (!doubt_body) return res.status(400).json({ error: 'doubt_body required' })

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      system: 'You are Zoro\'s assistant. Given a student doubt, suggest a clear, helpful answer. Be direct and concise.',
      messages: [{ role: 'user', content: `Draft an answer for: ${doubt_body}` }],
    })
    const response = msg.content[0].type === 'text' ? msg.content[0].text : ''
    res.json({ answer: response })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router