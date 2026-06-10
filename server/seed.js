/**
 * Seed script — populates MongoDB with initial data for Samagama.
 * Run with: node seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Faq = require('./models/Faq');
const { Task } = require('./models/Task');
const User = require('./models/User');
const Announcement = require('./models/Announcement');
const KnowledgeBase = require('./models/KnowledgeBase');

// ── 127 FAQs (from the original data.js) ────────────────────────
const faqData = [
  { q: 'What is the Vicharanashala internship?', a: 'A two-month internship run by Vicharanashala, a research lab at IIT Ropar. Interns work on real open-source projects under mentors after a training phase. The internship is free and project-based.', cat: 'about' },
  { q: 'What is VINS?', a: 'VINS is the online version of the Vicharanashala Internship. Selected students contribute to open-source projects under mentors. The certificate is issued by the Vicharanashala Lab for Education Design at IIT Ropar. There is no stipend.', cat: 'about' },
  { q: 'What are the phases of VINS?', a: 'Bronze is the training phase, Silver is the main project contribution phase, Gold is recognition for meaningful contributions, and Platinum is an invitation to revisit the lab with travel support.', cat: 'about' },
  { q: 'Who is eligible?', a: 'Currently enrolled UG, PG, and PhD students are eligible. Graduated candidates without active enrollment are not eligible.', cat: 'eligibility' },
  { q: 'Is this IIT Ropar\'s official Summer Internship?', a: 'No. It is a VLED Lab initiative, separate from IIT Ropar\'s central internship programme.', cat: 'about' },
  { q: 'Can I take leave for classes or exams?', a: 'No. Leave is not permitted during the internship.', cat: 'timing' },
  { q: 'When can I start?', a: 'You may start anytime in 2026, but the internship must finish on or before 31 December 2026. Starting early is strongly recommended.', cat: 'timing' },
  { q: 'How long does the internship last?', a: 'The internship lasts two months from your chosen start date with an optional one-month grace period.', cat: 'timing' },
  { q: 'Can I start later because of exams?', a: 'Yes, if your exams genuinely prevent participation.', cat: 'timing' },
  { q: 'Can I pause during exams?', a: 'No. The internship expects full attention.', cat: 'timing' },
  { q: 'Can I get exemption during exams?', a: 'No exemptions are granted.', cat: 'timing' },
  { q: 'Are orientation recordings shared?', a: 'Sometimes abridged versions may be shared, but this is not guaranteed.', cat: 'timing' },
  { q: 'What dates should be on the NOC?', a: 'Use the start date, start plus two months, and the optional grace period. The end date must remain before 31 December 2026.', cat: 'noc' },
  { q: 'Who can sign the NOC?', a: 'Authorized college officials such as the HOD, Dean, Principal, Director, or T&P Officer can sign the NOC.', cat: 'noc' },
  { q: 'When should the NOC be submitted?', a: 'Before the internship formally begins.', cat: 'noc' },
  { q: 'Is a format provided?', a: 'Yes. It is downloadable from the samagama.in dashboard.', cat: 'noc' },
  { q: 'Can my college use its own format?', a: 'Yes, if it includes the signature, official details, dates, and student signature.', cat: 'noc' },
  { q: 'Are handwritten signatures required?', a: 'Yes.', cat: 'noc' },
  { q: 'Can HOD email the NOC?', a: 'Yes, through the official institutional email.', cat: 'noc' },
  { q: 'How do I upload the NOC?', a: 'Upload it through the dashboard.', cat: 'noc' },
  { q: 'What if verification is delayed?', a: 'A provisional offer may still be issued.', cat: 'noc' },
  { q: 'What if online course platforms refuse NOC?', a: 'Only students enrolled in recognized full-time programmes are eligible.', cat: 'noc' },
  { q: 'My HOD wants written confirmation.', a: 'Use the provisional offer letter.', cat: 'noc' },
  { q: 'Can IIT Ropar faculty sign my NOC?', a: 'No. Only your institution\'s authorized signatory may sign.', cat: 'noc' },
  { q: 'Is NOC mandatory for internship participation?', a: 'Yes. A signed NOC is required before the internship formally begins.', cat: 'noc' },
  { q: 'How much stipend is offered?', a: 'There is no guaranteed stipend.', cat: 'stipend' },
  { q: 'Are final year students eligible?', a: 'Currently enrolled UG, PG, and PhD students are eligible. Final-year students may apply if they are still actively enrolled.', cat: 'eligibility' },
  { q: 'Is remote internship available?', a: 'Yes, most roles are available remotely.', cat: 'mode' },
  { q: 'Which documents are required?', a: 'A signed NOC and any onboarding documents requested on the dashboard.', cat: 'documents' },
  { q: 'How do I know if I am selected?', a: 'Check the yellow VINS or green VISE panel on the dashboard.', cat: 'selection' },
  { q: 'How do I opt into VINS?', a: 'Use Yaksha chat on samagama.in.', cat: 'selection' },
  { q: 'When do I get the offer letter?', a: 'Automatically after onboarding requirements are completed.', cat: 'selection' },
  { q: 'Will I get a certificate?', a: 'Yes, after successful completion.', cat: 'certificate' },
  { q: 'How can I confirm internship dates?', a: 'Use the Confirm Internship Dates section on the dashboard.', cat: 'selection' },
  { q: 'AI Minor or Major students?', a: 'A separate process may apply.', cat: 'selection' },
  { q: 'How do I accept the offer letter?', a: 'Reply using the exact acceptance statement.', cat: 'selection' },
  { q: 'What if I change the acceptance wording?', a: 'The offer may be withdrawn.', cat: 'selection' },
  { q: 'Can withdrawn offers be appealed?', a: 'Yes, via a formal appeal process.', cat: 'selection' },
  { q: 'Dashboard not updating after acceptance?', a: 'The dashboard does not track acceptance status.', cat: 'selection' },
  { q: 'Can dates be changed?', a: 'Only before offer letter issuance.', cat: 'selection' },
  { q: 'How do I get Zoom kickoff links?', a: 'Through dashboard announcements and email.', cat: 'selection' },
  { q: 'NOC not ready but start date approaching?', a: 'Use self-declaration temporarily.', cat: 'selection' },
  { q: 'When does the internship officially begin?', a: 'On the confirmed start date after the NOC is validated.', cat: 'selection' },
  { q: 'Can I switch from VINS to VISE?', a: 'No.', cat: 'selection' },
  { q: 'Can dates change after the offer letter?', a: 'No.', cat: 'selection' },
  { q: 'Are daily standups mandatory?', a: 'Yes.', cat: 'selection' },
  { q: 'Why does Zoom ID matter?', a: 'Attendance tracking depends on it.', cat: 'selection' },
  { q: 'Can Zoom ID be changed?', a: 'Only through escalation support.', cat: 'selection' },
  { q: 'How do I write an SOP?', a: 'Highlight your projects, why the internship matters to you, and keep it concise and authentic.', cat: 'selection' },
  { q: 'What work will I do?', a: 'Open-source projects across AI/ML, NLP, Web Development, Computer Vision, EdTech, and Agriculture Tech.', cat: 'work' },
  { q: 'How many hours will I work?', a: 'Usually 6 to 10 hours daily.', cat: 'work' },
  { q: 'Who will mentor me?', a: 'Research and engineering teams.', cat: 'work' },
  { q: 'Is there a stipend?', a: 'No guaranteed stipend.', cat: 'work' },
  { q: 'What laptop do I need?', a: 'A personal laptop is required. Linux or macOS is preferred. Windows users should install WSL or terminal tools.', cat: 'work' },
  { q: 'Can I use different emails on platforms?', a: 'No, it is not recommended.', cat: 'work' },
  { q: 'What if my mentor is not assigned yet?', a: 'Mentors are assigned later during the project phase.', cat: 'work' },
  { q: 'What are the best DSA resources?', a: 'Focus on arrays, linked lists, trees, graphs, and pattern-based practice before the interview.', cat: 'work' },
  { q: 'What are the official communication channels?', a: 'Priority order is announcements on samagama.in, Yaksha chat, discussion forum, and email support.', cat: 'conduct' },
  { q: 'Can I use unofficial WhatsApp, Telegram, or Discord groups?', a: 'No. Violations may terminate the internship.', cat: 'conduct' },
  { q: 'Interview not marked complete?', a: 'Use Yaksha or escalate through email.', cat: 'interview' },
  { q: 'Does the grade report or evaluation depend on requirements?', a: 'Yes, it depends on internship requirements.', cat: 'certificate' },
  { q: 'Does the certificate mention online or offline?', a: 'Yes.', cat: 'certificate' },
  { q: 'Will I get a physical certificate or e-certificate?', a: 'Usually an e-certificate.', cat: 'certificate' },
  { q: 'Is there a WhatsApp group?', a: 'No official WhatsApp group exists.', cat: 'certificate' },
  { q: 'What is Rosetta?', a: 'A reflective internship journal.', cat: 'rosetta' },
  { q: 'Why does it exist?', a: 'To encourage thinking and reflection.', cat: 'rosetta' },
  { q: 'What is a thinking routine?', a: 'Structured reflection prompts.', cat: 'rosetta' },
  { q: 'How do I get Rosetta?', a: 'It is provided during the internship.', cat: 'rosetta' },
  { q: 'How should I use Rosetta?', a: 'Maintain regular entries.', cat: 'rosetta' },
  { q: 'How long should each entry be?', a: 'Flexible but meaningful.', cat: 'rosetta' },
  { q: 'What is the main rule?', a: 'Write honestly.', cat: 'rosetta' },
  { q: 'Can AI tools write my entries?', a: 'No.', cat: 'rosetta' },
  { q: 'What if I miss a day?', a: 'Continue honestly and consistently.', cat: 'rosetta' },
  { q: 'Will mentors read it?', a: 'Possibly during evaluation.', cat: 'rosetta' },
  { q: 'Can prompts change?', a: 'Yes.', cat: 'rosetta' },
  { q: 'How do I submit it?', a: 'Instructions are shared later.', cat: 'rosetta' },
  { q: 'Where can I ask more Rosetta questions?', a: 'Use Yaksha support.', cat: 'rosetta' },
  { q: 'Need self-paced proof for college?', a: 'Share the official documents provided.', cat: 'rosetta' },
  { q: 'Are previous interns exempt?', a: 'It depends on the mentor or team decision.', cat: 'phase1' },
  { q: 'How do I register on ViBe?', a: 'Through the invitation flow.', cat: 'phase1' },
  { q: 'Can I use a different email on ViBe?', a: 'Avoid mismatches.', cat: 'phase1' },
  { q: 'Are live sessions mandatory?', a: 'It depends on your route.', cat: 'phase1' },
  { q: 'Where is the session schedule?', a: 'Check dashboard announcements.', cat: 'phase1' },
  { q: 'Can ViBe start early?', a: 'Sometimes yes.', cat: 'phase1' },
  { q: 'What about attendance rules?', a: 'Attendance is strictly monitored.', cat: 'phase1' },
  { q: 'Unable to type in Yaksha?', a: 'Refresh the page, relogin, or escalate.', cat: 'yaksha' },
  { q: 'How do I log in to ViBe?', a: 'Use the invite link.', cat: 'vibe' },
  { q: 'What does "No course enrolled" mean?', a: 'It is usually an onboarding sync issue.', cat: 'vibe' },
  { q: 'Videos are stuck or repeating.', a: 'This is often a browser or network issue.', cat: 'vibe' },
  { q: 'Can I use a mobile or tablet?', a: 'A laptop is preferred.', cat: 'vibe' },
  { q: 'How do I troubleshoot video issues?', a: 'Refresh the browser and ensure stable internet.', cat: 'vibe' },
  { q: 'Why is progress below 100%?', a: 'Sometimes sync delays occur.', cat: 'vibe' },
  { q: 'What if I am dissatisfied with ViBe?', a: 'Exceptions are generally not granted.', cat: 'vibe' },
  { q: 'Is the consent form compulsory?', a: 'Yes.', cat: 'vibe' },
  { q: 'What are penalty scores?', a: 'They are internal learning-compliance metrics.', cat: 'vibe' },
  { q: 'When should I use the Flag option?', a: 'Use it for content or platform issues.', cat: 'vibe' },
  { q: 'What is Linear Progression?', a: 'It is a sequential learning progression system.', cat: 'vibe' },
  { q: 'Can I skip ahead?', a: 'Generally no.', cat: 'vibe' },
  { q: 'What does the Access Restricted banner mean?', a: 'It is not necessarily a bug.', cat: 'vibe' },
  { q: 'How do I resolve Access Restricted?', a: 'Follow the platform instructions.', cat: 'vibe' },
  { q: 'Why do lessons restart?', a: 'It may be triggered by attention or proctoring checks.', cat: 'vibe' },
  { q: 'Can I read aloud while studying?', a: 'Avoid excessive speaking.', cat: 'vibe' },
  { q: 'Can I study with a friend on camera?', a: 'It is not recommended.', cat: 'vibe' },
  { q: 'Will clearing the browser erase progress?', a: 'Usually not if everything is synced properly.', cat: 'vibe' },
  { q: 'What is the recommended study rhythm?', a: 'Keep a consistent daily routine.', cat: 'vibe' },
  { q: 'What is the ideal study corner?', a: 'A quiet and distraction-free space.', cat: 'vibe' },
  { q: 'Is team formation compulsory?', a: 'Yes.', cat: 'team' },
  { q: 'What is the team size?', a: 'Usually 2 to 4 members.', cat: 'team' },
  { q: 'How are teams formed?', a: 'Through an assigned activity or selection process.', cat: 'team' },
  { q: 'What if I missed the formation activity?', a: 'Support will guide the next steps.', cat: 'team' },
  { q: 'What if my email has a typo?', a: 'It can be corrected through support.', cat: 'team' },
  { q: 'Is a team of two acceptable?', a: 'Usually yes.', cat: 'team' },
  { q: 'What if a member leaves?', a: 'Team adjustments may happen.', cat: 'team' },
  { q: 'Are same-college teammates allowed?', a: 'Yes.', cat: 'team' },
  { q: 'Are same IITM BS cohort teammates allowed?', a: 'Generally allowed.', cat: 'team' },
  { q: 'Can the team name change?', a: 'Usually discouraged.', cat: 'team' },
  { q: 'What if duplicate team names exist?', a: 'Support resolves conflicts.', cat: 'team' },
  { q: 'What if there is a team conflict?', a: 'Escalate officially.', cat: 'team' },
  { q: 'How will the mentor be assigned?', a: 'Later during the project phase.', cat: 'team' },
  { q: 'When are team details shared?', a: 'After allocation.', cat: 'team' },
  { q: 'What if I am missing from the team email?', a: 'Escalate support.', cat: 'team' },
  { q: 'What if I was assigned a different project?', a: 'Assignments are final.', cat: 'team' },
  { q: 'Can I form my own team later?', a: 'It depends on the stage.', cat: 'team' },
  { q: 'When do team activities begin?', a: 'After onboarding and training.', cat: 'team' },
  { q: 'Can I request teammates later?', a: 'Usually no.', cat: 'team' },
  { q: 'What if a team member is inactive?', a: 'Report it officially.', cat: 'team' },
  { q: 'Can teams switch?', a: 'Rarely.', cat: 'team' },
  { q: 'Does team performance affect evaluation?', a: 'Yes.', cat: 'team' },
  { q: 'How should teams communicate?', a: 'Use official channels only.', cat: 'team' },
  { q: 'What if I missed a team announcement?', a: 'Check announcements and escalate if needed.', cat: 'team' },
  { q: 'Can a team be dissolved?', a: 'Only under special conditions.', cat: 'team' },
  { q: 'What if I drop out?', a: 'Team restructuring may occur.', cat: 'team' },
  { q: 'Is there time before Phase 2?', a: 'Yes, usually some coordination period exists.', cat: 'team' },
];

// ── Task definitions (from internshipTasks.js) ───────────────────
const taskData = [
  // Phase 0 — Onboarding
  { taskId: 'P0-1', title: 'Complete Profile & Submit NOC', description: 'Fill in your profile details and upload the signed NOC letter.', phase: 'bronze', spReward: 20, deadline: 'Week 1 - Day 3', isOptional: false, order: 1 },
  { taskId: 'P0-2', title: 'Join Orientation Session', description: 'Attend the orientation Zoom call and introduce yourself.', phase: 'bronze', spReward: 15, deadline: 'Week 1 - Day 5', isOptional: false, order: 2 },
  // Phase 1 — Bronze Training
  { taskId: 'B1', title: 'Complete ViBe Onboarding', description: 'Finish all onboarding modules in the ViBe LMS.', phase: 'bronze', spReward: 30, deadline: 'Week 2', isOptional: false, order: 3 },
  { taskId: 'B2', title: 'Complete DSA Phase 1 Tasks', description: 'Solve all assigned DSA problems for Phase 1.', phase: 'bronze', spReward: 50, deadline: 'Week 3', isOptional: false, order: 4 },
  { taskId: 'B3', title: 'Write Rosetta Entry #1', description: 'Complete your first reflective journal entry on Rosetta.', phase: 'bronze', spReward: 10, deadline: 'Week 3', isOptional: false, order: 5 },
  { taskId: 'B4', title: 'Phase 1 Assessment', description: 'Pass the Phase 1 assessment with a score of 70% or above.', phase: 'bronze', spReward: 40, deadline: 'Week 4', isOptional: false, order: 6 },
  // Phase 2 — Silver Project
  { taskId: 'S1', title: 'Team Formation', description: 'Form or join a project team through the team formation workflow.', phase: 'silver', spReward: 25, deadline: 'Week 5', isOptional: false, order: 7 },
  { taskId: 'S2', title: 'Submit Project Proposal', description: 'Submit a project proposal with title, abstract, and tech stack.', phase: 'silver', spReward: 35, deadline: 'Week 6', isOptional: false, order: 8 },
  { taskId: 'S3', title: 'Complete Weekly Reviews × 4', description: 'Submit weekly progress reviews for 4 consecutive weeks.', phase: 'silver', spReward: 60, deadline: 'Week 10', isOptional: false, order: 9 },
  { taskId: 'S4', title: 'Milestone 1 — MVP Demo', description: 'Demonstrate a working minimum viable product.', phase: 'silver', spReward: 50, deadline: 'Week 8', isOptional: false, order: 10 },
  // Phase 3 — Gold
  { taskId: 'G1', title: 'Final Project Submission', description: 'Submit the complete project with documentation.', phase: 'gold', spReward: 75, deadline: 'Week 11', isOptional: false, order: 11 },
  { taskId: 'G2', title: 'Peer Code Review', description: 'Conduct and document code reviews for 2 peer projects.', phase: 'gold', spReward: 30, deadline: 'Week 11', isOptional: false, order: 12 },
  // Phase 4 — Platinum
  { taskId: 'Pt1', title: 'Contribution Summary Report', description: 'Submit a detailed report of your contributions to open-source.', phase: 'platinum', spReward: 40, deadline: 'Week 12', isOptional: true, order: 13 },
];

// ── Seed function ─────────────────────────────────────────────────
async function seed() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/samagama';

  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }

  console.log('\n🌱 Seeding database...\n');

  // Admin user
  const admin = await User.findOneAndUpdate(
    { email: 'admin@demo' },
    {
      name: 'Samagama Admin',
      email: 'admin@demo',
      password: await bcrypt.hash('demo123', 10),
      role: 'admin',
    },
    { upsert: true, new: true }
  );
  console.log('✅ Admin:', admin.email);

  // Demo student
  const student = await User.findOneAndUpdate(
    { email: 'student@demo' },
    {
      name: 'Arushi Singh',
      email: 'student@demo',
      password: await bcrypt.hash('demo123', 10),
      role: 'student',
      college: 'IIT Ropar',
      department: 'Computer Science',
      currentPhase: 'bronze',
      spurtiPoints: 120,
      streak: 5,
      onboardingComplete: true,
    },
    { upsert: true, new: true }
  );
  console.log('✅ Student:', student.email);

  // FAQs
  await Faq.deleteMany({});
  const categoryOrder = { about: 1, timing: 2, eligibility: 3, noc: 4, stipend: 5, mode: 6, documents: 7, selection: 8, work: 9, conduct: 10, interview: 11, certificate: 12, rosetta: 13, phase1: 14, yaksha: 15, vibe: 16, team: 17 };
  await Faq.insertMany(faqData.map(f => ({
    question: f.q, answer: f.a, category: f.cat, order: categoryOrder[f.cat] || 99,
  })));
  console.log(`✅ ${faqData.length} FAQs inserted`);

  // Tasks
  await Task.deleteMany({});
  await Task.insertMany(taskData.map(t => ({ ...t })));
  console.log(`✅ ${taskData.length} tasks inserted`);

  // Sample announcement
  await Announcement.findOneAndUpdate(
    { title: 'Welcome to Samagama 2026!' },
    {
      title: 'Welcome to Samagama 2026!',
      content: 'We are thrilled to have you here. This internship is your opportunity to work on real open-source projects under IIT Ropar mentorship. Complete your onboarding tasks, submit your NOC, and get ready for an incredible journey.',
      preview: 'We are thrilled to have you here. This internship is your opportunity...',
      category: 'Announcement',
      urgencyLevel: 'High',
      priority: 'High',
      pinned: true,
      status: 'published',
      publishedAt: new Date(),
      createdBy: admin._id,
    },
    { upsert: true, runValidators: true }
  );
  console.log('✅ Announcements seeded');

  // Knowledge Base
  const kbData = [
    { question: 'How do I submit my NOC?', answer: 'Go to your Internship Tasks page, find the NOC upload task, and attach your signed NOC PDF. Make sure it has your mentor\'s signature and the institute seal.', category: 'Onboarding', tags: ['noc', 'onboarding', 'task'], priority: 'high', source: 'manual' },
    { question: 'How are Spurti points awarded?', answer: 'Spurti points (SP) are awarded by mentors for completing tasks, helping peers, and active participation. You can earn bonus SP by resolving doubts in the Community Hub.', category: 'Grading', tags: ['spurti', 'points', 'grading'], priority: 'high', source: 'manual' },
    { question: 'How do I form or join a team?', answer: 'Visit the Teams section in your dashboard. You can create a new team with a project name and invite teammates. Admins will approve team formations and assign mentors.', category: 'Teams', tags: ['teams', 'project', 'formation'], priority: 'high', source: 'manual' },
    { question: 'What happens if I miss a task deadline?', answer: 'Missed tasks are marked as missed after the deadline passes. While this affects your completion rate, you can still submit optional tasks for SP points. Focus on upcoming tasks to stay on track.', category: 'Tasks', tags: ['deadline', 'missed', 'tasks'], priority: 'medium', source: 'manual' },
    { question: 'How does the ZORO AI chat work?', answer: 'ZORO (Your AI mentor) answers questions based on a knowledge base built from FAQ entries, resolved community doubts, and mentor-approved content. It\'s trained on Samagama-specific context.', category: 'ZORO AI', tags: ['zoro', 'ai', 'chat'], priority: 'high', source: 'manual' },
    { question: 'Can I resubmit a rejected task?', answer: 'Yes. If a mentor rejects your task submission, you\'ll receive feedback. Read the comments, make improvements, and resubmit before the next deadline.', category: 'Tasks', tags: ['resubmit', 'rejected', 'task'], priority: 'medium', source: 'manual' },
    { question: 'How do I track my internship progress?', answer: 'Your Student Dashboard shows your phase (Bronze/Silver/Gold/Platinum), SP points, completed tasks, and journey milestones. The overview section gives a complete picture.', category: 'Progress', tags: ['progress', 'phase', 'dashboard'], priority: 'high', source: 'manual' },
    { question: 'What are the different internship phases?', answer: 'Samagama has 4 phases: Bronze (Foundation), Silver (Development), Gold (Project Work), and Platinum (Completion). Each phase has specific tasks and SP thresholds to unlock.', category: 'Internship', tags: ['phase', 'bronze', 'silver', 'gold', 'platinum'], priority: 'medium', source: 'manual' },
    { question: 'How do I use the Community Hub?', answer: 'Post your doubts in the Community Hub with a clear title and description. Other students can answer, and you can mark an answer as helpful. Admins may also escalate or resolve topics.', category: 'Community', tags: ['community', 'hub', 'doubts'], priority: 'medium', source: 'manual' },
    { question: 'How is the leaderboard ranked?', answer: 'The leaderboard ranks students by total SP points. You can filter by week, month, or all-time. Your rank updates whenever you earn or lose SP points.', category: 'Leaderboard', tags: ['leaderboard', 'ranking', 'spurti'], priority: 'medium', source: 'manual' },
    { question: 'What should I include in my weekly review?', answer: 'Your weekly review should include: work summary (what you completed), challenges faced, and next week\'s goals. This helps mentors track your growth and provide guidance.', category: 'Reviews', tags: ['review', 'weekly', 'progress'], priority: 'high', source: 'manual' },
    { question: 'How do I get help during the internship?', answer: 'Start with the FAQ section and ZORO AI chat. If you can\'t find an answer, post in the Community Hub. For urgent issues, use the escalation system to notify admins directly.', category: 'Support', tags: ['help', 'support', 'escalation'], priority: 'medium', source: 'manual' },
    { question: 'Can I switch my team after formation?', answer: 'Team switching requires admin approval. Contact an admin through the escalation system explaining why you need to switch. Teams are meant to be stable, so this is approved only in exceptional cases.', category: 'Teams', tags: ['teams', 'switch', 'admin'], priority: 'low', source: 'manual' },
    { question: 'What open-source tools are used in Samagama?', answer: 'The internship uses standard tools: Git/GitHub for version control, VS Code as the editor, and various language-specific toolchains. Check your task descriptions for specific requirements.', category: 'Tools', tags: ['tools', 'github', 'opensource'], priority: 'medium', source: 'manual' },
    { question: 'How do I check my NOC status?', answer: 'Go to the NOC section in your dashboard. Uploaded NOCs show a pending/approved/rejected status. If rejected, you\'ll see the reason and can re-upload.', category: 'Onboarding', tags: ['noc', 'status', 'onboarding'], priority: 'high', source: 'manual' },
  ];
  await KnowledgeBase.deleteMany({});
  await KnowledgeBase.insertMany(kbData.map(k => ({ ...k, createdBy: admin._id, updatedBy: admin._id })));
  console.log(`✅ ${kbData.length} Knowledge Base entries seeded`);

  console.log('\n🎉 Seed complete! You can now start the server with: npm start\n');

  await mongoose.disconnect();
}

seed();