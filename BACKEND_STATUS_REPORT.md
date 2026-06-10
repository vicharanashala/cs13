# Samagama Backend — Status Report
**Generated:** June 4, 2026  
**Status:** ✅ Fully Operational  
**MongoDB:** mongodb://localhost:27017/samagama  
**Server:** http://localhost:4000

---

## What's Working

### Auth (100%)
| Endpoint | Method | Status | Notes |
|---|---|---|---|
| `/api/auth/login` | POST | ✅ | Returns JWT + user object |
| `/api/auth/register` | POST | ✅ | Auto-creates user on demo login |
| `/api/auth/me` | GET | ✅ | Returns full user profile |
| `/api/auth/profile` | PUT | ✅ | Update name/phone/avatar |
| `/api/auth/jwtinfo` | GET | ✅ | Decode token payload |

**Demo Credentials:**
- Student: `student@demo` / `demo123`
- Admin: `admin@demo` / `demo123`

**JWT:** 7-day expiry, stored in `sessionStorage['samagama-token']`, sent as `Authorization: Bearer <token>` header.

---

### Announcements (100%)
| Endpoint | Method | Auth | Status |
|---|---|---|---|
| `/api/announcements` | GET | Optional | ✅ All published announcements |
| `/api/announcements` | POST | Admin | ✅ Create announcement |
| `/api/announcements/:id` | PATCH | Admin | ✅ Update/publish |
| `/api/announcements/:id` | DELETE | Admin | ✅ Delete |
| `/api/announcements/read-state/:userId` | GET | — | ✅ Get read IDs for a user |
| `/api/announcements/read-state` | POST | — | ✅ Mark one announcement read |
| `/api/announcements/read-state/all` | POST | — | ✅ Mark all read |

Read state is stored on the `User` document as `announcementReadIds[]`. Frontend announcements sync with `GET /api/announcements` on mount, with localStorage as cache.

---

### FAQs (100%)
| Endpoint | Method | Auth | Status |
|---|---|---|---|
| `/api/faqs` | GET | — | ✅ All 133 FAQs |

---

### Doubts / Community Q&A (100%)
| Endpoint | Method | Auth | Status | Notes |
|---|---|---|---|---|
| `/api/doubts` | GET | Optional | ✅ | Returns filtered list |
| `/api/doubts` | POST | Student+ | ✅ | Submit doubt |
| `/api/doubts/:id/approve` | POST | Admin | ✅ | Approve pending doubt |
| `/api/doubts/:id/reject` | POST | Admin | ✅ | Reject doubt |
| `/api/doubts/:id/answer` | POST | Admin | ✅ | Add answer (also accepts `/answers`) |
| `/api/doubts/:id/vote` | POST | Student+ | ✅ | Upvote doubt |

**Doubt lifecycle:** `pending` → `approved` → `answered`. Only approved doubts are visible to students.

---

### Leaderboard (100%)
| Endpoint | Method | Auth | Status |
|---|---|---|---|
| `/api/leaderboard` | GET | Optional | ✅ Ranked by SP, includes phase badge |
| `/api/leaderboard/me` | GET | Required | ✅ Returns rank, percentile, SP, streak |
| `/api/leaderboard?period=weekly` | GET | Optional | ✅ Filter by period |

Rankings update when students earn SP via admin awards.

---

### Spurti Points (100%)
| Endpoint | Method | Auth | Status |
|---|---|---|---|
| `/api/spurti` | GET | Student | ✅ SP balance + transaction history |

| Admin Endpoint | Method | Auth | Status |
|---|---|---|---|
| `/api/students/:id/spurti` | PUT | Admin | ✅ Award SP (amount + reason required) |

**Transaction log:** Every SP award is recorded in `SpurtiTransaction` collection with admin, student, amount, reason, and timestamp. Balance is stored denormalized on `User.spurtiPoints` and recalculated on demand.

---

### Teams (100%)
| Endpoint | Method | Auth | Status |
|---|---|---|---|
| `/api/teams` | POST | Student | ✅ Create team (becomes leader) |
| `/api/teams/me` | GET | Student | ✅ My team (by studentId or email) |
| `/api/teams/:id/join-request` | POST | Student | ✅ Request to join a team |
| `/api/teams/:id/members/respond` | PATCH | Team Leader | ✅ Accept/reject join request |
| `/api/teams/:id/invites/respond` | POST | Student | ✅ Accept/decline team invite |
| `/api/admin/teams` | GET | Admin | ✅ All teams with member details |
| `/api/admin/teams/:id/decision` | POST | Admin | ✅ Final approve/reject by admin |

Team lifecycle: `pending` → `approved` (by leader) → `final-approved` (by admin).

---

### Students & Dashboard (100%)
| Endpoint | Method | Auth | Status |
|---|---|---|---|
| `/api/students/stats` | GET | Admin | ✅ Dashboard totals (total, active, byPhase, pending counts) |
| `/api/students` | GET | Admin | ✅ Paginated student list with filters |
| `/api/students/:id` | GET | Either | ✅ Individual student profile |
| `/api/students/:id/progress` | GET | Either | ✅ Internship journey progress |
| `/api/students/:id/phase` | PUT | Admin | ✅ Update student phase (bronze→silver→gold→platinum) |

---

### Internship Tasks (100%)
| Endpoint | Method | Auth | Status |
|---|---|---|---|
| `/api/tasks` | GET | — | ✅ All 13 tasks, filterable by `?phase=bronze` |
| `/api/tasks/my` | GET | Student | ✅ Tasks with `myStatus` (locked/submitted/graded) |
| `/api/tasks` | POST | Admin | ✅ Create task |
| `/api/tasks` | PUT | Admin | ✅ Bulk replace tasks (for re-seeding) |
| `/api/tasks/:id/submit` | PATCH | Student | ✅ Submit a task |
| `/api/tasks/submissions/:id/grade` | PATCH | Admin | ✅ Grade submission (pass/fail/partial) |

**13 tasks seeded across 4 phases:**
- Bronze (B1–B4): Onboarding/training
- Silver (S1–S3): Project contribution
- Gold (G1–G3): Recognition
- Platinum (P1–P3): Lab revisit

---

### Weekly Reviews (100%)
| Endpoint | Method | Auth | Status |
|---|---|---|---|
| `/api/reviews` | GET | Either | ✅ List reviews (student=own, admin=all) |
| `/api/reviews/pending` | GET | Admin | ✅ Pending reviews for admin queue |
| `/api/reviews` | POST | Student | ✅ Submit weekly review |
| `/api/reviews/:id` | PATCH | Admin | ✅ Approve/reject review with feedback |

---

### NOC Upload (100%)
| Endpoint | Method | Auth | Status |
|---|---|---|---|
| `/api/nocs` | GET | Admin | ✅ List all NOC submissions |
| `/api/nocs` | POST | Student | ✅ Upload NOC (PDF/JPG/PNG, 5MB max) |
| `/api/nocs/:id` | PATCH | Admin | ✅ Approve/reject NOC |
| `/uploads/nocs/:filename` | GET | — | ✅ Download NOC file |

Files stored in `server/uploads/nocs/`. Served at `/uploads/nocs/` from the server root.

---

### Yaksha AI (⚠️ Requires API Key)
| Endpoint | Method | Auth | Status |
|---|---|---|---|
| `/api/yaksha` | POST | Student | ✅ Proxies to Groq API |

**Setup required:** Add `GROQ_API_KEY=your_key` to `server/.env`. Without the key, returns a clear error: `"Groq API key not configured on server"`.

---

## Security Checks
- ✅ JWT required on all student-write endpoints
- ✅ Admin-only routes (`requireAdmin`) return 403 for students
- ✅ Rate limiting: 100 requests/minute per IP
- ✅ Helmet.js security headers
- ✅ CORS enabled for local development
- ✅ File upload: PDF/JPG/PNG only, 5MB limit

---

## Seeded Data
| Collection | Count | Notes |
|---|---|---|
| Users | 2 | admin@demo, student@demo |
| FAQs | 133 | All Samagama FAQs |
| Tasks | 13 | B1–B4, S1–S3, G1–G3, P1–P3 |
| Announcements | 1 | Welcome to Samagama 2026! |

---

## Frontend Integration

### api.js (client/src/api.js)
Fully updated with all endpoints. Auth token is automatically attached from `sessionStorage['samagama-token']` for all protected calls.

### LoginPage
- Replaced fake `setTimeout` with real `POST /api/auth/login`
- Stores JWT in `sessionStorage['samagama-token']` and user ID in `sessionStorage['samagama-user-id']`
- Role-based redirect: admin → `/admin`, student → `/dashboard`

### Session Restore
- `App.jsx` `useEffect` checks for stored role + token on load
- If both exist, user is restored to their previous role without re-login

### Protected Pages
Pages that require auth check `sessionStorage['samagama-token']` before rendering sensitive content. Admin-only pages additionally verify `sessionStorage['samagama-role'] === 'admin'`.

---

## To Start the Backend

```bash
# 1. Start MongoDB (if not running)
mongod --dbpath /tmp/mongodb --port 27017

# 2. In another terminal, start the server
cd c:\projects\fyq\test-portal\server
node server.js

# 3. Verify it's up
curl http://localhost:4000/api/health
```

## To Reset & Re-Seed

```bash
cd c:\projects\fyq\test-portal\server
node seed.js
```

---

## Known Limitations
1. **Yaksha requires Groq API key** — set `GROQ_API_KEY` in `server/.env`
2. **No email notifications** — NOC/review approvals don't send email
3. **File storage is local** — NOC files on disk, not cloud storage
4. **No real-time updates** — doubt/announcement changes require page refresh
5. **No password reset** — demo auth doesn't support it