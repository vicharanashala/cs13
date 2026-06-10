import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../authContext';
import {
  formatAnnouncementTime,
  getAnnouncementCategoryIcon,
} from '../announcements';
import { getJourneyMilestone } from '../internshipJourney';
import { getTaskSummary } from '../internshipTasks';
import {
  createTask,
  decideAdminTeam,
  fetchAdminTeams,
  fetchAnnouncements,
  fetchNocs,
  fetchPendingReviews,
  fetchReviews,
  fetchSpurtiPoints,
  fetchAllStudents,
  publishAnnouncement,
  removeAnnouncement,
  updateAnnouncement,
  reviewSubmission,
  fetchKnowledgeBase,
  createKnowledgeBase,
  updateKnowledgeBase,
  archiveKnowledgeBase,
  deleteKnowledgeBase,
} from '../api';

/* ── Shared glass helpers (matching StudentDashboard) ──────────────────────────── */
function glassCard(style = {}) {
  return {
    background: `linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))`,
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 20,
    backdropFilter: 'blur(16px)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
    padding: '24px',
    ...style,
  };
}

function SectionTitle({ icon, label, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        <span style={{ marginRight: 8, fontSize: 16 }}>{icon}</span>{label}
      </h3>
      {action && <span style={{ fontSize: 12, color: '#64748b' }}>{action}</span>}
    </div>
  );
}

function StatCard({ label, value, icon, trend }) {
  return (
    <div style={glassCard({ minWidth: 160 })}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <span style={{ fontSize: 28 }}>{icon}</span>
        {trend && <span style={{ fontSize: 12, color: trend > 0 ? '#10b981' : '#ef4444' }}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </span>}
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 6 }}>{value}</div>
      <div style={{ fontSize: 12, color: '#94a3b8' }}>{label}</div>
    </div>
  );
}

const communityCategories = [
  'NOC',
  'Stipend',
  'Eligibility',
  'Interview',
  'Certificate',
  'Internship',
  'Team Formation',
  'SP Points',
  'Technical',
];

const communityTabs = [
  'New Doubts',
  'Reply Review Queue',
  'All Discussions',
  'Admin Participation',
  'SP Reward History',
];

const initialCommunityDiscussions = [
  {
    id: 101,
    student: 'Rahul Verma',
    studentSp: 322,
    timestamp: '05 Jun 2026, 10:24 AM',
    category: 'NOC',
    title: 'NOC upload question after college signature mismatch',
    description: 'My NOC has the correct dates, but the signatory name differs from the college seal. Should I re-upload before review?',
    replies: [
      { id: 9001, student: 'Priya Sharma', studentSp: 4210, content: 'Re-upload with a corrected signatory line if possible. If not, add a note explaining the mismatch.', timestamp: '05 Jun 2026, 10:42 AM', likes: 14, status: 'pending' },
      { id: 9002, student: 'Admin Team', studentSp: 0, content: 'Please upload a corrected file when the signatory differs from the seal.', timestamp: '05 Jun 2026, 10:58 AM', likes: 0, status: 'accepted', adminVerified: true, pinned: true },
    ],
    status: 'New',
    pinned: true,
    resolved: false,
    locked: false,
  },
  {
    id: 102,
    student: 'Meera Nair',
    studentSp: 287,
    timestamp: '05 Jun 2026, 09:18 AM',
    category: 'Certificate',
    title: 'Certificate release after final review',
    description: 'Will certificates be released immediately after completion or after admin verifies all final milestones?',
    replies: [
      { id: 9003, student: 'Arjun Mehta', studentSp: 3870, content: 'Certificates usually wait for final completion checks. Watch dashboard announcements for the release batch.', timestamp: '05 Jun 2026, 09:33 AM', likes: 23, status: 'pending' },
    ],
    status: 'Unanswered',
    pinned: false,
    resolved: false,
    locked: false,
  },
  {
    id: 103,
    student: 'Ananya Das',
    studentSp: 189,
    timestamp: '04 Jun 2026, 06:05 PM',
    category: 'SP Points',
    title: 'How are helpful community answers rewarded?',
    description: 'I answered two questions yesterday. How do SP rewards show up in my profile and leaderboard?',
    replies: [
      { id: 9004, student: 'Sneha Reddy', studentSp: 3540, content: 'SP rewards appear after moderation accepts the reply. Leaderboard sync can take a short while.', timestamp: '04 Jun 2026, 06:44 PM', likes: 31, status: 'accepted', awardedSp: 10, acceptedAnswer: true },
      { id: 9005, student: 'Karan Patel', studentSp: 210, content: 'You can also see the reason in the SP activity history once awarded.', timestamp: '04 Jun 2026, 07:12 PM', likes: 8, status: 'pending' },
    ],
    status: 'Answered',
    pinned: false,
    resolved: true,
    locked: false,
  },
  {
    id: 104,
    student: 'Aman Khan',
    studentSp: 167,
    timestamp: '04 Jun 2026, 03:20 PM',
    category: 'Team Formation',
    title: 'Can duplicate team formation questions be merged?',
    description: 'There are several similar posts about inactive members. Can admins merge them?',
    replies: [
      { id: 9006, student: 'Pooja Menon', studentSp: 1220, content: 'This looks like the same topic as the inactive member thread. It should probably be merged.', timestamp: '04 Jun 2026, 03:31 PM', likes: 6, status: 'pending' },
    ],
    status: 'Resolved',
    pinned: false,
    resolved: true,
    locked: true,
  },
];

/* ── Main Admin Dashboard ──────────────────────────────────────────── */
export default function AdminDashboard() {
  const { handleLogout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [announcementDialogOpen, setAnnouncementDialogOpen] = useState(false);
  const [announcementDialogTab, setAnnouncementDialogTab] = useState('create');
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskDialogTab, setTaskDialogTab] = useState('assign');
  const profileMenuRef = useRef(null);
  const notificationMenuRef = useRef(null);
  const notificationButtonRef = useRef(null);
  const loginTimestampRef = useRef(new Date());
  const [announcementItems, setAnnouncementItems] = useState([]);
  const [announcementDraft, setAnnouncementDraft] = useState({
    title: '',
    message: '',
    category: 'Announcement',
    priority: 'Medium',
    attachmentLink: '',
    attachmentLabel: 'Attachment',
    pinned: true,
    target: 'all',
  });
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [pinConflict, setPinConflict] = useState(null);
  const [taskItems, setTaskItems] = useState([]);
  const [journeyReviews, setJourneyReviews] = useState([]);
  const [offerLetterMessage, setOfferLetterMessage] = useState('');
  const [teamItems, setTeamItems] = useState([]);
  const [teamMessage, setTeamMessage] = useState('');
  const [taskDraft, setTaskDraft] = useState({
    title: '',
    description: '',
    category: 'General',
    deadline: '',
    priority: 'Medium',
    attachmentLink: '',
    slots: '',
  });
  const [taskMessage, setTaskMessage] = useState('');
  const [journeySearch, setJourneySearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [communityTab, setCommunityTab] = useState('New Doubts');
  const [communitySearch, setCommunitySearch] = useState('');
  const [communityCategory, setCommunityCategory] = useState('All');
  const [communitySort, setCommunitySort] = useState('latest');
  const [communityDiscussions, setCommunityDiscussions] = useState(initialCommunityDiscussions);
  const [rewardDialog, setRewardDialog] = useState(null);
  const [rejectDialog, setRejectDialog] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [adminReplyDrafts, setAdminReplyDrafts] = useState({});
  const [communityToast, setCommunityToast] = useState('');
  const [spRewardHistory, setSpRewardHistory] = useState([
    { id: 1, date: '05 Jun 2026', student: 'Sneha Reddy', question: 'How are helpful community answers rewarded?', awardedSp: 10, awardedBy: 'Admin', reason: 'Great answer' },
    { id: 2, date: '05 Jun 2026', student: 'Arjun Mehta', question: 'Certificate release after final review', awardedSp: 5, awardedBy: 'Admin', reason: 'Helpful answer' },
    { id: 3, date: '04 Jun 2026', student: 'Priya Sharma', question: 'NOC upload question after college signature mismatch', awardedSp: 2, awardedBy: 'Admin', reason: 'Correct but basic answer' },
  ]);
  const [students, setStudents] = useState([
    { id: 1, name: 'Arjun Singh', email: 'arjun@iitropar.ac.in', sp: 450, status: 'active', joinDate: '2024-01-15' },
    { id: 2, name: 'Priya Sharma', email: 'priya@iitropar.ac.in', sp: 320, status: 'active', joinDate: '2024-02-10' },
    { id: 3, name: 'Rahul Patel', email: 'rahul@iitropar.ac.in', sp: 180, status: 'inactive', joinDate: '2024-03-05' },
  ]);

  const [applications, setApplications] = useState([
    { id: 1, student: 'Arjun Singh', status: 'verified', date: '2024-05-15' },
    { id: 2, student: 'Priya Sharma', status: 'pending', date: '2024-05-16' },
    { id: 3, student: 'Rahul Patel', status: 'rejected', date: '2024-05-14' },
  ]);

  const [nocQueue, setNocQueue] = useState([
    { id: 1, student: 'Neha Gupta', submitted: '2024-05-15', status: 'pending' },
    { id: 2, student: 'Vikram Kumar', submitted: '2024-05-14', status: 'verified' },
  ]);
  const [kbItems, setKbItems] = useState([]);
  const [kbSearch, setKbSearch] = useState('');
  const [kbCategory, setKbCategory] = useState('All');
  const [kbDialog, setKbDialog] = useState(null); // null | 'create' | 'edit'
  const [kbDraft, setKbDraft] = useState({ question: '', answer: '', category: '', tags: '', priority: 'medium' });
  const [kbLoading, setKbLoading] = useState(false);
  const [kbDeleteTarget, setKbDeleteTarget] = useState(null);

  const taskSummary = getTaskSummary(taskItems);
  const offerLetterMilestone = getJourneyMilestone(6);
  const leaderboardStudents = useMemo(
    () => [...students].sort((a, b) => (b.sp || 0) - (a.sp || 0)),
    [students],
  );
  const filteredLeaderboardStudents = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();
    if (!query) return leaderboardStudents;
    return leaderboardStudents.filter(student => [
      student.name,
      student.email,
      student.status,
      student.id,
      student.sp,
    ].filter(Boolean).join(' ').toLowerCase().includes(query));
  }, [leaderboardStudents, studentSearch]);
  const topThreeStudents = filteredLeaderboardStudents.slice(0, 3);
  const studentTotals = useMemo(() => ({
    total: students.length,
    active: students.filter(student => student.status === 'active').length,
    inactive: students.filter(student => student.status !== 'active').length,
    average: students.length ? Math.round(students.reduce((sum, student) => sum + Number(student.sp || 0), 0) / students.length) : 0,
  }), [students]);
  const filteredJourneyReviews = journeyReviews.filter(item => {
    const haystack = [
      item.milestoneTitle,
      item.submittedBy,
      item.comment,
      item.category,
      item.id,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(journeySearch.trim().toLowerCase());
  });
  const communityReplies = useMemo(
    () => communityDiscussions.flatMap(discussion =>
      discussion.replies.map(reply => ({
        ...reply,
        discussionId: discussion.id,
        questionTitle: discussion.title,
        category: discussion.category,
      })),
    ),
    [communityDiscussions],
  );
  const pendingCommunityReplies = useMemo(
    () => communityReplies.filter(reply => reply.status === 'pending'),
    [communityReplies],
  );
  const communityStats = useMemo(() => {
    const newDoubtsToday = communityDiscussions.filter(item => item.status === 'New').length;
    const unanswered = communityDiscussions.filter(item => item.replies.filter(reply => reply.status !== 'rejected').length === 0 || item.status === 'Unanswered').length;
    const awardedToday = spRewardHistory
      .filter(item => item.date === '05 Jun 2026')
      .reduce((total, item) => total + Number(item.awardedSp || 0), 0);
    return {
      newDoubtsToday,
      unanswered,
      pendingReplies: pendingCommunityReplies.length,
      awardedToday,
    };
  }, [communityDiscussions, pendingCommunityReplies.length, spRewardHistory]);
  const filteredCommunityDiscussions = useMemo(() => {
    const query = communitySearch.trim().toLowerCase();
    const filtered = communityDiscussions.filter(item => {
      const matchesQuery = !query || [item.student, item.title, item.description, item.category, item.status]
        .some(value => String(value).toLowerCase().includes(query));
      const matchesCategory = communityCategory === 'All' || item.category === communityCategory;
      return matchesQuery && matchesCategory;
    });

    return [...filtered].sort((a, b) => {
      if (communitySort === 'most-liked') {
        return b.replies.reduce((sum, reply) => sum + reply.likes, 0) - a.replies.reduce((sum, reply) => sum + reply.likes, 0);
      }
      if (communitySort === 'unanswered') {
        return Number(a.replies.length > 0) - Number(b.replies.length > 0);
      }
      if (communitySort === 'resolved') {
        return Number(b.resolved) - Number(a.resolved);
      }
      return b.id - a.id;
    });
  }, [communityCategory, communityDiscussions, communitySearch, communitySort]);
  const sortedAnnouncements = useMemo(
    () => [...announcementItems].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.createdAt || b.dateTime || 0) - new Date(a.createdAt || a.dateTime || 0);
    }),
    [announcementItems],
  );
  const pendingTeams = useMemo(
    () => teamItems.filter(team => team.status !== 'active'),
    [teamItems],
  );
  const adminNotifications = useMemo(() => {
    const reviewItems = journeyReviews.slice(0, 3).map(item => ({
      id: `review-${item.id}`,
      icon: '🛡',
      category: 'Moderation',
      title: item.milestoneTitle || 'Journey review pending',
      preview: `${item.submittedBy || 'Student'} submitted a milestone for admin review.`,
      meta: item.submittedAt ? formatAnnouncementTime(item.submittedAt) : 'Pending',
      onClick: () => setActiveSection('moderation'),
    }));

    const teamItemsForPanel = pendingTeams.slice(0, 3).map(team => ({
      id: `team-${team._id || team.name}`,
      icon: '👥',
      category: 'Teams',
      title: team.name || 'Project team pending',
      preview: `${team.leaderName || team.leaderId || 'Team lead'} is awaiting an admin decision.`,
      meta: team.createdAt ? formatAnnouncementTime(team.createdAt) : 'Pending',
      onClick: () => setActiveSection('teams'),
    }));

    const announcementPanelItems = sortedAnnouncements.slice(0, 4).map(announcement => ({
      id: announcement._id || announcement.id,
      icon: getAnnouncementCategoryIcon(announcement.category),
      category: announcement.category,
      title: announcement.title,
      preview: (announcement.body || '').slice(0, 80),
      meta: formatAnnouncementTime(announcement.createdAt || announcement.dateTime),
      pinned: announcement.pinned,
      onClick: () => setActiveSection('overview'),
    }));

    return [...reviewItems, ...teamItemsForPanel, ...announcementPanelItems];
  }, [journeyReviews, pendingTeams, sortedAnnouncements]);
  const unreadCount = adminNotifications.length;
  const loginTime = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
    hour12: true,
  }).format(loginTimestampRef.current).toUpperCase() + ' IST';

  function handleBackToDashboard() {
    setActiveSection('overview');
    navigate('/admin');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function handleProfileMenuAction() {
    setNotificationOpen(false);
    setProfileMenuOpen(false);
    setActiveSection('overview');
  }

  function handleIssueOfferLetter() {
    issueJourneyOfferLetter({
      issuedBy: 'Samagama Admin Team',
      remarks: 'Offer letter issued from the admin dashboard.',
      fileName: offerLetterMilestone?.data?.fileName || 'Vicharanashala_Offer_Letter.pdf',
    });
    setOfferLetterMessage('Offer letter issued successfully.');
    window.setTimeout(() => setOfferLetterMessage(''), 1800);
  }

  const stats = [
    { label: 'Total Students', value: '2,840', icon: '👥', trend: 12 },
    { label: 'Active Now', value: '642', icon: '🟢', trend: 8 },
    { label: 'Applications', value: '98%', icon: '📋', trend: 15 },
    { label: 'Avg SP Points', value: '385', icon: '⚡', trend: 22 },
  ];

  useEffect(() => {
    function handleDocumentClick(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
      if (
        notificationMenuRef.current &&
        !notificationMenuRef.current.contains(event.target) &&
        notificationButtonRef.current &&
        !notificationButtonRef.current.contains(event.target)
      ) {
        setNotificationOpen(false);
      }
    }

    document.addEventListener('mousedown', handleDocumentClick);
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, []);

  useEffect(() => {
    async function syncAnnouncements() {
      try {
        const data = await fetchAnnouncements();
        setAnnouncementItems(Array.isArray(data) ? data : []);
      } catch { setAnnouncementItems([]); }
    }

    async function syncTasks() {
      try {
        const data = await fetchTasks();
        setTaskItems(Array.isArray(data) ? data : []);
      } catch { setTaskItems([]); }
    }

    async function syncJourney() {
      try {
        const data = await fetchPendingReviews();
        setJourneyReviews(Array.isArray(data) ? data : []);
      } catch { setJourneyReviews([]); }
    }

    async function syncTeams() {
      try {
        const data = await fetchAdminTeams();
        setTeamItems(Array.isArray(data) ? data : []);
      } catch { setTeamItems([]); }
    }

    async function syncKnowledgeBase() {
      try {
        const data = await fetchKnowledgeBase({ limit: 50 });
        setKbItems(Array.isArray(data.items) ? data.items : Array.isArray(data) ? data : []);
      } catch { setKbItems([]); }
    }

    syncAnnouncements();
    syncTasks();
    syncJourney();
    syncTeams();
    syncKnowledgeBase();

    window.addEventListener('samagama-announcements-updated', syncAnnouncements);
    window.addEventListener('samagama-tasks-updated', syncTasks);
    window.addEventListener('samagama-journey-updated', syncJourney);
    window.addEventListener('samagama-teams-updated', syncTeams);
    const teamInterval = window.setInterval(syncTeams, 20000);
    return () => {
      window.removeEventListener('samagama-announcements-updated', syncAnnouncements);
      window.removeEventListener('samagama-tasks-updated', syncTasks);
      window.removeEventListener('samagama-journey-updated', syncJourney);
      window.removeEventListener('samagama-teams-updated', syncTeams);
      window.clearInterval(teamInterval);
    };
  }, []);

  async function refreshAnnouncementItems() {
    try {
      const data = await fetchAnnouncements();
      setAnnouncementItems(Array.isArray(data) ? data : []);
    } catch { setAnnouncementItems([]); }
  }

  async function handlePublishAnnouncement(event) {
    event.preventDefault();
    if (!announcementDraft.title.trim() || !announcementDraft.message.trim()) return;

    try {
      await publishAnnouncement({
        title: announcementDraft.title,
        message: announcementDraft.message,
        target: announcementDraft.target || 'all',
        postedBy: 'Samagama Admin Team',
      });
      await refreshAnnouncementItems();
      resetAnnouncementDraft();
      setAnnouncementMessage('Announcement posted successfully!');
      setTimeout(() => setAnnouncementMessage(''), 1800);
    } catch {
      setAnnouncementMessage('Failed to post announcement. Please try again.');
    }
  }

  function resetAnnouncementDraft() {
    setAnnouncementDraft({
      title: '',
      message: '',
      category: 'Announcement',
      priority: 'Medium',
      attachmentLink: '',
      attachmentLabel: 'Attachment',
      pinned: false,
      target: 'all',
    });
  }

  async function handleDeleteAnnouncement(id) {
    try {
      await removeAnnouncement(id);
      await refreshAnnouncementItems();
    } catch (error) {
      console.error('Failed to delete announcement:', error);
    }
  }

  async function finalizePublishAnnouncement({ replacePinned = false } = {}) {
    try {
      if (replacePinned) {
        const old = announcementItems.find(a => a.pinned);
        if (old?._id) await updateAnnouncement(old._id, { pinned: false });
      }
      await publishAnnouncement({
        title: announcementDraft.title,
        body: announcementDraft.message,
        category: announcementDraft.category,
        priority: announcementDraft.priority,
        pinned: announcementDraft.pinned,
        links: announcementDraft.attachmentLink
          ? [{ label: announcementDraft.attachmentLabel || 'Attachment', url: announcementDraft.attachmentLink }]
          : [],
      });
      await refreshAnnouncementItems();
      resetAnnouncementDraft();
      setAnnouncementMessage('Announcement posted successfully!');
      setTimeout(() => setAnnouncementMessage(''), 1800);
    } catch { setAnnouncementMessage('Failed to publish. Please try again.'); }
  }

  async function handleReplacePinnedAnnouncement() {
    if (!pinConflict) return;

    if (pinConflict.mode === 'publish') {
      await finalizePublishAnnouncement({ replacePinned: true });
    } else if (pinConflict.mode === 'toggle') {
      try {
        const old = announcementItems.find(a => a.pinned);
        if (old) await updateAnnouncement(old._id || old.id, { pinned: false });
        await updateAnnouncement(pinConflict.targetId, { pinned: true });
        await refreshAnnouncementItems();
      } catch { /* fail silently */ }
    }

    setPinConflict(null);
  }

  function handleCancelPinnedReplacement() {
    setPinConflict(null);
  }

  function openAnnouncementDialog(tab = 'create') {
    setAnnouncementDialogTab(tab);
    setAnnouncementDialogOpen(true);
    setNotificationOpen(false);
    setProfileMenuOpen(false);
  }

  function closeAnnouncementDialog() {
    setAnnouncementDialogOpen(false);
  }

  function openTaskDialog(tab = 'assign') {
    setTaskDialogTab(tab);
    setTaskDialogOpen(true);
    setNotificationOpen(false);
    setProfileMenuOpen(false);
  }

  function closeTaskDialog() {
    setTaskDialogOpen(false);
  }

  function showCommunityToast(message) {
    setCommunityToast(message);
    window.setTimeout(() => setCommunityToast(''), 2200);
  }

  function updateCommunityDiscussion(discussionId, updater) {
    setCommunityDiscussions(prev => prev.map(item => (item.id === discussionId ? updater(item) : item)));
  }

  function setCommunityStatus(discussionId, status) {
    updateCommunityDiscussion(discussionId, item => ({
      ...item,
      status,
      resolved: status === 'Resolved',
    }));
  }

  function toggleCommunityFlag(discussionId, key) {
    updateCommunityDiscussion(discussionId, item => ({ ...item, [key]: !item[key] }));
  }

  function openRewardDialog(discussionId, replyId) {
    const reply = communityReplies.find(item => item.discussionId === discussionId && item.id === replyId);
    if (!reply) return;
    setRewardDialog({ discussionId, replyId, sp: '5', reason: 'Helpful answer' });
  }

  function acceptCommunityReply({ awardSp = true } = {}) {
    if (!rewardDialog) return;
    const spValue = awardSp ? Math.max(0, Number(rewardDialog.sp || 0)) : 0;
    const targetReply = communityReplies.find(item => item.discussionId === rewardDialog.discussionId && item.id === rewardDialog.replyId);

    updateCommunityDiscussion(rewardDialog.discussionId, item => ({
      ...item,
      status: 'Answered',
      replies: item.replies.map(reply => reply.id === rewardDialog.replyId
        ? {
            ...reply,
            status: 'accepted',
            awardedSp: spValue,
            studentSp: reply.studentSp + spValue,
            acceptedAnswer: !item.replies.some(existing => existing.acceptedAnswer),
          }
        : reply),
    }));

    if (targetReply && spValue > 0) {
      setSpRewardHistory(prev => [
        {
          id: Date.now(),
          date: '05 Jun 2026',
          student: targetReply.student,
          question: targetReply.questionTitle,
          awardedSp: spValue,
          awardedBy: 'Admin',
          reason: rewardDialog.reason || 'Community contribution',
        },
        ...prev,
      ]);
    }

    showCommunityToast(spValue > 0
      ? `Your answer was accepted and awarded ${spValue} SP.`
      : 'Your answer was accepted without SP.');
    setRewardDialog(null);
  }

  function rejectCommunityReply() {
    if (!rejectDialog) return;
    updateCommunityDiscussion(rejectDialog.discussionId, item => ({
      ...item,
      replies: item.replies.map(reply => reply.id === rejectDialog.replyId
        ? { ...reply, status: 'rejected', rejectionNote: rejectDialog.note || 'Reviewed but not accepted.' }
        : reply),
    }));
    showCommunityToast('Your answer was reviewed but not accepted.');
    setRejectDialog(null);
  }

  function deleteCommunityReply() {
    if (!deleteDialog) return;
    updateCommunityDiscussion(deleteDialog.discussionId, item => ({
      ...item,
      replies: item.replies.filter(reply => reply.id !== deleteDialog.replyId),
    }));
    showCommunityToast('Reply removed from the discussion.');
    setDeleteDialog(null);
  }

  function addAdminReply(discussionId) {
    const draft = adminReplyDrafts[discussionId]?.trim();
    if (!draft) return;
    updateCommunityDiscussion(discussionId, item => ({
      ...item,
      status: 'Answered',
      replies: [
        {
          id: Date.now(),
          student: 'Admin Team',
          studentSp: 0,
          content: draft,
          timestamp: '05 Jun 2026, Just now',
          likes: 0,
          status: 'accepted',
          adminVerified: true,
          pinned: true,
        },
        ...item.replies,
      ],
    }));
    setAdminReplyDrafts(prev => ({ ...prev, [discussionId]: '' }));
    showCommunityToast('Admin verified reply posted above student replies.');
  }

  function mergeDuplicateQuestion(discussionId) {
    updateCommunityDiscussion(discussionId, item => ({
      ...item,
      status: 'Resolved',
      resolved: true,
      locked: true,
      description: `${item.description} Duplicate merged into the primary community thread.`,
    }));
    showCommunityToast('Duplicate question merged and locked.');
  }

  async function handlePublishTask(event) {
    event.preventDefault();
    if (!taskDraft.title.trim() || !taskDraft.description.trim() || !taskDraft.deadline) return;
    try {
      await createTask({
        title: taskDraft.title,
        description: taskDraft.description,
        category: taskDraft.category,
        deadline: taskDraft.deadline,
        priority: taskDraft.priority,
        links: taskDraft.attachmentLink ? [{ label: 'Link', url: taskDraft.attachmentLink }] : [],
        slots: taskDraft.slots.split(',').map(s => s.trim()).filter(Boolean),
        phase: 1,
      });
      const data = await fetchTasks();
      setTaskItems(Array.isArray(data) ? data : []);
      setTaskDraft({ title: '', description: '', category: 'General', deadline: '', priority: 'Medium', attachmentLink: '', slots: '' });
      setTaskMessage('Internship task assigned successfully.');
      setTimeout(() => setTaskMessage(''), 1800);
    } catch { setTaskMessage('Failed to create task. Please try again.'); }
  }

  async function handleJourneyReview(reviewId, decision) {
    try {
      await reviewSubmission(reviewId, decision, decision === 'approved' ? 'Approved by admin moderation.' : 'Please revise and resubmit.');
      const data = await fetchPendingReviews();
      setJourneyReviews(Array.isArray(data) ? data : []);
    } catch { /* silently fail */ }
  }

  async function handleTeamDecision(teamId, action) {
    try {
      const response = await decideAdminTeam(teamId, action);
      if (response?.error) throw new Error(response.error);
      setTeamItems(prev => prev.map(item => (item._id === teamId ? { ...item, ...response } : item)));
      setTeamMessage(action === 'approve' ? 'Team approved successfully.' : 'Team rejected successfully.');
      window.dispatchEvent(new Event('samagama-teams-updated'));
      window.setTimeout(() => setTeamMessage(''), 2000);
    } catch (error) {
      setTeamMessage(error?.message || 'Unable to update team status.');
      window.setTimeout(() => setTeamMessage(''), 2000);
    }
  }

  return (
    <div style={styles.dashboard}>
      {/* Cosmic background */}
      <div style={styles.cosmicBg1} />
      <div style={styles.cosmicBg2} />

      <div style={styles.container}>
        <header style={adminNavStyles.bar}>
          <button type="button" onClick={handleBackToDashboard} style={adminNavStyles.backBtn} className="student-nav-back-btn">
            ← Back to Dashboard
          </button>

          <div style={adminNavStyles.centerTitle}>Admin Portal</div>

          <div style={adminNavStyles.rightRow}>
            <div ref={notificationMenuRef} style={adminNavStyles.notificationWrap}>
              <button
                ref={notificationButtonRef}
                type="button"
                aria-label="Notifications"
                aria-expanded={notificationOpen}
                style={adminNavStyles.iconBtn}
                className="student-nav-icon-btn"
                onClick={() => {
                  setProfileMenuOpen(false);
                  setNotificationOpen(prev => !prev);
                }}
              >
                <span style={adminNavStyles.iconGlyph}>🔔</span>
                {unreadCount > 0 && (
                  <span style={adminNavStyles.notificationDot}>{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
              </button>

              {notificationOpen && (
                <div style={adminNavStyles.notificationPanel}>
                  <div style={adminNavStyles.notificationHeader}>
                    <div>
                      <div style={adminNavStyles.notificationTitle}>Notifications</div>
                      <div style={adminNavStyles.notificationSubtitle}>Admin updates and pending actions</div>
                    </div>
                  </div>

                  <div style={adminNavStyles.notificationList}>
                    {adminNotifications.length === 0 ? (
                      <div style={adminNavStyles.emptyState}>
                        <strong style={adminNavStyles.emptyTitle}>No notifications yet.</strong>
                        <p style={adminNavStyles.emptyText}>
                          Pending reviews, team approvals, and recent announcements will appear here.
                        </p>
                      </div>
                    ) : (
                      adminNotifications.map(item => (
                        <button
                          key={item.id}
                          type="button"
                          className="student-announcement-card"
                          style={{
                            ...adminNavStyles.announcementCard,
                            ...(item.pinned ? adminNavStyles.pinnedCard : {}),
                          }}
                          onClick={() => {
                            item.onClick();
                            setNotificationOpen(false);
                          }}
                        >
                          <div style={adminNavStyles.announcementTopRow}>
                            <div style={{
                              ...adminNavStyles.announcementAccent,
                              ...adminNavStyles.announcementAccentUnread,
                            }} />
                            <div style={adminNavStyles.announcementIcon}>{item.icon}</div>
                            <div style={adminNavStyles.announcementBody}>
                              <div style={adminNavStyles.announcementMetaRow}>
                                <span style={adminNavStyles.categoryBadge}>{item.category}</span>
                                {item.pinned && <span style={adminNavStyles.pinnedBadge}>📌 Pinned Announcement</span>}
                                <span style={adminNavStyles.newBadge}>NEW</span>
                              </div>
                              <div style={{ ...adminNavStyles.announcementTitle, ...adminNavStyles.announcementTitleUnread }}>
                                {item.title}
                              </div>
                              <div style={adminNavStyles.announcementPreview}>{item.preview}</div>
                              <div style={adminNavStyles.announcementBottomRow}>
                                <span style={adminNavStyles.adminBadge}>Admin Team</span>
                                <span style={adminNavStyles.timeText}>{item.meta}</span>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div ref={profileMenuRef} style={adminNavStyles.profileWrap}>
              <button
                type="button"
                aria-label="Profile menu"
                aria-expanded={profileMenuOpen}
                onClick={() => {
                  setNotificationOpen(false);
                  setProfileMenuOpen(prev => !prev);
                }}
                style={adminNavStyles.avatarBtn}
                className="student-nav-avatar-btn"
              >
                A
                <span style={adminNavStyles.avatarChevron}>▾</span>
              </button>
              {profileMenuOpen && (
                <div style={adminNavStyles.dropdown}>
                  <button
                    type="button"
                    onClick={handleProfileMenuAction}
                    style={adminNavStyles.dropdownItem}
                    className="student-nav-dropdown-item"
                  >
                    View Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      handleLogout();
                    }}
                    style={adminNavStyles.dropdownItem}
                    className="student-nav-dropdown-item"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <section style={adminHeaderStyles.shell}>
          <div style={adminHeaderStyles.banner}>
            <span style={adminHeaderStyles.bannerDot} />
            <span style={adminHeaderStyles.bannerText}>
              <strong>ADMIN</strong> logged in at {loginTime}
            </span>
          </div>

          <div style={adminHeaderStyles.hero}>
            <div style={adminHeaderStyles.heroCopy}>
              <h1 style={adminHeaderStyles.title}>Welcome, Admin</h1>
              <p style={adminHeaderStyles.subtitle}>
                Manage students, announcements, internship progress, community discussions, tasks, and platform operations from one dashboard.
              </p>
            </div>
          </div>
        </section>

        <div style={styles.contentArea}>
          {/* ═══ Dashboard Overview ═══════════════════════════ */}
          {activeSection === 'overview' && (
            <>
            <div style={styles.headerSection}>
              <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#fff' }}>Dashboard Overview</h2>
              <p style={{ margin: '8px 0 0', color: '#94a3b8', fontSize: 14 }}>Monitor platform activity, student progress, and critical operations</p>
            </div>

            <style>{`
              .admin-stats-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 16px;
                margin-bottom: 32px;
              }
              @media (min-width: 768px) {
                .admin-stats-grid {
                  grid-template-columns: repeat(3, 1fr);
                }
              }
              @media (min-width: 1024px) {
                .admin-stats-grid {
                  grid-template-columns: repeat(6, 1fr);
                }
              }
              .admin-stat-card {
                background: rgba(255, 255, 255, 0.04);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 16px;
                padding: 20px;
                transition: transform 0.2s ease, box-shadow 0.2s ease;
                display: flex;
                flex-direction: column;
                gap: 8px;
                position: relative;
                overflow: hidden;
              }
              .admin-stat-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
              }
              .admin-stat-icon {
                font-size: 28px;
                margin-bottom: 4px;
                text-align: left;
              }
              .admin-stat-value {
                font-size: 24px;
                font-weight: 800;
                color: #ffffff;
              }
              .admin-stat-label {
                font-size: 10px;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: #a78bfa;
              }
              .admin-stat-subtitle {
                font-size: 11px;
                color: #94a3b8;
                line-height: 1.3;
              }
            `}</style>

            <div className="admin-stats-grid">
              {[
                { icon: '👥', label: 'Total Interns', value: '1,240', subtitle: 'Registered on platform', accent: '#a78bfa' },
                { icon: '🟢', label: 'Active Today', value: '847', subtitle: 'Submitted standup today', accent: '#34d399' },
                { icon: '📄', label: 'NOC Pending', value: '23', subtitle: 'Awaiting admin review', accent: '#fb923c' },
                { icon: '📋', label: 'Offer Letters Issued', value: '1,189', subtitle: 'Auto-generated after NOC', accent: '#60a5fa' },
                { icon: '🏆', label: 'Completed Internship', value: '312', subtitle: 'Bronze + Silver done', accent: '#fbbf24' },
                { icon: '⚠️', label: 'Drop-offs', value: '48', subtitle: 'Inactive over 14 days', accent: '#f87171' },
              ].map((s, i) => (
                <div key={i} className="admin-stat-card" style={{ borderLeft: `4px solid ${s.accent}` }}>
                  <div className="admin-stat-icon">{s.icon}</div>
                  <div className="admin-stat-value">{s.value}</div>
                  <div className="admin-stat-label">{s.label}</div>
                  <div className="admin-stat-subtitle">{s.subtitle}</div>
                </div>
              ))}
            </div>

            <div style={styles.gridRow}>
              <div style={glassCard({ flex: 1 })}>
                <SectionTitle icon="📢" label="Announcements" action={`${announcementItems.length} total`} />
                <div style={styles.announcementLauncher}>
                  <div>
                    <div style={styles.announcementLauncherTitle}>Announcement Dialog</div>
                    <div style={styles.announcementLauncherText}>
                      Open one place to create an announcement or review recent announcements.
                    </div>
                  </div>
                  <div style={styles.announcementLauncherActions}>
                    <button
                      type="button"
                      onClick={() => openAnnouncementDialog('create')}
                      style={styles.announcementLauncherPrimary}
                    >
                      Create Announcement
                    </button>
                    <button
                      type="button"
                      onClick={() => openAnnouncementDialog('recent')}
                      style={styles.announcementLauncherSecondary}
                    >
                      Recent Announcement
                    </button>
                  </div>
                </div>
              </div>

              <div style={glassCard({ flex: 1 })}>
                <SectionTitle icon="👥" label="Community Hub" action={`${pendingCommunityReplies.length} replies pending`} />
                <div style={styles.communityPreviewGrid}>
                  <div style={styles.communityPreviewStat}>
                    <strong>{communityStats.newDoubtsToday}</strong>
                    <span>New Doubts Today</span>
                  </div>
                  <div style={styles.communityPreviewStat}>
                    <strong>{communityStats.unanswered}</strong>
                    <span>Unanswered Doubts</span>
                  </div>
                  <div style={styles.communityPreviewStat}>
                    <strong>{communityStats.pendingReplies}</strong>
                    <span>Replies Pending Review</span>
                  </div>
                  <div style={styles.communityPreviewStat}>
                    <strong>{communityStats.awardedToday}</strong>
                    <span>SP Awarded Today</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCommunityTab('Reply Review Queue');
                    setActiveSection('community');
                  }}
                  style={styles.communityOpenBtn}
                >
                  Open Community Hub →
                </button>
              </div>
            </div>

            <div style={{ ...styles.gridRow, marginTop: 20 }}>
              <div style={glassCard({ flex: 1 })}>
                <SectionTitle icon="📋" label="Internship Task" action={`${taskSummary.total} tasks`} />
                <div style={styles.taskLauncher}>
                  <div>
                    <div style={styles.announcementLauncherTitle}>Internship Task Dialog</div>
                    <div style={styles.announcementLauncherText}>
                      Open one place to assign internship tasks or review the task summary.
                    </div>
                  </div>
                  <div style={styles.announcementLauncherActions}>
                    <button
                      type="button"
                      onClick={() => openTaskDialog('assign')}
                      style={styles.taskLauncherPrimary}
                    >
                      Assign Internship Task
                    </button>
                    <button
                      type="button"
                      onClick={() => openTaskDialog('summary')}
                      style={styles.announcementLauncherSecondary}
                    >
                      Task Summary
                    </button>
                  </div>
                </div>
              </div>
            </div>

            </>
          )}

          {/* ═══ Student Management ════════════════════════════ */}
          {activeSection === 'students' && (
            <>
            <div style={styles.headerSection}>
              <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#fff' }}>Student Management</h2>
              <p style={{ margin: '8px 0 0', color: '#94a3b8', fontSize: 14 }}>Track student profiles, SP Points, and account activity</p>
            </div>

            <div style={glassCard()}>
              <SectionTitle icon="👥" label="Active Students" action={`${students.length} total`} />
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <th style={{ textAlign: 'left', padding: '12px 0', color: '#94a3b8', fontWeight: 600 }}>Name</th>
                      <th style={{ textAlign: 'left', padding: '12px 0', color: '#94a3b8', fontWeight: 600 }}>Email</th>
                      <th style={{ textAlign: 'center', padding: '12px 0', color: '#94a3b8', fontWeight: 600 }}>SP Points</th>
                      <th style={{ textAlign: 'center', padding: '12px 0', color: '#94a3b8', fontWeight: 600 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(s => (
                      <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '12px 0', color: '#fff' }}>{s.name}</td>
                        <td style={{ padding: '12px 0', color: '#94a3b8' }}>{s.email}</td>
                        <td style={{ padding: '12px 0', textAlign: 'center', color: '#fbbf24' }}>⚡ {s.sp}</td>
                        <td style={{ padding: '12px 0', textAlign: 'center' }}>
                          <span style={{ padding: '4px 8px', borderRadius: 6, background: s.status === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(107,114,128,0.15)', fontSize: 12, color: s.status === 'active' ? '#6ee7b7' : '#9ca3af' }}>
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            </>
          )}

          {/* ═══ Leaderboard ══════════════════════════════════ */}
          {activeSection === 'leaderboard' && (
            <>
            <div style={styles.headerSection}>
              <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#fff' }}>Student Leaderboard</h2>
              <p style={{ margin: '8px 0 0', color: '#94a3b8', fontSize: 14 }}>View all students ranked by SP Points and contribution status</p>
            </div>

            <div style={styles.leaderboardSummaryGrid}>
              <div style={glassCard()}>
                <SectionTitle icon="🏆" label="Leaderboard Summary" />
                <div style={styles.leaderboardStats}>
                  <div style={styles.leaderStat}><strong>{studentTotals.total}</strong><span>Total Students</span></div>
                  <div style={styles.leaderStat}><strong>{studentTotals.active}</strong><span>Active</span></div>
                  <div style={styles.leaderStat}><strong>{studentTotals.inactive}</strong><span>Inactive</span></div>
                  <div style={styles.leaderStat}><strong>{studentTotals.average}</strong><span>Avg SP</span></div>
                </div>
              </div>

              <div style={glassCard()}>
                <SectionTitle icon="🔎" label="Search Students" action={`${filteredLeaderboardStudents.length} shown`} />
                <input
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                  placeholder="Search by name, email, status, or SP points..."
                  style={{
                    width: '100%',
                    borderRadius: 14,
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.03)',
                    color: '#e2e8f0',
                    padding: '12px 14px',
                    outline: 'none',
                  }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginTop: 14 }}>
                  {topThreeStudents.map((student, index) => (
                    <div key={student.id} style={{
                      padding: 14,
                      borderRadius: 16,
                      background: index === 0 ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.03)',
                      border: index === 0 ? '1px solid rgba(59,130,246,0.24)' : '1px solid rgba(255,255,255,0.08)',
                    }}>
                      <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>#{index + 1}</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginTop: 8 }}>{student.name}</div>
                      <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 4 }}>{student.email}</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#fbbf24', marginTop: 8 }}>⚡ {student.sp}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={glassCard({ marginTop: 20 })}>
              <SectionTitle icon="📋" label="All Students" action="Ranked by SP Points" />
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <th style={{ textAlign: 'left', padding: '12px 0', color: '#94a3b8', fontWeight: 600 }}>Rank</th>
                      <th style={{ textAlign: 'left', padding: '12px 0', color: '#94a3b8', fontWeight: 600 }}>Name</th>
                      <th style={{ textAlign: 'left', padding: '12px 0', color: '#94a3b8', fontWeight: 600 }}>Email</th>
                      <th style={{ textAlign: 'center', padding: '12px 0', color: '#94a3b8', fontWeight: 600 }}>SP Points</th>
                      <th style={{ textAlign: 'center', padding: '12px 0', color: '#94a3b8', fontWeight: 600 }}>Status</th>
                      <th style={{ textAlign: 'left', padding: '12px 0', color: '#94a3b8', fontWeight: 600 }}>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeaderboardStudents.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ padding: '18px 0', color: '#94a3b8', textAlign: 'center' }}>
                          No students match your search.
                        </td>
                      </tr>
                    ) : filteredLeaderboardStudents.map((student, index) => (
                      <tr key={student.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '12px 0', color: index < 3 ? '#fbbf24' : '#e2e8f0', fontWeight: 800 }}>#{index + 1}</td>
                        <td style={{ padding: '12px 0', color: '#fff', fontWeight: 700 }}>{student.name}</td>
                        <td style={{ padding: '12px 0', color: '#94a3b8' }}>{student.email}</td>
                        <td style={{ padding: '12px 0', textAlign: 'center', color: '#fbbf24', fontWeight: 800 }}>⚡ {student.sp}</td>
                        <td style={{ padding: '12px 0', textAlign: 'center' }}>
                          <span style={{ padding: '4px 8px', borderRadius: 6, background: student.status === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(107,114,128,0.15)', fontSize: 12, color: student.status === 'active' ? '#6ee7b7' : '#9ca3af' }}>
                            {student.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 0', color: '#94a3b8' }}>
                          {student.joinDate ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(student.joinDate)) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ═══ Applications ══════════════════════════════════ */}
        {activeSection === 'applications' && (
          <>
            <div style={styles.headerSection}>
              <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#fff' }}>Internship Applications</h2>
              <p style={{ margin: '8px 0 0', color: '#94a3b8', fontSize: 14 }}>Review and manage student internship applications</p>
            </div>

            <div style={glassCard({ marginBottom: 20 })}>
              <SectionTitle icon="📨" label="Offer Letter Management" action={offerLetterMilestone?.data?.issuedAt ? 'Issued' : 'Awaiting issue'} />
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Download Offer Letter</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                      {offerLetterMilestone?.data?.issuedAt
                        ? `Issued on ${new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(offerLetterMilestone.data.issuedAt))}`
                        : 'Locked until admin issues the offer letter.'}
                    </div>
                  </div>
                  <span style={{
                    padding: '6px 10px',
                    borderRadius: 999,
                    background: offerLetterMilestone?.data?.issuedAt ? 'rgba(34,197,94,0.14)' : 'rgba(107,114,128,0.16)',
                    border: offerLetterMilestone?.data?.issuedAt ? '1px solid rgba(34,197,94,0.22)' : '1px solid rgba(107,114,128,0.22)',
                    color: offerLetterMilestone?.data?.issuedAt ? '#86efac' : '#cbd5e1',
                    fontSize: 12,
                    fontWeight: 800,
                  }}>
                    {offerLetterMilestone?.data?.issuedAt ? 'Issued' : 'Locked'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  <button
                    type="button"
                    onClick={handleIssueOfferLetter}
                    style={{
                      border: '1px solid rgba(59,130,246,0.22)',
                      background: 'linear-gradient(135deg, rgba(124,111,247,0.16), rgba(56,189,248,0.14))',
                      color: '#e0e7ff',
                      borderRadius: 12,
                      padding: '10px 14px',
                      fontWeight: 800,
                    }}
                  >
                    {offerLetterMilestone?.data?.issuedAt ? 'Reissue Offer Letter' : 'Issue Offer Letter'}
                  </button>
                </div>
                {offerLetterMessage && (
                  <div style={{ color: '#a7f3d0', fontSize: 13, fontWeight: 700 }}>
                    {offerLetterMessage}
                  </div>
                )}
              </div>
            </div>

            <div style={glassCard()}>
              <SectionTitle icon="📝" label="Application Status" />
              <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                <div style={{ flex: 1, padding: 12, background: 'rgba(16,185,129,0.1)', borderRadius: 12, border: '1px solid rgba(16,185,129,0.2)' }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981' }}>98%</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Verification Rate</div>
                </div>
                <div style={{ flex: 1, padding: 12, background: 'rgba(245,158,11,0.1)', borderRadius: 12, border: '1px solid rgba(245,158,11,0.2)' }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#f59e0b' }}>{applications.filter(a => a.status === 'pending').length}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Pending Review</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {applications.map(app => (
                  <div key={app.id} style={{ padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{app.student}</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Applied {app.date}</div>
                    </div>
                    <span style={{ padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: app.status === 'verified' ? 'rgba(16,185,129,0.15)' : app.status === 'pending' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)', color: app.status === 'verified' ? '#6ee7b7' : app.status === 'pending' ? '#fbbf24' : '#f87171' }}>
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ═══ Teams ═══════════════════════════════════════ */}
        {activeSection === 'teams' && (
          <>
            <div style={styles.headerSection}>
              <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#fff' }}>Project Teams</h2>
              <p style={{ margin: '8px 0 0', color: '#94a3b8', fontSize: 14 }}>Monitor team formation, approvals, invitations, and progress</p>
            </div>

            <div style={glassCard()}>
              <SectionTitle icon="👥" label="All Teams" action={`${teamItems.length} teams`} />
              {teamMessage && (
                <div style={{ padding: 12, borderRadius: 12, background: 'rgba(16,185,129,0.14)', color: '#a7f3d0', marginBottom: 14 }}>
                  {teamMessage}
                </div>
              )}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <th style={{ textAlign: 'left', padding: '12px 0', color: '#94a3b8', fontWeight: 600 }}>Team</th>
                      <th style={{ textAlign: 'left', padding: '12px 0', color: '#94a3b8', fontWeight: 600 }}>Leader</th>
                      <th style={{ textAlign: 'center', padding: '12px 0', color: '#94a3b8', fontWeight: 600 }}>Members</th>
                      <th style={{ textAlign: 'center', padding: '12px 0', color: '#94a3b8', fontWeight: 600 }}>Pending Invites</th>
                      <th style={{ textAlign: 'center', padding: '12px 0', color: '#94a3b8', fontWeight: 600 }}>Join Requests</th>
                      <th style={{ textAlign: 'center', padding: '12px 0', color: '#94a3b8', fontWeight: 600 }}>Accepted / Rejected</th>
                      <th style={{ textAlign: 'center', padding: '12px 0', color: '#94a3b8', fontWeight: 600 }}>Status</th>
                      <th style={{ textAlign: 'left', padding: '12px 0', color: '#94a3b8', fontWeight: 600 }}>Created</th>
                      <th style={{ textAlign: 'right', padding: '12px 0', color: '#94a3b8', fontWeight: 600 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamItems.length === 0 ? (
                      <tr>
                        <td colSpan="9" style={{ padding: '18px 0', color: '#94a3b8', textAlign: 'center' }}>
                          No project teams yet.
                        </td>
                      </tr>
                    ) : teamItems.map(team => (
                      <tr key={team._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '12px 0', color: '#fff', fontWeight: 700 }}>
                          {team.name}
                          <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>{team.domain}</div>
                        </td>
                        <td style={{ padding: '12px 0', color: '#e2e8f0' }}>{team.leaderName || team.leaderId}</td>
                        <td style={{ padding: '12px 0', textAlign: 'center', color: '#fbbf24' }}>{team.memberCount || 0}</td>
                        <td style={{ padding: '12px 0', textAlign: 'center', color: '#93c5fd' }}>{team.pendingInviteCount || 0}</td>
                        <td style={{ padding: '12px 0', textAlign: 'center', color: '#c4b5fd' }}>{Array.isArray(team.joinRequests) ? team.joinRequests.length : 0}</td>
                        <td style={{ padding: '12px 0', textAlign: 'center', color: '#e9d5ff' }}>
                          {team.acceptedMemberCount || 1} / {team.rejectedMemberCount || 0}
                        </td>
                        <td style={{ padding: '12px 0', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: 999,
                            background: team.status === 'active'
                              ? 'rgba(16,185,129,0.15)'
                              : team.status === 'rejected'
                                ? 'rgba(239,68,68,0.15)'
                                : 'rgba(251,191,36,0.15)',
                            fontSize: 12,
                            color: team.status === 'active'
                              ? '#6ee7b7'
                              : team.status === 'rejected'
                                ? '#f87171'
                                : '#fbbf24',
                            fontWeight: 700,
                          }}>
                            {team.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 0', color: '#94a3b8' }}>
                          {team.createdAt ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(team.createdAt)) : '—'}
                        </td>
                        <td style={{ padding: '12px 0', textAlign: 'right' }}>
                          {team.status !== 'active' ? (
                            <div style={{ display: 'inline-flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                              <button type="button" onClick={() => handleTeamDecision(team._id, 'approve')} style={{
                                border: '1px solid rgba(16,185,129,0.22)',
                                background: 'rgba(16,185,129,0.12)',
                                color: '#a7f3d0',
                                borderRadius: 10,
                                padding: '8px 10px',
                                fontSize: 11,
                                fontWeight: 800,
                              }}>
                                Approve
                              </button>
                              <button type="button" onClick={() => handleTeamDecision(team._id, 'reject')} style={{
                                border: '1px solid rgba(239,68,68,0.22)',
                                background: 'rgba(239,68,68,0.12)',
                                color: '#fecaca',
                                borderRadius: 10,
                                padding: '8px 10px',
                                fontSize: 11,
                                fontWeight: 800,
                              }}>
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: 12 }}>Monitored</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ═══ Community Hub Management ═════════════════════ */}
        {activeSection === 'community' && (
          <>
            <div style={styles.headerSection}>
              <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#fff' }}>Community Hub Management</h2>
              <p style={{ margin: '8px 0 0', color: '#94a3b8', fontSize: 14 }}>Moderate doubts, review replies, award SP, and keep community discussions high quality.</p>
            </div>

            {communityToast && (
              <div style={styles.communityToast}>{communityToast}</div>
            )}

            <div style={styles.communityStatsGrid}>
              {[
                { label: 'New Doubts Today', value: `${communityStats.newDoubtsToday} New Doubts` },
                { label: 'Unanswered Doubts', value: `${communityStats.unanswered} Unanswered` },
                { label: 'Pending Review Replies', value: `${communityStats.pendingReplies} Replies Pending Review` },
                { label: 'SP Rewards Given Today', value: `${communityStats.awardedToday} SP Awarded Today` },
              ].map(item => (
                <div key={item.label} style={styles.communityMetricCard}>
                  <div style={styles.communityMetricValue}>{item.value}</div>
                  <div style={styles.communityMetricLabel}>{item.label}</div>
                </div>
              ))}
            </div>

            <div style={glassCard()}>
              <div style={styles.communityTabs}>
                {communityTabs.map(tab => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setCommunityTab(tab)}
                    style={{
                      ...styles.communityTab,
                      ...(communityTab === tab ? styles.communityTabActive : {}),
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {communityTab === 'New Doubts' && (
                <div style={styles.communityPanelList}>
                  {communityDiscussions.map(doubt => (
                    <article key={doubt.id} style={styles.communityDiscussionCard}>
                      <div style={styles.communityCardTop}>
                        <div>
                          <div style={styles.communityMetaLine}>{doubt.student} · {doubt.timestamp} · {doubt.category}</div>
                          <h3 style={styles.communityCardTitle}>{doubt.title}</h3>
                          <p style={styles.communityCardText}>{doubt.description}</p>
                        </div>
                        <span style={styles.communityStatusPill}>{doubt.status}</span>
                      </div>
                      <div style={styles.communityCardMeta}>
                        <span>{doubt.replies.length} replies</span>
                        {doubt.pinned && <span>Pinned Question</span>}
                        {doubt.locked && <span>Locked</span>}
                      </div>
                      <div style={styles.communityActionRow}>
                        <button type="button" style={styles.communityGhostBtn} onClick={() => { setCommunitySearch(doubt.title); setCommunityTab('All Discussions'); }}>Open Discussion</button>
                        <button type="button" style={styles.communityGhostBtn} onClick={() => setCommunityTab('Admin Participation')}>Reply as Admin</button>
                        <button type="button" style={styles.communityApproveBtn} onClick={() => setCommunityStatus(doubt.id, 'Resolved')}>Mark Resolved</button>
                        <button type="button" style={styles.communityGhostBtn} onClick={() => toggleCommunityFlag(doubt.id, 'pinned')}>{doubt.pinned ? 'Unpin Question' : 'Pin Question'}</button>
                        <button type="button" style={styles.communityDangerBtn} onClick={() => setCommunityDiscussions(prev => prev.filter(item => item.id !== doubt.id))}>Delete Question</button>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {communityTab === 'Reply Review Queue' && (
                <div style={styles.communityPanelList}>
                  {communityReplies.map(reply => (
                    <article key={`${reply.discussionId}-${reply.id}`} style={styles.communityReviewCard}>
                      <div style={styles.communityCardTop}>
                        <div>
                          <div style={styles.communityMetaLine}>{reply.student} · SP {reply.studentSp} · {reply.timestamp}</div>
                          <h3 style={styles.communityCardTitle}>{reply.questionTitle}</h3>
                        </div>
                        <span style={{
                          ...styles.communityStatusPill,
                          ...(reply.status === 'accepted' ? styles.communityAcceptedPill : {}),
                          ...(reply.status === 'rejected' ? styles.communityRejectedPill : {}),
                        }}>
                          {reply.acceptedAnswer ? '✅ Accepted Answer' : reply.status}
                        </span>
                      </div>
                      <p style={styles.communityReplyText}>{reply.content}</p>
                      <div style={styles.communityCardMeta}>
                        <span>Linked to: {reply.questionTitle}</span>
                        <span>{reply.likes} likes received</span>
                        {reply.adminVerified && <span>🛡 Admin Verified</span>}
                        {reply.awardedSp ? <span>+{reply.awardedSp} SP awarded</span> : null}
                      </div>
                      {reply.rejectionNote && <div style={styles.communityNote}>Note: {reply.rejectionNote}</div>}
                      <div style={styles.communityActionRow}>
                        <button type="button" style={styles.communityApproveBtn} onClick={() => openRewardDialog(reply.discussionId, reply.id)}>Accept Reply</button>
                        <button type="button" style={styles.communityGhostBtn} onClick={() => setRejectDialog({ discussionId: reply.discussionId, replyId: reply.id, note: '' })}>Reject Reply</button>
                        <button type="button" style={styles.communityDangerBtn} onClick={() => setDeleteDialog({ discussionId: reply.discussionId, replyId: reply.id })}>Delete Reply</button>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {communityTab === 'All Discussions' && (
                <div style={styles.communityPanelList}>
                  <div style={styles.communityFilterBar}>
                    <input value={communitySearch} onChange={e => setCommunitySearch(e.target.value)} placeholder="Search discussions..." />
                    <select value={communityCategory} onChange={e => setCommunityCategory(e.target.value)}>
                      {['All', ...communityCategories].map(category => <option key={category} value={category}>{category}</option>)}
                    </select>
                    <select value={communitySort} onChange={e => setCommunitySort(e.target.value)}>
                      <option value="latest">Sort by latest</option>
                      <option value="most-liked">Sort by most liked</option>
                      <option value="unanswered">Sort by unanswered</option>
                      <option value="resolved">Sort by resolved</option>
                    </select>
                  </div>

                  {filteredCommunityDiscussions.map(discussion => (
                    <article key={discussion.id} style={styles.communityDiscussionCard}>
                      <div style={styles.communityCardTop}>
                        <div>
                          <div style={styles.communityMetaLine}>{discussion.student} · {discussion.category} · {discussion.timestamp}</div>
                          <h3 style={styles.communityCardTitle}>{discussion.title}</h3>
                          <p style={styles.communityCardText}>{discussion.description}</p>
                        </div>
                        <span style={styles.communityStatusPill}>{discussion.status}</span>
                      </div>
                      <div style={styles.communityReplyStack}>
                        {[...discussion.replies]
                          .sort((a, b) => Number(b.adminVerified || b.acceptedAnswer || b.pinned) - Number(a.adminVerified || a.acceptedAnswer || a.pinned))
                          .slice(0, 3)
                          .map(reply => (
                            <div key={reply.id} style={styles.communityMiniReply}>
                              <strong>{reply.adminVerified ? '🛡 Admin Verified' : reply.acceptedAnswer ? '✅ Accepted Answer' : reply.student}</strong>
                              <span>{reply.content}</span>
                            </div>
                          ))}
                      </div>
                      <div style={styles.communityActionRow}>
                        <button type="button" style={styles.communityGhostBtn} onClick={() => toggleCommunityFlag(discussion.id, 'pinned')}>{discussion.pinned ? 'Unpin Question' : 'Pin Question'}</button>
                        <button type="button" style={styles.communityGhostBtn} onClick={() => toggleCommunityFlag(discussion.id, 'locked')}>{discussion.locked ? 'Unlock Discussion' : 'Lock Discussion'}</button>
                        <button type="button" style={styles.communityGhostBtn} onClick={() => mergeDuplicateQuestion(discussion.id)}>Merge Duplicate</button>
                        <button type="button" style={styles.communityDangerBtn} onClick={() => setCommunityDiscussions(prev => prev.filter(item => item.id !== discussion.id))}>Remove Spam</button>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {communityTab === 'Admin Participation' && (
                <div style={styles.communityPanelList}>
                  {communityDiscussions.map(discussion => (
                    <article key={discussion.id} style={styles.communityDiscussionCard}>
                      <div style={styles.communityCardTop}>
                        <div>
                          <div style={styles.communityMetaLine}>{discussion.category} · {discussion.replies.length} replies</div>
                          <h3 style={styles.communityCardTitle}>{discussion.title}</h3>
                          <p style={styles.communityCardText}>{discussion.description}</p>
                        </div>
                        <span style={styles.communityStatusPill}>{discussion.locked ? 'Locked' : discussion.status}</span>
                      </div>
                      <textarea
                        value={adminReplyDrafts[discussion.id] || ''}
                        onChange={e => setAdminReplyDrafts(prev => ({ ...prev, [discussion.id]: e.target.value }))}
                        placeholder="Reply as Admin..."
                        rows="3"
                        disabled={discussion.locked}
                      />
                      <div style={styles.communityActionRow}>
                        <button type="button" style={styles.communityApproveBtn} onClick={() => addAdminReply(discussion.id)} disabled={discussion.locked}>Reply as Admin</button>
                        <button type="button" style={styles.communityGhostBtn} onClick={() => toggleCommunityFlag(discussion.id, 'locked')}>{discussion.locked ? 'Unlock Discussion' : 'Lock Discussion'}</button>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {communityTab === 'SP Reward History' && (
                <div style={styles.communityPanelList}>
                  {spRewardHistory.map(item => (
                    <article key={item.id} style={styles.communityHistoryCard}>
                      <div>
                        <div style={styles.communityMetaLine}>{item.date} · Awarded by {item.awardedBy}</div>
                        <h3 style={styles.communityCardTitle}>{item.student}</h3>
                        <p style={styles.communityCardText}>{item.question}</p>
                        <div style={styles.communityCardMeta}><span>Reason: {item.reason}</span></div>
                      </div>
                      <div style={styles.communityRewardValue}>+{item.awardedSp} SP</div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ═══ Moderation ════════════════════════════════════ */}
        {activeSection === 'moderation' && (
          <>
            <div style={styles.headerSection}>
              <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#fff' }}>Community Moderation</h2>
              <p style={{ margin: '8px 0 0', color: '#94a3b8', fontSize: 14 }}>Review milestone submissions, approvals, and student journey updates</p>
            </div>

            <div style={glassCard()}>
              <SectionTitle icon="🛡️" label="Journey Review Queue" action={`${filteredJourneyReviews.length} pending`} />
              <div style={{ marginBottom: 14 }}>
                <input
                  value={journeySearch}
                  onChange={e => setJourneySearch(e.target.value)}
                  placeholder="Search student name, milestone, or submission ID..."
                  style={{
                    width: '100%',
                    borderRadius: 14,
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.03)',
                    color: '#e2e8f0',
                    padding: '12px 14px',
                    outline: 'none',
                  }}
                />
              </div>
              {filteredJourneyReviews.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>
                  <p style={{ fontSize: 14 }}>📭 No milestone submissions pending review</p>
                  <p style={{ fontSize: 12, marginTop: 8, color: '#64748b' }}>Approval actions will appear here when students submit a reviewable milestone.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {filteredJourneyReviews.map(item => (
                    <div key={item.id} style={{ padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)', display: 'grid', gap: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{item.milestoneTitle}</div>
                          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                            {item.category} · {item.submittedBy || 'Student'} · Submitted {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(item.submittedAt))}
                          </div>
                        </div>
                        <span style={{ padding: '6px 10px', borderRadius: 999, background: 'rgba(124,111,247,0.14)', border: '1px solid rgba(124,111,247,0.22)', color: '#c4b5fd', fontSize: 12, fontWeight: 800 }}>
                          Pending Review
                        </span>
                      </div>
                      {item.comment && <div style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.6 }}>{item.comment}</div>}
                      <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                        <div style={{ padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.03)' }}>
                          <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Student</div>
                          <div style={{ fontSize: 13, color: '#fff', fontWeight: 700, marginTop: 4 }}>{item.submittedBy || 'Student'}</div>
                        </div>
                        <div style={{ padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.03)' }}>
                          <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Uploaded File</div>
                          <div style={{ fontSize: 13, color: '#fff', fontWeight: 700, marginTop: 4 }}>
                            {item.files?.[0]?.name || item.data?.fileName || 'No file attached'}
                          </div>
                        </div>
                        <div style={{ padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.03)' }}>
                          <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Submitted Link</div>
                          <div style={{ fontSize: 13, color: '#fff', fontWeight: 700, marginTop: 4, wordBreak: 'break-all' }}>
                            {item.links?.[0] || item.data?.submittedLink || 'No link attached'}
                          </div>
                        </div>
                        {item.milestoneId === 4 && (
                          <>
                            <div style={{ padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.03)' }}>
                              <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Start Date</div>
                              <div style={{ fontSize: 13, color: '#fff', fontWeight: 700, marginTop: 4 }}>
                                {item.data?.startDate ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(item.data.startDate)) : '—'}
                              </div>
                            </div>
                            <div style={{ padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.03)' }}>
                              <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>End Date</div>
                              <div style={{ fontSize: 13, color: '#fff', fontWeight: 700, marginTop: 4 }}>
                                {item.data?.endDate ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(item.data.endDate)) : '—'}
                              </div>
                            </div>
                            <div style={{ padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.03)' }}>
                              <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Duration</div>
                              <div style={{ fontSize: 13, color: '#fff', fontWeight: 700, marginTop: 4 }}>
                                {item.data?.durationDays ? `${item.data.durationDays} days` : '—'}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                      {(item.files?.[0]?.previewUrl || item.data?.submittedFilePreview) && (
                        <a
                          href={item.files?.[0]?.previewUrl || item.data?.submittedFilePreview}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#93c5fd', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}
                        >
                          Download / view uploaded file →
                        </a>
                      )}
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => handleJourneyReview(item.id, 'approved')}
                          style={{
                            border: '1px solid rgba(16,185,129,0.22)',
                            background: 'rgba(16,185,129,0.12)',
                            color: '#a7f3d0',
                            borderRadius: 12,
                            padding: '10px 14px',
                            fontWeight: 800,
                          }}
                          >
                            Approve
                          </button>
                        <button
                          type="button"
                          onClick={() => handleJourneyReview(item.id, 'needs_changes')}
                          style={{
                            border: '1px solid rgba(251,191,36,0.22)',
                            background: 'rgba(251,191,36,0.12)',
                            color: '#fde68a',
                            borderRadius: 12,
                            padding: '10px 14px',
                            fontWeight: 800,
                          }}
                        >
                          Needs Changes
                        </button>
                        <button
                          type="button"
                          onClick={() => handleJourneyReview(item.id, 'rejected')}
                          style={{
                            border: '1px solid rgba(239,68,68,0.22)',
                            background: 'rgba(239,68,68,0.12)',
                            color: '#fecaca',
                            borderRadius: 12,
                            padding: '10px 14px',
                            fontWeight: 800,
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ═══ Analytics ════════════════════════════════════ */}
        {activeSection === 'analytics' && (
          <>
            <div style={styles.headerSection}>
              <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#fff' }}>Analytics & Reports</h2>
              <p style={{ margin: '8px 0 0', color: '#94a3b8', fontSize: 14 }}>Track engagement, participation, and platform growth</p>
            </div>

            <div style={styles.gridRow}>
              <div style={glassCard({ flex: 1 })}>
                <SectionTitle icon="📈" label="Student Engagement" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: '#94a3b8', fontSize: 12 }}>Daily Active Users</span>
                      <span style={{ color: '#fff', fontWeight: 600 }}>642 / 2,840</span>
                    </div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ width: '22%', height: '100%', background: '#7c6ff7', borderRadius: 999 }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: '#94a3b8', fontSize: 12 }}>Questions Solved</span>
                      <span style={{ color: '#fff', fontWeight: 600 }}>9,400 / 12,000</span>
                    </div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ width: '78%', height: '100%', background: '#10b981', borderRadius: 999 }} />
                    </div>
                  </div>
                </div>
              </div>

              <div style={glassCard({ flex: 1 })}>
                <SectionTitle icon="🎯" label="Key Metrics" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>Avg Response Time</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginTop: 4 }}>2.3 hours</div>
                  </div>
                  <div style={{ padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>Contribution Rate</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginTop: 4 }}>340+ active</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        </div>

        {rewardDialog && (
          <div style={styles.modalBackdrop} onClick={() => setRewardDialog(null)}>
            <div style={styles.communityModal} onClick={event => event.stopPropagation()}>
              <div style={styles.pinModalHeader}>
                <div>
                  <div style={styles.pinModalKicker}>Reply approval</div>
                  <h3 style={styles.pinModalTitle}>Reward this contribution?</h3>
                </div>
                <button type="button" onClick={() => setRewardDialog(null)} style={styles.pinModalClose}>✕</button>
              </div>
              <div style={styles.communityRewardOptions}>
                {[
                  ['0', '0 SP'],
                  ['2', '2 SP'],
                  ['5', '5 SP'],
                  ['10', '10 SP'],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRewardDialog(prev => ({ ...prev, sp: value }))}
                    style={{
                      ...styles.communityRewardChip,
                      ...(rewardDialog.sp === value ? styles.communityRewardChipActive : {}),
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="0"
                value={rewardDialog.sp}
                onChange={e => setRewardDialog(prev => ({ ...prev, sp: e.target.value }))}
                placeholder="Custom SP value"
              />
              <select value={rewardDialog.reason} onChange={e => setRewardDialog(prev => ({ ...prev, reason: e.target.value }))}>
                <option>Great answer</option>
                <option>Helpful answer</option>
                <option>Correct but basic answer</option>
                <option>Valid answer but no reward</option>
              </select>
              <div style={styles.pinModalActions}>
                <button type="button" onClick={() => acceptCommunityReply({ awardSp: false })} style={styles.pinCancelBtn}>Accept Without SP</button>
                <button type="button" onClick={() => acceptCommunityReply({ awardSp: true })} style={styles.pinReplaceBtn}>Accept & Award SP</button>
              </div>
            </div>
          </div>
        )}

        {rejectDialog && (
          <div style={styles.modalBackdrop} onClick={() => setRejectDialog(null)}>
            <div style={styles.communityModal} onClick={event => event.stopPropagation()}>
              <div style={styles.pinModalHeader}>
                <div>
                  <div style={styles.pinModalKicker}>Reject reply</div>
                  <h3 style={styles.pinModalTitle}>Add optional rejection note</h3>
                </div>
                <button type="button" onClick={() => setRejectDialog(null)} style={styles.pinModalClose}>✕</button>
              </div>
              <textarea
                value={rejectDialog.note}
                onChange={e => setRejectDialog(prev => ({ ...prev, note: e.target.value }))}
                placeholder="Information is outdated."
                rows="4"
              />
              <div style={styles.pinModalActions}>
                <button type="button" onClick={() => setRejectDialog(null)} style={styles.pinCancelBtn}>Cancel</button>
                <button type="button" onClick={rejectCommunityReply} style={styles.communityDangerBtn}>Mark Rejected</button>
              </div>
            </div>
          </div>
        )}

        {deleteDialog && (
          <div style={styles.modalBackdrop} onClick={() => setDeleteDialog(null)}>
            <div style={styles.communityModal} onClick={event => event.stopPropagation()}>
              <div style={styles.pinModalHeader}>
                <div>
                  <div style={styles.pinModalKicker}>Delete reply</div>
                  <h3 style={styles.pinModalTitle}>Remove this reply?</h3>
                </div>
                <button type="button" onClick={() => setDeleteDialog(null)} style={styles.pinModalClose}>✕</button>
              </div>
              <p style={styles.pinModalText}>Use this for spam, offensive content, duplicate answers, or low-quality generated responses.</p>
              <div style={styles.pinModalActions}>
                <button type="button" onClick={() => setDeleteDialog(null)} style={styles.pinCancelBtn}>Cancel</button>
                <button type="button" onClick={deleteCommunityReply} style={styles.communityDangerBtn}>Delete Reply</button>
              </div>
            </div>
          </div>
        )}

        {taskDialogOpen && (
          <div style={styles.modalBackdrop} onClick={closeTaskDialog}>
            <div style={styles.announcementDialog} onClick={event => event.stopPropagation()}>
              <div style={styles.announcementDialogHeader}>
                <div>
                  <div style={styles.pinModalKicker}>Admin internship tasks</div>
                  <h3 style={styles.pinModalTitle}>Internship Task Dialog</h3>
                </div>
                <button type="button" onClick={closeTaskDialog} style={styles.pinModalClose}>✕</button>
              </div>

              <div style={styles.announcementTabs} role="tablist" aria-label="Internship task options">
                <button
                  type="button"
                  role="tab"
                  aria-selected={taskDialogTab === 'assign'}
                  onClick={() => setTaskDialogTab('assign')}
                  style={{
                    ...styles.announcementTab,
                    ...(taskDialogTab === 'assign' ? styles.taskTabActive : {}),
                  }}
                >
                  Assign Internship Task
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={taskDialogTab === 'summary'}
                  onClick={() => setTaskDialogTab('summary')}
                  style={{
                    ...styles.announcementTab,
                    ...(taskDialogTab === 'summary' ? styles.taskTabActive : {}),
                  }}
                >
                  Task Summary
                </button>
              </div>

              {taskDialogTab === 'assign' ? (
                <form onSubmit={handlePublishTask} style={styles.announcementDialogBody}>
                  <input
                    value={taskDraft.title}
                    onChange={e => setTaskDraft(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Task Title"
                  />
                  <textarea
                    value={taskDraft.description}
                    onChange={e => setTaskDraft(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Description"
                    rows="4"
                  />
                  <div style={styles.announcementFormGrid}>
                    <select value={taskDraft.category} onChange={e => setTaskDraft(prev => ({ ...prev, category: e.target.value }))}>
                      {['General', 'Project', 'NOC', 'Meeting', 'Setup', 'Internship'].map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                    <select value={taskDraft.priority} onChange={e => setTaskDraft(prev => ({ ...prev, priority: e.target.value }))}>
                      {['Low', 'Medium', 'High'].map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="date"
                    value={taskDraft.deadline}
                    onChange={e => setTaskDraft(prev => ({ ...prev, deadline: e.target.value }))}
                  />
                  <input
                    value={taskDraft.attachmentLink}
                    onChange={e => setTaskDraft(prev => ({ ...prev, attachmentLink: e.target.value }))}
                    placeholder="Attachment / Link (optional)"
                  />
                  <input
                    value={taskDraft.slots}
                    onChange={e => setTaskDraft(prev => ({ ...prev, slots: e.target.value }))}
                    placeholder="Slots (optional, comma separated)"
                  />
                  <button className="primary-btn" type="submit">Assign Task</button>
                  {taskMessage && (
                    <div style={styles.announcementSuccess}>
                      {taskMessage}
                    </div>
                  )}
                </form>
              ) : (
                <div style={styles.announcementDialogBody}>
                  <div style={styles.taskSummaryGrid}>
                    {[
                      { label: 'Total', value: taskSummary.total },
                      { label: 'Pending', value: taskSummary.pending },
                      { label: 'Completed', value: taskSummary.completed },
                      { label: 'Missed', value: taskSummary.missed },
                    ].map(item => (
                      <div key={item.label} style={styles.taskSummaryStat}>
                        <div style={styles.taskSummaryLabel}>{item.label}</div>
                        <div style={styles.taskSummaryValue}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={styles.taskSummaryList}>
                    {[...taskItems].slice(0, 8).map(task => (
                      <div key={task.id} style={styles.taskSummaryItem}>
                        <div>
                          <div style={styles.taskSummaryTitle}>{task.title}</div>
                          <div style={styles.taskSummaryMeta}>{task.category} · Due {task.deadline}</div>
                        </div>
                        <span style={styles.taskPriorityPill}>{task.priority}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {announcementDialogOpen && (
          <div style={styles.modalBackdrop} onClick={closeAnnouncementDialog}>
            <div style={styles.announcementDialog} onClick={event => event.stopPropagation()}>
              <div style={styles.announcementDialogHeader}>
                <div>
                  <div style={styles.pinModalKicker}>Admin announcements</div>
                  <h3 style={styles.pinModalTitle}>Announcements Manager</h3>
                </div>
                <button type="button" onClick={closeAnnouncementDialog} style={styles.pinModalClose}>✕</button>
              </div>

              <div style={styles.announcementDialogScrollContainer}>
                {/* 1. Post Announcement Form */}
                <form onSubmit={handlePublishAnnouncement} style={styles.announcementForm}>
                  <h4 style={styles.formSectionTitle}>Post Announcement</h4>
                  <input
                    value={announcementDraft.title || ''}
                    onChange={e => setAnnouncementDraft(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Title"
                    required
                    style={styles.formInput}
                  />
                  <textarea
                    value={announcementDraft.message || ''}
                    onChange={e => setAnnouncementDraft(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Message"
                    rows="4"
                    required
                    style={styles.formTextarea}
                  />
                  <div style={styles.formRow}>
                    <select
                      value={announcementDraft.target || 'all'}
                      onChange={e => setAnnouncementDraft(prev => ({ ...prev, target: e.target.value }))}
                      style={styles.formSelect}
                    >
                      <option value="all">All Interns</option>
                      <option value="bronze">Bronze Phase</option>
                      <option value="silver">Silver Phase</option>
                      <option value="gold">Gold Phase</option>
                    </select>
                    <button className="primary-btn" type="submit" style={styles.submitBtn}>
                      Post Announcement
                    </button>
                  </div>
                  {announcementMessage && (
                    <div style={styles.announcementSuccess}>
                      {announcementMessage}
                    </div>
                  )}
                </form>

                <hr style={styles.divider} />

                {/* 2. Existing Announcements Cards */}
                <div style={styles.announcementCardsList}>
                  <h4 style={styles.formSectionTitle}>Recent Announcements</h4>
                  {announcementItems.length === 0 ? (
                    <div style={styles.emptyState}>No announcements posted yet.</div>
                  ) : (
                    [...announcementItems]
                      .sort((a, b) => new Date(b.createdAt || b.dateTime) - new Date(a.createdAt || a.dateTime))
                      .map(a => {
                        const targetLabel =
                          a.targetAudience === 'Bronze Phase' ? 'Bronze Phase' :
                          a.targetAudience === 'Silver Phase' ? 'Silver Phase' :
                          a.targetAudience === 'Gold Phase' ? 'Gold Phase' : 'All Interns';
                        return (
                          <div key={a._id || a.id} style={styles.announcementCard}>
                            <div style={styles.cardHeaderRow}>
                              <strong style={styles.cardTitle}>{a.title}</strong>
                              <span style={styles.targetBadge(a.targetAudience)}>
                                {targetLabel}
                              </span>
                            </div>
                            <p style={styles.cardMessage}>{a.content || a.message || ''}</p>
                            <div style={styles.cardFooter}>
                              <span style={styles.cardTime}>
                                {new Intl.DateTimeFormat('en-IN', {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                }).format(new Date(a.createdAt || a.dateTime || Date.now()))}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeleteAnnouncement(a._id || a.id)}
                                style={styles.deleteBtn}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {pinConflict && (
          <div style={styles.modalBackdrop} onClick={handleCancelPinnedReplacement}>
            <div style={styles.pinModal} onClick={event => event.stopPropagation()}>
              <div style={styles.pinModalHeader}>
                <div>
                  <div style={styles.pinModalKicker}>Pinned announcement conflict</div>
                  <h3 style={styles.pinModalTitle}>Replace current pinned announcement?</h3>
                </div>
                <button type="button" onClick={handleCancelPinnedReplacement} style={styles.pinModalClose}>✕</button>
              </div>
              <p style={styles.pinModalText}>
                Only one pinned announcement can stay at the top. Replace the current pinned item with the new one, or cancel and keep the existing pin.
              </p>
              <div style={styles.pinModalPreview}>
                <div style={styles.pinModalPreviewLabel}>Current pinned</div>
                <strong style={styles.pinModalPreviewTitle}>{pinConflict.existingPinned?.title}</strong>
              </div>
              <div style={styles.pinModalActions}>
                <button type="button" onClick={handleCancelPinnedReplacement} style={styles.pinCancelBtn}>
                  Cancel
                </button>
                <button type="button" onClick={handleReplacePinnedAnnouncement} style={styles.pinReplaceBtn}>
                  Replace Pin
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ Navigation Menu ═══════════════════════════════ */}
        <div style={styles.navMenu}>
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'announcements', label: 'Announcement', icon: '📢', dialog: 'announcement' },
              { id: 'tasks', label: 'Internship Task', icon: '📋', dialog: 'task' },
              { id: 'community', label: 'Community Hub', icon: '👥' },
              { id: 'students', label: 'Students', icon: '👥' },
              { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
              { id: 'applications', label: 'Applications', icon: '📋' },
              { id: 'teams', label: 'Teams', icon: '🧑‍🤝‍🧑' },
              { id: 'moderation', label: 'Moderation', icon: '🛡️' },
              { id: 'knowledge-base', label: 'Knowledge Base', icon: '🧠' },
              { id: 'analytics', label: 'Analytics', icon: '📈' },
            ].map(item => (
            <button
              key={item.id}
              onClick={() => {
                if (item.dialog === 'announcement') {
                  openAnnouncementDialog('create');
                  return;
                }
                if (item.dialog === 'task') {
                  openTaskDialog('assign');
                  return;
                }
                setActiveSection(item.id);
              }}
              style={{
                ...styles.navBtn,
                ...(activeSection === item.id || (item.dialog === 'announcement' && announcementDialogOpen) || (item.dialog === 'task' && taskDialogOpen) ? styles.navBtnActive : {}),
              }}
            >
              <span>{item.icon}</span> {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const adminNavStyles = {
  bar: {
    position: 'sticky',
    top: 0,
    zIndex: 30,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    padding: '14px 18px',
    borderRadius: 20,
    background: 'rgba(7, 9, 15, 0.72)',
    border: '1px solid rgba(255,255,255,0.08)',
    backdropFilter: 'blur(18px)',
    boxShadow: '0 10px 34px rgba(0,0,0,0.25)',
  },
  backBtn: {
    border: 'none',
    borderRadius: 12,
    padding: '9px 14px',
    background: 'rgba(255,255,255,0.08)',
    color: '#eef0f6',
    fontSize: 14,
    fontWeight: 700,
  },
  centerTitle: {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    color: '#eef0f6',
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: '-0.02em',
    pointerEvents: 'none',
  },
  rightRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginLeft: 'auto',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  notificationWrap: {
    position: 'relative',
  },
  iconBtn: {
    position: 'relative',
    width: 42,
    height: 42,
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.05)',
    color: '#eef0f6',
    display: 'grid',
    placeItems: 'center',
    boxShadow: '0 10px 24px rgba(0,0,0,0.18)',
  },
  iconGlyph: {
    fontSize: 16,
  },
  notificationDot: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    padding: '0 4px',
    borderRadius: 999,
    background: '#ef4444',
    color: '#fff',
    fontSize: 10,
    fontWeight: 800,
    display: 'grid',
    placeItems: 'center',
  },
  notificationPanel: {
    position: 'absolute',
    top: 'calc(100% + 12px)',
    right: 0,
    width: 460,
    maxWidth: 'calc(100vw - 24px)',
    maxHeight: 620,
    overflow: 'hidden',
    borderRadius: 24,
    padding: 16,
    background: 'rgba(8, 11, 20, 0.96)',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
    backdropFilter: 'blur(20px)',
    zIndex: 45,
    animation: 'dropdownFade 0.18s ease-out',
  },
  notificationHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  notificationTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: 800,
    letterSpacing: '-0.03em',
  },
  notificationSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
  },
  notificationList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    maxHeight: 520,
    overflowY: 'auto',
    paddingRight: 4,
  },
  announcementCard: {
    width: '100%',
    textAlign: 'left',
    border: '1px solid rgba(255,255,255,0.07)',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: 18,
    padding: 14,
    color: '#eef0f6',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    opacity: 0.9,
  },
  pinnedCard: {
    background: 'linear-gradient(135deg, rgba(124,111,247,0.12), rgba(56,189,248,0.06))',
    borderColor: 'rgba(124,111,247,0.22)',
  },
  announcementTopRow: {
    display: 'flex',
    gap: 12,
    width: '100%',
  },
  announcementAccent: {
    width: 4,
    borderRadius: 999,
    alignSelf: 'stretch',
    flexShrink: 0,
    background: 'transparent',
    transition: 'background 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease',
  },
  announcementAccentUnread: {
    background: 'linear-gradient(180deg, #a78bfa, #38bdf8)',
    boxShadow: '0 0 18px rgba(124,111,247,0.35)',
    opacity: 1,
  },
  announcementIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    background: 'rgba(124,111,247,0.12)',
    border: '1px solid rgba(124,111,247,0.18)',
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
    fontSize: 18,
  },
  announcementBody: {
    minWidth: 0,
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  announcementMetaRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  categoryBadge: {
    padding: '5px 9px',
    borderRadius: 999,
    background: 'rgba(56,189,248,0.12)',
    border: '1px solid rgba(56,189,248,0.18)',
    color: '#dbeafe',
    fontSize: 11,
    fontWeight: 800,
  },
  pinnedBadge: {
    padding: '5px 9px',
    borderRadius: 999,
    background: 'rgba(251,191,36,0.12)',
    border: '1px solid rgba(251,191,36,0.18)',
    color: '#fde68a',
    fontSize: 11,
    fontWeight: 800,
  },
  newBadge: {
    padding: '5px 9px',
    borderRadius: 999,
    background: 'rgba(124,111,247,0.16)',
    border: '1px solid rgba(124,111,247,0.26)',
    color: '#ede9fe',
    fontSize: 11,
    fontWeight: 800,
  },
  announcementTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#cbd5e1',
    lineHeight: 1.4,
  },
  announcementTitleUnread: {
    color: '#ffffff',
    fontWeight: 900,
    textShadow: '0 0 12px rgba(255,255,255,0.16)',
  },
  announcementPreview: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 1.5,
  },
  announcementBottomRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  adminBadge: {
    padding: '5px 9px',
    borderRadius: 999,
    background: 'rgba(34,197,94,0.12)',
    border: '1px solid rgba(34,197,94,0.18)',
    color: '#bbf7d0',
    fontSize: 11,
    fontWeight: 800,
  },
  timeText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: 700,
  },
  emptyState: {
    padding: 18,
    borderRadius: 18,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  emptyTitle: {
    display: 'block',
    color: '#f8fafc',
    fontSize: 14,
    marginBottom: 6,
  },
  emptyText: {
    margin: 0,
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 1.6,
  },
  profileWrap: {
    position: 'relative',
  },
  avatarBtn: {
    minWidth: 42,
    height: 42,
    padding: '0 12px',
    borderRadius: 14,
    border: '1px solid rgba(124,111,247,0.28)',
    background: 'linear-gradient(135deg, rgba(124,111,247,0.95), rgba(59,130,246,0.85))',
    color: '#fff',
    fontWeight: 800,
    fontSize: 14,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  avatarChevron: {
    fontSize: 10,
    opacity: 0.9,
    transform: 'translateY(1px)',
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 10px)',
    right: 0,
    minWidth: 190,
    padding: 8,
    borderRadius: 18,
    background: 'rgba(9, 12, 22, 0.95)',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 18px 40px rgba(0,0,0,0.4)',
    backdropFilter: 'blur(18px)',
    zIndex: 40,
    animation: 'dropdownFade 0.18s ease-out',
  },
  dropdownItem: {
    width: '100%',
    textAlign: 'left',
    border: 'none',
    borderRadius: 12,
    padding: '11px 12px',
    background: 'transparent',
    color: '#e5e7eb',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
};

const adminHeaderStyles = {
  shell: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    padding: '2px 2px 2px',
  },
  banner: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'flex-start',
    padding: '9px 14px',
    borderRadius: 999,
    background: 'rgba(124,111,247,0.08)',
    border: '1px solid rgba(124,111,247,0.18)',
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.02em',
    boxShadow: '0 8px 24px rgba(0,0,0,0.16)',
  },
  bannerDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: '#22c55e',
    boxShadow: '0 0 0 7px rgba(34,197,94,0.1), 0 0 18px rgba(34,197,94,0.36)',
  },
  bannerText: {
    display: 'inline-flex',
    gap: 6,
    alignItems: 'center',
    color: '#cbd5e1',
  },
  hero: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 16,
    flexWrap: 'wrap',
    padding: '2px 2px 0',
  },
  heroCopy: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  title: {
    margin: 0,
    color: '#f8fafc',
    fontSize: 'clamp(28px, 3vw, 38px)',
    lineHeight: 1.05,
    letterSpacing: '-0.04em',
    fontWeight: 800,
  },
  subtitle: {
    margin: 0,
    color: '#cbd5e1',
    fontSize: 15,
    lineHeight: 1.5,
    maxWidth: 760,
  },
};

const styles = {
  dashboard: {
    minHeight: '100vh',
    background: '#07090f',
    position: 'relative',
    overflow: 'hidden',
    paddingBottom: 80,
  },
  cosmicBg1: {
    position: 'fixed',
    top: '10%',
    left: '5%',
    width: 600,
    height: 600,
    background: 'radial-gradient(circle, rgba(124,111,247,0.08) 0%, transparent 70%)',
    borderRadius: '50%',
    pointerEvents: 'none',
  },
  cosmicBg2: {
    position: 'fixed',
    bottom: '15%',
    right: '10%',
    width: 400,
    height: 400,
    background: 'radial-gradient(circle, rgba(34,211,238,0.06) 0%, transparent 70%)',
    borderRadius: '50%',
    pointerEvents: 'none',
  },
  container: {
    maxWidth: 1320,
    margin: '0 auto',
    padding: '16px 24px 80px',
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  contentArea: {
    width: '100%',
  },
  headerSection: {
    marginBottom: 32,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 16,
    marginBottom: 32,
  },
  leaderboardSummaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: 20,
    marginBottom: 20,
  },
  leaderboardStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: 12,
  },
  leaderStat: {
    padding: 14,
    borderRadius: 16,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    display: 'grid',
    gap: 6,
  },
  leaderboardStatLabel: {
    fontSize: 11,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontWeight: 700,
  },
  leaderboardStatValue: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 800,
  },
  gridRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: 20,
  },
  navMenu: {
    position: 'fixed',
    bottom: 20,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: 8,
    background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 8,
    backdropFilter: 'blur(16px)',
    zIndex: 50,
  },
  navBtn: {
    padding: '8px 14px',
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: 600,
    borderRadius: 10,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    transition: 'all 0.2s ease',
  },
  navBtnActive: {
    background: 'rgba(124,111,247,0.15)',
    color: '#a5b4fc',
    border: '1px solid rgba(124,111,247,0.3)',
  },
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(3, 7, 18, 0.72)',
    backdropFilter: 'blur(10px)',
    display: 'grid',
    placeItems: 'center',
    zIndex: 200,
    padding: 20,
  },
  announcementLauncher: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 18,
    padding: 18,
    borderRadius: 18,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    flexWrap: 'wrap',
  },
  announcementLauncherTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: 800,
    letterSpacing: '-0.02em',
  },
  announcementLauncherText: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 1.6,
    marginTop: 6,
  },
  announcementLauncherActions: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
  },
  announcementLauncherPrimary: {
    border: '1px solid rgba(124,111,247,0.25)',
    background: 'linear-gradient(135deg, #7c6ff7, #3b82f6)',
    color: '#fff',
    borderRadius: 14,
    padding: '11px 14px',
    fontWeight: 800,
    boxShadow: '0 18px 30px rgba(124,111,247,0.18)',
  },
  announcementLauncherSecondary: {
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    color: '#e2e8f0',
    borderRadius: 14,
    padding: '11px 14px',
    fontWeight: 800,
  },
  announcementDialog: {
    width: 'min(920px, 100%)',
    maxHeight: 'calc(100vh - 48px)',
    overflow: 'hidden',
    borderRadius: 24,
    background: 'linear-gradient(180deg, rgba(15,20,40,0.98), rgba(8,11,22,0.98))',
    border: '1px solid rgba(124,111,247,0.18)',
    boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
    padding: 22,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  announcementDialogScrollContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    overflowY: 'auto',
    maxHeight: 'calc(100vh - 160px)',
    paddingRight: 6,
  },
  announcementForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    background: 'rgba(255,255,255,0.02)',
    padding: 16,
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.05)',
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: 800,
    color: '#a78bfa',
    margin: '0 0 4px 0',
  },
  formInput: {
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: '10px 14px',
    color: '#fff',
    fontSize: 14,
    width: '100%',
    boxSizing: 'border-box',
  },
  formTextarea: {
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: '10px 14px',
    color: '#fff',
    fontSize: 14,
    width: '100%',
    boxSizing: 'border-box',
    resize: 'vertical',
  },
  formRow: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  formSelect: {
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: '10px 14px',
    color: '#fff',
    fontSize: 14,
    minWidth: 160,
    cursor: 'pointer',
  },
  submitBtn: {
    padding: '10px 20px',
    borderRadius: 10,
    fontWeight: 800,
    fontSize: 14,
    border: 'none',
    cursor: 'pointer',
    background: 'linear-gradient(135deg, #7c6ff7, #38bdf8)',
    color: '#fff',
  },
  divider: {
    border: 'none',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    margin: '10px 0',
  },
  announcementCardsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  announcementCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  cardHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  targetBadge: (targetAudience) => {
    const t = String(targetAudience || '').toLowerCase();
    let bg = 'rgba(124, 111, 247, 0.15)';
    let border = '1px solid rgba(124, 111, 247, 0.3)';
    let color = '#a78bfa';

    if (t.includes('bronze')) {
      bg = 'rgba(205, 127, 50, 0.15)';
      border = '1px solid rgba(205, 127, 50, 0.3)';
      color = '#cd7f32';
    } else if (t.includes('silver')) {
      bg = 'rgba(192, 192, 192, 0.15)';
      border = '1px solid rgba(192, 192, 192, 0.3)';
      color = '#e2e8f0';
    } else if (t.includes('gold')) {
      bg = 'rgba(255, 215, 0, 0.15)';
      border = '1px solid rgba(255, 215, 0, 0.3)';
      color = '#ffd700';
    }

    return {
      padding: '4px 10px',
      borderRadius: 12,
      fontSize: 11,
      fontWeight: 'bold',
      background: bg,
      border: border,
      color: color,
    };
  },
  cardMessage: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 1.5,
    margin: 0,
    whiteSpace: 'pre-wrap',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  cardTime: {
    fontSize: 12,
    color: '#64748b',
  },
  deleteBtn: {
    background: 'rgba(239,68,68,0.12)',
    border: '1px solid rgba(239,68,68,0.22)',
    color: '#fca5a5',
    borderRadius: 8,
    padding: '6px 12px',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  announcementDialogHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  announcementTabs: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 8,
    padding: 6,
    borderRadius: 16,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
  },
  announcementTab: {
    border: '1px solid transparent',
    background: 'transparent',
    color: '#94a3b8',
    borderRadius: 12,
    padding: '11px 12px',
    fontWeight: 800,
    fontSize: 13,
  },
  announcementTabActive: {
    background: 'rgba(124,111,247,0.16)',
    borderColor: 'rgba(124,111,247,0.26)',
    color: '#ede9fe',
  },
  announcementDialogBody: {
    display: 'grid',
    gap: 12,
    overflowY: 'auto',
    paddingRight: 4,
  },
  announcementFormGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 12,
  },
  announcementCheckRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    color: '#cbd5e1',
    fontSize: 13,
  },
  announcementSuccess: {
    padding: 12,
    borderRadius: 12,
    background: 'rgba(16,185,129,0.14)',
    color: '#a7f3d0',
  },
  announcementRecentItem: {
    padding: 14,
    background: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 14,
    border: '1px solid rgba(255,255,255,0.07)',
  },
  announcementRecentTitle: {
    fontSize: 15,
    fontWeight: 800,
    color: '#fff',
    lineHeight: 1.4,
  },
  announcementRecentMeta: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 5,
  },
  announcementRecentPreview: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 1.5,
    marginTop: 8,
  },
  announcementRecentActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  announcementPinnedPill: {
    padding: '5px 9px',
    borderRadius: 999,
    background: 'rgba(251,191,36,0.12)',
    border: '1px solid rgba(251,191,36,0.18)',
    color: '#fde68a',
    fontSize: 11,
    fontWeight: 800,
  },
  announcementPinBtn: {
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(124,111,247,0.12)',
    color: '#e9d5ff',
    borderRadius: 10,
    padding: '8px 10px',
    fontSize: 11,
    fontWeight: 800,
  },
  announcementUnpinBtn: {
    background: 'rgba(239,68,68,0.12)',
    color: '#fecaca',
  },
  taskLauncher: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 18,
    padding: 18,
    borderRadius: 18,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    flexWrap: 'wrap',
  },
  taskLauncherPrimary: {
    border: '1px solid rgba(34,197,94,0.25)',
    background: 'linear-gradient(135deg, #16a34a, #0ea5e9)',
    color: '#fff',
    borderRadius: 14,
    padding: '11px 14px',
    fontWeight: 800,
    boxShadow: '0 18px 30px rgba(34,197,94,0.14)',
  },
  taskTabActive: {
    background: 'rgba(34,197,94,0.14)',
    borderColor: 'rgba(34,197,94,0.26)',
    color: '#dcfce7',
  },
  taskSummaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: 12,
  },
  taskSummaryStat: {
    padding: 14,
    borderRadius: 14,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  taskSummaryLabel: {
    fontSize: 11,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontWeight: 700,
  },
  taskSummaryValue: {
    fontSize: 24,
    fontWeight: 900,
    color: '#fff',
    marginTop: 6,
  },
  taskSummaryList: {
    display: 'grid',
    gap: 10,
  },
  taskSummaryItem: {
    padding: 14,
    background: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
  },
  taskSummaryTitle: {
    fontSize: 14,
    fontWeight: 800,
    color: '#fff',
  },
  taskSummaryMeta: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  taskPriorityPill: {
    padding: '6px 10px',
    borderRadius: 999,
    background: 'rgba(124,111,247,0.14)',
    border: '1px solid rgba(124,111,247,0.22)',
    color: '#c4b5fd',
    fontSize: 12,
    fontWeight: 800,
    flexShrink: 0,
  },
  communityPreviewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))',
    gap: 10,
    marginBottom: 14,
  },
  communityPreviewStat: {
    padding: 14,
    borderRadius: 14,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    display: 'grid',
    gap: 5,
  },
  communityOpenBtn: {
    border: '1px solid rgba(34,197,94,0.24)',
    background: 'linear-gradient(135deg, rgba(34,197,94,0.18), rgba(56,189,248,0.14))',
    color: '#d1fae5',
    borderRadius: 14,
    padding: '11px 14px',
    fontWeight: 800,
  },
  communityStatsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
    gap: 14,
    marginBottom: 18,
  },
  communityMetricCard: {
    padding: 18,
    borderRadius: 18,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 14px 34px rgba(0,0,0,0.18)',
  },
  communityMetricValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 900,
    letterSpacing: '-0.02em',
  },
  communityMetricLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 6,
  },
  communityTabs: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    padding: 6,
    borderRadius: 16,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    marginBottom: 18,
  },
  communityTab: {
    border: '1px solid transparent',
    background: 'transparent',
    color: '#94a3b8',
    borderRadius: 12,
    padding: '10px 12px',
    fontSize: 12,
    fontWeight: 800,
  },
  communityTabActive: {
    background: 'rgba(34,197,94,0.12)',
    borderColor: 'rgba(34,197,94,0.22)',
    color: '#bbf7d0',
  },
  communityPanelList: {
    display: 'grid',
    gap: 14,
  },
  communityDiscussionCard: {
    padding: 18,
    borderRadius: 18,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    display: 'grid',
    gap: 12,
  },
  communityReviewCard: {
    padding: 18,
    borderRadius: 18,
    background: 'linear-gradient(135deg, rgba(124,111,247,0.08), rgba(255,255,255,0.03))',
    border: '1px solid rgba(124,111,247,0.16)',
    display: 'grid',
    gap: 12,
  },
  communityCardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 14,
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  communityMetaLine: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: 700,
  },
  communityCardTitle: {
    margin: '6px 0 0',
    color: '#f8fafc',
    fontSize: 17,
    fontWeight: 900,
    letterSpacing: '-0.02em',
  },
  communityCardText: {
    margin: '8px 0 0',
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 1.6,
  },
  communityStatusPill: {
    padding: '6px 10px',
    borderRadius: 999,
    background: 'rgba(56,189,248,0.12)',
    border: '1px solid rgba(56,189,248,0.2)',
    color: '#bae6fd',
    fontSize: 11,
    fontWeight: 900,
    textTransform: 'capitalize',
  },
  communityAcceptedPill: {
    background: 'rgba(34,197,94,0.12)',
    borderColor: 'rgba(34,197,94,0.22)',
    color: '#bbf7d0',
  },
  communityRejectedPill: {
    background: 'rgba(239,68,68,0.12)',
    borderColor: 'rgba(239,68,68,0.22)',
    color: '#fecaca',
  },
  communityCardMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: 700,
  },
  communityActionRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  communityGhostBtn: {
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    color: '#e2e8f0',
    borderRadius: 12,
    padding: '9px 11px',
    fontSize: 12,
    fontWeight: 800,
  },
  communityApproveBtn: {
    border: '1px solid rgba(34,197,94,0.22)',
    background: 'rgba(34,197,94,0.12)',
    color: '#bbf7d0',
    borderRadius: 12,
    padding: '9px 11px',
    fontSize: 12,
    fontWeight: 800,
  },
  communityDangerBtn: {
    border: '1px solid rgba(239,68,68,0.22)',
    background: 'rgba(239,68,68,0.12)',
    color: '#fecaca',
    borderRadius: 12,
    padding: '9px 11px',
    fontSize: 12,
    fontWeight: 800,
  },
  communityReplyText: {
    margin: 0,
    color: '#e2e8f0',
    fontSize: 14,
    lineHeight: 1.65,
  },
  communityNote: {
    padding: 12,
    borderRadius: 12,
    background: 'rgba(251,191,36,0.1)',
    color: '#fde68a',
    fontSize: 12,
    border: '1px solid rgba(251,191,36,0.16)',
  },
  communityFilterBar: {
    display: 'grid',
    gridTemplateColumns: 'minmax(220px, 1fr) repeat(2, minmax(160px, 220px))',
    gap: 10,
  },
  communityReplyStack: {
    display: 'grid',
    gap: 8,
  },
  communityMiniReply: {
    display: 'grid',
    gap: 4,
    padding: 12,
    borderRadius: 12,
    background: 'rgba(255,255,255,0.03)',
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 1.5,
  },
  communityHistoryCard: {
    padding: 16,
    borderRadius: 16,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  communityRewardValue: {
    color: '#bbf7d0',
    fontSize: 22,
    fontWeight: 900,
  },
  communityToast: {
    padding: 13,
    borderRadius: 14,
    background: 'rgba(34,197,94,0.12)',
    border: '1px solid rgba(34,197,94,0.2)',
    color: '#bbf7d0',
    fontSize: 13,
    fontWeight: 800,
    marginBottom: 16,
  },
  communityModal: {
    width: '100%',
    maxWidth: 540,
    borderRadius: 24,
    background: 'linear-gradient(180deg, rgba(15,20,40,0.98), rgba(8,11,22,0.98))',
    border: '1px solid rgba(34,197,94,0.18)',
    boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
    padding: 22,
    display: 'grid',
    gap: 14,
  },
  communityRewardOptions: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  communityRewardChip: {
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    color: '#e2e8f0',
    borderRadius: 12,
    padding: '9px 12px',
    fontWeight: 800,
  },
  communityRewardChipActive: {
    background: 'rgba(34,197,94,0.14)',
    borderColor: 'rgba(34,197,94,0.28)',
    color: '#bbf7d0',
  },
  pinModal: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 24,
    background: 'linear-gradient(180deg, rgba(15,20,40,0.98), rgba(8,11,22,0.98))',
    border: '1px solid rgba(124,111,247,0.18)',
    boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
    padding: 22,
  },
  pinModalHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  pinModalKicker: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: '#a5b4fc',
    fontWeight: 800,
    marginBottom: 8,
  },
  pinModalTitle: {
    margin: 0,
    fontSize: 22,
    fontWeight: 800,
    color: '#f8fafc',
    letterSpacing: '-0.03em',
  },
  pinModalClose: {
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    color: '#cbd5e1',
    width: 36,
    height: 36,
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 700,
  },
  pinModalText: {
    margin: '14px 0 16px',
    color: '#cbd5e1',
    lineHeight: 1.6,
    fontSize: 14,
  },
  pinModalPreview: {
    padding: 14,
    borderRadius: 18,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    marginBottom: 18,
  },
  pinModalPreviewLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: '#94a3b8',
    fontWeight: 700,
  },
  pinModalPreviewTitle: {
    fontSize: 16,
    color: '#f8fafc',
    fontWeight: 700,
  },
  pinModalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 12,
    flexWrap: 'wrap',
  },
  pinCancelBtn: {
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    color: '#e2e8f0',
    borderRadius: 14,
    padding: '11px 16px',
    fontWeight: 800,
  },
  pinReplaceBtn: {
    border: '1px solid rgba(124,111,247,0.25)',
    background: 'linear-gradient(135deg, #7c6ff7, #3b82f6)',
    color: '#fff',
    borderRadius: 14,
    padding: '11px 16px',
    fontWeight: 800,
    boxShadow: '0 18px 30px rgba(124,111,247,0.18)',
  },
};
