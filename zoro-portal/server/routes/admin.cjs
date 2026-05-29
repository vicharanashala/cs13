const express = require('express')
const { getDb } = require('../db.cjs')
const { authenticate, requireAdmin } = require('../middleware/auth.cjs')
const Anthropic = require('@anthropic-ai/sdk')

const router = express.Router()
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' })

// Configurable SP reward amount (can be overridden via env)
const SP_APPROVAL_REWARD = parseInt(process.env.SP_APPROVAL_REWARD || '10', 10)

router.get('/stats', authenticate, requireAdmin, (req, res) => {
  const db = getDb()
  const total = db.prepare('SELECT COUNT(*) as c FROM doubts').get().c
  const resolved = db.prepare("SELECT COUNT(*) as c FROM doubts WHERE status = 'resolved'").get().c
  const pending = db.prepare("SELECT COUNT(*) as c FROM doubts WHERE status = 'open'").get().c
  const feedback = db.prepare('SELECT COUNT(*) as c FROM zoro_feedback').get().c
  const users = db.prepare('SELECT COUNT(*) as c FROM users WHERE role = "user"').get().c
  const faqs = db.prepare('SELECT COUNT(*) as c FROM faq_items').get().c
  const totalSP = db.prepare('SELECT COALESCE(SUM(sp_points), 0) as s FROM users').get().s
  res.json({ total, resolved, pending, feedback, users, faqs, totalSP })
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
  const users = getDb().prepare('SELECT id, username, role, sp_points, created_at FROM users ORDER BY sp_points DESC').all()
  res.json({ users })
})

// Get SP transactions (all or filtered by user)
router.get('/sp-transactions', authenticate, requireAdmin, (req, res) => {
  const db = getDb()
  const { user_id } = req.query
  let sql = `
    SELECT t.*, u.username as target_user, a.body as answer_preview, c.username as created_by_name
    FROM sp_transactions t
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN answers a ON t.answer_id = a.id
    LEFT JOIN users c ON t.created_by = c.id
  `
  const params = []
  if (user_id) {
    sql += ' WHERE t.user_id = ?'
    params.push(user_id)
  }
  sql += ' ORDER BY t.created_at DESC LIMIT 100'
  const transactions = db.prepare(sql).all(...params)
  res.json({ transactions })
})

// Get SP stats (total, per-user breakdown, recent)
router.get('/sp-stats', authenticate, requireAdmin, (req, res) => {
  const db = getDb()
  const totalSP = db.prepare('SELECT COALESCE(SUM(sp_points), 0) as s FROM users').get().s
  const totalAwards = db.prepare("SELECT COUNT(*) as c FROM sp_transactions WHERE amount > 0").get().c
  const totalDeducted = db.prepare("SELECT COUNT(*) as c FROM sp_transactions WHERE amount < 0").get().c
  const recentTransactions = db.prepare(`
    SELECT t.*, u.username as target_user, a.body as answer_preview
    FROM sp_transactions t
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN answers a ON t.answer_id = a.id
    ORDER BY t.created_at DESC LIMIT 10
  `).all()
  const topEarners = db.prepare('SELECT id, username, sp_points FROM users WHERE role = "user" ORDER BY sp_points DESC LIMIT 5').all()
  res.json({ totalSP, totalAwards, totalDeducted, recentTransactions, topEarners, SP_APPROVAL_REWARD })
})

// Get a specific user's SP history
router.get('/sp-history/:userId', authenticate, requireAdmin, (req, res) => {
  const db = getDb()
  const user = db.prepare('SELECT id, username, sp_points FROM users WHERE id = ?').get(req.params.userId)
  if (!user) return res.status(404).json({ error: 'User not found' })
  const history = db.prepare(`
    SELECT t.*, a.body as answer_preview, c.username as moderator_name
    FROM sp_transactions t
    LEFT JOIN answers a ON t.answer_id = a.id
    LEFT JOIN users c ON t.created_by = c.id
    WHERE t.user_id = ?
    ORDER BY t.created_at DESC
  `).all(req.params.userId)
  res.json({ user, history })
})

router.get('/faq', authenticate, requireAdmin, (req, res) => {
  const items = getDb().prepare('SELECT * FROM faq_items ORDER BY created_at DESC').all()
  res.json({ items })
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

// Approve or reject an answer — full SP management
router.patch('/answers/:id/status', authenticate, requireAdmin, (req, res) => {
  const { status, rejection_reason } = req.body
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Must be pending, approved, or rejected.' })
  }

  const db = getDb()
  const answer = db.prepare('SELECT * FROM answers WHERE id = ?').get(req.params.id)
  if (!answer) return res.status(404).json({ error: 'Answer not found' })

  // Prevent duplicate SP rewards
  if (status === 'approved' && answer.status !== 'approved' && answer.sp_awarded) {
    return res.status(409).json({ error: 'SP already awarded for this answer', spAwarded: true })
  }

  if (status === 'approved') {
    // Check again to prevent race conditions
    const fresh = db.prepare('SELECT sp_awarded FROM answers WHERE id = ?').get(req.params.id)
    if (fresh.sp_awarded) {
      return res.status(409).json({ error: 'SP already awarded', spAwarded: true })
    }

    // Award SP
    db.prepare('UPDATE answers SET status = ?, sp_awarded = 1, sp_points = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(status, SP_APPROVAL_REWARD, req.params.id)
    db.prepare('UPDATE users SET sp_points = sp_points + ? WHERE id = ?')
      .run(SP_APPROVAL_REWARD, answer.creator_id)

    // Log transaction
    db.prepare(
      'INSERT INTO sp_transactions (user_id, answer_id, amount, reason, created_by) VALUES (?, ?, ?, ?, ?)'
    ).run(answer.creator_id, answer.id, SP_APPROVAL_REWARD, `Answer approved — reward for answering: "${(answer.body || '').slice(0, 50)}..."`, req.user.id)
  } else if (status === 'rejected') {
    db.prepare('UPDATE answers SET status = ?, rejection_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(status, rejection_reason || null, req.params.id)
  } else {
    // Reset back to pending — undo SP if it was previously awarded
    if (answer.sp_awarded && answer.sp_points > 0) {
      db.prepare('UPDATE users SET sp_points = sp_points - ? WHERE id = ?')
        .run(answer.sp_points, answer.creator_id)
      db.prepare(
        'INSERT INTO sp_transactions (user_id, answer_id, amount, reason, created_by) VALUES (?, ?, ?, ?, ?)'
      ).run(answer.creator_id, answer.id, -answer.sp_points, 'Answer reset to pending — SP revoked', req.user.id)
    }
    db.prepare('UPDATE answers SET status = ?, sp_awarded = 0, sp_points = 0, rejection_reason = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(status, req.params.id)
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