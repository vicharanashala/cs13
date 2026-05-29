const initSqlJs = require('sql.js')
const path = require('path')
const bcrypt = require('bcryptjs')

const DB_PATH = path.join(__dirname, 'zoro.db')

let _db = null

// Global setter for use in routes after async init
global.__zoroDb = null

function getDb() { return global.__zoroDb }

async function initDb() {
  const SQL = await initSqlJs()
  let data = null
  try {
    const { readFileSync } = require('fs')
    data = readFileSync(DB_PATH)
  } catch {}

  db = new SQL.Database(data)

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      sp_points INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS faq_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      category TEXT NOT NULL,
      keywords TEXT DEFAULT '[]',
      helpful_votes INTEGER DEFAULT 0,
      unhelpful_votes INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(title, category)
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS doubts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      category TEXT NOT NULL,
      creator_id INTEGER,
      status TEXT DEFAULT 'open',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (creator_id) REFERENCES users(id)
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doubt_id INTEGER NOT NULL,
      body TEXT NOT NULL,
      creator_id INTEGER,
      upvotes INTEGER DEFAULT 0,
      is_accepted INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      sp_awarded INTEGER DEFAULT 0,
      sp_points INTEGER DEFAULT 0,
      rejection_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (doubt_id) REFERENCES doubts(id),
      FOREIGN KEY (creator_id) REFERENCES users(id)
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS zoro_feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      query TEXT,
      response TEXT,
      feedback_text TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS sp_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      answer_id INTEGER,
      amount INTEGER NOT NULL,
      reason TEXT NOT NULL,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (answer_id) REFERENCES answers(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `)

  // Seed
  const count = db.exec('SELECT COUNT(*) as c FROM users')[0]
  if (!count || count.values[0][0] === 0) {
    const adminHash = bcrypt.hashSync('admin123', 10)
    const userHash = bcrypt.hashSync('user123', 10)

    db.run('INSERT INTO users (username, password_hash, role, sp_points) VALUES (?, ?, ?, ?)',
      ['admin', adminHash, 'admin', 150])
    db.run('INSERT INTO users (username, password_hash, role, sp_points) VALUES (?, ?, ?, ?)',
      ['arushi', userHash, 'user', 50])
    db.run('INSERT INTO users (username, password_hash, role, sp_points) VALUES (?, ?, ?, ?)',
      ['demo', userHash, 'user', 0])
    db.run('INSERT INTO users (username, password_hash, role, sp_points) VALUES (?, ?, ?, ?)',
      ['riya_k', userHash, 'user', 120])
    db.run('INSERT INTO users (username, password_hash, role, sp_points) VALUES (?, ?, ?, ?)',
      ['aditya_s', userHash, 'user', 85])
    db.run('INSERT INTO users (username, password_hash, role, sp_points) VALUES (?, ?, ?, ?)',
      ['priya_m', userHash, 'user', 65])
    db.run('INSERT INTO users (username, password_hash, role, sp_points) VALUES (?, ?, ?, ?)',
      ['vivaan_r', userHash, 'user', 40])
    db.run('INSERT INTO users (username, password_hash, role, sp_points) VALUES (?, ?, ?, ?)',
      ['anika_j', userHash, 'user', 20])

    const faqs = [
      { title: 'How do I apply for an NOC?', body: 'To apply for an NOC, log in to the Samagama portal, go to the NOC section, fill out the application form, attach the required documents (no dues certificate, bonafide letter), and submit. Your TPO reviews it within 3-5 working days. Keep checking the status tracker for updates.', category: 'NOC', keywords: JSON.stringify(['noc', 'no objection', 'application', 'samagama', 'apply', 'form']) },
      { title: 'What is the NOC approval timeline?', body: 'Standard NOC processing takes 3-5 working days. During placement season (Oct-Nov), allow up to 7 working days. If your company needs the NOC urgently, contact your TPO directly with a written request from your company\'s HR. Rush requests are handled case-by-case.', category: 'NOC', keywords: JSON.stringify(['noc', 'timeline', 'processing', 'days', 'approval', 'working days', 'rush']) },
      { title: 'What documents are needed for NOC?', body: 'Required: (1) No dues certificate from department, (2) Bonafide letter from institute, (3) Signed internship offer letter, (4) Company verification form submitted by employer, (5) Undertaking form from Samagama. All documents must be clear PDFs under 5MB. Incomplete submissions delay processing.', category: 'NOC', keywords: JSON.stringify(['noc', 'documents', 'papers', 'certificate', 'offer letter', 'verification', 'no dues']) },
      { title: 'Why was my NOC rejected?', body: 'Common rejection reasons: employer verification not received, pending fees or dues with the institute, incomplete documentation, discrepancy between offer letter and portal application, or your internship dates clash with an exam scheduled by the institute. Check "My Applications" for the specific rejection reason, then rectfy and resubmit.', category: 'NOC', keywords: JSON.stringify(['noc', 'rejected', 'rejection', 'reason', 'denied', 'discrepancy']) },
      { title: 'How do I follow up on my NOC status?', body: 'Track live status under Samagama → My Applications → NOC. If marked "Pending" beyond the timeline, raise a Doubt Solver ticket tagged "NOC" and your TPO coordinator will be tagged automatically. For urgent cases, email your TPO directly with your Samagama application ID.', category: 'NOC', keywords: JSON.stringify(['noc', 'status', 'follow up', 'track', 'pending', 'tpo', 'email']) },
      { title: 'How does NOC work for different internship types?', body: 'Full-time internships: standard 3-5 day NOC. Part-time internships (≤20 hrs/week): NOC usually faster, 2-3 days, but requires employer to specify weekly hours. Remote/virtual internships: NOC available but some companies may request additional verification. Research internships: require a separate research undertaking form along with NOC application.', category: 'NOC', keywords: JSON.stringify(['noc', 'full time', 'part time', 'remote', 'virtual', 'research', 'internship type']) },
      { title: 'Can I reapply for NOC after rejection?', body: 'Yes, absolutely. Fix the rejection reason first — check "My Applications" for the specific flag. Common fixes: ask your company HR to resubmit the verification form, clear any pending institute dues, or correct discrepancies in your application. Once fixed, resubmit from the same section. Each fresh submission gets a new review timeline.', category: 'NOC', keywords: JSON.stringify(['noc', 'reapply', 'resubmit', 'rejection', 'fix', 'correction']) },
      { title: 'How are SP points related to NOC?', body: 'SP points do not directly affect NOC eligibility — NOC is based on academic standing and document completeness. However, if you help resolve another student\'s NOC-related doubt (answer it in Doubt Solver with an accepted answer), you earn +15 SP. You can also earn SP by improving FAQ articles related to NOC processes.', category: 'NOC', keywords: JSON.stringify(['noc', 'sp points', 'skill points', 'relationship', 'bonus', 'eligibility']) },
      { title: 'Who approves the NOC request?', body: 'Your Training & Placement Officer (TPO) is the primary approver. The流程: (1) You submit via Samagama, (2) Your department verifies academic standing and clears any dues, (3) TPO reviews documents for completeness and policy compliance, (4) Final approval is stamped and uploaded to Samagama. Allow 3-5 working days at each stage. For offline NOCs, the TPO signs a physical form you collect from the TPO office.', category: 'NOC', keywords: JSON.stringify(['noc', 'approve', 'approval', 'tpo', 'training', 'placement', 'officer', 'sign', 'who']) },
      { title: 'Can I track my NOC status?', body: 'Yes — track live status on Samagama → My Applications → NOC tab. Each application shows: Submitted, Under Review, Approved, Rejected. If your company HR has a portal login, they can also verify their portion directly. If status hasn\'t changed beyond the expected timeline, raise a Doubt Solver ticket tagged "NOC" and your TPO coordinator will be auto-tagged.', category: 'NOC', keywords: JSON.stringify(['noc', 'track', 'status', 'check', 'monitor', 'live', 'progress']) },
      { title: 'What happens if my NOC is rejected?', body: 'If rejected, check the rejection reason in Samagama → My Applications → NOC. Common consequences: (1) Your internship start date may be delayed until NOC is cleared, (2) You cannot upload your offer letter completion certificate without NOC approval, (3) In cases of discrepancy, your TPO will specify exactly what needs correction. Fix the issue and resubmit — each resubmission starts a fresh 3-5 day review cycle. Repeated rejections should be escalated to the Dean of Academic Affairs.', category: 'NOC', keywords: JSON.stringify(['noc', 'rejected', 'rejection', 'consequence', 'delayed', 'after', 'happens']) },
      { title: 'How long is an NOC valid?', body: 'An NOC is valid for the specific internship duration and company mentioned in your application. It cannot be reused for a different company or extended internship period. If your internship is extended, you must apply for a fresh NOC with the updated dates and company details. Validity is typically 2 months from the start date on your offer letter — check the exact expiry date on the approved NOC document in Samagama.', category: 'NOC', keywords: JSON.stringify(['noc', 'valid', 'validity', 'expire', 'expiry', 'duration', 'extension', 'renew']) },
      { title: 'Can I edit my NOC request after submission?', body: 'You can edit your NOC request only while it is in "Draft" or "Submitted" status — before the TPO begins review. Once status changes to "Under Review" or beyond, edits are locked. To make changes after that, withdraw the application (if still possible) and resubmit, or raise a correction request via Doubt Solver tagged "NOC". Changes to company name, internship type, or dates always require a fresh application.', category: 'NOC', keywords: JSON.stringify(['noc', 'edit', 'update', 'change', 'after', 'submission', 'modify', 'correct']) },
      { title: 'What is the Samagama portal?', body: 'Samagama is the internal internship and training portal used by the institute. It tracks your internship applications, NOC requests, feedback submissions, and overall internship progress throughout your program.', category: 'Samagama', keywords: JSON.stringify(['samagama', 'portal', 'internship', 'training', 'platform']) },
      { title: 'How do I submit my internship feedback?', body: 'Go to the Samagama portal → Internship Feedback section. Rate your experience (1-5 stars), describe your role and learning, mention any issues, and submit. You can edit your feedback within 7 days of submission.', category: 'Feedback', keywords: JSON.stringify(['feedback', 'internship', 'review', 'rating', 'submit']) },
      { title: 'What documents do I need for internship verification?', body: 'You need: offer letter, company ID card copy, internship certificate from employer, monthly salary slips (if paid), and the signed undertaking form from Samagama. All documents must be uploaded in PDF format.', category: 'Internship', keywords: JSON.stringify(['documents', 'verification', 'internship', 'certificate', 'offer letter']) },
      { title: 'How are SP points calculated?', body: 'SP (Skill Points) are earned as follows: Resolving a doubt = +20 pts, Answering with accepted answer = +15 pts, Helpful FAQ vote = +2 pts, Raising a resolved doubt = +5 pts. Points are updated live on the leaderboard.', category: 'SP Points', keywords: JSON.stringify(['sp', 'points', 'skill points', 'leaderboard', 'calculation']) },
      { title: 'How do I raise a doubt if I\'m stuck?', body: 'Go to the Doubt Solver section and click the "Raise a Doubt" button. Describe your issue clearly — our system auto-detects the category. You\'ll earn SP points once your doubt is resolved. You can also ask Zoro for instant help.', category: 'Doubt Solver', keywords: JSON.stringify(['doubt', 'raise', 'question', 'stuck', 'help']) },
      { title: 'Can I edit my internship details after submission?', body: 'Yes, you can edit most internship details within 24 hours of initial submission. After that, you need to raise a correction request through the Doubt Solver. Changes to company name or duration require fresh approval from your TPO coordinator.', category: 'Internship', keywords: JSON.stringify(['edit', 'internship', 'update', 'correct', 'details']) },
      { title: 'How does Zoro AI help me?', body: 'Zoro is your 24/7 AI companion trained on all institute processes. Ask him about NOC status, Samagama features, internship rules, SP points, or anything portal-related. He\'s direct, fast, and never makes things up. If he doesn\'t know, he\'ll say so.', category: 'Zoro', keywords: JSON.stringify(['zoro', 'ai', 'help', 'chatbot', 'ask']) },
      { title: 'What are the attendance requirements for internship?', body: 'Most companies require a minimum 75% attendance during your internship period (as per AICTE norms). Part-time internships may have adjusted requirements. Contact your TPO coordinator for clarification specific to your program.', category: 'Internship', keywords: JSON.stringify(['attendance', 'internship', 'requirement', 'aicte', '75%']) },
    ]

    for (const f of faqs) {
      db.run('INSERT INTO faq_items (title, body, category, keywords) VALUES (?, ?, ?, ?)',
        [f.title, f.body, f.category, f.keywords])
    }

    const doubts = [
      { title: 'NOC rejected without reason', body: 'My NOC application was rejected yesterday but there was no reason mentioned. I have all documents in order and my company has submitted the verification form.', category: 'NOC', creator_id: 2 },
      { title: 'How to update my company email ID?', body: 'The Samagama portal still shows my old personal email for company correspondence. I need to update it to my official company email but the edit field is greyed out.', category: 'Samagama', creator_id: 3 },
    ]

    for (const d of doubts) {
      db.run('INSERT INTO doubts (title, body, category, creator_id, status) VALUES (?, ?, ?, ?, ?)',
        [d.title, d.body, d.category, d.creator_id, 'open'])
    }

    db.run("INSERT INTO answers (doubt_id, body, creator_id, is_accepted, status) VALUES (?, ?, ?, ?, ?)",
      [1, "NOC rejections usually happen when the company verification hasn't been received. Wait 24-48 hours after your company submits the form, then check again. If still rejected, raise a Doubt with screenshot.", 1, 1, 'approved'])

    db.run('INSERT INTO announcements (title, body, created_by) VALUES (?, ?, ?)',
      ['Welcome to Zoro Portal! 🗡️', 'This is your institute\'s new knowledge hub. Browse FAQs, solve doubts together, and earn SP points. Ask Zoro AI anything about portal processes.', 1])
    db.run('INSERT INTO announcements (title, body, created_by) VALUES (?, ?, ?)',
      ['SP Points Leaderboard is Live', 'Compete with your peers by helping others. Answer doubts, improve FAQs, and climb to the top. Top contributors get recognized on the leaderboard!', 1])

    console.log('✅ Database seeded')
  }

  // Wire up sync helper for all route files
  global.__zoroDb = wrapDb(db)
  _db = db

  // Migration: add status column to answers table if missing
  try {
    const cols = db.exec("PRAGMA table_info(answers)")[0]
    if (cols && !cols.values.some(row => row[1] === 'status')) {
      console.log('Migrating answers table to add status column...')
      db.run('ALTER TABLE answers ADD COLUMN status TEXT DEFAULT \'pending\'')
      console.log('✅ answers.status migration complete')
    }
  } catch (e) {
    console.log('answers.status migration skipped:', e.message)
  }

  // Migration: add UNIQUE constraint on faq_items if missing
  try {
    const existing = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='faq_items'")[0]
    if (existing) {
      const hasUnique = db.exec("SELECT sql FROM sqlite_master WHERE type='table' AND name='faq_items'")[0]
      if (hasUnique && !hasUnique.values[0][0].toString().includes('UNIQUE(title')) {
        console.log('Migrating faq_items table to add UNIQUE(title, category)...')
        db.run('DROP TABLE IF EXISTS _faq_items_new')
        db.run(`CREATE TABLE _faq_items_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          body TEXT NOT NULL,
          category TEXT NOT NULL,
          keywords TEXT DEFAULT '[]',
          helpful_votes INTEGER DEFAULT 0,
          unhelpful_votes INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(title, category)
        )`)
        db.run('INSERT INTO _faq_items_new (id, title, body, category, keywords, helpful_votes, unhelpful_votes, created_at) SELECT id, title, body, category, keywords, helpful_votes, unhelpful_votes, created_at FROM faq_items')
        db.run('DROP TABLE faq_items')
        db.run('ALTER TABLE _faq_items_new RENAME TO faq_items')
        console.log('✅ FAQ UNIQUE migration complete')
      }
    }
  } catch (e) {
    // Table may be fresh, ignore
  }

  // Migration: add sp_awarded, sp_points, rejection_reason to answers
  try {
    const cols = db.exec("PRAGMA table_info(answers)")[0]
    if (cols) {
      const colNames = cols.values.map(r => r[1])
      if (!colNames.includes('sp_awarded')) {
        console.log('Migrating answers: adding sp_awarded, sp_points, rejection_reason...')
        db.run('ALTER TABLE answers ADD COLUMN sp_awarded INTEGER DEFAULT 0')
        db.run('ALTER TABLE answers ADD COLUMN sp_points INTEGER DEFAULT 0')
        db.run('ALTER TABLE answers ADD COLUMN rejection_reason TEXT')
        console.log('✅ answers sp columns migration complete')
      }
    }
  } catch (e) { console.log('answers sp columns migration skipped:', e.message) }

  // Migration: create sp_transactions table if not exists
  try {
    const existing = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='sp_transactions'")[0]
    if (!existing) {
      console.log('Creating sp_transactions table...')
      db.run(`CREATE TABLE sp_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        answer_id INTEGER,
        amount INTEGER NOT NULL,
        reason TEXT NOT NULL,
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`)
      console.log('✅ sp_transactions table created')
    }
  } catch (e) { console.log('sp_transactions table creation skipped:', e.message) }

  // Migration: add status column to doubts table
  try {
    const cols = db.exec("PRAGMA table_info(doubts)")[0]
    if (cols && !cols.values.some(row => row[1] === 'status')) {
      console.log('Migrating doubts table to add status column...')
      db.run("ALTER TABLE doubts ADD COLUMN status TEXT DEFAULT 'pending'")
      // Migrate existing 'open' doubts to 'pending'
      db.run("UPDATE doubts SET status = 'pending' WHERE status = 'open'")
      console.log('✅ doubts.status migration complete')
    }
  } catch (e) { console.log('doubts.status migration skipped:', e.message) }

  // Migration: add rejection_reason to doubts
  try {
    const cols = db.exec("PRAGMA table_info(doubts)")[0]
    if (cols && !cols.values.some(row => row[1] === 'rejection_reason')) {
      console.log('Migrating doubts table to add rejection_reason...')
      db.run('ALTER TABLE doubts ADD COLUMN rejection_reason TEXT')
      console.log('✅ doubts.rejection_reason migration complete')
    }
  } catch (e) { console.log('doubts.rejection_reason migration skipped:', e.message) }

  // Migration: create moderation_logs table
  try {
    const existing = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='moderation_logs'")[0]
    if (!existing) {
      console.log('Creating moderation_logs table...')
      db.run(`CREATE TABLE moderation_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        moderator_id INTEGER NOT NULL,
        target_type TEXT NOT NULL,
        target_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        detail TEXT,
        sp_delta INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`)
      console.log('✅ moderation_logs table created')
    }
  } catch (e) { console.log('moderation_logs table creation skipped:', e.message) }

  console.log('✅ Database initialized')
  return db
}

function wrapDb(db) {
  return {
    exec: db.exec.bind(db),
    run: (sql, ...params) => db.run(sql, params),
    get: (sql, ...params) => {
      const stmt = db.prepare(sql)
      stmt.bind(params)
      if (stmt.step()) { const row = stmt.getAsObject(); stmt.free(); return row }
      stmt.free()
      return null
    },
    all: (sql, ...params) => {
      const stmt = db.prepare(sql)
      stmt.bind(params)
      const rows = []
      while (stmt.step()) rows.push(stmt.getAsObject())
      stmt.free()
      return rows
    },
    prepare: (sql) => ({
      run: (...params) => db.run(sql, params),
      get: (...params) => {
        const stmt = db.prepare(sql)
        stmt.bind(params)
        if (stmt.step()) { const row = stmt.getAsObject(); stmt.free(); return row }
        stmt.free()
        return null
      },
      all: (...params) => {
        const stmt = db.prepare(sql)
        stmt.bind(params)
        const rows = []
        while (stmt.step()) rows.push(stmt.getAsObject())
        stmt.free()
        return rows
      },
    }),
  }
}

module.exports = { initDb, getDb }