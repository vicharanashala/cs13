<p align="center">
  <img src="https://vicharanashala.ai/assets/vled-iit-clear-BqWIp7DI.png" alt="Vicharanashala Logo" width="220"/>
</p>

<h1 align="center">Samagama — Internship Management Platform</h1>

<p align="center">
  <strong>CS13 &nbsp;·&nbsp; IIT Ropar &nbsp;·&nbsp; Vicharanashala Open-Source Internship Programme</strong><br/>
  Full-Stack MERN Web Application
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Express.js-Node.js-339933?logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Groq_AI-mixtral--8x7b-FF6B35" />
  <img src="https://img.shields.io/badge/Team-CS13-1A3557" />
</p>

<p align="center">
  <a href="https://github.com/vicharanashala/cs13"><strong>→ View Repository</strong></a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="https://drive.google.com/file/d/11rItcxKhL3VPwqIAuwtb9IZqaMEGYNQy/view?usp=sharing"><strong>→ Feature Demo Video</strong></a>
</p>

---

## What is Samagama?

**Samagama** (Sanskrit: *confluence*) is the official internship management platform for the Vicharanashala open-source internship at IIT Ropar. It is a full-stack MERN web application that consolidates every aspect of the two-month internship experience into a single, role-aware, mobile-responsive digital environment.

Before Samagama, the programme ran across fragmented tools — emails for announcements, spreadsheets for progress tracking, chat groups for Q&A, and external documents for FAQs. Students had no single place to check their tier progress, earn recognition for contributions, or get AI-powered guidance. Coordinators manually tracked everything across disparate systems.

Samagama solves all of this. It gives:

- **Students** a personal dashboard, a four-tier journey tracker, a 127-entry searchable FAQ, a moderated community doubt forum, an AI mentor (Yaksha), a Spurti Points wallet with badges and leaderboard, weekly review submission, NOC upload, and team management tools.
- **Administrators** a single console to manage student records, moderate community content, award Spurti Points, approve weekly reviews, broadcast announcements, track NOC submissions, manage project teams, and view live programme health statistics.
- **The Public** access to the programme overview, journey explorer, and leaderboard — serving as a window into the programme for prospective students and collaborators.

---

## Table of Contents

- [Team CS13](#team-cs13)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Application Pages](#application-pages)
- [Features — Deep Dive](#features--deep-dive)
  - [Yaksha AI Assistant ⭐ Standout Innovation](#yaksha-ai-assistant--standout-innovation)
  - [Gamified Spurti Points Economy](#gamified-spurti-points-economy)
  - [Click-to-Explore Journey Page](#click-to-explore-journey-page)
  - [Moderated Community Doubt Forum](#moderated-community-doubt-forum)
  - [Comprehensive Admin Dashboard](#comprehensive-admin-dashboard)
  - [FAQ Module — 127 Entries, 18 Categories](#faq-module--127-entries-18-categories)
  - [Mobile-Responsive Design System](#mobile-responsive-design-system)
  - [Internship Tasks by Phase](#internship-tasks-by-phase)
  - [Team Formation Workflow](#team-formation-workflow)
- [Roles & Authentication](#roles--authentication)
- [Backend API Reference](#backend-api-reference)
- [Challenges & Known Limitations](#challenges--known-limitations)
- [Future Enhancements](#future-enhancements)
- [Programme Context: The Four-Tier Journey](#programme-context-the-four-tier-journey)

---

## Team CS13

**Team Lead:** Arushi Singh

| # | Member | Primary Contribution |
|---|--------|----------------------|
| 1 | **Arushi Singh** *(Lead)* | Project architecture, backend API design, Express server structure, authentication system, overall integration, team coordination |
| 2 | Kirti Solanki | Frontend development, Student Dashboard UI, responsive CSS, component design system |
| 3 | Maragoni Harini | Doubt Forum module, Community Hub page, community Q&A backend integration, tag filter system |
| 4 | Rayaparthy Drakshayani | FAQ module, search & filter system, all 127 FAQ entries structured across 18 categories |
| 5 | Raksha S | Leaderboard page, Spurti Points visualisation, public route design, period-filter tabs |
| 6 | Chandana Jagadish | Admin Dashboard, moderation controls, SP management panel, student analytics, stats bar |
| 7 | Anjali Bingi | Yaksha AI chat assistant, Groq API integration, system prompt engineering, chat UX design |
| 8 | Tushit Tiwari | Backend Express routes, server configuration, data seeding, Internship Tasks page |
| 9 | Harshita Balchandani | Spurti Points system, achievement badges, transaction history, tier progression logic |
| 10 | Nandeeshwari Vadde | Journey/Overview page, milestone explorer, mobile responsive UI, modals |
| 11 | Aryan Sinha | Student Dashboard — Daily Focus / Next Best Actions panel, prioritised action engine, task state management, urgency-aware UI |

---

## Tech Stack

| Layer | Technology | Why We Chose It |
|-------|-----------|-----------------|
| **Frontend** | React 18 + Vite 5 | Component model maps perfectly to role-specific UI sections; Vite's near-instant HMR accelerated development significantly |
| **Backend** | Express.js (Node.js) | Lightweight, JavaScript-native REST server; middleware system cleanly handles auth, CORS, and logging |
| **Database** | MongoDB (Atlas — production) | Schema-flexible document model suits evolving student/doubt/SP structures; JSON-native aligns with the JS stack |
| **AI Chat** | Groq API (`mixtral-8x7b-32768`) | Sub-second inference latency; strong instruction-following for structured internship guidance context |
| **Routing** | React Router v6 | Declarative nested routing; role guards implemented cleanly at component level via AuthContext |
| **HTTP Client** | Axios | Single base URL in `api.js`; all team members add calls without repeating configuration |
| **Styling** | Custom CSS with CSS Variables | Full visual control, no framework constraints, unique visual identity |
| **Typography** | Google Fonts (5 typefaces) | Poppins (UI labels), Space Grotesk (data), Playfair Display (decorative headings), Lora (body text), JetBrains Mono (code) |

---

## Project Structure

```
cs13/
├── client/                              # React 18 + Vite 5 frontend (port 5173)
│   ├── index.html
│   ├── vite.config.js                   # Proxy: /api → localhost:4000
│   └── src/
│       ├── main.jsx                     # React root
│       ├── App.jsx                      # Router + AuthContext + Navbar + route guards
│       ├── authContext.js               # AuthProvider — login/logout/role state
│       ├── api.js                       # Axios instance (base: localhost:4000/api)
│       ├── data.js                      # Mock student profile data
│       ├── announcements.js             # Mock announcement seeds
│       ├── internshipTasks.js           # Task definitions for all 4 phases
│       ├── internshipJourney.js         # Journey tier data (Bronze → Platinum)
│       ├── studentProfile.js            # Student profile fetch helper
│       ├── studentSession.js            # Session fetch helper
│       ├── pages/
│       │   ├── HomePage.jsx             # Public landing page
│       │   ├── LoginPage.jsx            # Login form with demo credentials
│       │   ├── OverviewPage.jsx         # Interactive journey explorer (zero-scroll)
│       │   ├── StudentDashboard.jsx     # Student home post-login
│       │   ├── AdminDashboard.jsx       # Admin console (~1800 lines, all coordinator tools)
│       │   ├── FaqPage.jsx              # 127-entry FAQ with search + 18 category chips
│       │   ├── DoubtPage.jsx            # Community Q&A forum
│       │   ├── YakshaPage.jsx           # Yaksha AI chat assistant (Groq-powered)
│       │   ├── LeaderboardPage.jsx      # SP leaderboard (All Time / Monthly / Weekly)
│       │   ├── SpurtiPointsPage.jsx     # Personal SP history, badges, achievements
│       │   ├── InternshipTasksPage.jsx  # Phase-wise task viewer with status
│       │   └── CommunityHubPage.jsx     # Community landing hub with feature cards
│       └── components/
│           ├── JourneyDetailModal.jsx          # Tier detail reveal modal
│           ├── NocUploadModal.jsx              # NOC document upload UI
│           ├── StudentProfileModal.jsx         # Student profile viewer
│           ├── WeeklyReviewSubmissionModal.jsx # 5-star + summary review form
│           └── TeamWorkflowModal.jsx           # 4-step team formation wizard
│
├── server/                              # Express.js backend (port 4000)
│   ├── package.json
│   ├── index.js                         # Main server — all routes + in-memory data store (~700 lines)
│   └── data.js                          # 127 FAQ entries + doubt/student seed data
│
├── zoro-portal/                         # Alternate React + TypeScript + Tailwind portal
├── samagama_v3.html                     # Standalone HTML prototype (896KB)
├── package.json                         # npm workspaces root
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/vicharanashala/cs13.git
cd cs13

# 2. Install all workspace dependencies
npm install

# 3. Start both servers (frontend + backend)
npm run dev
```

The Vite frontend will start at **http://localhost:5173**  
The Express backend will start at **http://localhost:4000**

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Student | `student@demo` | `demo123` |
| Admin | `admin@demo` | `demo123` |

### Environment Variables

Create a `.env` file in the `client/` directory:

```env
VITE_GROQ_API_KEY=your_groq_api_key_here
```

> ⚠️ **Note:** In production, move the Groq API key to the Express backend and proxy Yaksha requests through `/api/yaksha/chat` to avoid exposing the key in client-side bundles.

---

## Application Pages

| Route | Component | Access | Description |
|-------|-----------|--------|-------------|
| `/` | `HomePage.jsx` | Public | Landing page with programme overview and CTA |
| `/login` | `LoginPage.jsx` | Public | Login form; redirects to dashboard if already authenticated |
| `/overview` | `OverviewPage.jsx` | Public | Interactive journey & tier explorer — zero-scroll |
| `/dashboard` | `StudentDashboard.jsx` | Student | Personal home with SP balance, tasks, announcements |
| `/tasks` | `InternshipTasksPage.jsx` | Student | Phase-wise task grid with SP rewards and status |
| `/faq` | `FaqPage.jsx` | Student | 127-entry FAQ with 18 category chips and full-text search |
| `/community` | `CommunityHubPage.jsx` | Student | Community hub linking to Leaderboard, Yaksha, Doubts, Teams |
| `/doubts` | `DoubtPage.jsx` | Student | Post, search, answer, and moderate community doubts |
| `/yaksha` | `YakshaPage.jsx` | Student | Yaksha AI chat assistant powered by Groq |
| `/leaderboard` | `LeaderboardPage.jsx` | Public | SP-ranked leaderboard with All Time / Monthly / Weekly tabs |
| `/spurti` | `SpurtiPointsPage.jsx` | Student | SP transaction history, badges, achievements, tier level |
| `/admin` | `AdminDashboard.jsx` | Admin only | Full coordinator console — students, doubts, SP, reviews, teams |

---

## Features — Deep Dive

---

### Yaksha AI Assistant ⭐ Standout Innovation

> **Demo:** [https://drive.google.com/file/d/11rItcxKhL3VPwqIAuwtb9IZqaMEGYNQy/view?usp=sharing](https://drive.google.com/file/d/11rItcxKhL3VPwqIAuwtb9IZqaMEGYNQy/view?usp=sharing)

Yaksha is the most technically innovative feature of Samagama. It is a **context-aware AI mentor embedded directly inside the internship platform**, powered by Groq's `mixtral-8x7b-32768` model.

What makes Yaksha genuinely innovative is not simply that it integrates an LLM — it is that the integration is **deeply contextual**. Yaksha is given a programme-specific system prompt encoding the full structure of the Vicharanashala internship: the four tiers (Bronze, Silver, Gold, Platinum), NOC procedures, stipend timelines, ViBe platform requirements, weekly review process, certificate conditions, and team formation rules. When a student asks Yaksha about the internship, they receive answers grounded in the actual programme — not generic internet advice.

**Technical implementation:**

The chat interface in `YakshaPage.jsx` sends the full `messages[]` array (complete conversation history) on every API call to Groq, maintaining multi-turn context. Responses are stored in `localStorage` so students can return to previous conversations from the "Recent Conversations" sidebar. The Groq `mixtral-8x7b-32768` model was selected for its exceptionally low inference latency and strong instruction-following at long context lengths.

**Six one-tap quick prompts** cover the questions coordinators receive most frequently:

| Quick Prompt | What it does |
|---|---|
| Resume Review | Yaksha reviews the student's resume draft and gives structured feedback |
| Interview Preparation | Generates role-specific mock interview questions and guidance |
| Internship Eligibility | Clarifies exactly what a student needs to do to maintain eligibility |
| NOC Questions | Explains the NOC process, timeline, and required documents |
| Stipend Queries | Answers questions about stipend conditions, amounts, and disbursement |
| Certificate Support | Explains certificate eligibility and what is needed to qualify |

**Real-world impact:** In a 100+ student cohort, coordinators previously spent hours per week answering the same questions. Yaksha handles the long tail of routine queries 24/7, freeing coordinators for substantive guidance. Students also benefit from the privacy of asking questions they might hesitate to raise publicly, and from getting accurate answers at midnight before a deadline.

**Key UX features:**
- Persistent chat history per session (localStorage)
- Recent Conversations sidebar — pick up where you left off
- Suggested Topics panel — surfaces common questions for students who don't know where to start
- Auto-scroll to latest message as conversation grows
- Plain-text response rendering — every AI response is fully selectable and copy-paste friendly
- "Start New Chat" clears the current thread without losing history

---

### Gamified Spurti Points Economy

Samagama implements a complete gamification system built around **Spurti Points (SP)** — a programmable internal currency that rewards students for meaningful programme contributions. The SP economy is tightly integrated with admin workflows and creates real behavioural incentives.

**The four interconnected SP system components:**

**1. Awards Engine (Admin → Student)**
Admins award SP via the Admin Dashboard. Every award requires:
- A target student
- A custom SP amount (flexible — not a fixed menu)
- A mandatory reason note (creates accountability and a searchable record)

**2. Transaction Ledger (Student Visibility)**
Every SP event — earn, spend, or adjustment — is recorded in a timestamped transaction log on the student's Spurti Points page, showing:
- Date and time
- Description / reason
- Amount (+/-)
- Running balance after the transaction

**3. Achievement System (Progress Milestones)**
Milestone achievements unlock as students hit SP thresholds:
- 🥉 Bronze tier — foundational engagement
- 🥈 Silver tier — consistent contribution
- 🥇 Gold tier — quality community impact
- 🏆 Platinum tier — programme excellence

Each tier unlocks new badges displayed on the Badges tab of the Spurti Points page.

**4. Leaderboard (Social Motivation)**
Students are ranked by total SP across three time windows: All Time, Monthly, and Weekly. Authenticated students see additional context — their exact rank, SP needed to move up one position, and their percentile among all students.

---

### Click-to-Explore Journey Page

The Overview/Journey Page solves a common problem in programme documentation: **information exists, but students cannot find it because they stop scrolling before reaching it.** Samagama eliminates scrolling from programme discovery entirely.

**How the zero-scroll model works:**

The page is built on a **click-reveal interaction** throughout every section:

- **Milestone Grid:** Four tier cards (Bronze, Silver, Gold, Platinum) are displayed in a horizontal grid. Clicking any card instantly reveals that tier's full detail — description, requirements, and perks — in a dedicated panel on the same page. No new tab, no page navigation, no scrolling.
- **Life Steps:** Click any step label to preview that milestone inline, without moving the page.
- **Process Steps:** Tab-style selectors — click a numbered step and the content panel swaps immediately.
- **FAQ Accordion:** Embedded on the same page — click a question and the answer expands in place.

A student can understand the entire two-month programme arc from Bronze to Platinum — what is expected, what they will build, what rewards await — **without pressing the scroll key once.** Every section is reachable by a single, clearly visible click.

**Additional sections on the Overview page:**
- Stats bar: 100% Online · 60 Days · IIT Ropar Mentorship · No Fee
- "What You'll Build" domain cards: AI/ML, LLM Apps, Web Dev, EdTech, AgriTech, Open Source
- Galaxy Mission Map: full-width Google Maps embed showing IIT Ropar

---

### Moderated Community Doubt Forum

The Doubt Forum is a peer knowledge-base with **quality controls built in**. It solves the problem of student questions getting lost in chat groups and never building into a searchable resource for future cohorts.

**Key design decisions:**

**Search before you post** — The search bar is prominently placed above the post button. Students are encouraged to check if their question already has an answer before submitting. If someone else had the same doubt, they can read the verified answer immediately.

**Moderation queue** — Every new doubt enters a `pending` state. It only appears publicly in the forum after an admin approves it. This ensures every question in the forum meets a quality bar and prevents spam.

**Tag taxonomy** — Six domain tags structure the forum for browsability:

| Tag | Covers |
|-----|--------|
| DSA | Data structures, algorithms, competitive programming |
| Web Dev | HTML, CSS, JavaScript, React, backend |
| AI/ML | Machine learning, deep learning, LLM |
| Resume | CV writing, LinkedIn, career documents |
| Internship | Programme procedures, timelines, eligibility |
| Other | Everything else |

**Solved status** — Once a doubt is resolved with a satisfactory answer, it gets a "Solved" badge. Future students immediately see that a verified answer exists before reading the thread.

**SP incentives for answers** — Admins can award Spurti Points to students who give particularly helpful answers. This creates a virtuous cycle: students are motivated to give quality responses, which builds a better knowledge base, which helps more students.

**Doubt lifecycle:** `submitted` → `pending (admin queue)` → `approved (public)` → `answered` → `solved`

---

### Comprehensive Admin Dashboard

The Admin Dashboard consolidates **every coordinator workflow** into a single, tabbed interface at `/admin`. At approximately 1,800 lines of code, it is the largest component in the codebase and the most feature-complete.

**Live Stats Bar (always visible at top):**

| Stat | What it shows |
|------|--------------|
| Total Students | All enrolled students in the system |
| Active Students | Students with recent activity |
| Pending Reviews | Weekly reviews awaiting approval |
| Pending Doubts | Community doubts in the moderation queue |
| NOC Uploads Today | Documents uploaded in the last 24 hours |
| SP Awarded Today | Total Spurti Points distributed today |

**Tabbed Sections:**

**Students Tab** — Full student roster with search (by name/email), filter (by tier/status), sort (by SP/name/join date), and pagination. Click any student row to open their full profile modal showing SP balance, tier, streak, college, and submission history.

**Doubts Tab** — Moderation queue showing all pending doubts with student name, SP balance, timestamp, doubt title, body preview, and tag. One-click Approve (moves to public forum) or Reject (with reason note sent to student).

**Reviews Tab** — Weekly review approval queue. Each row shows student name, week number, 5-star rating given, work summary, challenges noted, and next-week goals. Approve or reject with a coordinator note.

**NOC Submissions Tab** — Grid of students showing NOC upload status (uploaded / not uploaded), upload timestamp, and document access link.

**Teams Tab** — All project teams with member lists, team leader, project domain, and approval status (pending / approved / final-approved). Admin makes the final approval decision on team formation.

**Announcements Tab** — Rich-text announcement editor with emoji support. Posted announcements immediately appear on every authenticated student's dashboard with an unread badge indicator.

**SP Awards Tab** — Two sub-sections:
1. *Award SP* — Select student, enter custom amount, write reason note, submit. Award is immediately reflected in the student's balance.
2. *SP History* — Paginated log of all SP awards ever made, showing date, student, amount, reason, and which admin made the award.

---

### FAQ Module — 127 Entries, 18 Categories

The FAQ page (`/faq`) is a fully searchable, category-filtered knowledge base with **127 entries** covering every common question across the two-month programme.

**18 categories:**

| Category | Topics Covered |
|----------|---------------|
| About | Programme overview, Vicharanashala mission |
| Timing | Schedule, deadlines, important dates |
| Eligibility | Who can join, requirements, disqualification conditions |
| NOC | No Objection Certificate process and documents |
| Stipend | Stipend amount, conditions, disbursement timeline |
| Internship Mode | Remote vs on-campus, attendance expectations |
| Documents | Required paperwork, submission formats |
| Selection | Selection criteria, interview process |
| Work | Day-to-day work expectations, output requirements |
| Conduct | Code of conduct, community guidelines |
| Interview | Mock interviews, preparation guidance |
| Certificate | Certificate eligibility, what it covers |
| Rosetta | Rosetta Code challenges and related tasks |
| Phase 1 | First phase specific tasks and requirements |
| Yaksha | The AI assistant — what it can and cannot do |
| ViBe | The ViBe LMS platform — attendance and tasks |
| Team Formation | Team creation rules, domain selection, leader roles |

**UX features:**
- **Category chip filter bar** — click any chip to instantly filter to that category
- **Full-text search bar** — searches question text and answers simultaneously; press `/` from anywhere on the page to jump focus to the search bar
- **Expandable accordion** — click any question to expand the answer inline with smooth animation
- **Category label** on each item shows which category it belongs to even when browsing without a filter
- Data fetched from `GET /api/faqs` on mount and cached in component state for instant filter/search without additional API calls

---

### Mobile-Responsive Design System

A substantial portion of the Samagama codebase is dedicated to mobile responsiveness. The explicit design goal: **a student with only a smartphone can participate fully in the programme without needing a laptop.**

**Three breakpoint tiers:**

| Breakpoint | Device Target | What Changes |
|-----------|---------------|-------------|
| `≤ 1100px` | Tablets, small laptops | Navigation reflows; grid layouts collapse from 3-col to 2-col |
| `≤ 768px` | Large phones, small tablets | Chat panels and sidebars stack vertically; Yaksha composer goes full-width; admin tables become scroll-horizontal; FAQ chip filter wraps to multi-row |
| `≤ 480px` | Standard phones | Hero text resizes; all card layouts go single-column; padding tightens for thumb-friendly tap targets; font sizes scale down |

Every major page has its own dedicated set of mobile media query overrides in its CSS block. The Yaksha page is particularly carefully handled — the chat window, input composer, quick-prompt grid, and recent conversations sidebar all have individual mobile treatments.

---

### Internship Tasks by Phase

The Tasks page (`/tasks`) gives students a clear, phase-organised view of everything they are expected to complete across the two-month programme.

**Phase selector** — Four tab buttons (Bronze, Silver, Gold, Platinum) filter the task grid to the selected phase. Students always know exactly which tasks apply to their current tier.

**Task card states:**

| State | Visual | Meaning |
|-------|--------|---------|
| Locked | Grey, padlock icon | Not yet available — complete earlier phases first |
| Available | Blue border, active | Ready to work on now |
| Completed | Green, checkmark | Submitted and accepted |

Each task card shows: task title, full description, SP reward for completion, and current status. The SP reward value creates a visible incentive to complete tasks and makes the gamification economy tangible.

---

### Team Formation Workflow

The TeamWorkflowModal (`components/TeamWorkflowModal.jsx`) guides students through a structured 4-step team formation process:

| Step | Title | What Happens |
|------|-------|-------------|
| 1 | Introduction | Student reads team formation rules and requirements |
| 2 | Preferences | Student selects preferred project domain (AI/ML, Web Dev, EdTech, etc.) |
| 3 | Matching | System matches with compatible team members based on preferences |
| 4 | Confirmation | Student reviews team composition and confirms joining |

Teams then enter the backend approval flow: `pending` (leader accepts) → `approved` (all members confirmed) → `final-approved` (admin signs off). This multi-stage approval ensures teams are intentionally formed and coordinator-verified before project work begins.

---

## Roles & Authentication

Authentication in Samagama is managed via React Context (`AuthContext` in `authContext.js`) backed by `localStorage`.

**How it works:**

1. User submits credentials on `LoginPage.jsx`
2. Frontend calls `POST /api/auth/login`
3. Server returns a JWT token + user object (with `role` field)
4. Token and user object are stored in `localStorage` as `samagama_user`
5. `AuthProvider` reads `localStorage` on mount and provides the session to all child components via `useContext(AuthContext)`
6. Route guards in `App.jsx` check `user` and `user.role` before rendering protected pages
7. Logout clears context and `localStorage`, redirects to `/login`

**Role access matrix:**

| Feature | Public | Student | Admin |
|---------|--------|---------|-------|
| Home, Overview | ✅ | ✅ | ✅ |
| Leaderboard | ✅ | ✅ | ✅ |
| Student Dashboard | — | ✅ | ✅ |
| FAQ, Doubts, Yaksha | — | ✅ | ✅ |
| Spurti Points, Tasks | — | ✅ | ✅ |
| Submit Reviews, Upload NOC | — | ✅ | ✅ |
| Admin Dashboard | — | — | ✅ |
| Award SP, Moderate Content | — | — | ✅ |
| Manage Students & Teams | — | — | ✅ |

> ⚠️ **Prototype note:** Route guards are implemented client-side only. Backend API endpoints do not yet validate JWT tokens server-side. See [Future Enhancements](#future-enhancements) for the production plan.

---

## Backend API Reference

All endpoints are served from `http://localhost:4000/api`.

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/login` | None | Authenticate with email + password; returns JWT + user object |
| `GET` | `/api/auth/me` | JWT | Return full profile for the authenticated user |
| `PUT` | `/api/auth/profile` | JWT | Update name, phone, or avatar |

### FAQs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/faqs` | None | Return all 133 FAQ entries with `{id, q, a, cat}` |

### Doubts / Community Q&A

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/doubts` | Optional | Return all approved doubts with answers, votes, tags, and status |
| `POST` | `/api/doubts` | Student | Submit a new doubt (enters pending moderation queue) |
| `PATCH` | `/api/doubts/:id/approve` | Admin | Move doubt from pending → public forum |
| `PATCH` | `/api/doubts/:id/reject` | Admin | Reject with reason note for student revision |
| `POST` | `/api/doubts/:id/answer` | Admin | Add an admin answer to a doubt |
| `POST` | `/api/doubts/:id/vote` | Student | Upvote a doubt |

### Students & SP

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/students` | Admin | Full student list — searchable, sortable |
| `GET` | `/api/students/:id` | Admin | Individual student profile with SP and tier |
| `PUT` | `/api/students/:id/spurti` | Admin | Award SP — requires `amount` and `reason` in body |
| `GET` | `/api/spurti` | Student | Return SP balance and full transaction history |

### Announcements

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/announcements` | Optional | Return all published announcements |
| `POST` | `/api/announcements` | Admin | Create and publish a new announcement |
| `PATCH` | `/api/announcements/:id` | Admin | Update or publish/unpublish an announcement |
| `DELETE` | `/api/announcements/:id` | Admin | Delete an announcement |

### Weekly Reviews

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/reviews` | Admin | Return all review submissions |
| `POST` | `/api/reviews` | Student | Submit a weekly review (rating, summary, challenges, goals) |
| `PATCH` | `/api/reviews/:id/status` | Admin | Approve or reject a review with coordinator note |

### Leaderboard

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/leaderboard` | Optional | SP-ranked leaderboard; supports `?period=weekly\|monthly` |
| `GET` | `/api/leaderboard/me` | Student | Return authenticated student's rank, percentile, SP, streak |

### Teams

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/teams` | Student | Create a new team; student becomes team leader |
| `GET` | `/api/teams/me` | Student | Return the student's current team with all member details |
| `POST` | `/api/teams/:id/join-request` | Student | Request to join an existing team |
| `PATCH` | `/api/teams/:id/members/respond` | Leader | Accept or reject a join request |
| `GET` | `/api/admin/teams` | Admin | All teams with full member details |
| `POST` | `/api/admin/teams/:id/decision` | Admin | Final approve or reject team formation |

### NOC & Attendance

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/noc` | Admin | Return NOC submission status list |
| `POST` | `/api/noc/upload` | Student | Upload NOC document |
| `GET` | `/api/vibe/attendance` | Admin | Return ViBe attendance records |

---

## Challenges & Known Limitations

### In-Memory Data Store — No Persistence

The backend stores all data in JavaScript arrays in `server/index.js`. Every server restart resets everything to seed values. This is the most critical limitation for production deployment. MongoDB Atlas connection is the first-priority enhancement.

### Client-Side Authentication Only

Auth guards live entirely in the React frontend. Anyone with browser DevTools can modify the `samagama_user` localStorage key to change their role to `admin` and access all routes. Server-side JWT middleware on every protected Express endpoint is required before production.

### Groq API Key in Frontend Bundle

`VITE_GROQ_API_KEY` in the frontend environment is bundled into the client JavaScript by Vite, making it extractable from the browser. The fix: proxy all Yaksha calls through `POST /api/yaksha/chat` on the Express server, where the key stays server-side.

### AdminDashboard Monolith

At ~1,800 lines, `AdminDashboard.jsx` handles too many concerns in one file. It is functional but increasingly hard to maintain, test, or extend. Decomposition into focused sub-components is the highest-priority refactor.

### Static Leaderboard and SP Data

`LeaderboardPage.jsx` and `SpurtiPointsPage.jsx` render hardcoded data. The backend API endpoints for both exist and return real data — they simply were not connected within the project timeline.

### No Loading or Error States

Most `useEffect` data-fetch hooks do not handle loading or error conditions. Failed API calls result in silent empty states rather than user-visible feedback.

### NOC Upload is Not Persisted

The NOC upload UI is fully functional, but the backend endpoint logs the file to the console without storing it. Real storage requires `multer` + AWS S3 or Cloudinary.

---

## Future Enhancements

### High Priority — Production Readiness

- **Connect MongoDB Atlas** — Replace in-memory arrays with persistent collections. Route handlers are already structured for Mongoose model calls.
- **Server-side JWT middleware** — Validate tokens on all protected Express routes.
- **Proxy Yaksha through backend** — Keep Groq API key server-side; frontend never touches it.
- **Real NOC file storage** — `multer` on the server + S3/Cloudinary for persistent, accessible uploads.
- **Connect Leaderboard & SP pages to live API** — Both endpoints exist; it is a `useEffect` + Axios call change.

### Medium Priority — Quality

- **Decompose AdminDashboard** — `StudentTable`, `ModerationQueue`, `ReviewQueue`, `NOCManager`, `TeamManager`, `AnnouncementEditor`, `SPAwardPanel`.
- **Three-state data fetching** — loading spinner → data display → error + retry button across all 12 pages.
- **Form validation** — `zod` or `react-hook-form` on login, doubt submission, review, NOC upload, and announcements.
- **Toast notifications** — Replace `alert()` and silent failures with `react-hot-toast` or `sonner`.
- **Real-time updates** — Socket.io to push live notifications when doubt is approved, announcement posted, or SP awarded.

### Lower Priority — Polish & Accessibility

- **Dark mode** — System-preference-aware CSS custom property swap with manual toggle.
- **ARIA labels** — Every emoji icon needs `aria-label`; all interactive elements need keyboard navigability.
- **Email notifications** — Nodemailer or SendGrid for doubt approval, review feedback, and SP award alerts.
- **Proper 404 page** — Styled not-found page with navigation links instead of silent redirect to home.
- **Unit and integration tests** — Jest + React Testing Library for components; Supertest for Express endpoints; Playwright/Cypress for critical end-to-end flows.
- **ViBe LMS integration** — Real API connection to pull attendance records instead of mock stub data.

---

## Programme Context: The Four-Tier Journey

Samagama is built to serve the Vicharanashala internship's four-tier progression model:

| Tier | Duration | Focus | Key Deliverables |
|------|----------|-------|-----------------|
| 🥉 **Bronze** | Weeks 1–2 | Foundations & Community | Onboarding, weekly reviews, Yaksha exploration, FAQ contribution, first community doubts |
| 🥈 **Silver** | Weeks 3–4 | Applied Learning | Domain-specific project work, team formation, ViBe engagement, peer mentoring |
| 🥇 **Gold** | Weeks 5–6 | Project Delivery | Full project build, code reviews, deployment, documentation, SP milestone |
| 🏆 **Platinum** | Weeks 7–8 | Innovation & Leadership | Advanced features, open-source contributions, mentoring juniors, final presentation |

Students move through these tiers by accumulating Spurti Points, completing phase tasks, submitting weekly reviews, and demonstrating community engagement — all of which Samagama tracks in one place.

---

<p align="center">
  Built with dedication by <strong>Team CS13</strong><br/>
  Vicharanashala · IIT Ropar · 2026<br/><br/>
  <strong>Team Lead:</strong> Arushi Singh<br/>
  Kirti Solanki · Maragoni Harini · Rayaparthy Drakshayani · Raksha S<br/>
  Chandana Jagadish · Anjali Bingi · Tushit Tiwari · Harshita Balchandani · Nandeeshwari Vadde · Aryan Sinha
</p>

<p align="center">
  <a href="https://github.com/vicharanashala/cs13">github.com/vicharanashala/cs13</a>
</p>
