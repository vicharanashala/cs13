import { createAnnouncement } from './announcements';

const JOURNEY_KEY = 'samagama-internship-journey';
const JOURNEY_EVENT = 'samagama-journey-updated';

const milestoneMeta = [
  {
    id: 1,
    title: 'Fill the application form',
    desc: 'Profile and short answers',
    dueDate: '2026-05-24',
    status: 'completed',
    category: 'Application',
    actionType: 'view',
    relatedRoute: '/overview',
    requirements: [
      'Complete profile details',
      'Answer the short-form prompts',
      'Review before submission',
    ],
    instructions: [
      'Double-check your personal information.',
      'Keep the responses concise and relevant.',
      'Submit only when the preview looks correct.',
    ],
    nextActions: ['Review the submitted form record'],
  },
  {
    id: 2,
    title: 'Take the Yaksha AI Interview',
    desc: 'Conversational, on record',
    dueDate: '2026-05-26',
    status: 'completed',
    category: 'Interview',
    actionType: 'view',
    relatedRoute: '/yaksha',
    requirements: [
      'Answer the interview prompts clearly',
      'Keep your webcam and mic ready',
      'Stay connected through the full session',
    ],
    instructions: [
      'Maintain a calm pace and explain your thinking.',
      'Your response record is saved for review.',
      'You can revisit the interview summary any time.',
    ],
    nextActions: ['Review score, remarks, and selection status'],
  },
  {
    id: 3,
    title: 'See Your Result',
    desc: 'Yellow VINS panel on dashboard',
    dueDate: '2026-05-27',
    status: 'completed',
    category: 'Result',
    actionType: 'view',
    relatedRoute: '/dashboard',
    requirements: [
      'Interview record evaluated by the team',
      'Selection panel confirmed on the dashboard',
    ],
    instructions: [
      'Open the result panel to check the selection state.',
      'Use feedback to prepare for the onboarding phase.',
    ],
    nextActions: ['Read remarks and selection feedback'],
    result: {
      interviewScore: 92,
      selectionStatus: 'Selected',
      remarks: 'Clear reasoning, consistent communication, and a strong fit for the internship flow.',
      feedback: 'Keep the same clarity for weekly reviews and project updates.',
    },
  },
  {
    id: 4,
    title: 'Confirm Internship Period',
    desc: 'Start + end dates on file',
    dueDate: '2026-05-29',
    status: 'completed',
    category: 'Onboarding',
    actionType: 'dateRange',
    relatedRoute: '/student/tasks',
    requirements: [
      'Choose your internship start date',
      'Choose your internship end date',
      'Confirm that the dates are correct',
    ],
    instructions: [
      'Pick dates that match your academic schedule.',
      'Keep the end date before the final review window.',
    ],
    nextActions: ['Edit dates if your timetable changes'],
    data: {
      startDate: '2026-06-03',
      endDate: '2026-08-03',
      confirmedAt: '2026-06-01T09:15:00.000Z',
    },
  },
  {
    id: 5,
    title: 'Upload Signed NOC',
    desc: 'Uploaded and validated',
    dueDate: '2026-06-01',
    status: 'completed',
    category: 'NOC',
    actionType: 'fileUpload',
    relatedRoute: '/student/tasks',
    requiresReview: true,
    requirements: [
      'Upload signed NOC on official letterhead',
      'Include correct internship dates',
      'Keep a readable PDF or image copy',
    ],
    instructions: [
      'Upload the signed file and preview it before submitting.',
      'You can replace the file if the college issues a corrected version.',
      'The admin team will approve or reject the current version.',
    ],
    nextActions: ['Replace or resubmit if corrections are requested'],
    data: {
      fileName: 'signed-noc.pdf',
      approvalStatus: 'Approved',
      uploadedAt: '2026-06-01T10:12:00.000Z',
      approvedAt: '2026-06-01T14:40:00.000Z',
      reviewer: 'Samagama Admin Team',
      comments: 'Dates and signature matched the verified internship period.',
      previewUrl: '',
    },
  },
  {
    id: 6,
    title: 'Download Offer Letter',
    desc: 'Securely generated for your record',
    dueDate: '2026-06-02',
    status: 'locked',
    category: 'Offer Letter',
    actionType: 'download',
    relatedRoute: '/student/tasks',
    requirements: [
      'NOC must be approved',
      'Internship period must be confirmed',
    ],
    instructions: [
      'Download the generated PDF from the portal.',
      'Keep a copy for your records and college submission.',
    ],
    nextActions: ['Download again if you need a fresh copy'],
    data: {
      fileName: 'Vicharanashala_Offer_Letter.pdf',
      generatedAt: '',
      issuedAt: '',
      downloadedAt: '',
      downloadReady: false,
    },
  },
  {
    id: 7,
    title: 'Provide Your Zoom ID',
    desc: 'Add your attendance ID',
    dueDate: '2026-06-03',
    status: 'active',
    category: 'Attendance',
    actionType: 'text',
    relatedRoute: '/student/tasks',
    requirements: [
      'Enter the Zoom ID used for attendance',
      'Keep the same ID for live sessions',
    ],
    instructions: [
      'Submit your Zoom ID exactly as you use it in meetings.',
      'If the ID changes later, update it here to keep attendance correct.',
    ],
    nextActions: ['Submit the Zoom ID to unlock the internship start step'],
    data: {
      zoomId: '987654321',
      attendanceNote: 'Same ID will be used for weekly live reviews.',
      submittedAt: '',
    },
  },
  {
    id: 8,
    title: 'Start the Internship',
    desc: 'Bronze begins, mentor assigned',
    dueDate: '2026-06-05',
    status: 'locked',
    category: 'Internship',
    actionType: 'confirm',
    relatedRoute: '/student/tasks',
    requirements: [
      'Provide a verified Zoom ID',
      'Wait for the internship start confirmation',
    ],
    instructions: [
      'This milestone unlocks after the attendance details are saved.',
      'Once started, your internship timeline begins.',
    ],
    nextActions: ['Confirm that the internship start screen is ready'],
  },
  {
    id: 9,
    title: 'Form Your Project Team',
    desc: 'Team of at least 10 interns',
    dueDate: '2026-06-08',
    status: 'locked',
    category: 'Team',
    actionType: 'team',
    relatedRoute: '/student/tasks',
    requirements: [
      'Create or join a team',
      'Ensure the team list is complete',
      'Review the team members before saving',
    ],
    instructions: [
      'Invite or add members directly in the team panel.',
      'Keep the team name short and readable.',
      'You can update members later if someone changes groups.',
    ],
    nextActions: ['Create a project team when this step unlocks'],
  },
  {
    id: 10,
    title: 'Weekly Review',
    desc: 'Reports, links, and progress notes',
    dueDate: '2026-06-14',
    status: 'locked',
    category: 'Review',
    actionType: 'review',
    relatedRoute: '/student/tasks',
    requiresReview: true,
    requirements: [
      'Submit weekly notes',
      'Attach report links if available',
      'Keep the progress update concise',
    ],
    instructions: [
      'Mention what you completed this week.',
      'Add any blockers or help you need from the mentor.',
      'The review may be approved or rejected by admin.',
    ],
    nextActions: ['Submit your first weekly progress update'],
  },
  {
    id: 11,
    title: 'Project Work & Finish Internship',
    desc: 'Earn your certificate',
    dueDate: '2026-06-30',
    status: 'locked',
    category: 'Certificate',
    actionType: 'final',
    relatedRoute: '/student/tasks',
    requiresReview: true,
    requirements: [
      'Complete the project work milestones',
      'Pass the final review',
      'Finish the Bronze + Silver checks',
    ],
    instructions: [
      'Track your final project submissions here.',
      'Certificate becomes available after approval.',
      'Keep the completion checklist updated.',
    ],
    nextActions: ['Finish the project stage to unlock the certificate'],
    certificate: {
      eligible: false,
      downloadedAt: '',
    },
  },
];

const defaultJourneyState = {
  spPoints: 120,
  milestones: milestoneMeta.reduce((acc, item) => {
    acc[item.id] = {
      status: item.status,
      completionDate: item.status === 'completed'
        ? `2026-06-0${Math.min(item.id, 6)}T10:00:00.000Z`
        : '',
      submissions: item.status === 'completed'
        ? [{
            id: `sub-${item.id}-seed`,
            title: `${item.title} record`,
            status: item.requiresReview ? 'approved' : 'saved',
            submittedAt: item.status === 'completed' ? `2026-06-0${Math.min(item.id, 6)}T09:00:00.000Z` : '',
            comment: item.requirements?.[0] || '',
          }]
        : [],
      approvals: item.requiresReview && item.status === 'completed'
        ? [{
            id: `apr-${item.id}-seed`,
            reviewer: 'Samagama Admin Team',
            decision: 'approved',
            reviewedAt: '2026-06-01T14:40:00.000Z',
            comment: 'Verified and approved.',
          }]
        : [],
      activity: item.status === 'completed'
        ? [{
            id: `evt-${item.id}-seed`,
            type: 'completion',
            title: `${item.title} completed`,
            detail: 'Milestone completed in the internship journey.',
            at: item.status === 'completed' ? `2026-06-0${Math.min(item.id, 6)}T10:00:00.000Z` : '',
            by: 'System',
          }]
        : [],
      data: item.data ? { ...item.data } : {},
    };
    return acc;
  }, {}),
  pendingReviews: [],
  history: [],
  generatedNotifications: [],
};

function readJson(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function dispatchUpdate() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(JOURNEY_EVENT));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function migrateOfferLetterState(state) {
  if (!state?.milestones?.[6]) return state;
  const next = clone(state);
  const milestone = next.milestones[6];
  if (milestone.data?.issuedAt) {
    milestone.status = 'completed';
    milestone.data.downloadReady = true;
  } else {
    milestone.status = 'locked';
    milestone.data.downloadReady = false;
    milestone.data.downloadedAt = '';
  }
  return next;
}

function getDefaultState() {
  return clone(defaultJourneyState);
}

function getStorageState() {
  if (typeof window === 'undefined') return getDefaultState();
  const saved = readJson(JOURNEY_KEY, null);
  if (saved && saved.milestones) {
    const migrated = migrateOfferLetterState(saved);
    if (migrated !== saved) writeJson(JOURNEY_KEY, migrated);
    return migrated;
  }
  const initial = migrateOfferLetterState(getDefaultState());
  writeJson(JOURNEY_KEY, initial);
  return initial;
}

function saveState(state) {
  if (typeof window === 'undefined') return;
  writeJson(JOURNEY_KEY, state);
  dispatchUpdate();
}

function formatDisplayDate(dateInput) {
  if (!dateInput) return '';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(dateInput));
  } catch {
    return dateInput;
  }
}

function milestoneAnnouncementMeta(milestone) {
  const categoryMap = {
    Application: 'Announcement',
    Interview: 'Meeting',
    Result: 'Important',
    Onboarding: 'NOC',
    NOC: 'NOC',
    'Offer Letter': 'Announcement',
    Attendance: 'Meeting',
    Internship: 'Internship',
    Team: 'Announcement',
    Review: 'Important',
    Certificate: 'Certificate',
  };

  return {
    category: categoryMap[milestone.category] || 'Important',
    priority: milestone.status === 'pending_review' ? 'High' : 'Medium',
  };
}

function maybeCreateReminderAnnouncements(state) {
  const now = new Date();
  const reminders = [];
  Object.values(state.milestones).forEach(milestone => {
    if (milestone.status === 'completed') return;
    const deadline = new Date(`${milestone.dueDate}T23:59:59`);
    if (Number.isNaN(deadline.getTime())) return;
    const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysRemaining < 0 || daysRemaining > 2) return;

    const key = `reminder-${milestone.id}-${milestone.dueDate}`;
    if (state.generatedNotifications.includes(key)) return;

    const title = `${milestone.title} due ${daysRemaining === 0 ? 'today' : daysRemaining === 1 ? 'tomorrow' : `in ${daysRemaining} days`}`;
    reminders.push({
      key,
      title,
      preview: `Keep your ${milestone.title.toLowerCase()} step on track before the deadline.`,
      content: `Reminder for ${milestone.title}.\n\n${milestone.instructions.join('\n')}`,
      category: milestoneAnnouncementMeta(milestone).category,
      priority: 'High',
    });
  });

  if (!reminders.length) return state;

  const next = clone(state);
  reminders.forEach(reminder => {
    next.generatedNotifications.push(reminder.key);
    createAnnouncement({
      title: reminder.title,
      message: reminder.content,
      category: reminder.category,
      priority: reminder.priority,
      pinned: false,
      postedBy: 'Samagama Admin Team',
    });
  });
  return next;
}

function recomputeFlow(state) {
  const next = clone(state);
  const milestoneIds = milestoneMeta.map(item => item.id);
  let previousCompleted = true;

  milestoneIds.forEach(id => {
    const milestone = next.milestones[id];
    if (!milestone) return;
    if (id === 6) {
      if (milestone.data?.issuedAt) {
        milestone.status = 'completed';
        previousCompleted = true;
      } else {
        milestone.status = 'locked';
        previousCompleted = false;
      }
      return;
    }
    if (milestone.status === 'completed' || milestone.status === 'pending_review') {
      previousCompleted = milestone.status === 'completed';
      return;
    }

    if (previousCompleted) {
      if (milestone.status === 'locked') {
        milestone.status = 'active';
      }
      previousCompleted = false;
      return;
    }

    milestone.status = 'locked';
  });

  return next;
}

export function getJourneyState() {
  return getStorageState();
}

export function ensureJourneyReminders() {
  if (typeof window === 'undefined') return getDefaultState();
  const state = getStorageState();
  const updated = maybeCreateReminderAnnouncements(state);
  if (updated !== state) {
    saveState(updated);
    return updated;
  }
  return state;
}

export function saveJourneyState(state) {
  saveState(state);
}

export function getJourneyMilestones() {
  const state = getJourneyState();
  return milestoneMeta.map(meta => ({
    ...meta,
    ...state.milestones[meta.id],
  }));
}

export function getJourneyMilestone(milestoneId) {
  return getJourneyMilestones().find(item => item.id === milestoneId) || null;
}

export function getJourneyProgress(state = getJourneyState()) {
  const milestones = milestoneMeta.map(meta => state.milestones[meta.id]);
  const completed = milestones.filter(item => item.status === 'completed').length;
  return {
    completed,
    total: milestones.length,
    percent: Math.round((completed / milestones.length) * 100),
  };
}

export function getJourneyPendingReviews() {
  const state = getJourneyState();
  return [...state.pendingReviews].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
}

export function getJourneyHistory() {
  const state = getJourneyState();
  return [...(state.history || [])];
}

export function markJourneyMilestoneComplete(milestoneId, payload = {}) {
  const state = getJourneyState();
  const milestone = state.milestones[milestoneId];
  if (!milestone) return state;

  const completedAt = new Date().toISOString();
  milestone.status = 'completed';
  milestone.completionDate = completedAt;
  milestone.data = {
    ...milestone.data,
    ...payload.data,
  };
  milestone.activity.unshift({
    id: `evt-${milestoneId}-${Date.now()}`,
    type: 'completion',
    title: `${milestone.title} completed`,
    detail: payload.note || 'Milestone completed successfully.',
    at: completedAt,
    by: payload.by || 'Student',
  });

  state.spPoints += payload.spDelta ?? 0;
  const nextIndex = milestoneMeta.findIndex(item => item.id === milestoneId) + 1;
  if (nextIndex < milestoneMeta.length) {
    const nextMilestone = state.milestones[milestoneMeta[nextIndex].id];
    if (nextMilestone && nextMilestone.status === 'locked') {
      nextMilestone.status = 'active';
    }
  }

  state.history.unshift({
    id: `hist-${milestoneId}-${Date.now()}`,
    milestoneId,
    type: 'completion',
    at: completedAt,
    by: payload.by || 'Student',
    title: milestone.title,
    detail: payload.note || 'Milestone completed.',
  });

  const announcementMeta = milestoneAnnouncementMeta(milestone);
  createAnnouncement({
    title: `${milestone.title} completed`,
    message: payload.note || `Milestone completed successfully: ${milestone.title}.`,
    category: announcementMeta.category,
    priority: announcementMeta.priority,
    pinned: false,
    postedBy: payload.by || 'Samagama Admin Team',
  });

  const next = recomputeFlow(state);
  saveState(next);
  return next;
}

export function submitJourneyReview(milestoneId, payload = {}, options = {}) {
  const state = getJourneyState();
  const milestone = state.milestones[milestoneId];
  if (!milestone) return state;

  const submittedAt = new Date().toISOString();
  const submission = {
    id: `sub-${milestoneId}-${Date.now()}`,
    title: payload.title || milestone.title,
    status: 'pending',
    submittedAt,
    comment: payload.comment || '',
    links: payload.links || [],
    files: payload.files || [],
    data: payload.data || {},
    submittedBy: payload.by || 'Student',
  };

  milestone.submissions.unshift(submission);
  if (!options.keepStatus) {
    milestone.status = 'pending_review';
  }
  milestone.activity.unshift({
    id: `evt-${milestoneId}-${Date.now()}`,
    type: 'submission',
    title: `${milestone.title} submitted for review`,
    detail: payload.comment || 'Waiting for admin review.',
    at: submittedAt,
    by: payload.by || 'Student',
  });
  state.pendingReviews = state.pendingReviews.filter(item => item.milestoneId !== milestoneId);
  state.pendingReviews.unshift({
    id: submission.id,
    milestoneId,
    milestoneTitle: milestone.title,
    category: milestone.category,
    submittedAt,
    submittedBy: payload.by || 'Student',
    comment: payload.comment || '',
    files: payload.files || [],
    links: payload.links || [],
    data: payload.data || {},
  });
  state.history.unshift({
    id: `hist-${milestoneId}-${Date.now()}`,
    milestoneId,
    type: 'submission',
    at: submittedAt,
    by: payload.by || 'Student',
    title: `${milestone.title} submitted`,
    detail: payload.comment || 'Submitted for review.',
  });

  const announcementMeta = milestoneAnnouncementMeta(milestone);
  createAnnouncement({
    title: `${milestone.title} submitted for review`,
    message: payload.comment || `A new submission is awaiting review for ${milestone.title}.`,
    category: announcementMeta.category,
    priority: 'High',
    pinned: false,
    postedBy: 'Samagama System',
  });

  saveState(state);
  return state;
}

export function reviewJourneySubmission(submissionId, decision, reviewerComment = '') {
  const state = getJourneyState();
  const pendingIndex = state.pendingReviews.findIndex(item => item.id === submissionId);
  if (pendingIndex === -1) return state;

  const item = state.pendingReviews[pendingIndex];
  const milestone = state.milestones[item.milestoneId];
  const reviewedAt = new Date().toISOString();
  const approved = decision === 'approved';
  const needsChanges = decision === 'needs_changes';
  const submissionIndex = milestone.submissions.findIndex(item => item.id === submissionId);

  const reviewRecord = {
    id: `rev-${submissionId}-${Date.now()}`,
    reviewer: 'Samagama Admin Team',
    decision,
    reviewedAt,
    comment: reviewerComment || '',
  };

  milestone.approvals.unshift(reviewRecord);
  if (submissionIndex !== -1) {
    milestone.submissions[submissionIndex] = {
      ...milestone.submissions[submissionIndex],
      status: decision,
      reviewedAt,
      reviewer: 'Samagama Admin Team',
      reviewComment: reviewerComment || '',
    };
  }
  milestone.activity.unshift({
    id: `evt-${item.milestoneId}-${Date.now()}`,
    type: approved ? 'approval' : 'rejection',
    title: approved ? `${milestone.title} approved` : needsChanges ? `${milestone.title} needs changes` : `${milestone.title} rejected`,
    detail: reviewerComment || (approved ? 'Approved by the admin team.' : needsChanges ? 'Changes requested by the admin team.' : 'Rejected by the admin team.'),
    at: reviewedAt,
    by: 'Samagama Admin Team',
  });

  if (approved) {
    milestone.status = 'completed';
    milestone.completionDate = reviewedAt;
    milestone.data = {
      ...milestone.data,
      approvalStatus: 'Approved',
      submissionStatus: 'approved',
      approvedAt: reviewedAt,
      lastReviewedAt: reviewedAt,
      reviewer: 'Samagama Admin Team',
      comments: reviewerComment || '',
    };
    if (item.milestoneId === 11) {
      milestone.data.certificateEligible = true;
      milestone.data.certificateReadyAt = reviewedAt;
    }
    state.spPoints += item.milestoneId === 11 ? 20 : item.milestoneId === 5 ? 10 : 8;
    const nextIndex = milestoneMeta.findIndex(meta => meta.id === item.milestoneId) + 1;
    if (nextIndex < milestoneMeta.length) {
      const nextMilestone = state.milestones[milestoneMeta[nextIndex].id];
      if (nextMilestone && nextMilestone.status === 'locked') {
        nextMilestone.status = 'active';
      }
    }
  } else if (needsChanges) {
    milestone.status = 'active';
    milestone.data = {
      ...milestone.data,
      approvalStatus: 'Needs Changes',
      submissionStatus: 'needs_changes',
      reviewedAt,
      lastReviewedAt: reviewedAt,
      reviewer: 'Samagama Admin Team',
      comments: reviewerComment || '',
    };
  } else {
    milestone.status = 'active';
    milestone.data = {
      ...milestone.data,
      approvalStatus: 'Rejected',
      submissionStatus: 'rejected',
      reviewedAt,
      lastReviewedAt: reviewedAt,
      reviewer: 'Samagama Admin Team',
      comments: reviewerComment || '',
    };
  }

  state.pendingReviews.splice(pendingIndex, 1);
  state.history.unshift({
    id: `hist-${item.milestoneId}-${Date.now()}`,
    milestoneId: item.milestoneId,
    type: approved ? 'approval' : 'rejection',
    at: reviewedAt,
    by: 'Samagama Admin Team',
    title: approved ? `${milestone.title} approved` : `${milestone.title} rejected`,
    detail: reviewerComment || '',
  });

  const announcementMeta = milestoneAnnouncementMeta(milestone);
  createAnnouncement({
    title: approved ? `${milestone.title} approved` : needsChanges ? `${milestone.title} needs changes` : `${milestone.title} rejected`,
    message: reviewerComment || (approved ? `Your ${milestone.title} milestone has been approved.` : needsChanges ? `Please revise and resubmit your ${milestone.title} milestone.` : `Your ${milestone.title} milestone has been rejected.`),
    category: announcementMeta.category,
    priority: approved ? 'Medium' : 'High',
    pinned: false,
    postedBy: 'Samagama Admin Team',
  });

  const next = recomputeFlow(state);
  saveState(next);
  return next;
}

export function setJourneyMilestoneData(milestoneId, data = {}, options = {}) {
  const state = getJourneyState();
  const milestone = state.milestones[milestoneId];
  if (!milestone) return state;

  milestone.data = {
    ...milestone.data,
    ...data,
  };
  if (options.note) {
    milestone.activity.unshift({
      id: `evt-${milestoneId}-${Date.now()}`,
      type: 'update',
      title: `${milestone.title} updated`,
      detail: options.note,
      at: new Date().toISOString(),
      by: options.by || 'Student',
    });
  }
  saveState(state);
  return state;
}

export function downloadJourneyOfferLetter() {
  const state = getJourneyState();
  const milestone = state.milestones[6];
  if (!milestone) return state;
  if (!milestone.data?.issuedAt) {
    throw new Error('Offer letter has not been issued yet.');
  }
  const now = new Date().toISOString();
  milestone.data = {
    ...milestone.data,
    downloadedAt: now,
    downloadReady: true,
  };
  milestone.activity.unshift({
    id: `evt-6-${Date.now()}`,
    type: 'download',
    title: 'Offer letter downloaded',
    detail: 'Secure offer letter was downloaded from the portal.',
    at: now,
    by: 'Student',
  });
  milestone.status = 'completed';
  state.history.unshift({
    id: `hist-6-${Date.now()}`,
    milestoneId: 6,
    type: 'completion',
    at: now,
    by: 'Student',
    title: 'Download Offer Letter completed',
    detail: 'Offer letter downloaded successfully.',
  });
  const next = recomputeFlow(state);
  saveState(next);
  return next;
}

export function issueJourneyOfferLetter(payload = {}) {
  const state = getJourneyState();
  const milestone = state.milestones[6];
  if (!milestone) return state;

  const issuedAt = payload.issuedAt || new Date().toISOString();
  milestone.status = 'completed';
  milestone.completionDate = issuedAt;
  milestone.data = {
    ...milestone.data,
    issuedAt,
    issueDate: issuedAt,
    generatedAt: payload.generatedAt || issuedAt,
    downloadedAt: milestone.data?.downloadedAt || '',
    downloadReady: true,
    fileName: payload.fileName || milestone.data?.fileName || 'Vicharanashala_Offer_Letter.pdf',
    issuedBy: payload.issuedBy || 'Samagama Admin Team',
    remarks: payload.remarks || '',
  };
  milestone.activity.unshift({
    id: `evt-6-issue-${Date.now()}`,
    type: 'update',
    title: 'Offer letter issued',
    detail: 'The offer letter is now available for secure download.',
    at: issuedAt,
    by: payload.issuedBy || 'Samagama Admin Team',
  });
  state.history.unshift({
    id: `hist-6-issue-${Date.now()}`,
    milestoneId: 6,
    type: 'update',
    at: issuedAt,
    by: payload.issuedBy || 'Samagama Admin Team',
    title: 'Offer Letter issued',
    detail: 'Offer letter is ready for student download.',
  });
  createAnnouncement({
    title: 'Offer Letter Issued',
    message: payload.remarks || 'Your offer letter is now available in the student portal.',
    category: 'Offer Letter',
    priority: 'High',
    pinned: false,
    postedBy: payload.issuedBy || 'Samagama Admin Team',
  });
  const next = recomputeFlow(state);
  saveState(next);
  return next;
}

export function submitJourneyZoomId(zoomId) {
  return markJourneyMilestoneComplete(7, {
    data: { zoomId, submittedAt: new Date().toISOString() },
    note: 'Zoom ID saved for attendance tracking.',
    spDelta: 5,
  });
}

export function submitJourneyTeam(team) {
  const payload = team || {};
  return markJourneyMilestoneComplete(9, {
    data: {
      team: payload.team || payload,
      role: payload.role || '',
      members: payload.members || [],
      status: payload.status || 'active',
      workflow: payload.workflow || 'team-formation',
      updatedAt: new Date().toISOString(),
    },
    note: payload.note || 'Project team saved successfully.',
    spDelta: payload.spDelta ?? 10,
    by: payload.by || 'Student',
  });
}

export function submitJourneyStart() {
  return markJourneyMilestoneComplete(8, {
    data: { startedAt: new Date().toISOString() },
    note: 'Internship started and mentor allocation is active.',
    spDelta: 10,
  });
}

export function submitJourneyWeeklyReview(review) {
  const state = getJourneyState();
  const milestone = state.milestones[10];
  if (!milestone) return state;

  const submittedAt = new Date().toISOString();
  const links = review.links || [];
  const files = review.files || [];
  const submission = {
    id: `sub-10-${Date.now()}`,
    title: 'Weekly Review',
    status: 'pending',
    submittedAt,
    comment: review.comment || '',
    links,
    files,
    data: {
      weeklyNote: review.comment || '',
      reportLinks: links,
      progressNotes: review.progressNotes || '',
      submittedFile: review.file || null,
      submittedFileName: review.fileName || '',
      submittedFilePreview: review.filePreview || '',
      submittedLink: review.link || links[0] || '',
      latestSubmissionType: review.file ? 'pdf' : (review.link || links.length ? 'link' : ''),
    },
    submittedBy: review.by || 'Student',
  };

  milestone.submissions = Array.isArray(milestone.submissions)
    ? milestone.submissions.map(item => (
        item.status === 'pending' && item.id !== submission.id
          ? { ...item, status: 'replaced', replacedAt: submittedAt }
          : item
      ))
    : [];
  milestone.submissions.unshift(submission);
  milestone.status = 'pending_review';
  milestone.data = {
    ...milestone.data,
    weeklyNote: review.comment || '',
    reportLinks: links,
    progressNotes: review.progressNotes || '',
    submittedFile: review.file || null,
    submittedFileName: review.fileName || '',
    submittedFilePreview: review.filePreview || '',
    submittedLink: review.link || links[0] || '',
    latestSubmissionType: review.file ? 'pdf' : (review.link || links.length ? 'link' : ''),
    submissionStatus: 'submitted',
    lastSubmittedAt: submittedAt,
    approvalStatus: 'Pending Review',
  };
  milestone.activity.unshift({
    id: `evt-10-${Date.now()}`,
    type: 'submission',
    title: 'Weekly Review submitted',
    detail: review.comment || 'Weekly review sent to mentor review.',
    at: submittedAt,
    by: review.by || 'Student',
  });

  state.pendingReviews = state.pendingReviews.filter(item => item.milestoneId !== 10);
  state.pendingReviews.unshift({
    id: submission.id,
    milestoneId: 10,
    milestoneTitle: milestone.title,
    category: milestone.category,
    submittedAt,
    submittedBy: review.by || 'Student',
    comment: review.comment || '',
    files,
    links,
    data: {
      ...submission.data,
      submittedAt,
    },
  });

  state.history.unshift({
    id: `hist-10-${Date.now()}`,
    milestoneId: 10,
    type: 'submission',
    at: submittedAt,
    by: review.by || 'Student',
    title: 'Weekly Review submitted',
    detail: review.comment || 'Submitted for mentor review.',
  });

  createAnnouncement({
    title: 'Weekly Review submitted for review',
    message: review.comment || 'A new weekly review is awaiting mentor review.',
    category: 'Important',
    priority: 'High',
    pinned: false,
    postedBy: 'Samagama System',
  });

  saveState(state);
  return state;
}

export function submitJourneyFinalProject(project) {
  return submitJourneyReview(11, {
    title: 'Project Work',
    comment: project.comment || '',
    links: project.links || [],
    files: project.files || [],
    data: {
      projectNote: project.comment || '',
      tasks: project.tasks || [],
      certificateEligible: Boolean(project.certificateEligible),
    },
  });
}

export function downloadJourneyCertificate() {
  const state = getJourneyState();
  const milestone = state.milestones[11];
  if (!milestone) return state;
  const now = new Date().toISOString();
  milestone.data = {
    ...milestone.data,
    certificateEligible: true,
    downloadedAt: now,
  };
  milestone.activity.unshift({
    id: `evt-11-${Date.now()}`,
    type: 'download',
    title: 'Certificate downloaded',
    detail: 'E-certificate was downloaded from the portal.',
    at: now,
    by: 'Student',
  });
  milestone.status = 'completed';
  state.spPoints += 20;
  const next = recomputeFlow(state);
  saveState(next);
  return next;
}

export function adjustJourneySpPoints(delta = 0, reason = '', payload = {}) {
  const state = getJourneyState();
  const now = new Date().toISOString();
  const amount = Number(delta || 0);
  state.spPoints = Math.max(0, Number(state.spPoints || 0) + amount);
  state.history.unshift({
    id: `hist-sp-${Date.now()}`,
    milestoneId: payload.milestoneId || null,
    type: amount >= 0 ? 'sp-credit' : 'sp-debit',
    at: now,
    by: payload.by || 'Admin',
    title: amount >= 0 ? 'SP credited' : 'SP debited',
    detail: `${amount >= 0 ? '+' : ''}${amount} SP${reason ? ` · ${reason}` : ''}`,
  });
  const next = recomputeFlow(state);
  saveState(next);
  return next;
}

export function getJourneySummary(state = getJourneyState()) {
  const progress = getJourneyProgress(state);
  return {
    completed: progress.completed,
    total: progress.total,
    spPoints: state.spPoints,
    activeMilestone: milestoneMeta.find(meta => state.milestones[meta.id]?.status === 'active')?.id || 7,
    pendingReviews: state.pendingReviews.length,
  };
}

export function formatJourneyDate(dateValue) {
  if (!dateValue) return '—';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(dateValue));
  } catch {
    return dateValue;
  }
}
