# Samagama — Internship Management Platform
<!-- Project documentation -->

> **IIT Ropar · Vicharanashala · Full-Stack MERN Web Application**

Samagama is the official internship dashboard for the Vicharanashala open-source internship programme at IIT Ropar. It connects students to a structured two-month journey covering training phases, team projects, community Q&A, AI assistance, and a gamified points system — all in one place.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Key Features](#key-features)
  - [📱 Mobile-Friendly Design](#-mobile-friendly-design)
  - [🤖 Yaksha AI Assistant — Copy-Paste Support](#-yaksha-ai-assistant--copy-paste-support)
  - [🗺️ Journey Page — Click to Explore, No Scrolling Required](#️-journey-page--click-to-explore-no-scrolling-required)
  - [❓ Doubt Forum — Search & Find Others' Doubts](#-doubt-forum--search--find-others-doubts)
  - [🛡️ Admin Controls — SP Points, Approve & Reject](#️-admin-controls--sp-points-approve--reject)
- [Roles & Authentication](#roles--authentication)
- [Backend API Reference](#backend-api-reference)
- [Pages Overview](#pages-overview)
- [Future Improvements](#future-improvements)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite 5 |
| Backend | Express.js (Node.js) |
| Database | MongoDB (in-memory for prototype) |
| Styling | Custom CSS with responsive media queries |
| Fonts | Poppins, Space Grotesk, Playfair Display, JetBrains Mono |
| AI Chat | Yaksha-mini powered by Groq API (`mixtral-8x7b-32768`) |

---

## Project Structure

```
cs13/
├── client/                   # React frontend (Vite)
│   └── src/
│       ├── pages/            # All page components
│       │   ├── HomePage.jsx
│       │   ├── OverviewPage.jsx       # Journey & milestone explorer
│       │   ├── StudentDashboard.jsx
│       │   ├── AdminDashboard.jsx     # Full admin panel (~1800 lines)
│       │   ├── YakshaPage.jsx         # AI chat assistant
│       │   ├── DoubtPage.jsx          # Community Q&A
│       │   ├── FaqPage.jsx
│       │   ├── LeaderboardPage.jsx
│       │   └── SpurtiPointsPage.jsx
│       └── components/       # Shared modals & UI components
├── server/                   # Express backend (port 4000)
│   ├── index.js              # All routes + in-memory data
│   └── data.js               # 127 FAQ entries + seed data
└── README.md
```

---

## Getting Started

1. **Install dependencies** from the workspace root:

   ```bash
   npm install
   npm run dev
   ```

2. Open the Vite dev server at `http://localhost:5173`

3. The Express backend runs at `http://localhost:4000`

**Demo credentials:**

| Role | Email | Password |
|---|---|---|
| Student | `student@demo` | `demo123` |
| Admin | `admin@demo` | `demo123` |

---

## Key Features

---

### 📱 Mobile-Friendly Design

Samagama is built to work seamlessly on phones and tablets, not just desktops. The entire interface adapts through a set of carefully crafted responsive breakpoints:

- **≤ 1100px** — Navigation and grid layouts reflow for tablet screens
- **≤ 768px** — Chat panels, sidebars, and quick-prompt grids switch to single-column. The Yaksha chat composer stacks vertically so the send button is always full-width and easy to tap
- **≤ 480px** — Hero text and card layouts resize for small phones, with tighter padding and larger tap targets

Every major page — Yaksha, the FAQ, the Leaderboard, the Overview, and the Student Dashboard — has dedicated mobile styles. The goal is that a student with only a phone can participate fully in the programme without needing a laptop.

---

### 🤖 Yaksha AI Assistant — Copy-Paste Support

**Yaksha** (also called Zoro) is the programme's built-in AI mentor, powered by Groq's `mixtral-8x7b-32768` model.

Key capabilities:

- **Full chat interface** with persistent message history stored in the browser
- **6 quick-prompt buttons** for common tasks — Resume Review, Interview Preparation, Internship Eligibility, NOC Questions, Stipend Queries, Certificate Support — so students can start a conversation with a single tap
- **Copy-paste friendly** — Every AI response is rendered as plain, selectable text in the chat window, with no special formatting blocks that would prevent copying. Students can freely copy any Yaksha response and paste it directly into a document, email, or another chat window
- **Auto-scroll** — The chat window automatically scrolls to the latest message as the conversation grows
- **Recent conversations sidebar** — Previously started threads are listed so students can pick up where they left off
- **Suggested topics panel** — Surface common questions like career roadmaps and mock interview practice to help students who aren't sure where to start

The AI is aware of the Vicharanashala programme context and answers questions about the internship structure, timelines, NOC procedures, and career guidance.

---

### 🗺️ Journey Page — Click to Explore, No Scrolling Required

The **Overview / Journey Page** replaces the traditional long-scroll page with an interactive, click-driven experience. Students never have to hunt for information by scrolling endlessly — everything is one click away.

Here's how it works:

- **Milestone cards** representing the four programme tiers — Bronze, Silver, Gold, and Platinum — are displayed in a horizontal roadmap grid. Each card shows the tier name, title, and a glowing accent colour.
- **One click on any milestone card** instantly reveals that tier's details — description, requirements, and perks — in a dedicated panel right on the page. No page navigation, no new tab, no scrolling down to find the section.
- **Life Steps section** works the same way: clicking a step label previews the next milestone inline.
- **Process steps** are tab-style selectors — click a number and the content panel swaps immediately.
- **FAQ accordion** is embedded on the same page — click a question to expand the answer in place.

The design philosophy is that a student should be able to understand the entire programme arc — from Bronze to Platinum — without pressing the scroll key once. Every section is reachable by a single, clearly visible click.

---

### ❓ Doubt Forum — Search & Find Others' Doubts

The **Doubt Forum** is a community-driven Q&A board where students can post questions and benefit from the collective knowledge of the cohort.

Features:

- **Search before you post** — Students can search the existing doubts by keyword or filter by tag (DSA, Web Dev, AI/ML, Resume, Internship, Other) to check if their question has already been answered. If someone else had the same doubt, students can read the accepted answer immediately, saving time for everyone.
- **See the same doubts** — Each doubt card shows vote counts, answers count, status badges (open / solved), and the tag category, so students can spot questions that mirror their own.
- **Post a new doubt** — If no existing thread matches, students fill in a title, description body, and select a tag. Submitted doubts go into a pending queue for admin review before appearing publicly.
- **Mark as solved** — Once a satisfactory answer is posted, the doubt can be marked solved so others immediately know a verified answer exists.
- **Answer threads** — Students can reply directly on a doubt thread, building a structured discussion around each question.
- **SP rewards for helpful answers** — Admins can award Spurti Points to answers they accept, motivating students to help each other with quality responses.

---

### 🛡️ Admin Controls — SP Points, Approve & Reject

The **Admin Dashboard** gives programme coordinators full control over student activity, community moderation, and the Spurti Points reward economy.

#### Spurti Points (SP) Management

Admins can:

- **Award SP to any student** for a helpful community answer, with a custom SP value and reason note
- **Accept an answer with SP** — one click accepts the reply and awards the configured SP amount to the student
- **Accept without SP** — approve an answer as correct without adding any points (for borderline cases)
- **View full SP reward history** — a paginated log showing date, student name, question, points awarded, and the admin who approved it
- Track **SP Awarded Today** as a live stat on the admin dashboard

#### Doubt & Community Moderation

Admins can:

- **Approve doubts** — move a pending doubt into the public forum
- **Reject doubts** — remove a doubt with a rejection reason so the student can revise and resubmit
- View all pending doubts in a dedicated moderation queue with student name, SP balance, submission timestamp, and the doubt body

#### Other Admin Capabilities

- **Student management** — search, filter, sort, and paginate the full student list; view individual profiles
- **Weekly review approval** — approve or reject submitted weekly reviews
- **NOC submission tracking** — see which students have uploaded their NOC documents
- **Announcement system** — post rich-text announcements that appear on every student's dashboard
- **Team management** — assign and manage student project teams
- **Stats overview** — live counters for total students, active students, pending reviews, pending doubts, and NOC uploads

---

## Roles & Authentication

| Role | Access |
|---|---|
| Public | Home, Overview, Leaderboard |
| Student | Dashboard, Tasks, FAQ, Community, Doubts, Yaksha, Spurti Points |
| Admin | Everything above + full Admin Dashboard |

Authentication is managed via React Context (`AuthContext`) and stored in `localStorage`. Route guards in `App.jsx` redirect unauthenticated users to `/login` and non-admins away from `/admin`.

---

## Backend API Reference

All endpoints are served from `http://localhost:4000/api`.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/faq` | Returns 127 FAQ items across 18 categories |
| `GET` | `/api/doubts` | Returns all community doubts with answers |
| `POST` | `/api/doubts` | Submit a new doubt (pending admin review) |
| `PATCH` | `/api/doubts/:id/approve` | Admin: approve a doubt |
| `PATCH` | `/api/doubts/:id/reject` | Admin: reject a doubt |
| `PATCH` | `/api/doubts/:id/solved` | Toggle solved status |
| `POST` | `/api/doubts/:id/answers` | Post an answer to a doubt |
| `GET` | `/api/announcements` | Fetch announcements |
| `POST` | `/api/announcements` | Admin: post a new announcement |
| `GET` | `/api/students` | List all students |
| `GET` | `/api/students/:id` | Single student detail |
| `GET` | `/api/reviews` | List weekly review submissions |
| `POST` | `/api/reviews` | Submit a weekly review |
| `PATCH` | `/api/reviews/:id/status` | Admin: approve/reject a review |
| `GET` | `/api/leaderboard` | Combined leaderboard data |
| `GET` | `/api/spurti/:studentId/transactions` | SP transaction history for a student |

---

## Pages Overview

| Route | Page | Who Can Access |
|---|---|---|
| `/` | Home | Public |
| `/login` | Login | Public |
| `/overview` | Journey & Overview | Public |
| `/dashboard` | Student Dashboard | Students |
| `/admin` | Admin Dashboard | Admins only |
| `/tasks` | Internship Tasks | Students |
| `/faq` | FAQ (127 entries) | Students |
| `/community` | Community Hub | Students |
| `/doubts` | Doubt Forum | Students |
| `/yaksha` | Yaksha AI Chat | Students |
| `/leaderboard` | Leaderboard | Public |
| `/spurti` | Spurti Points & Achievements | Students |

---

## Future Improvements

- **Connect MongoDB** — Replace in-memory arrays so data persists across server restarts
- **Move Groq API key to backend** — Proxy Yaksha requests through `/api/yaksha/chat` to keep the key off the client
- **Add JWT authentication middleware** — Protect API routes server-side, not just on the client
- **Real file uploads** — Use `multer` + cloud storage (S3/Cloudinary) for NOC documents
- **Break up AdminDashboard** — Extract into sub-components (`StudentTable`, `AnnouncementForm`, `ReviewQueue`, etc.)
- **Add loading and error states** — Every data-fetching `useEffect` should handle pending and failure cases
- **Form validation** — Add validation on doubt submission, review forms, and NOC upload using `zod` or similar
- **Toast notifications** — Give users feedback after actions (submitted, approved, rejected)
- **Dark mode** — System-preference-aware colour scheme toggle
- **Accessible icon labels** — Add ARIA labels to emoji icons for screen reader support

---

> Built by **CS13** for the Vicharanashala internship programme at IIT Ropar.  
> Stack: React · Vite · Express · MongoDB · Groq AI

<!-- End of documentation -->
