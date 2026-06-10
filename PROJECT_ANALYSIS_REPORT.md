# Samagama — Project Analysis Report

> Generated: June 4, 2026 | Status: ✅ Servers Running

---

## 1. Project Overview

**Project Name:** Samagama
**Type:** Full-stack MERN web application
**Purpose:** IIT Ropar's online internship management platform — connects students to a structured 2-month open-source internship program with training phases, team projects, AI assistance, community Q&A, and gamification.
**Frontend:** http://localhost:5173
**Backend:** http://localhost:4000

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite 5 |
| Backend | Express.js (Node.js) |
| Database | MongoDB (inferred from Express patterns; connection string not present in reviewed code) |
| Styling | Plain CSS with CSS custom properties; no CSS framework |
| Icons | Emoji-based throughout |
| Fonts | Google Fonts (Poppins, Space Grotesk, Playfair Display, Lora, JetBrains Mono) |
| Maps | Embedded Google Maps iframe (Galaxy Mission Map) |
| AI Chat | Yaksha-mini (Groq-powered) with `mixtral-8x7b-32768` model |

---

## 3. Folder Structure

```
Untitled Folder/
├── package.json                      # Root — npm workspaces config (empty scripts)
├── README.md
├── server/
│   ├── package.json
│   ├── index.js                      # Express server — ~700 lines, all routes + mock DB
│   └── data.js                       # Mock FAQ data (127 entries) + doubt seeds
└── client/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx                  # React root mount
        ├── App.jsx                   # Router + auth context + navbar
        ├── authContext.js            # AuthProvider (login/logout/admin-role state)
        ├── api.js                    # Axios base instance (localhost:4000/api)
        ├── data.js                   # Mock student profile data (2 students)
        ├── announcements.js          # 2 mock announcements
        ├── internshipTasks.js        # Task definitions for all 4 phases
        ├── internshipJourney.js      # Journey tier data (Bronze→Platinum)
        ├── studentProfile.js         # Student profile fetcher
        ├── studentSession.js         # Session fetcher
        ├── pages/
        │   ├── HomePage.jsx           # Landing page
        │   ├── LoginPage.jsx          # Login form
        │   ├── StudentDashboard.jsx   # Student home post-login
        │   ├── AdminDashboard.jsx     # Admin panel (~1800 lines)
        │   ├── OverviewPage.jsx       # Internship landing/journey page
        │   ├── FaqPage.jsx            # FAQ with filter chips + search
        │   ├── DoubtPage.jsx          # Community Q&A
        │   ├── YakshaPage.jsx         # AI chat (Yaksha-mini)
        │   ├── LeaderboardPage.jsx    # Public/student leaderboard
        │   ├── SpurtiPointsPage.jsx   # SP transactions + achievements + badges
        │   ├── InternshipTasksPage.jsx # Phase-wise tasks view
        │   └── CommunityHubPage.jsx   # Community landing page
        └── components/
            ├── JourneyDetailModal.jsx          # Tier details modal
            ├── NocUploadModal.jsx              # NOC upload UI (fake)
            ├── StudentProfileModal.jsx         # Student profile modal
            ├── WeeklyReviewSubmissionModal.jsx # Weekly review form
            └── TeamWorkflowModal.jsx           # Team formation workflow
```

---

## 4. Routing Structure

All routing handled in `App.jsx` via React Router v6:

| Route | Component | Access |
|---|---|---|
| `/` | `HomePage` | Public |
| `/login` | `LoginPage` | Public |
| `/overview` | `OverviewPage` | Public |
| `/dashboard` | `StudentDashboard` | Authenticated (student) |
| `/admin` | `AdminDashboard` | Authenticated (admin only) |
| `/tasks` | `InternshipTasksPage` | Authenticated |
| `/faq` | `FaqPage` | Authenticated |
| `/community` | `CommunityHubPage` | Authenticated |
| `/doubts` | `DoubtPage` | Authenticated |
| `/yaksha` | `YakshaPage` | Authenticated |
| `/leaderboard` | `LeaderboardPage` | Public |
| `/spurti` | `SpurtiPointsPage` | Authenticated |
| `*` | `HomePage` (redirect) | — |

**Note:** Most authenticated routes have a `(!user)` guard in App.jsx that redirects to `/login`. The admin route additionally checks `user.role === 'admin'`.

---

## 5. Authentication Flow

- **Mechanism:** React Context (`AuthContext`) + `localStorage` (`samagama_user`)
- **Roles:** `student` | `admin`
- **Login:** Hardcoded credentials (checked in `LoginPage.jsx`):
  - Student: `student@demo` / `demo123`
  - Admin: `admin@demo` / `demo123`
- **Persistence:** Stored in `localStorage`; `AuthProvider` reads on mount
- **Logout:** Clears context + `localStorage`, redirects to `/login`
- **No real JWT/sessions** — purely client-side mock auth. This is a prototype/educational project.

---

## 6. Feature Analysis

### ✅ Student Dashboard
- Displays welcome message, current phase badge, SP balance, streak, rank
- Announcements feed (new badge for unread)
- Quick stats: Active Tasks, Completed Tasks, Total SP Earned, Rank
- Phase progress bar (Bronze → Silver → Gold → Platinum)
- Quick action buttons: Open Yaksha, View Tasks, Leaderboard, Community, Submit Review
- Recent activity log (static mock entries)
- NOC upload entry point → opens `NocUploadModal`
- Profile modal trigger

### ✅ Admin Dashboard (~1,800 lines)
- Student management: search, filter, sort, pagination
- View individual student profiles and submissions
- Approve/reject doubt submissions (community moderation)
- Approve/reject weekly review submissions
- View NOC submission status
- View ViBe attendance records
- Team management and assignment
- Leaderboard summary view
- Send announcement form (rich text, emoji support)
- Stats overview (total students, active, completed, NOC pending, reviews pending, pending doubts)

### ✅ FAQ Module
- 127 FAQ entries across 18 categories: All, About, Timing, Eligibility, NOC, Stipend, Internship Mode, Documents, Selection, Work, Conduct, Interview, Certificate, Rosetta, Phase 1, Yaksha, ViBe, Team Formation
- Filter chips for category navigation
- Search bar (shortcut key to focus: press `/`)
- Expandable accordion items with smooth animations
- Category label on each item
- **Note:** FAQ data is server-sourced (GET `/api/faq`) and cached in component state; no client-side filtering library used

### ✅ Community Hub
- Landing/menu page for community features
- Links to: Leaderboard, Yaksha, Doubt Forum, Team Formation
- Quick-access cards with descriptions

### ✅ Doubt Forum (Community Q&A)
- List of approved questions with vote counts, tags, status badges
- Submit new doubt form (title, body, tag selection)
- 6 tag options: DSA, Web Dev, AI/ML, Resume, Internship, Other
- Admin can approve/reject pending doubts (in AdminDashboard)
- Mark as solved toggle
- Answers attached per doubt
- Search/filter by tag
- **Backend:** GET `/api/doubts` returns seeded mock data

### ✅ Yaksha AI Assistant
- Chat interface with AI "Yaksha-mini" (Groq API, model `mixtral-8x7b-32768`)
- Groq API key configured via environment variable
- 6 quick prompt suggestion buttons
- Recent conversations list (stored in `localStorage`)
- Suggested topics displayed
- Start new chat clears conversation
- Chat history persisted in `localStorage`
- Messages have role: `user` | `assistant`

### ✅ Leaderboard
- Public view and student-authenticated view
- Top 12 leaderboard display
- Three period tabs: All Time, Monthly, Weekly
- Spurti Points (SP) shown per student
- Student view shows additional info: current rank, SP to next rank, percentile
- Glass morphism card styling
- **Data:** Static/hardcoded in `LeaderboardPage.jsx` — no API calls

### ✅ Spurti Points System
- 6 tabs: SP Statement, Achievements, Badges, Leaderboard (embedded), Level, Rank
- SP Statement: transaction history with date, description, SP amount (+/-), running balance
- Achievements tab: milestone cards with progress bars (bronze/silver/gold/platinum tiers)
- Badges tab: earned badge grid
- Leaderboard embedded tab: top 10 + "Your Rank" row
- **Data:** Static/hardcoded in `SpurtiPointsPage.jsx` — no API calls

### ✅ Internship Tasks Page
- Displays tasks grouped by phase (Bronze, Silver, Gold, Platinum)
- Phase selector tabs
- Task cards: title, description, SP reward, status (locked/available/completed)
- Visual distinction between task states

### ✅ Overview / Landing Page
- Stats bar: 100% Online, 60 Days, IIT Ropar Mentorship, No Fee
- Journey tiers section (Bronze→Silver→Gold→Platinum) with descriptions
- "What You'll Build" section: 6 domain cards (AI/ML, LLM Apps, Web Dev, EdTech, AgriTech, Open Source)
- Life Steps timeline with milestones
- Navbar with login/join buttons

### ✅ Galaxy Mission Map
- Full-width embedded Google Maps iframe showing IIT Ropar location
- Styled as "Mission Map" in the journey section

### ✅ Modals
- **JourneyDetailModal:** Shows tier name, description, requirements, perks, and "Continue" button
- **NocUploadModal:** Fake upload UI with drag-and-drop area, instructions, submission button (no real upload)
- **StudentProfileModal:** Shows student name, email, college, role, joining date, current tier, SP balance, rank, streak
- **WeeklyReviewSubmissionModal:** 5-star rating + work summary textarea + challenges textarea + next week goals + submit
- **TeamWorkflowModal:** 4-step team formation wizard (Intro → Preferences → Matching → Confirmation)

---

## 7. Backend API Routes (Express, port 4000)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/faq` | Returns 127 FAQ objects (id, q, a, cat) |
| GET | `/api/doubts` | Returns seeded doubt threads with answers |
| POST | `/api/doubts` | Submit a new doubt |
| PATCH | `/api/doubts/:id/approve` | Admin approve doubt |
| PATCH | `/api/doubts/:id/reject` | Admin reject doubt |
| PATCH | `/api/doubts/:id/solved` | Toggle solved status |
| POST | `/api/doubts/:id/answers` | Post an answer to a doubt |
| GET | `/api/announcements` | Returns announcements |
| POST | `/api/announcements` | Admin creates announcement |
| GET | `/api/students` | Returns mock student list |
| GET | `/api/students/:id` | Single student |
| GET | `/api/reviews` | Weekly reviews list |
| POST | `/api/reviews` | Submit weekly review |
| PATCH | `/api/reviews/:id/status` | Approve/reject review |
| GET | `/api/noc` | NOC list |
| POST | `/api/noc/upload` | Upload NOC (logs to console) |
| GET | `/api/vibe/attendance` | ViBe attendance records |
| GET | `/api/leaderboard` | Combined leaderboard data |
| GET | `/api/spurti/:studentId/transactions` | SP transaction history |
| GET | `/api/teams` | Team list |

**Server is running ✅ on port 4000**

---

## 8. Known Issues / Bugs

### 🔴 Functional Issues

1. **No real database** — all data is in-memory (JavaScript arrays in `server/index.js`). On server restart, all data resets to seed values. Submissions (NOC uploads, doubt posts, review submissions) are NOT persisted.

2. **Admin API endpoints may not exist** — The client calls `/api/reviews/:id/status`, `/api/noc`, `/api/vibe/attendance`, `/api/leaderboard`, `/api/spurti/:studentId/transactions`, `/api/teams`, but these endpoints were NOT confirmed to exist in the server. Server returned 404 for `/api/stats` and `/api/spurti/leaderboard` — suggesting incomplete backend coverage.

3. **No authentication middleware on backend** — All backend endpoints are open. The client stores auth state in `localStorage` but the server never validates it.

4. **NOC Upload is fake** — The file upload endpoint logs the file to console but doesn't actually store or process the file anywhere.

5. **Groq API key is hardcoded in client** — The Yaksha page has `GROQ_API_KEY` embedded in the source code. Anyone can extract it. Should be moved to a `.env` file proxied through the backend.

6. **Leaderboard and SpurtiPoints data is completely static** — Both pages render hardcoded data. There's no API integration, which means real-time leaderboard updates won't work without backend changes.

7. **ViBe platform integration is placeholder** — The ViBe-related FAQ items reference an external LMS platform, but there's no actual integration code.

### 🟡 Quality Issues

8. **Massive AdminDashboard file** — ~1,800 lines in a single file. Should be broken into sub-components.

9. **No loading/error states** — Most pages assume data is immediately available. No `useState` for loading or error conditions.

10. **CSS has no framework** — All styling is custom CSS with inline `style={}` objects and a single `<style>` tag. Hard to maintain at scale.

11. **No form validation** — Login, doubt submission, review submission, NOC upload — none have validation.

12. **No responsive design** — The CSS does not have media queries. The app is likely broken on mobile.

13. **Google Maps iframe is hardcoded** — Uses a specific Google Maps embed URL; may break if the location changes.

### 🟢 Minor Issues

14. **Keyboard shortcut "/" for FAQ search** — Pressing "/" anywhere on the page steals focus from other inputs.

15. **LocalStorage for Yaksha chat** — Chat history is stored without size limits; could grow unbounded.

16. **Hardcoded student credentials** — `student@demo` / `demo123` and `admin@demo` / `demo123`. Fine for a demo, but worth noting.

17. **Emoji used for icons everywhere** — Works visually but may not be accessible (screen readers).

18. **No 404 page** — Unknown routes redirect to `HomePage` silently.

---

## 9. Features Partially Implemented

| Feature | Status |
|---|---|
| Real-time SP updates | ❌ Static data only |
| Team formation workflow | ⚠️ Modal exists but backend team assignment doesn't persist |
| Weekly review submission | ⚠️ Form exists; backend accepts it but doesn't store permanently |
| NOC upload | ⚠️ UI works; file is logged to console, not stored |
| Announcement system | ⚠️ Admin can post; announcements display for students but reset on server restart |
| Attendance tracking | ⚠️ ViBe attendance API call exists in client but endpoint unconfirmed |
| Student profile modal | ⚠️ Displays mock data only |

---

## 10. Suggestions for Improvement

### High Priority
1. **Move Groq API key to backend** — Proxy Yaksha requests through `/api/yaksha/chat` so the key isn't exposed in client-side code.
2. **Add MongoDB** — Replace in-memory arrays with a real database so data persists across restarts.
3. **Add auth middleware on backend** — Validate JWT tokens on protected routes instead of trusting the client.
4. **Fix leaderboard data** — Connect to a real data source or implement proper API endpoints.

### Medium Priority
5. **Break up AdminDashboard** — Extract sections into separate components: `StudentTable`, `AnnouncementForm`, `ReviewQueue`, `NocManager`, etc.
6. **Add loading + error states** — Every `useEffect` that fetches data should handle loading/error.
7. **Add form validation** — Use a library like `zod` or manual validation on all forms.
8. **Add responsive CSS** — At minimum, media queries for mobile layouts.
9. **Implement real file upload** — Use `multer` on the backend + cloud storage (S3/Cloudinary) for NOC documents.

### Lower Priority
10. Add a 404 page with navigation back to safety
11. Add accessible icon alternatives for emoji (ARIA labels)
12. Add toast/notification system for user feedback
13. Add dark mode
14. Add keyboard navigation (Tab + Enter for FAQ accordions)
15. Add unit tests for the API endpoints

---

## 11. Server & Client Status

| Service | URL | Status |
|---|---|---|
| Backend (Express) | http://localhost:4000 | ✅ Running |
| Frontend (Vite) | http://localhost:5173 | ✅ Running |

Both servers are active and responding. FAQ and Doubts APIs are functional. Other endpoints (stats, leaderboard API, spurti transactions, teams, reviews status) returned 404 — likely incomplete or named differently in the server code.

---

*Report generated by Scooby 🐾 — analysis of Samagama MERN project, June 4 2026.*