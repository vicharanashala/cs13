const faqData = [
  // About the Internship
  { id: 1, q: 'What is the Vicharanashala internship?', a: 'A two-month internship run by Vicharanashala, a research lab at IIT Ropar. Interns work on real open-source projects under mentors after a training phase. The internship is free and project-based.', cat: 'about' },
  { id: 2, q: 'What is VINS?', a: 'VINS is the online version of the Vicharanashala Internship. Selected students contribute to open-source projects under mentors. The certificate is issued by the Vicharanashala Lab for Education Design at IIT Ropar. There is no stipend.', cat: 'about' },
  { id: 3, q: 'What are the phases of VINS?', a: 'Bronze is the training phase, Silver is the main project contribution phase, Gold is recognition for meaningful contributions, and Platinum is an invitation to revisit the lab with travel support.', cat: 'about' },
  { id: 4, q: 'Who is eligible?', a: 'Currently enrolled UG, PG, and PhD students are eligible. Graduated candidates without active enrollment are not eligible.', cat: 'about' },
  { id: 5, q: 'Is this IIT Ropar’s official Summer Internship?', a: 'No. It is a VLED Lab initiative, separate from IIT Ropar’s central internship programme.', cat: 'about' },
  { id: 6, q: 'Can I take leave for classes or exams?', a: 'No. Leave is not permitted during the internship.', cat: 'about' },

  // Timing and Dates
  { id: 7, q: 'When can I start?', a: 'You may start anytime in 2026, but the internship must finish on or before 31 December 2026. Starting early is strongly recommended for better cohort interaction, TA support, and training experience.', cat: 'timing' },
  { id: 8, q: 'How long does the internship last?', a: 'The internship lasts two months from your chosen start date with an optional one-month grace period.', cat: 'timing' },
  { id: 9, q: 'Can I start later because of exams?', a: 'Yes, if your exams genuinely prevent participation.', cat: 'timing' },
  { id: 10, q: 'Can I pause during exams?', a: 'No. The internship expects full attention.', cat: 'timing' },
  { id: 11, q: 'Can I get exemption during exams?', a: 'No exemptions are granted.', cat: 'timing' },
  { id: 12, q: 'Are orientation recordings shared?', a: 'Sometimes abridged versions may be shared, but this is not guaranteed.', cat: 'timing' },

  // NOC
  { id: 13, q: 'What dates should be on the NOC?', a: 'Use the start date, start plus two months, and the optional grace period. The end date must remain before 31 December 2026.', cat: 'noc' },
  { id: 14, q: 'Who can sign the NOC?', a: 'Authorized college officials such as the HOD, Dean, Principal, Director, or T&P Officer can sign the NOC.', cat: 'noc' },
  { id: 15, q: 'When should the NOC be submitted?', a: 'Before the internship formally begins.', cat: 'noc' },
  { id: 16, q: 'Is a format provided?', a: 'Yes. It is downloadable from the samagama.in dashboard.', cat: 'noc' },
  { id: 17, q: 'Can my college use its own format?', a: 'Yes, if it includes the signature, official details, dates, and student signature.', cat: 'noc' },
  { id: 18, q: 'Are handwritten signatures required?', a: 'Yes.', cat: 'noc' },
  { id: 19, q: 'Can HOD email the NOC?', a: 'Yes, through the official institutional email.', cat: 'noc' },
  { id: 20, q: 'How do I upload the NOC?', a: 'Upload it through the dashboard.', cat: 'noc' },
  { id: 21, q: 'What if verification is delayed?', a: 'A provisional offer may still be issued.', cat: 'noc' },
  { id: 22, q: 'What if online course platforms refuse NOC?', a: 'Only students enrolled in recognized full-time programmes are eligible.', cat: 'noc' },
  { id: 23, q: 'My HOD wants written confirmation.', a: 'Use the provisional offer letter.', cat: 'noc' },
  { id: 24, q: 'Can IIT Ropar faculty sign my NOC?', a: 'No. Only your institution’s authorized signatory may sign.', cat: 'noc' },
  { id: 127, q: 'Is NOC mandatory for internship participation?', a: 'Yes. A signed NOC is required before the internship formally begins.', cat: 'noc' },

  // Stipend
  { id: 128, q: 'How much stipend is offered?', a: 'There is no guaranteed stipend.', cat: 'stipend' },

  // Eligibility
  { id: 129, q: 'Are final year students eligible?', a: 'Currently enrolled UG, PG, and PhD students are eligible. Final-year students may apply if they are still actively enrolled.', cat: 'eligibility' },

  // Internship mode
  { id: 130, q: 'Is remote internship available?', a: 'Yes, most roles are available remotely.', cat: 'mode' },

  // Documents
  { id: 131, q: 'Which documents are required?', a: 'A signed NOC and any onboarding documents requested on the dashboard.', cat: 'documents' },

  // Selection, Offer Letter, and Certificate
  { id: 25, q: 'How do I know if I am selected?', a: 'Check the yellow VINS or green VISE panel on the dashboard.', cat: 'selection' },
  { id: 26, q: 'How do I opt into VINS?', a: 'Use Yaksha chat on samagama.in.', cat: 'selection' },
  { id: 27, q: 'When do I get the offer letter?', a: 'Automatically after onboarding requirements are completed.', cat: 'selection' },
  { id: 28, q: 'Will I get a certificate?', a: 'Yes, after successful completion.', cat: 'selection' },
  { id: 29, q: 'How can I confirm internship dates?', a: 'Use the Confirm Internship Dates section on the dashboard.', cat: 'selection' },
  { id: 30, q: 'AI Minor or Major students?', a: 'A separate process may apply.', cat: 'selection' },
  { id: 31, q: 'How do I accept the offer letter?', a: 'Reply using the exact acceptance statement.', cat: 'selection' },
  { id: 32, q: 'What if I change the acceptance wording?', a: 'The offer may be withdrawn.', cat: 'selection' },
  { id: 33, q: 'Can withdrawn offers be appealed?', a: 'Yes, via a formal appeal process.', cat: 'selection' },
  { id: 34, q: 'Dashboard not updating after acceptance?', a: 'The dashboard does not track acceptance status.', cat: 'selection' },
  { id: 35, q: 'Can dates be changed?', a: 'Only before offer letter issuance.', cat: 'selection' },
  { id: 36, q: 'How do I get Zoom kickoff links?', a: 'Through dashboard announcements and email.', cat: 'selection' },
  { id: 37, q: 'NOC not ready but start date approaching?', a: 'Use self-declaration temporarily.', cat: 'selection' },
  { id: 38, q: 'When does the internship officially begin?', a: 'On the confirmed start date after the NOC is validated.', cat: 'selection' },
  { id: 39, q: 'Can I switch from VINS to VISE?', a: 'No.', cat: 'selection' },
  { id: 40, q: 'Can dates change after the offer letter?', a: 'No.', cat: 'selection' },
  { id: 41, q: 'Are daily standups mandatory?', a: 'Yes.', cat: 'selection' },
  { id: 42, q: 'Why does Zoom ID matter?', a: 'Attendance tracking depends on it.', cat: 'selection' },
  { id: 43, q: 'Can Zoom ID be changed?', a: 'Only through escalation support.', cat: 'selection' },
  { id: 132, q: 'How do I write an SOP?', a: 'Highlight your projects, why the internship matters to you, and keep it concise and authentic.', cat: 'selection' },

  // Work, Mentorship, and Projects
  { id: 44, q: 'What work will I do?', a: 'Open-source projects across AI/ML, NLP, Web Development, Computer Vision, EdTech, and Agriculture Tech.', cat: 'work' },
  { id: 45, q: 'How many hours will I work?', a: 'Usually 6 to 10 hours daily.', cat: 'work' },
  { id: 46, q: 'Who will mentor me?', a: 'Research and engineering teams.', cat: 'work' },
  { id: 47, q: 'Is there a stipend?', a: 'No guaranteed stipend.', cat: 'work' },
  { id: 48, q: 'What laptop do I need?', a: 'A personal laptop is required. Linux or macOS is preferred. Windows users should install WSL or terminal tools.', cat: 'work' },
  { id: 49, q: 'Can I use different emails on platforms?', a: 'No, it is not recommended.', cat: 'work' },
  { id: 50, q: 'What if my mentor is not assigned yet?', a: 'Mentors are assigned later during the project phase.', cat: 'work' },
  { id: 133, q: 'What are the best DSA resources?', a: 'Focus on arrays, linked lists, trees, graphs, and pattern-based practice before the interview.', cat: 'work' },

  // Code of Conduct & Communication
  { id: 51, q: 'What are the official communication channels?', a: 'Priority order is announcements on samagama.in, Yaksha chat, discussion forum, and email support.', cat: 'conduct' },
  { id: 52, q: 'Can I use unofficial WhatsApp, Telegram, or Discord groups?', a: 'No. Violations may terminate the internship.', cat: 'conduct' },

  // Interview Related
  { id: 53, q: 'Interview not marked complete?', a: 'Use Yaksha or escalate through email.', cat: 'interview' },

  // Certificate
  { id: 54, q: 'Does the grade report or evaluation depend on requirements?', a: 'Yes, it depends on internship requirements.', cat: 'certificate' },
  { id: 55, q: 'Does the certificate mention online or offline?', a: 'Yes.', cat: 'certificate' },
  { id: 56, q: 'Will I get a physical certificate or e-certificate?', a: 'Usually an e-certificate.', cat: 'certificate' },
  { id: 57, q: 'Is there a WhatsApp group?', a: 'No official WhatsApp group exists.', cat: 'certificate' },

  // Rosetta Journal
  { id: 58, q: 'What is Rosetta?', a: 'A reflective internship journal.', cat: 'rosetta' },
  { id: 59, q: 'Why does it exist?', a: 'To encourage thinking and reflection.', cat: 'rosetta' },
  { id: 60, q: 'What is a thinking routine?', a: 'Structured reflection prompts.', cat: 'rosetta' },
  { id: 61, q: 'How do I get Rosetta?', a: 'It is provided during the internship.', cat: 'rosetta' },
  { id: 62, q: 'How should I use Rosetta?', a: 'Maintain regular entries.', cat: 'rosetta' },
  { id: 63, q: 'How long should each entry be?', a: 'Flexible but meaningful.', cat: 'rosetta' },
  { id: 64, q: 'What is the main rule?', a: 'Write honestly.', cat: 'rosetta' },
  { id: 65, q: 'Can AI tools write my entries?', a: 'No.', cat: 'rosetta' },
  { id: 66, q: 'What if I miss a day?', a: 'Continue honestly and consistently.', cat: 'rosetta' },
  { id: 67, q: 'Will mentors read it?', a: 'Possibly during evaluation.', cat: 'rosetta' },
  { id: 68, q: 'Can prompts change?', a: 'Yes.', cat: 'rosetta' },
  { id: 69, q: 'How do I submit it?', a: 'Instructions are shared later.', cat: 'rosetta' },
  { id: 70, q: 'Where can I ask more Rosetta questions?', a: 'Use Yaksha support.', cat: 'rosetta' },
  { id: 71, q: 'Need self-paced proof for college?', a: 'Share the official documents provided.', cat: 'rosetta' },

  // Phase 1 — Coursework & ViBe
  { id: 72, q: 'Are previous interns exempt?', a: 'It depends on the mentor or team decision.', cat: 'phase1' },
  { id: 73, q: 'How do I register on ViBe?', a: 'Through the invitation flow.', cat: 'phase1' },
  { id: 74, q: 'Can I use a different email on ViBe?', a: 'Avoid mismatches.', cat: 'phase1' },
  { id: 75, q: 'Are live sessions mandatory?', a: 'It depends on your route.', cat: 'phase1' },
  { id: 76, q: 'Where is the session schedule?', a: 'Check dashboard announcements.', cat: 'phase1' },
  { id: 77, q: 'Can ViBe start early?', a: 'Sometimes yes.', cat: 'phase1' },
  { id: 78, q: 'What about attendance rules?', a: 'Attendance is strictly monitored.', cat: 'phase1' },

  // Yaksha Chat
  { id: 79, q: 'Unable to type in Yaksha?', a: 'Refresh the page, relogin, or escalate.', cat: 'yaksha' },

  // ViBe Platform
  { id: 80, q: 'How do I log in to ViBe?', a: 'Use the invite link.', cat: 'vibe' },
  { id: 81, q: 'What does “No course enrolled” mean?', a: 'It is usually an onboarding sync issue.', cat: 'vibe' },
  { id: 82, q: 'Videos are stuck or repeating.', a: 'This is often a browser or network issue.', cat: 'vibe' },
  { id: 83, q: 'Can I use a mobile or tablet?', a: 'A laptop is preferred.', cat: 'vibe' },
  { id: 84, q: 'How do I troubleshoot video issues?', a: 'Refresh the browser and ensure stable internet.', cat: 'vibe' },
  { id: 85, q: 'Why is progress below 100%?', a: 'Sometimes sync delays occur.', cat: 'vibe' },
  { id: 86, q: 'What if I am dissatisfied with ViBe?', a: 'Exceptions are generally not granted.', cat: 'vibe' },
  { id: 87, q: 'Is the consent form compulsory?', a: 'Yes.', cat: 'vibe' },
  { id: 88, q: 'What are penalty scores?', a: 'They are internal learning-compliance metrics.', cat: 'vibe' },
  { id: 89, q: 'When should I use the Flag option?', a: 'Use it for content or platform issues.', cat: 'vibe' },
  { id: 90, q: 'What is Linear Progression?', a: 'It is a sequential learning progression system.', cat: 'vibe' },
  { id: 91, q: 'Can I skip ahead?', a: 'Generally no.', cat: 'vibe' },
  { id: 92, q: 'What does the Access Restricted banner mean?', a: 'It is not necessarily a bug.', cat: 'vibe' },
  { id: 93, q: 'How do I resolve Access Restricted?', a: 'Follow the platform instructions.', cat: 'vibe' },
  { id: 94, q: 'Why do lessons restart?', a: 'It may be triggered by attention or proctoring checks.', cat: 'vibe' },
  { id: 95, q: 'Can I read aloud while studying?', a: 'Avoid excessive speaking.', cat: 'vibe' },
  { id: 96, q: 'Can I study with a friend on camera?', a: 'It is not recommended.', cat: 'vibe' },
  { id: 97, q: 'Will clearing the browser erase progress?', a: 'Usually not if everything is synced properly.', cat: 'vibe' },
  { id: 98, q: 'What is the recommended study rhythm?', a: 'Keep a consistent daily routine.', cat: 'vibe' },
  { id: 99, q: 'What is the ideal study corner?', a: 'A quiet and distraction-free space.', cat: 'vibe' },

  // Team Formation
  { id: 100, q: 'Is team formation compulsory?', a: 'Yes.', cat: 'team' },
  { id: 101, q: 'What is the team size?', a: 'Usually 2 to 4 members.', cat: 'team' },
  { id: 102, q: 'How are teams formed?', a: 'Through an assigned activity or selection process.', cat: 'team' },
  { id: 103, q: 'What if I missed the formation activity?', a: 'Support will guide the next steps.', cat: 'team' },
  { id: 104, q: 'What if my email has a typo?', a: 'It can be corrected through support.', cat: 'team' },
  { id: 105, q: 'Is a team of two acceptable?', a: 'Usually yes.', cat: 'team' },
  { id: 106, q: 'What if a member leaves?', a: 'Team adjustments may happen.', cat: 'team' },
  { id: 107, q: 'Are same-college teammates allowed?', a: 'Yes.', cat: 'team' },
  { id: 108, q: 'Are same IITM BS cohort teammates allowed?', a: 'Generally allowed.', cat: 'team' },
  { id: 109, q: 'Can the team name change?', a: 'Usually discouraged.', cat: 'team' },
  { id: 110, q: 'What if duplicate team names exist?', a: 'Support resolves conflicts.', cat: 'team' },
  { id: 111, q: 'What if there is a team conflict?', a: 'Escalate officially.', cat: 'team' },
  { id: 112, q: 'How will the mentor be assigned?', a: 'Later during the project phase.', cat: 'team' },
  { id: 113, q: 'When are team details shared?', a: 'After allocation.', cat: 'team' },
  { id: 114, q: 'What if I am missing from the team email?', a: 'Escalate support.', cat: 'team' },
  { id: 115, q: 'What if I was assigned a different project?', a: 'Assignments are final.', cat: 'team' },
  { id: 116, q: 'Can I form my own team later?', a: 'It depends on the stage.', cat: 'team' },
  { id: 117, q: 'When do team activities begin?', a: 'After onboarding and training.', cat: 'team' },
  { id: 118, q: 'Can I request teammates later?', a: 'Usually no.', cat: 'team' },
  { id: 119, q: 'What if a team member is inactive?', a: 'Report it officially.', cat: 'team' },
  { id: 120, q: 'Can teams switch?', a: 'Rarely.', cat: 'team' },
  { id: 121, q: 'Does team performance affect evaluation?', a: 'Yes.', cat: 'team' },
  { id: 122, q: 'How should teams communicate?', a: 'Use official channels only.', cat: 'team' },
  { id: 123, q: 'What if I missed a team announcement?', a: 'Check announcements and escalate if needed.', cat: 'team' },
  { id: 124, q: 'Can a team be dissolved?', a: 'Only under special conditions.', cat: 'team' },
  { id: 125, q: 'What if I drop out?', a: 'Team restructuring may occur.', cat: 'team' },
  { id: 126, q: 'Is there time before Phase 2?', a: 'Yes, usually some coordination period exists.', cat: 'team' }
];

const doubtPosts = [
  {
    id: 1,
    title: 'How to write a strong SOP for IIT Ropar Samagama?',
    body: 'I am applying for the research internship and want to know what to highlight in my SOP.',
    tags: ['Internship', 'Resume'],
    votes: 47,
    status: 'approved',
    solved: true,
    user: 'Priya R.',
    time: '2h ago',
    answers: [
      {
        id: 1,
        user: 'Arjun K.',
        text: 'Focus on why IIT Ropar is the right fit for you, describe relevant projects, and keep the SOP concise and authentic.',
        time: '1h ago'
      }
    ]
  },
  {
    id: 2,
    title: 'Best DSA resources to prepare for research internship interviews?',
    body: 'I know basic data structures but want to brush up before the selection process. Does Samagama ask DSA?',
    tags: ['DSA', 'Coding'],
    votes: 31,
    status: 'approved',
    solved: false,
    user: 'Arjun K.',
    time: '5h ago',
    answers: []
  }
];

module.exports = { faqData, doubtPosts };
