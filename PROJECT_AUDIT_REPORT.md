# PROJECT_AUDIT_REPORT.md
**Project:** Samagama Internship Portal  
**Audited:** 2026-06-04  
**Phase:** 1 — Full Project Analysis  

---

## SECTION 1 — STACK OVERVIEW

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | React 18 + Vite | `client/`, SPA, React Router v6 |
| Backend | Express 4 + Node 26 | `server/`, port 4000 |
| Database | MongoDB (mongoose 8) | `samagama` DB, port 27017 |
| Auth | JWT (jsonwebtoken) | 7-day expiry, Bearer token |
| AI | Groq API (llama-3.3-70b-versatile) | Via server-side proxy |
| File Upload | Multer | NOC PDFs only, 5MB max |
| Security | helmet, cors, express-rate-limit | 100 req/min |

---

## SECTION 2 — BACKEND ARCHITECTURE

### 2.1 MongoDB Collections (10 total)

| Collection | Count | Purpose |
|-----------|-------|---------|
| `users` | 2 | Students + admins |
| `faqs` | 133 | FAQ entries (seeded) |
| `tasks` | 13 | Internship task definitions (seeded) |
| `tasksubmissions` | 3 | Per-student task submissions |
| `announcements` | 1 | Admin announcements |
| `doubts` | 1 | Community hub questions |
| `reviews` | 1 | Weekly review submissions |
| `nocs` | 1 | NOC document uploads |
| `teams` | 1 | Student teams |
| `spurtitransactions` | 1 | SP points ledger |

### 2.2 Models

| Model | File | Key Fields |
|-------|------|-----------|
| `User` | `models/User.js` | name, email, password, role, college, currentPhase, spurtiPoints, streak, nocStatus, announcementReadIds, announcementReadAt |
| `Announcement` | `models/Announcement.js` | title, preview, content, category, urgencyLevel, pinned, status, publishedAt, links |
| `Faq` | `models/Faq.js` | question, answer, category, order |
| `Doubt` | `models/Doubt.js` | title, body, tags, status, solved, author, answers[userName, text] |
| `Task` + `TaskSubmission` | `models/Task.js` | taskId, title, phase, spReward, deadline, isOptional, order (Task); status, grade, feedback (Submission) |
| `Noc` | `models/Noc.js` | student, fileName, fileUrl, status, rejectionReason |
| `Review` | `models/Review.js` | student, weekNumber, rating, workSummary, challenges, nextWeekGoals, status |
| `Team` | `models/Team.js` | name, domain, status, members[user, role, status], leader |
| `SpurtiTransaction` | `models/SpurtiTransaction.js` | student, amount, balanceAfter, reason, category, refId |

### 2.3 Route Files (13)

| Route | File | Mount | Endpoints |
|-------|------|-------|-----------|
| Auth | `routes/auth.js` | `/api/auth` | POST /register, POST /login, GET /me, PUT /profile |
| Announcements | `routes/announcements.js` | `/api/announcements` | GET /, GET /read-state/:userId, POST /read-state, POST /read-state/all, POST /, PATCH /:id, DELETE /:id |
| FAQs | `routes/faqs.js` | `/api/faqs` | GET /, POST /, PUT / |
| Doubts | `routes/doubts.js` | `/api/doubts` | GET /, POST /, POST /:id/approve, POST /:id/reject, POST /:id/answers, POST /:id/solved, POST /:id/vote, POST /:id/answer |
| Leaderboard | `routes/leaderboard.js` | `/api/leaderboard` | GET /, GET /me |
| Spurti | `routes/spurti.js` | `/api/spurti` | GET / |
| Teams | `routes/teams.js` | `/api/teams` + `/api/admin/teams` | GET /me, GET /, POST /, POST /:id/invite, POST /:id/join-request, PATCH /:id/members/:memberId, DELETE /, POST /:id/decision |
| Students | `routes/students.js` | `/api/students` | GET /, GET /stats, GET /:id, PUT /:id/phase, PUT /:id/spurti |
| Tasks | `routes/tasks.js` | `/api/tasks` | GET /, GET /my, POST /, PUT /, PATCH /:id/submit, PATCH /submissions/:submissionId/grade |
| Reviews | `routes/reviews.js` | `/api/reviews` | GET /, GET /pending, POST /, PATCH /:id |
| NOCs | `routes/nocs.js` | `/api/nocs` | GET /, POST /, PATCH /:id |
| Yaksha | `routes/yaksha.js` | `/api/yaksha` | POST / |
| *(none)* | — | `/api/admin/teams` | Shared via `app.use('/api/admin/teams', teamRoutes)` |

### 2.4 Middleware

| Middleware | File | Purpose |
|-----------|------|---------|
| `optionalAuth` | `middleware/auth.js` | Attaches `req.user` if valid JWT present; does NOT block |
| `requireAuth` | `middleware/auth.js` | Returns 401 if no valid JWT; sets `req.userId`, `req.userRole` |
| `requireAdmin` | `middleware/auth.js` | Returns 403 if `req.userRole !== 'admin'` |

---

## SECTION 3 — FRONTEND ARCHITECTURE

### 3.1 API Layer (`api.js`)

~410 lines, 40+ exported functions. All read token from `sessionStorage.getItem('samagama-token')` and attach as `Authorization: Bearer <token>`.

Key groupings:
- **Auth:** `apiLogin`, `apiRegister`, `apiGetMe`, `apiUpdateProfile`
- **Announcements:** `fetchAnnouncements`, `createAnnouncement`, `updateAnnouncement`, `deleteAnnouncement`, `fetchAnnouncementReadState`, `markAnnouncementRead`, `markAllAnnouncementsRead`
- **FAQs:** `fetchFaq`
- **Doubts:** `fetchDoubts`, `submitDoubt`, `approveDoubt`, `rejectDoubt`, `answerDoubt`, `voteDoubt`
- **Leaderboard:** `fetchLeaderboard`, `fetchMyRank`
- **Teams:** `fetchMyTeam`, `createTeam`, `joinTeamRequest`, `respondToJoinRequest`, `respondToInvite`, `fetchAdminTeams`, `decideAdminTeam`
- **Spurti:** `fetchSpurtiPoints`, `fetchStudentStats`, `fetchAdminStats`
- **Tasks:** `fetchTasks`, `fetchMyTasks`, `submitTask`
- **Reviews:** `fetchReviews`, `fetchPendingReviews`, `submitReview`, `reviewSubmission`
- **NOCs:** `fetchNocs`, `uploadNoc`, `updateNocStatus`
- **Yaksha AI:** `yakshaChat`
- **Student Mgmt:** `fetchAllStudents`, `updateStudentPhase`, `awardSpurti`

### 3.2 Pages (15)

| Page | File | API Status | Data Source |
|------|------|-----------|-------------|
| `LoginPage` | `pages/LoginPage.jsx` | ✅ Wired | `apiLogin()` → sessionStorage |
| `HomePage` | `pages/HomePage.jsx` | ❌ Static | No API calls |
| `LeaderboardPage` | `pages/LeaderboardPage.jsx` | ✅ Wired | `fetchLeaderboard()`, `fetchMyRank()` |
| `SpurtiPointsPage` | `pages/SpurtiPointsPage.jsx` | ✅ Wired | `fetchSpurtiPoints()`, `fetchLeaderboard()` |
| `InternshipTasksPage` | `pages/InternshipTasksPage.jsx` | ✅ Wired | `fetchMyTasks()`, `submitTask()` |
| `YakshaPage` | `pages/YakshaPage.jsx` | ✅ Wired | `yakshaChat()` |
| `FaqPage` | `pages/FaqPage.jsx` | ✅ Wired | `fetchFaq()` |
| `DoubtPage` | `pages/DoubtPage.jsx` | ⚠️ Partial | `fetchDoubts()` on mount; all mutations present but broken (see Section 5) |
| `CommunityHubPage` | `pages/CommunityHubPage.jsx` | ❌ Static | Mock data + no API calls |
| `AdminDashboard` | `pages/AdminDashboard.jsx` | ❌ Static | 100% static mock data |
| `StudentDashboard` | `pages/StudentDashboard.jsx` | ⚠️ Partial | `fetchAnnouncementReadState`, `fetchMyTeam`; rest is `announcements.js`, `internshipTasks.js`, `internshipJourney.js` |
| `OverviewPage` | `pages/OverviewPage.jsx` | ❌ Static | No API calls, all hardcoded |
| `JourneyDetailModal` | `pages/JourneyDetailModal.jsx` | ❌ Static | `internshipJourney.js` |
| `NocUploadModal` | `components/NocUploadModal.jsx` | ❌ Not wired | Has `uploadNoc` in api.js but modal uses `internshipJourney.js` |
| `WeeklyReviewSubmissionModal` | `components/WeeklyReviewSubmissionModal.jsx` | ❌ Not wired | Uses `internshipJourney.js` localStorage |
| `StudentProfileModal` | `components/StudentProfileModal.jsx` | ❌ Static | `studentProfile.js` |

### 3.3 Legacy Static Data Files

| File | Used By | Status |
|------|---------|--------|
| `announcements.js` | StudentDashboard, AdminDashboard | ❌ Should be replaced by `GET /api/announcements` |
| `internshipTasks.js` | StudentDashboard, AdminDashboard | ❌ Should be replaced by `GET /api/tasks/my` |
| `internshipJourney.js` | StudentDashboard, NocUploadModal, WeeklyReviewSubmissionModal | ❌ Should be replaced by API calls |
| `studentProfile.js` | StudentProfileModal | ❌ Should be replaced by `GET /api/auth/me` |
| `studentSession.js` | Various | ✅ sessionStorage wrapper (OK) |
| `data.js` (root) | Nothing in main app | 🗑️ Dead file (only in `client/src/data.js` which doesn't exist; `server/data.js` is seed source) |
| `server/data.js` | `server/seed.js` | ✅ Seed source only |

---

## SECTION 4 — AUTHENTICATION FLOW

### 4.1 Current Flow (After JWT Fix)

```
LoginPage → apiLogin() → POST /api/auth/login
  → sessionStorage['samagama-token'] = token
  → sessionStorage['samagama-user-id'] = user._id
  → sessionStorage['samagama-role'] = user.role
  → sessionStorage['samagama-email'] = user.email
  → sessionStorage['samagama-display-name'] = user.name

App Load → useAuthBootstrap() → GET /api/auth/me
  → Valid token: restore user state, repopulate sessionStorage
  → Invalid token: clear ALL sessionStorage keys, show error banner
  → No token: proceed as guest
```

**JWT Secret:** `samagama_jwt_secret_2026` (set in `server/.env`)

### 4.2 Auth Middleware Behavior

| Middleware | Missing Token | Invalid Token | Valid Token |
|-----------|--------------|---------------|-------------|
| `optionalAuth` | `next()` (pass through) | `next()` (pass through) | `req.user = user` |
| `requireAuth` | 401 | 401 | `req.userId`, `req.userRole` set |
| `requireAdmin` | (not reached) | (not reached) | 403 if not admin |

### 4.3 Routes Without `requireAuth`

These routes are publicly accessible:
- `GET /api/auth/login`
- `POST /api/auth/register`
- `GET /api/health`
- `GET /api/announcements`
- `GET /api/faqs`
- `GET /api/leaderboard`
- `GET /api/tasks`
- `POST /api/auth/me` → requires auth

---

## SECTION 5 — IDENTIFIED BUGS & GAPS

### 🔴 CRITICAL — Integration Breaking

| # | File | Issue | Backend Expected |
|---|------|-------|-----------------|
| C1 | `App.jsx` `handleLogin` | Sets `samagama-user-id = data.user.id` but login returns `data.user._id` (fixed at API level but handleLogin still uses `.id`) | `userData?._id` |
| C2 | `DoubtPage.jsx` | `post.id` used throughout instead of `post._id` — blocks all approve/reject/answer/solved/vote actions | `post._id` |
| C3 | `DoubtPage.jsx` | Answer submission sends `{ user, text }` but backend expects `{ text }` (user from JWT) | `{ text }` |
| C4 | `CommunityHubPage.jsx` | Zero API calls — all data is `initialDiscussions` / `duplicateLibrary` / `initialCommunityDiscussions` mock arrays | Wire all doubt APIs |
| C5 | `AdminDashboard.jsx` | Zero API calls — 100% static mock data (SP queue, NOC queue, review queue, community discussions, student list) | Wire all admin APIs |

### 🟠 HIGH — Functional Gaps

| # | File | Issue | Fix Required |
|---|------|-------|-------------|
| H1 | `NocUploadModal.jsx` | Submits to `internshipJourney.js` localStorage; has `uploadNoc` available in `api.js` but unused | `uploadNoc(file)` → `POST /api/nocs` |
| H2 | `WeeklyReviewSubmissionModal.jsx` | Submits to `internshipJourney.js` localStorage | `submitReview(week, data)` → `POST /api/reviews` |
| H3 | `StudentDashboard.jsx` | Calls `getAnnouncements()`, `getInternshipTasks()`, `getJourneyMilestones()` from static localStorage files | `GET /api/announcements`, `GET /api/tasks/my`, `GET /api/reviews` |
| H4 | `StudentDashboard.jsx` | Team section uses `fetchMyTeam` but returns mock from `internshipJourney.js` | Real `fetchMyTeam(studentId, email)` |
| H5 | `handleLogin` in `App.jsx` | Still uses `userData?.id` (not `._id`) when storing `samagama-user-id` | `userData?._id` |

### 🟡 MEDIUM — Incomplete Integration

| # | File | Issue |
|---|------|-------|
| M1 | `DoubtPage.jsx` | Answer cards display `answer.user` (ObjectId) instead of `answer.userName` |
| M2 | `DoubtPage.jsx` | Answer cards display `answer.time` instead of `answer.createdAt` |
| M3 | `StudentProfileModal.jsx` | Shows static data from `studentProfile.js`; should show `GET /api/auth/me` data |
| M4 | `NocUploadModal.jsx` | No resubmission guard — calls `handleSubmit` on every click; backend rejects duplicate pending/approved |
| M5 | `DoubtPage.jsx` | Answer form shown to doubt author (should only show to others) |

### 🟢 LOW — Cleanup

| # | File | Issue |
|---|------|-------|
| L1 | `OverviewPage.jsx` | Entirely static; should show `GET /api/auth/me`, `GET /api/students/me/progress` |
| L2 | `AdminDashboard.jsx` | Hardcoded 9-tab UI; admin community tab uses static `communityDiscussions` |
| L3 | `server/index.js` | Old in-memory server at port 4000 (not used; `server.js` is current) |
| L4 | `server/announcement-read-state.json` | JSON file persistence (replaced by MongoDB `announcementReadIds`) |
| L5 | `client/test-portal/` | Full duplicate project copy — dead code |

---

## SECTION 6 — MISSING IMPLEMENTATIONS (Phase 2–7 Requirements)

| # | Requirement | Status | Notes |
|---|-------------|--------|-------|
| KB1 | KnowledgeBase model/collection | ❌ Missing | No KB schema, no CRUD APIs |
| KB2 | Knowledge Base import from samagama.in/internship/faq | ❌ Missing | No scraping/sync mechanism |
| KB3 | Knowledge Base admin management UI | ❌ Missing | No admin KB panel |
| KB4 | KB search + filter | ❌ Missing | No search endpoint |
| AI1 | AIConversations collection | ❌ Missing | No conversation storage |
| AI2 | RAG (retrieval augmented generation) | ❌ Missing | Yaksha calls Groq directly, no KB retrieval |
| AI3 | Citations in AI responses | ❌ Missing | Not stored or displayed |
| AI4 | Conversation history for Yaksha | ⚠️ Partial | Frontend sends history but nothing saved to DB |
| ESC1 | EscalationTicket collection | ❌ Missing | No schema |
| ESC2 | Low-confidence escalation system | ❌ Missing | No confidence scoring |
| ESC3 | Admin escalation dashboard | ❌ Missing | No UI |
| ESC4 | Student ticket status view | ❌ Missing | No UI |
| SL1 | Admin "Convert to KB" on escalation resolution | ❌ Missing | Not implemented |
| IE1 | Interview Engine (Zoro mode) | ❌ Missing | No schema, no UI, no question generation |
| AN1 | AI Analytics (conversations, escalations, resolution rate) | ❌ Missing | No collection or dashboard |
| AN2 | Most-asked questions tracking | ❌ Missing | No aggregation |
| AN3 | Knowledge gap analysis | ❌ Missing | No KB coverage tracking |

---

## SECTION 7 — DEPENDENCY MAP

```
Frontend (React 18)
├── api.js (40+ functions → backend)
├── App.jsx (router + auth bootstrap)
├── authContext.js (empty createContext — no-op)
├── announcements.js (legacy localStorage — BEING PHASED OUT)
├── internshipTasks.js (legacy localStorage — BEING PHASED OUT)
├── internshipJourney.js (legacy localStorage — BEING PHASED OUT)
├── studentProfile.js (legacy localStorage — BEING PHASED OUT)
├── studentSession.js (sessionStorage helpers — OK)
├── pages/
│   ├── HomePage.jsx ← static
│   ├── LoginPage.jsx ← apiLogin()
│   ├── StudentDashboard.jsx ← partial (api + legacy)
│   ├── AdminDashboard.jsx ← 100% static mock
│   ├── LeaderboardPage.jsx ← fetchLeaderboard + fetchMyRank
│   ├── SpurtiPointsPage.jsx ← fetchSpurtiPoints
│   ├── InternshipTasksPage.jsx ← fetchMyTasks + submitTask
│   ├── YakshaPage.jsx ← yakshaChat (no RAG, no persistence)
│   ├── FaqPage.jsx ← fetchFaq
│   ├── DoubtPage.jsx ← partial (fetchDoubts works; mutations broken)
│   ├── CommunityHubPage.jsx ← 100% static mock
│   ├── OverviewPage.jsx ← static
│   └── JourneyDetailModal.jsx ← legacy
└── components/
    ├── NocUploadModal.jsx ← not wired to uploadNoc()
    ├── WeeklyReviewSubmissionModal.jsx ← not wired to submitReview()
    ├── StudentProfileModal.jsx ← static studentProfile.js
    ├── TeamWorkflowModal.jsx ← static
    └── FluidFlowBackground.jsx ← pure UI

Backend (Express 4)
├── server.js (entry + mount)
├── .env (JWT_SECRET, GROQ_API_KEY, MONGODB_URI)
├── seed.js (133 FAQs, 13 tasks, 2 users)
├── middleware/auth.js (optionalAuth, requireAuth, requireAdmin)
├── models/
│   ├── User.js, Announcement.js, Faq.js, Doubt.js
│   ├── Task.js (Task + TaskSubmission), Noc.js
│   ├── Review.js, Team.js, SpurtiTransaction.js
└── routes/
    ├── auth.js (login returns _id ✅)
    ├── announcements.js
    ├── faqs.js
    ├── doubts.js
    ├── leaderboard.js
    ├── spurti.js
    ├── teams.js
    ├── students.js
    ├── tasks.js
    ├── reviews.js
    ├── nocs.js
    └── yaksha.js (Groq proxy only — no RAG)
```

---

## SECTION 8 — WHAT'S WORKING

### Fully Wired ✅
- Login + JWT bootstrap + sessionStorage
- Leaderboard (all periods)
- SP Points page
- Internship Tasks page (self-contained)
- FAQ page
- Yaksha AI chat (Groq proxy; no KB yet)
- Task submission form

### Fully Static ❌
- HomePage
- OverviewPage
- CommunityHubPage
- AdminDashboard
- JourneyDetailModal
- StudentProfileModal
- TeamWorkflowModal
- NocUploadModal (has API fn, unused)
- WeeklyReviewSubmissionModal (has API fn, unused)

### Partially Wired ⚠️
- DoubtPage (read works; mutations broken)
- StudentDashboard (some API, mostly legacy files)
- App.jsx handleLogin (id vs _id bug)

---

## SECTION 9 — SERVER STATUS

| Service | PID | Port | Status |
|---------|-----|------|--------|
| MongoDB | 24482 | 27017 | ✅ Running |
| Node server | 74248 | 4000 | ✅ Running |

**Note:** `server/index.js` (old in-memory server) is not running. `server/server.js` is the active server.

---

## SECTION 10 — RECOMMENDED IMPLEMENTATION ORDER

```
Phase 1 (This session):
  ✅ Yaksha AI integration (done)
  ✅ Auth JWT validation on startup (done)

Phase 2 — Fix Critical Bugs:
  1. Fix App.jsx handleLogin userData.id → userData._id
  2. Fix DoubtPage post.id → post._id
  3. Fix DoubtPage answer payload { user, text } → { text }
  4. Wire CommunityHubPage to API
  5. Wire AdminDashboard to API

Phase 3 — Complete Wiring:
  6. Wire NocUploadModal → uploadNoc()
  7. Wire WeeklyReviewSubmissionModal → submitReview()
  8. Wire StudentDashboard to API (replace legacy files)
  9. Wire OverviewPage → GET /api/auth/me + GET /api/students/me/progress

Phase 4 — Knowledge Base (Phase 2 of original request):
  10. Create KnowledgeBase model
  11. Create KnowledgeBase routes + CRUD
  12. Fetch/import from samagama.in/internship/faq
  13. Build admin KB management UI

Phase 5 — RAG + AI (Phase 3 of original request):
  14. Create AIConversations model
  15. Wire Yaksha to KB retrieval before Groq call
  16. Store every conversation in AIConversations
  17. Add citations to responses

Phase 6 — Escalation (Phase 4 of original request):
  18. Create EscalationTicket model
  19. Confidence scoring in yaksha route
  20. Auto-create ticket when confidence < threshold
  21. Admin escalation dashboard
  22. Student ticket status view

Phase 7 — Self Learning (Phase 5):
  23. "Convert to KB" on escalation resolution

Phase 8 — Interview Engine (Phase 6):
  24. Interview mode schema + API
  25. Question generation (Groq)
  26. Student interview UI

Phase 9 — Analytics (Phase 7):
  27. AI conversation analytics
  28. Escalation rate dashboard
  29. Most-asked questions
  30. KB coverage gaps

Phase 10 — Final Audit (Phase 8):
  31. Full integration test
  32. Generate FINAL_SYSTEM_AUDIT.md
```

---

*Audit generated by Scooby 🐾 — Samagama 2026-06-04*