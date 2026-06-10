import { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../authContext';
import { fetchDoubts, submitDoubt, answerDoubt, voteDoubt, approveDoubt, rejectDoubt } from '../api';

const topicChips = [
  'NOC', 'Eligibility', 'Certificate', 'Interview', 'Offer Letter', 'Stipend', 'Remote Internship',
  'Team Formation', 'Attendance', 'SP Points', 'FAQ', 'Documents', 'Results', 'Yaksha', 'Community', 'Leaderboard',
];

const duplicateLibrary = [
  {
    title: 'How to re-upload NOC?',
    hint: 'It looks like a NOC upload issue. This thread explains the re-upload flow.',
    keywords: ['noc', 're-upload', 'upload'],
    discussionId: 2,
  },
  {
    title: 'Wrong NOC uploaded by mistake',
    hint: 'Existing discussion about mistaken document uploads.',
    keywords: ['wrong noc', 'mistake', 'incorrect'],
    discussionId: 2,
  },
  {
    title: 'NOC approval taking too long',
    hint: 'Community reports on approval delays and follow-up steps.',
    keywords: ['noc', 'approval', 'delay'],
    discussionId: 1,
  },
  {
    title: 'When will certificates be released?',
    hint: 'Certificate release timeline discussion.',
    keywords: ['certificate', 'release'],
    discussionId: 3,
  },
  {
    title: 'How do I track SP Points?',
    hint: 'SP points clarification thread.',
    keywords: ['sp', 'points', 'track'],
    discussionId: 4,
  },
];

const seededDiscussions = [
  {
    id: 'seed-1',
    title: 'My HOD is asking for written proof of selection before signing NOC — what do I show?',
    preview: 'My college administration is very strict and won\'t sign the NOC without a formal selection letter. How can I request one or prove my selection?',
    author: 'Ankit R.',
    authorId: 'seed-author-1',
    authorSp: 140,
    badge: 'Community Member',
    time: '2 hours ago',
    category: 'NOC',
    tags: ['NOC'],
    answersCount: 3,
    views: 120,
    status: 'Resolved',
    resolutionState: 'resolved',
    helpfulBy: 8,
    isMine: false,
    canAccept: false,
    questionMeta: {
      author: 'Ankit R.',
      date: '06 Jun 2026',
      category: 'NOC',
      tags: ['NOC'],
      views: 120,
      status: 'Resolved',
    },
    body: 'My college administration is very strict and won\'t sign the NOC without a formal selection letter. How can I request one or prove my selection?',
    answers: [
      {
        id: 'seed-1-ans-1',
        user: 'Priya Sharma',
        role: 'Student',
        sp: 312,
        badge: 'FAQ Expert',
        content: 'You can download the draft offer letter from your dashboard. Also, taking a screenshot of your selected banner in samagama.in works for most colleges.',
        helpful: 14,
        accepted: true,
        replies: [],
      },
      {
        id: 'seed-1-ans-2',
        user: 'Arjun Mehta',
        role: 'Student',
        sp: 198,
        badge: 'Top Reviewer',
        content: 'Yes, the draft letter has all details about the VINS program. Show it to your HOD.',
        helpful: 5,
        accepted: false,
        replies: [],
      },
      {
        id: 'seed-1-ans-3',
        user: 'Dev P.',
        role: 'Student',
        sp: 110,
        badge: 'Community Member',
        content: 'If they still don\'t agree, email VLED Lab support and request a selection confirmation letter.',
        helpful: 2,
        accepted: false,
        replies: [],
      }
    ],
  },
  {
    id: 'seed-2',
    title: 'I am enrolled in NPTEL only, not a full-time degree — am I eligible?',
    preview: 'I am doing some NPTEL courses online but not currently in college. Am I eligible to apply?',
    author: 'Priya S.',
    authorId: 'seed-author-2',
    authorSp: 95,
    badge: 'Community Member',
    time: '4 hours ago',
    category: 'Eligibility',
    tags: ['Eligibility'],
    answersCount: 5,
    views: 94,
    status: 'Resolved',
    resolutionState: 'resolved',
    helpfulBy: 12,
    isMine: false,
    canAccept: false,
    questionMeta: {
      author: 'Priya S.',
      date: '06 Jun 2026',
      category: 'Eligibility',
      tags: ['Eligibility'],
      views: 94,
      status: 'Resolved',
    },
    body: 'I am doing some NPTEL courses online but not currently in college. Am I eligible to apply?',
    answers: [
      {
        id: 'seed-2-ans-1',
        user: 'Sneha Reddy',
        role: 'Student',
        sp: 240,
        badge: 'Community Helper',
        content: 'No, VINS requires you to be a currently-enrolled student in a full-time regular degree college program. NPTEL-only candidates are not eligible.',
        helpful: 25,
        accepted: true,
        replies: [],
      },
      {
        id: 'seed-2-ans-2',
        user: 'Dev P.',
        role: 'Student',
        sp: 110,
        badge: 'Community Member',
        content: 'That is correct, a regular NOC from a physical college is mandatory.',
        helpful: 4,
        accepted: false,
        replies: [],
      }
    ],
  },
  {
    id: 'seed-3',
    title: 'My ViBe progress shows 87% even after completing all videos — what to do?',
    preview: 'I have finished all the modules in ViBe LMS, but the progress indicator is stuck at 87%. Will this affect my Bronze phase verification?',
    author: 'Rohit M.',
    authorId: 'seed-author-3',
    authorSp: 112,
    badge: 'Community Member',
    time: '5 hours ago',
    category: 'ViBe',
    tags: ['ViBe'],
    answersCount: 2,
    views: 74,
    status: 'Open',
    resolutionState: 'open',
    helpfulBy: 4,
    isMine: false,
    canAccept: false,
    questionMeta: {
      author: 'Rohit M.',
      date: '06 Jun 2026',
      category: 'ViBe',
      tags: ['ViBe'],
      views: 74,
      status: 'Open',
    },
    body: 'I have finished all the modules in ViBe LMS, but the progress indicator is stuck at 87%. Will this affect my Bronze phase verification?',
    answers: [
      {
        id: 'seed-3-ans-1',
        user: 'Arjun Mehta',
        role: 'Student',
        sp: 387,
        badge: 'Top Reviewer',
        content: 'Make sure you completed the final quizzes at the end of each module. Sometimes a quiz is left unsubmitted.',
        helpful: 18,
        accepted: false,
        replies: [],
      },
      {
        id: 'seed-3-ans-2',
        user: 'Priya Sharma',
        role: 'Student',
        sp: 421,
        badge: 'FAQ Expert',
        content: 'Check if you watched all videos to the very last second. ViBe tracks watch percentage.',
        helpful: 12,
        accepted: false,
        replies: [],
      }
    ],
  },
  {
    id: 'seed-4',
    title: 'My SP is showing negative, should I be worried?',
    preview: 'I noticed my SP points balance went negative. Does this mean I am failing or disqualified?',
    author: 'Sneha K.',
    authorId: 'seed-author-4',
    authorSp: 88,
    badge: 'Community Member',
    time: 'Yesterday',
    category: 'SP Points',
    tags: ['SP Points'],
    answersCount: 4,
    views: 140,
    status: 'Resolved',
    resolutionState: 'resolved',
    helpfulBy: 15,
    isMine: false,
    canAccept: false,
    questionMeta: {
      author: 'Sneha K.',
      date: '05 Jun 2026',
      category: 'SP Points',
      tags: ['SP Points'],
      views: 140,
      status: 'Resolved',
    },
    body: 'I noticed my SP points balance went negative. Does this mean I am failing or disqualified?',
    answers: [
      {
        id: 'seed-4-ans-1',
        user: 'Priya Sharma',
        role: 'Student',
        sp: 421,
        badge: 'FAQ Expert',
        content: 'Do not worry! SP points are just for tracking activity. Negative SP is normal and does not affect your certificate or selection status.',
        helpful: 30,
        accepted: true,
        replies: [],
      },
      {
        id: 'seed-4-ans-2',
        user: 'Rahul Verma',
        role: 'Student',
        sp: 198,
        badge: 'Helpful Contributor',
        content: 'Exactly, SP is just a leaderboard mechanic. Just focus on completing your weekly reports.',
        helpful: 8,
        accepted: false,
        replies: [],
      }
    ],
  },
  {
    id: 'seed-5',
    title: 'Will the certificate mention that it was done online?',
    preview: 'Does the certificate state that this is a remote internship or is it standard?',
    author: 'Dev P.',
    authorId: 'seed-author-5',
    authorSp: 110,
    badge: 'Community Member',
    time: 'Yesterday',
    category: 'Certificate',
    tags: ['Certificate'],
    answersCount: 3,
    views: 115,
    status: 'Resolved',
    resolutionState: 'resolved',
    helpfulBy: 10,
    isMine: false,
    canAccept: false,
    questionMeta: {
      author: 'Dev P.',
      date: '05 Jun 2026',
      category: 'Certificate',
      tags: ['Certificate'],
      views: 115,
      status: 'Resolved',
    },
    body: 'Does the certificate state that this is a remote internship or is it standard?',
    answers: [
      {
        id: 'seed-5-ans-1',
        user: 'Priya Sharma',
        role: 'Student',
        sp: 421,
        badge: 'FAQ Expert',
        content: 'The certificate is issued by Vicharanashala Lab, IIT Ropar and describes it as a full-time internship. It doesn\'t explicitly highlight \'online\' in a negative way, but rather lists your projects.',
        helpful: 15,
        accepted: true,
        replies: [],
      },
      {
        id: 'seed-5-ans-2',
        user: 'Arjun Mehta',
        role: 'Student',
        sp: 387,
        badge: 'Top Reviewer',
        content: 'It is a highly valued certificate from Prof. Sudarshan Iyengar\'s lab.',
        helpful: 3,
        accepted: false,
        replies: [],
      }
    ],
  },
  {
    id: 'seed-6',
    title: 'Can I form a team with my college friend?',
    preview: 'My friend and I got selected. Can we register as a team or are teams assigned randomly?',
    author: 'Meera L.',
    authorId: 'seed-author-6',
    authorSp: 72,
    badge: 'Community Member',
    time: '2 days ago',
    category: 'Team Formation',
    tags: ['Team Formation'],
    answersCount: 2,
    views: 95,
    status: 'Resolved',
    resolutionState: 'resolved',
    helpfulBy: 9,
    isMine: false,
    canAccept: false,
    questionMeta: {
      author: 'Meera L.',
      date: '04 Jun 2026',
      category: 'Team Formation',
      tags: ['Team Formation'],
      views: 95,
      status: 'Resolved',
    },
    body: 'My friend and I got selected. Can we register as a team or are teams assigned randomly?',
    answers: [
      {
        id: 'seed-6-ans-1',
        user: 'Sneha Reddy',
        role: 'Student',
        sp: 240,
        badge: 'Community Helper',
        content: 'Yes, you can register as a team on the dashboard. Use each other\'s registered emails to link your profiles during the team phase.',
        helpful: 22,
        accepted: true,
        replies: [],
      },
      {
        id: 'seed-6-ans-2',
        user: 'Priya Sharma',
        role: 'Student',
        sp: 421,
        badge: 'FAQ Expert',
        content: 'Make sure both of you have uploaded your NOCs and got approved first.',
        helpful: 6,
        accepted: false,
        replies: [],
      }
    ],
  },
  {
    id: 'seed-7',
    title: 'How long does it take to get the offer letter after uploading NOC?',
    preview: 'I uploaded my signed NOC yesterday. When can I expect the official offer letter to be generated?',
    author: 'Karan T.',
    authorId: 'seed-author-7',
    authorSp: 63,
    badge: 'Community Member',
    time: '3 days ago',
    category: 'Offer Letter',
    tags: ['Offer Letter'],
    answersCount: 1,
    views: 52,
    status: 'Open',
    resolutionState: 'open',
    helpfulBy: 3,
    isMine: false,
    canAccept: false,
    questionMeta: {
      author: 'Karan T.',
      date: '03 Jun 2026',
      category: 'Offer Letter',
      tags: ['Offer Letter'],
      views: 52,
      status: 'Open',
    },
    body: 'I uploaded my signed NOC yesterday. When can I expect the official offer letter to be generated?',
    answers: [
      {
        id: 'seed-7-ans-1',
        user: 'Arjun Mehta',
        role: 'Student',
        sp: 387,
        badge: 'Top Reviewer',
        content: 'It usually takes 2-3 business days for the admin team to verify the NOC and generate the formal offer letter on the dashboard.',
        helpful: 11,
        accepted: false,
        replies: [],
      }
    ],
  },
  {
    id: 'seed-8',
    title: 'Is there any chance of getting a stipend during the internship?',
    preview: 'The selection panel says no stipend, but I read that stellar performers might get one. What is the criteria?',
    author: 'Fatima N.',
    authorId: 'seed-author-8',
    authorSp: 114,
    badge: 'Community Member',
    time: '4 days ago',
    category: 'Stipend',
    tags: ['Stipend'],
    answersCount: 6,
    views: 180,
    status: 'Resolved',
    resolutionState: 'resolved',
    helpfulBy: 16,
    isMine: false,
    canAccept: false,
    questionMeta: {
      author: 'Fatima N.',
      date: '02 Jun 2026',
      category: 'Stipend',
      tags: ['Stipend'],
      views: 180,
      status: 'Resolved',
    },
    body: 'The selection panel says no stipend, but I read that stellar performers might get one. What is the criteria?',
    answers: [
      {
        id: 'seed-8-ans-1',
        user: 'Priya Sharma',
        role: 'Student',
        sp: 421,
        badge: 'FAQ Expert',
        content: 'VINS is completely free and unpaid. If you perform exceptionally well and your mentor recommends you, you might get a stipend at the end, but it is not guaranteed.',
        helpful: 20,
        accepted: true,
        replies: [],
      },
      {
        id: 'seed-8-ans-2',
        user: 'Arjun Mehta',
        role: 'Student',
        sp: 387,
        badge: 'Top Reviewer',
        content: 'Do not expect a stipend as a guarantee. Focus on learning and mentorship.',
        helpful: 5,
        accepted: false,
        replies: [],
      }
    ],
  }
];

const faqData = [
  {
    question: 'How do I know if I am selected for VINS?',
    answer: 'If you can see a yellow VINS result panel on your samagama.in dashboard, you are selected. There is no separate selection email.'
  },
  {
    question: 'How do I opt into VINS?',
    answer: 'Log in to samagama.in and tell Yaksha in the dashboard chat: "I want to opt in to VINS" exactly as shown on your result panel.'
  },
  {
    question: 'What is the NOC and who signs it?',
    answer: 'The No Objection Certificate must be signed and stamped by your HOD, Department Dean, or Principal. Download the template from your dashboard, get it signed, and upload it via the Upload NOC button.'
  },
  {
    question: 'Is there a stipend?',
    answer: 'No stipend for VINS. The programme is completely free. Stellar performers may be considered for a stipend later, but it is not guaranteed.'
  },
  {
    question: 'When can I start and what is the deadline?',
    answer: 'You can start anytime in 2026. The internship is 2 months with a 1-month grace period. Everything must be completed by 31 December 2026.'
  },
  {
    question: 'What are the phases of VINS?',
    answer: 'Bronze (Phase 1) - training/coursework on ViBe LMS. Silver (Phase 2) - real open-source project contribution under a mentor. Completing both earns the certificate. Gold and Platinum are bonus recognition phases.'
  },
  {
    question: 'Will I get a certificate?',
    answer: 'Yes. An e-certificate is issued by the Vicharanashala Lab for Education Design at IIT Ropar upon successful completion of Bronze and Silver phases.'
  },
  {
    question: 'What are Spurti Points (SP)?',
    answer: 'SP is a participation tracking system only. It does not affect your certificate or internship outcome. SP can go negative — this is normal.'
  },
  {
    question: 'What is ViBe?',
    answer: 'ViBe is the LMS (Learning Management System) used for Phase 1 coursework. It uses linear progression and has proctoring active. Use the same email as your Samagama account when registering.'
  },
  {
    question: 'Can I change my internship dates after the offer letter?',
    answer: 'Date changes after the offer letter are rarely allowed and only at the lab\'s discretion. Contact support via your dashboard chat.'
  }
];

function CommunityHubPage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [discussions, setDiscussions] = useState([]);
  const [loadingDiscussions, setLoadingDiscussions] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeChip, setActiveChip] = useState('All');
  const [feedTab, setFeedTab] = useState('All Discussions');
  const [selectedId, setSelectedId] = useState(null);
  const [askOpen, setAskOpen] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [draft, setDraft] = useState({ title: '', description: '', category: 'NOC', tags: '', screenshot: null });
  const [formErrors, setFormErrors] = useState({ title: '', description: '' });
  const [replyOpen, setReplyOpen] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [newAnswerText, setNewAnswerText] = useState('');
  const [toast, setToast] = useState(null);
  const [openFaqs, setOpenFaqs] = useState({});
  const myUserId = sessionStorage.getItem('samagama-user-id') || '';

  const triggerToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const toggleFaq = (index) => {
    setOpenFaqs(prev => ({ ...prev, [index]: !prev[index] }));
  };

  function timeAgo(dateStr) {
    if (!dateStr) return 'Recently';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  }

  function transformDoubt(d) {
    return {
      id: d._id || d.id,
      title: d.title,
      preview: (d.body || '').slice(0, 120),
      author: d.authorName || 'Student',
      authorSp: 0,
      badge: 'Community Member',
      time: timeAgo(d.createdAt),
      category: (d.tags || [])[0] || 'General',
      tags: d.tags || [],
      answersCount: (d.answers || []).length,
      views: 0,
      status: d.status === 'approved' ? (d.solved ? 'Resolved' : 'Open') : 'Community Reviewing',
      resolutionState: d.solved ? 'resolved' : (d.status === 'approved' ? 'open' : 'reviewing'),
      helpfulBy: d.votes || 0,
      isMine: String(d.author?._id || d.author || '') === String(myUserId),
      canAccept: String(d.author?._id || d.author || '') === String(myUserId),
      questionMeta: {
        author: d.authorName || 'Student',
        date: d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
        category: (d.tags || [])[0] || 'General',
        tags: d.tags || [],
        views: 0,
        status: d.status === 'approved' ? (d.solved ? 'Resolved' : 'Open') : 'Community Reviewing',
      },
      body: d.body || '',
      answers: (d.answers || []).map(a => ({
        id: a._id || a.id,
        user: a.userName || 'Student',
        role: 'Student',
        sp: 0,
        badge: 'Community Member',
        content: a.text,
        helpful: 0,
        accepted: false,
        replies: [],
      })),
    };
  }

  async function refreshDiscussions() {
    setLoadingDiscussions(true);
    try {
      const raw = await fetchDoubts();
      const backendDiscussions = Array.isArray(raw) ? raw.map(transformDoubt) : [];
      
      const preparedSeeds = seededDiscussions.map(seed => ({
        ...seed,
        isMine: seed.authorId === myUserId,
        canAccept: seed.authorId === myUserId,
      }));
      setDiscussions([...backendDiscussions, ...preparedSeeds]);
    } catch { 
      const preparedSeeds = seededDiscussions.map(seed => ({
        ...seed,
        isMine: seed.authorId === myUserId,
        canAccept: seed.authorId === myUserId,
      }));
      setDiscussions(preparedSeeds); 
    } finally { 
      setLoadingDiscussions(false); 
    }
  }

  useEffect(() => { refreshDiscussions(); }, []);

  const selectedDiscussion = useMemo(
    () => discussions.find(item => item.id === selectedId || item._id === selectedId) || null,
    [discussions, selectedId],
  );

  const searchResults = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return [];
    return discussions.filter(item => {
      const matchesSearch =
        (item.title || '').toLowerCase().includes(q) ||
        (item.category || '').toLowerCase().includes(q) ||
        (item.postedBy || item.author || '').toLowerCase().includes(q);
      const matchesChip =
        activeChip === 'All' ||
        (item.tags && item.tags.some(tag => tag.toLowerCase() === activeChip.toLowerCase())) ||
        (item.category || '').toLowerCase() === activeChip.toLowerCase();
      return matchesSearch && matchesChip;
    });
  }, [discussions, searchTerm, activeChip]);

  const filteredDiscussions = useMemo(() => {
    return discussions.filter(item => {
      const matchesChip =
        activeChip === 'All' ||
        (item.tags && item.tags.some(tag => tag.toLowerCase() === activeChip.toLowerCase())) ||
        (item.category || '').toLowerCase() === activeChip.toLowerCase();

      const matchesTab =
        feedTab === 'All Discussions' || item.isMine;

      return matchesChip && matchesTab;
    });
  }, [activeChip, discussions, feedTab]);

  const askQuery = `${draft.title} ${draft.description}`.trim().toLowerCase();
  const smartSuggestions = useMemo(() => {
    if (!askQuery) return [];
    const matches = duplicateLibrary.filter(item => item.keywords.some(keyword => askQuery.includes(keyword)));
    return matches.slice(0, 3);
  }, [askQuery]);

  function openDiscussion(id) {
    setSelectedId(id);
  }

  function closeDiscussion() {
    setSelectedId(null);
    setReplyOpen(null);
    setReplyText('');
    setNewAnswerText('');
  }

  function updateDiscussion(id, updater) {
    setDiscussions(prev =>
      prev.map(item => {
        if (item.id !== id && item._id !== id) return item;
        return typeof updater === 'function' ? updater(item) : item;
      }),
    );
  }

  function handleHelpfulClick(discussionId, answerId) {
    updateDiscussion(discussionId, item => {
      const currentAnswers = Array.isArray(item.answers) ? item.answers : [];
      return {
        ...item,
        helpfulBy: (item.helpfulBy || 0) + 1,
        answers: currentAnswers.map(answer => {
          if (answer.id !== answerId) return answer;
          return {
            ...answer,
            helpful: answer.helpful + 1,
            sp: answer.sp + 3,
          };
        }),
      };
    });
    triggerToast("+3 SP earned!");
  }

  function handleAcceptAnswer(discussionId, answerId) {
    updateDiscussion(discussionId, item => {
      const currentAnswers = Array.isArray(item.answers) ? item.answers : [];
      return {
        ...item,
        status: 'Resolved',
        resolutionState: 'resolved',
        answers: currentAnswers.map(answer => ({
          ...answer,
          accepted: answer.id === answerId,
          sp: answer.id === answerId ? answer.sp + 10 : answer.sp,
        })),
      };
    });
    triggerToast("+10 SP earned!");
  }

  function handleReplySubmit(discussionId, answerId) {
    if (!replyText.trim()) return;
    updateDiscussion(discussionId, item => {
      const currentAnswers = Array.isArray(item.answers) ? item.answers : [];
      return {
        ...item,
        answers: currentAnswers.map(answer => {
          if (answer.id !== answerId) return answer;
          return {
            ...answer,
            replies: [
              ...(answer.replies || []),
              { id: Date.now(), user: 'Student', content: replyText.trim() },
            ],
          };
        }),
      };
    });
    setReplyText('');
    setReplyOpen(null);
    triggerToast("+5 SP earned!");
  }

  function handleAnswerSubmit(discussionId) {
    if (!newAnswerText.trim()) return;
    const newAns = {
      id: 'ans-' + Date.now(),
      user: 'Student',
      role: 'Student',
      sp: 0,
      badge: 'Community Member',
      content: newAnswerText.trim(),
      helpful: 0,
      accepted: false,
      replies: [],
    };
    updateDiscussion(discussionId, item => {
      const currentAnswers = Array.isArray(item.answers) ? item.answers : [];
      const currentCount = typeof item.answers === 'number' ? item.answers : (item.answersCount || 0);
      return {
        ...item,
        answersCount: currentCount + 1,
        answers: [...currentAnswers, newAns],
      };
    });
    setNewAnswerText('');
    triggerToast("+5 SP earned!");
  }

  const handleCloseAskModal = () => {
    setAskOpen(false);
    setDraft({ title: '', description: '', category: 'NOC', tags: '', screenshot: null });
    setFormErrors({ title: '', description: '' });
  };

  async function handleAskSubmit(event) {
    event.preventDefault();
    
    const errors = { title: '', description: '' };
    let isValid = true;
    if (!draft.title.trim()) {
      errors.title = 'This field is required';
      isValid = false;
    }
    if (!draft.description.trim()) {
      errors.description = 'This field is required';
      isValid = false;
    }
    setFormErrors(errors);
    if (!isValid) return;

    const newDiscussion = {
      id: Date.now(),
      title: draft.title.trim(),
      category: draft.category,
      description: draft.description.trim(),
      postedBy: "You",
      timeAgo: "Just now",
      answers: 0,
      helpfulVotes: 0,
      status: "Open",
      spReward: "+10 SP for correct answer",
      // standard fields for safe rendering
      tags: [draft.category],
      isMine: true,
      canAccept: true,
      answersCount: 0,
      helpfulBy: 0,
      views: 0,
      questionMeta: {
        author: "You",
        date: "Just now",
        category: draft.category,
        tags: [draft.category],
        views: 0,
        status: "Open",
      },
      body: draft.description.trim(),
    };

    // Prepend to top of discussions list
    setDiscussions(prev => [newDiscussion, ...prev]);
    
    // Close modal, clear fields/errors, trigger toast
    setAskOpen(false);
    setDraft({ title: '', description: '', category: 'NOC', tags: '', screenshot: null });
    setFormErrors({ title: '', description: '' });
    triggerToast("Question posted! +2 SP earned 🎉");

    // Scroll to discussions section
    setTimeout(() => {
      const feedEl = document.getElementById('feed-card-anchor');
      if (feedEl) {
        feedEl.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);

    // Call submitDoubt in the background to save to db
    submitDoubt({
      title: newDiscussion.title,
      body: newDiscussion.body,
      tags: newDiscussion.tags,
    }).catch(err => console.error("Error submitting doubt to backend:", err));
  }

  const totalDiscussions = 4821;
  const solvedDiscussions = 3945;
  const resolutionRate = 91;
  const activeContributors = 1240;
  const todaysAnswers = 87;

  const topContributors = [
    { rank: 1, name: 'Priya Sharma', sp: 4210, badge: 'FAQ Expert' },
    { rank: 2, name: 'Arjun Mehta', sp: 3870, badge: 'Top Reviewer' },
    { rank: 3, name: 'Sneha Reddy', sp: 3540, badge: 'Community Helper' },
    { rank: 4, name: 'Rahul Verma', sp: 3220, badge: 'Helpful Contributor' },
    { rank: 5, name: 'Ananya Iyer', sp: 3105, badge: 'Positive Contributor' },
  ];

  const trending = [
    'NOC Approval Delays',
    'Internship Joining Date',
    'Certificate Release',
    'SP Points Clarification',
  ];

  const notifications = [
    { text: 'Someone answered your question', accent: 'purple' },
    { text: 'A reply was added to your answer', accent: 'blue' },
    { text: 'Your answer became helpful', accent: 'green' },
    { text: 'Your question was marked resolved', accent: 'green' },
  ];

  const myQuestions = discussions.filter(item => item.isMine);
  const openQuestions = myQuestions.filter(item => item.resolutionState !== 'resolved').length;
  const resolvedQuestions = myQuestions.filter(item => item.resolutionState === 'resolved').length;
  const answeredQuestions = myQuestions.filter(item => item.answersCount > 0).length;
  const helpfulEarned = myQuestions.reduce((sum, q) => sum + q.helpfulBy, 0);
  const displayName = user?.role === 'student' ? 'Student' : 'Community Member';

  const currentStatusColor = status => {
    if (status === 'Resolved') return '#22c55e';
    if (status === 'Community Reviewing') return '#38bdf8';
    return '#f59e0b';
  };

  return (
    <div style={page}>
      <div style={bgGlowA} />
      <div style={bgGlowB} />

      <div style={inner}>
        <header style={topBar}>
          <button type="button" onClick={() => navigate('/dashboard')} style={backBtn}>
            ← Back to Dashboard
          </button>
          <div style={portalLabel}>Community Hub</div>
          <div style={spacer} />
        </header>

        <section style={heroCard}>
            <div style={heroCopy}>
              <div style={eyebrow}>Community Hub</div>
              <h1 style={heroTitle}>Ask questions, help peers, and learn from the community.</h1>
              <p style={heroSubtitle}>
                Browse discussions, catch duplicate questions before posting, and earn Spurti Points for helpful contributions.
              </p>
            </div>
            <div style={heroRight}>
            <button type="button" style={askButton} onClick={() => setAskOpen(true)}>
              Ask a Question
            </button>
            <div style={heroQuickCard}>
              <span style={heroQuickLabel}>Resolved today</span>
              <strong style={heroQuickValue}>{resolutionRate}%</strong>
              <span style={heroQuickSub}>{solvedDiscussions.toLocaleString()} solved discussions</span>
              <span style={heroQuickSub}>Signed in as {displayName}</span>
            </div>
          </div>
        </section>

        <section style={heroSearchWrap}>
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search discussions, NOC, certificates, eligibility, stipend..."
            style={searchInput}
          />
        </section>

        {searchTerm.trim() !== '' && (
          <section style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
            border: '1px solid rgba(124, 111, 247, 0.2)',
            borderRadius: 24,
            padding: 22,
            backdropFilter: 'blur(18px)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.28)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}>
            <h2 style={{ fontSize: 18, margin: 0, color: '#a78bfa', letterSpacing: '-0.02em', fontWeight: 800 }}>
              Search Results for '{searchTerm}' — {searchResults.length} results found
            </h2>
            <div style={feedList}>
              {searchResults.length === 0 ? (
                <div style={{
                  padding: '24px',
                  textAlign: 'center',
                  color: '#94a3b8',
                  fontSize: 15,
                  background: 'rgba(255, 255, 255, 0.01)',
                  borderRadius: 16,
                  border: '1px dashed rgba(255, 255, 255, 0.08)',
                }}>
                  No results found for '{searchTerm}'. Try different keywords or ask a new question.
                </div>
              ) : (
                searchResults.map(item => (
                  <article
                    key={item.id || item._id}
                    style={{ ...discussionCard, position: 'relative' }}
                    onClick={() => openDiscussion(item.id || item._id)}
                  >
                    {/* SP Reward Badge */}
                    <div style={{
                      position: 'absolute',
                      top: 14,
                      right: 14,
                      background: 'rgba(124, 111, 247, 0.15)',
                      border: '1px solid rgba(124, 111, 247, 0.25)',
                      color: '#c4b5fd',
                      borderRadius: 8,
                      padding: '4px 8px',
                      fontSize: 11,
                      fontWeight: 800,
                      zIndex: 5,
                    }}>
                      +10 SP for correct answer
                    </div>

                    <div style={discussionTop}>
                      <div style={discussionCopy}>
                        <div style={discussionTitleRow}>
                          <h3 style={{ ...discussionTitle, paddingRight: 160 }}>{item.title}</h3>
                        </div>
                        <p style={discussionPreview}>{item.preview || item.description}</p>
                        <div style={discussionMeta}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 800,
                            border: '1px solid',
                            color: item.resolutionState === 'resolved' ? '#22c55e' : '#f59e0b',
                            borderColor: item.resolutionState === 'resolved' ? 'rgba(34, 197, 94, 0.25)' : 'rgba(245, 158, 11, 0.25)',
                            background: item.resolutionState === 'resolved' ? 'rgba(34, 197, 94, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                            whiteSpace: 'nowrap',
                            marginRight: 6,
                          }}>
                            {item.resolutionState === 'resolved' ? '✓ Resolved' : (item.status || 'Open')}
                          </span>
                          {item.postedBy ? (
                            <span>Posted by: {item.postedBy} · {item.timeAgo}</span>
                          ) : (
                            <>
                              <span>Posted by: {item.author} · SP: {item.authorSp}</span>
                              <span>{item.time}</span>
                            </>
                          )}
                          <span>{item.category}</span>
                          <span>{item.answers !== undefined && !Array.isArray(item.answers) ? item.answers : (item.answersCount || 0)} answers</span>
                          <span>{item.views || 0} Views</span>
                        </div>
                      </div>
                      <div style={{ ...discussionVoteBox, marginTop: 28 }}>
                        <div style={discussionVoteValue}>❤️ {item.helpfulVotes !== undefined ? item.helpfulVotes : (item.helpfulBy || 0)}</div>
                        <div style={discussionVoteLabel}>Helpful votes</div>
                      </div>
                    </div>

                    <div style={tagWrap}>
                      {(item.tags || []).map(tag => (
                        <span key={tag} style={tagPill}>{tag}</span>
                      ))}
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        )}

        <section style={topicRow}>
          {['All', ...topicChips].map(chip => (
            <button
              key={chip}
              type="button"
              onClick={() => setActiveChip(chip)}
              style={{
                ...topicChip,
                ...(activeChip === chip ? topicChipActive : {}),
              }}
            >
              {chip}
            </button>
          ))}
        </section>

        <section style={mainGrid}>
          <div style={leftColumn}>
            
            {/* --- SECTION 1: FREQUENTLY ASKED QUESTIONS (FAQ) --- */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 24,
              padding: 22,
              marginBottom: 18,
              backdropFilter: 'blur(18px)',
              boxShadow: '0 12px 32px rgba(0,0,0,0.28)',
            }}>
              <h2 style={{ fontSize: 18, margin: '0 0 16px', color: '#eef0f6', letterSpacing: '-0.02em', fontWeight: 800 }}>
                📌 Frequently Asked Questions (FAQ)
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {faqData.map((faq, index) => {
                  const isOpen = openFaqs[index];
                  return (
                    <div
                      key={index}
                      style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: 16,
                        overflow: 'hidden',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => toggleFaq(index)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '16px 18px',
                          background: 'transparent',
                          border: 'none',
                          color: '#eef0f6',
                          textAlign: 'left',
                          fontWeight: 700,
                          fontSize: 15,
                          cursor: 'pointer',
                        }}
                      >
                        <span>{faq.question}</span>
                        <span style={{ fontSize: 18, color: '#a78bfa', marginLeft: 8 }}>
                          {isOpen ? '−' : '＋'}
                        </span>
                      </button>
                      {isOpen && (
                        <div
                          style={{
                            padding: '0 18px 16px',
                            color: '#cbd5e1',
                            fontSize: 14.5,
                            lineHeight: 1.6,
                            borderTop: '1px solid rgba(255, 255, 255, 0.04)',
                            paddingTop: 12,
                          }}
                        >
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div id="feed-card-anchor" style={feedCard}>
              <div style={feedHeader}>
                <div style={segmentTabs}>
                  {['All Discussions', 'My Questions'].map(tab => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setFeedTab(tab)}
                      style={{
                        ...feedTabBtn,
                        ...(feedTab === tab ? feedTabBtnActive : {}),
                      }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div style={feedCount}>{filteredDiscussions.length} discussions</div>
              </div>

              <div style={feedList}>
                {filteredDiscussions.map(item => (
                  <article
                    key={item.id || item._id}
                    style={{ ...discussionCard, position: 'relative' }}
                    onClick={() => openDiscussion(item.id || item._id)}
                  >
                    {/* SP Reward Badge */}
                    <div style={{
                      position: 'absolute',
                      top: 14,
                      right: 14,
                      background: 'rgba(124, 111, 247, 0.15)',
                      border: '1px solid rgba(124, 111, 247, 0.25)',
                      color: '#c4b5fd',
                      borderRadius: 8,
                      padding: '4px 8px',
                      fontSize: 11,
                      fontWeight: 800,
                      zIndex: 5,
                    }}>
                      +10 SP for correct answer
                    </div>

                    <div style={discussionTop}>
                      <div style={discussionCopy}>
                        <div style={discussionTitleRow}>
                          <h3 style={{ ...discussionTitle, paddingRight: 160 }}>{item.title}</h3>
                        </div>
                        <p style={discussionPreview}>{item.preview || item.description}</p>
                        <div style={discussionMeta}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 800,
                            border: '1px solid',
                            color: item.resolutionState === 'resolved' ? '#22c55e' : '#f59e0b',
                            borderColor: item.resolutionState === 'resolved' ? 'rgba(34, 197, 94, 0.25)' : 'rgba(245, 158, 11, 0.25)',
                            background: item.resolutionState === 'resolved' ? 'rgba(34, 197, 94, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                            whiteSpace: 'nowrap',
                            marginRight: 6,
                          }}>
                            {item.resolutionState === 'resolved' ? '✓ Resolved' : (item.status || 'Open')}
                          </span>
                          {item.postedBy ? (
                            <span>Posted by: {item.postedBy} · {item.timeAgo}</span>
                          ) : (
                            <>
                              <span>Posted by: {item.author} · SP: {item.authorSp}</span>
                              <span>{item.time}</span>
                            </>
                          )}
                          <span>{item.category}</span>
                          <span>{item.answers !== undefined && !Array.isArray(item.answers) ? item.answers : (item.answersCount || 0)} answers</span>
                          <span>{item.views || 0} Views</span>
                        </div>
                      </div>
                      <div style={{ ...discussionVoteBox, marginTop: 28 }}>
                        <div style={discussionVoteValue}>❤️ {item.helpfulVotes !== undefined ? item.helpfulVotes : (item.helpfulBy || 0)}</div>
                        <div style={discussionVoteLabel}>Helpful votes</div>
                      </div>
                    </div>

                    <div style={tagWrap}>
                      {(item.tags || []).map(tag => (
                        <span key={tag} style={tagPill}>{tag}</span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>

          <aside style={sidebar}>
            <div style={sideCard}>
              <SectionTitle title="Community Stats" />
              <StatLine label="Total Discussions" value={totalDiscussions.toLocaleString()} />
              <StatLine label="Questions Solved" value={solvedDiscussions.toLocaleString()} />
              <StatLine label="Active Contributors" value={activeContributors.toLocaleString()} />
              <StatLine label="Today's Answers" value={todaysAnswers.toLocaleString()} />
              <StatLine label="Resolution Rate" value={`${resolutionRate}%`} />
            </div>

            <div style={sideCard}>
              <SectionTitle title="Trending Discussions" />
              <div style={stackGap}>
                {trending.map(item => (
                  <button key={item} type="button" style={trendItem} onClick={() => setSearchTerm(item)}>
                    🔥 {item}
                  </button>
                ))}
              </div>
            </div>

            <div style={sideCard}>
              <SectionTitle title="Top Contributors" />
              <div style={leaderMini}>
                {topContributors.map(item => (
                  <div key={item.rank} style={leaderMiniItem}>
                    <div style={leaderMiniRank}>#{item.rank}</div>
                    <div style={leaderMiniMeta}>
                      <strong style={{ color: '#eef0f6' }}>{item.name}</strong>
                      <span style={{ color: '#94a3b8', fontSize: 12 }}>{item.badge} · SP {item.sp}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" style={viewBtn} onClick={() => navigate('/leaderboard')}>
                View Full Leaderboard
              </button>
            </div>

            <div style={sideCard}>
              <SectionTitle title="Notifications" />
              <div style={stackGap}>
                {notifications.map(item => (
                  <div key={item.text} style={notificationItem}>
                    <span style={{ ...notifDot, background: notificationColors[item.accent] }} />
                    <span style={notificationText}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={sideCard}>
              <SectionTitle title="My Questions" />
              <div style={stackGap}>
                <StatLine label="Questions Asked" value={myQuestions.length.toString()} />
                <StatLine label="Open Questions" value={openQuestions.toString()} />
                <StatLine label="Resolved Questions" value={resolvedQuestions.toString()} />
                <StatLine label="Questions Answered" value={answeredQuestions.toString()} />
                <StatLine label="Helpful Count Earned" value={helpfulEarned.toString()} />
              </div>
            </div>
          </aside>
        </section>
      </div>

      {askOpen && (
        <div style={modalBackdrop} onClick={handleCloseAskModal}>
          <div style={modalCard} onClick={e => e.stopPropagation()}>
            <div style={modalHeader}>
              <div>
                <div style={eyebrow}>Ask a Question</div>
                <h2 style={modalTitle}>Share your doubt with the community</h2>
              </div>
              <button type="button" onClick={handleCloseAskModal} style={closeBtn}>✕</button>
            </div>

            <form style={askForm} onSubmit={handleAskSubmit}>
              <input
                value={draft.title}
                onChange={e => {
                  setDraft(prev => ({ ...prev, title: e.target.value }));
                  if (formErrors.title) {
                    setFormErrors(prev => ({ ...prev, title: '' }));
                  }
                }}
                placeholder="Question Title"
                style={field}
              />
              {formErrors.title && (
                <div style={{ color: '#ff6b6b', fontSize: 13, marginTop: -6, marginBottom: 2, paddingLeft: 4 }}>
                  {formErrors.title}
                </div>
              )}

              <textarea
                value={draft.description}
                onChange={e => {
                  setDraft(prev => ({ ...prev, description: e.target.value }));
                  if (formErrors.description) {
                    setFormErrors(prev => ({ ...prev, description: '' }));
                  }
                }}
                placeholder="Description"
                style={{ ...field, minHeight: 140, resize: 'vertical' }}
              />
              {formErrors.description && (
                <div style={{ color: '#ff6b6b', fontSize: 13, marginTop: -6, marginBottom: 2, paddingLeft: 4 }}>
                  {formErrors.description}
                </div>
              )}

              {smartSuggestions.length > 0 && (
                <div style={suggestionBlock}>
                  <div style={suggestionLabel}>Do you mean:</div>
                  <div style={suggestionGrid}>
                    {smartSuggestions.map(item => (
                      <button
                        type="button"
                        key={item.title}
                        style={suggestionCard}
                        onClick={() => {
                          handleCloseAskModal();
                          openDiscussion(item.discussionId);
                        }}
                      >
                        <strong style={{ color: '#eef0f6' }}>{item.title}</strong>
                        <span style={{ color: '#94a3b8', fontSize: 12 }}>{item.hint}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={formGrid}>
                <select
                  value={draft.category}
                  onChange={e => setDraft(prev => ({ ...prev, category: e.target.value }))}
                  style={field}
                >
                  {topicChips.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <input
                  value={draft.tags}
                  onChange={e => setDraft(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="Tags (comma separated)"
                  style={field}
                />
              </div>

              <input
                type="file"
                onChange={e => setDraft(prev => ({ ...prev, screenshot: e.target.files?.[0] || null }))}
                style={fileField}
              />

              <button type="submit" style={submitBtn}>Submit Question</button>
              {submitMessage && <div style={successMessage}>{submitMessage}</div>}
            </form>
          </div>
        </div>
      )}

      {selectedDiscussion && (
        <div style={modalBackdrop} onClick={closeDiscussion}>
          <div style={detailModal} onClick={e => e.stopPropagation()}>
            <div style={detailHeader}>
              <div>
                <div style={eyebrow}>Discussion Detail</div>
                <h2 style={detailTitle}>{selectedDiscussion.title}</h2>
                <div style={detailMeta}>
                  <span>{selectedDiscussion.questionMeta?.author || selectedDiscussion.postedBy || 'You'}</span>
                  <span>{selectedDiscussion.questionMeta?.date || selectedDiscussion.timeAgo || 'Just now'}</span>
                  <span>{selectedDiscussion.questionMeta?.category || selectedDiscussion.category}</span>
                  <span>{selectedDiscussion.questionMeta?.views || 0} Views</span>
                  <span style={{ color: currentStatusColor(selectedDiscussion.status), fontWeight: 800 }}>
                    {selectedDiscussion.questionMeta?.status || selectedDiscussion.status || 'Open'}
                  </span>
                </div>
              </div>
              <button type="button" onClick={closeDiscussion} style={closeBtn}>✕</button>
            </div>

            <div style={questionPanel}>
              <p style={questionBody}>{selectedDiscussion.body || selectedDiscussion.description}</p>
              <div style={tagWrap}>
                {(selectedDiscussion.questionMeta?.tags || [selectedDiscussion.category] || []).map(tag => (
                  <span key={tag} style={tagPill}>{tag}</span>
                ))}
              </div>
            </div>

            <div style={answersHeader}>
              <h3 style={answersTitle}>Answers</h3>
              <span style={answersCount}>
                {Array.isArray(selectedDiscussion.answers) ? selectedDiscussion.answers.length : (selectedDiscussion.answersCount || 0)} replies
              </span>
            </div>

            <div style={answerList}>
              {Array.isArray(selectedDiscussion.answers) && [...selectedDiscussion.answers]
                .sort((a, b) => Number(b.accepted) - Number(a.accepted) || b.helpful - a.helpful)
                .map(answer => (
                  <div key={answer.id} style={{
                    ...answerCard,
                    ...(answer.accepted ? acceptedAnswerCard : {}),
                  }}>
                    <div style={answerTop}>
                      <div style={avatar}>{(answer.user || '').slice(0, 1)}</div>
                      <div style={answerMeta}>
                        <div style={answerNameRow}>
                          <strong style={{ color: '#eef0f6' }}>{answer.user}</strong>
                          <span style={roleBadge}>{answer.role}</span>
                          <span style={spBadge}>SP {answer.sp}</span>
                          {answer.badge && <span style={miniBadge}>{answer.badge}</span>}
                        </div>
                        <div style={answerMetaText}>
                          <span>❤️ Helpful by {answer.helpful} students</span>
                          {answer.accepted && <span style={acceptedPill}>Community Verified</span>}
                        </div>
                      </div>
                    </div>
                    <p style={answerContent}>{answer.content}</p>

                    <div style={answerActions}>
                      <button type="button" style={actionBtn} onClick={() => handleHelpfulClick(selectedDiscussion.id, answer.id)}>
                        ▲ Upvote ({answer.helpful})
                      </button>
                      <button type="button" style={actionBtn} onClick={() => setReplyOpen(prev => prev === answer.id ? null : answer.id)}>
                        Reply
                      </button>
                      {selectedDiscussion.canAccept && !answer.accepted && (
                        <button type="button" style={acceptBtn} onClick={() => handleAcceptAnswer(selectedDiscussion.id, answer.id)}>
                          ✓ Mark as Resolved
                        </button>
                      )}
                    </div>

                    {(answer.replies || []).length > 0 && (
                      <div style={replyThread}>
                        {answer.replies.map(reply => (
                          <div key={reply.id} style={replyItem}>
                            <div style={replyAvatar}>{(reply.user || '').slice(0, 1)}</div>
                            <div>
                              <strong style={{ color: '#eef0f6' }}>{reply.user}</strong>
                              <p style={replyTextStyle}>{reply.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {replyOpen === answer.id && (
                      <div style={replyComposer}>
                        <textarea
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                          placeholder="Write a reply..."
                          style={replyField}
                        />
                        <button type="button" style={submitReplyBtn} onClick={() => handleReplySubmit(selectedDiscussion.id, answer.id)}>
                          Post Reply
                        </button>
                      </div>
                    )}
                  </div>
                ))}
            </div>

            {/* Top-level Answer Composer */}
            <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: 15, color: '#eef0f6' }}>Write your answer</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <textarea
                  value={newAnswerText}
                  onChange={e => setNewAnswerText(e.target.value)}
                  placeholder="Type your answer here to help your peers..."
                  style={{
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 16,
                    background: 'rgba(255,255,255,0.04)',
                    color: '#eef0f6',
                    minHeight: 100,
                    padding: 14,
                    outline: 'none',
                    resize: 'none',
                    fontSize: 14,
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleAnswerSubmit(selectedDiscussion.id)}
                  style={{
                    alignSelf: 'flex-start',
                    border: 'none',
                    borderRadius: 14,
                    padding: '11px 18px',
                    background: 'linear-gradient(135deg, #7c6ff7, #38bdf8)',
                    color: '#fff',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Post Answer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: 12,
          fontWeight: 800,
          boxShadow: '0 12px 28px rgba(124, 111, 247, 0.4)',
          zIndex: 1000,
          animation: 'yakshaFadeUp 0.3s ease both',
        }}>
          ✨ {toast}
        </div>
      )}
    </div>
  );
}

function SectionTitle({ title }) {
  return (
    <div style={{
      color: '#a78bfa',
      fontSize: 13,
      fontWeight: 800,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      marginBottom: 12,
    }}>
      {title}
    </div>
  );
}

function StatLine({ label, value }) {
  return (
    <div style={statLine}>
      <span style={statLabel}>{label}</span>
      <strong style={statValue}>{value}</strong>
    </div>
  );
}

const notificationColors = {
  purple: '#7c6ff7',
  blue: '#38bdf8',
  green: '#22c55e',
};

const page = {
  minHeight: '100vh',
  background: 'radial-gradient(ellipse at 15% 20%, #13112b 0%, #0d0d1a 45%, #07090f 100%)',
  position: 'relative',
  overflow: 'hidden',
  color: '#eef0f6',
};

const bgGlowA = {
  position: 'fixed',
  top: '-8%',
  left: '-10%',
  width: 560,
  height: 560,
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(124,111,247,0.15), transparent 70%)',
  pointerEvents: 'none',
};

const bgGlowB = {
  position: 'fixed',
  right: '-12%',
  bottom: '-12%',
  width: 560,
  height: 560,
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(56,189,248,0.12), transparent 70%)',
  pointerEvents: 'none',
};

const inner = {
  position: 'relative',
  zIndex: 1,
  maxWidth: 1460,
  margin: '0 auto',
  padding: '24px 24px 92px',
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
};

const topBar = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '8px 0 0',
};

const backBtn = {
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.05)',
  color: '#eef0f6',
  borderRadius: 14,
  padding: '10px 14px',
  fontWeight: 700,
};

const portalLabel = {
  color: '#a78bfa',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: '0.18em',
  fontWeight: 800,
};

const spacer = {
  flex: 1,
};

const heroCard = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 18,
  alignItems: 'center',
  padding: 22,
  borderRadius: 26,
  background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
  border: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(18px)',
};

const heroCopy = {
  maxWidth: 760,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const eyebrow = {
  color: '#a78bfa',
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
};

const heroTitle = {
  margin: 0,
  fontSize: 'clamp(28px, 3vw, 40px)',
  letterSpacing: '-0.04em',
  lineHeight: 1.05,
};

const heroSubtitle = {
  margin: 0,
  color: '#cbd5e1',
  fontSize: 15,
  lineHeight: 1.55,
};

const heroRight = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  minWidth: 220,
};

const askButton = {
  border: 'none',
  borderRadius: 16,
  padding: '14px 18px',
  background: 'linear-gradient(135deg, #7c6ff7, #38bdf8)',
  color: '#fff',
  fontWeight: 800,
  boxShadow: '0 14px 28px rgba(124,111,247,0.24)',
};

const heroQuickCard = {
  padding: 16,
  borderRadius: 18,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const heroQuickLabel = { color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 };
const heroQuickValue = { color: '#eef0f6', fontSize: 28, fontWeight: 900, letterSpacing: '-0.04em' };
const heroQuickSub = { color: '#cbd5e1', fontSize: 13 };

const heroSearchWrap = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const searchInput = {
  width: '100%',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 18,
  background: 'rgba(255,255,255,0.04)',
  color: '#eef0f6',
  padding: '16px 18px',
  fontSize: 14,
  outline: 'none',
  boxShadow: '0 10px 24px rgba(0,0,0,0.18)',
};

const topicRow = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
};

const topicChip = {
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.03)',
  color: '#cbd5e1',
  padding: '9px 12px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
};

const topicChipActive = {
  background: 'linear-gradient(135deg, rgba(124,111,247,0.22), rgba(56,189,248,0.14))',
  borderColor: 'rgba(124,111,247,0.28)',
  color: '#fff',
};

const mainGrid = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 2.35fr) minmax(320px, 1fr)',
  gap: 18,
  alignItems: 'start',
};

const leftColumn = {
  minWidth: 0,
};

const feedCard = {
  ...glassCardStyle(),
  padding: 20,
};

function glassCardStyle() {
  return {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 24,
    backdropFilter: 'blur(18px)',
    boxShadow: '0 12px 32px rgba(0,0,0,0.28)',
  };
}

const feedHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
  marginBottom: 16,
};

const segmentTabs = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
};

const feedTabBtn = {
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.03)',
  color: '#cbd5e1',
  padding: '10px 14px',
  borderRadius: 14,
  fontWeight: 700,
};

const feedTabBtnActive = {
  background: 'linear-gradient(135deg, rgba(124,111,247,0.22), rgba(56,189,248,0.14))',
  color: '#fff',
  borderColor: 'rgba(124,111,247,0.28)',
};

const feedCount = {
  color: '#94a3b8',
  fontSize: 12,
  fontWeight: 700,
};

const feedList = {
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
};

const discussionCard = {
  padding: 18,
  borderRadius: 20,
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  cursor: 'pointer',
};

const discussionTop = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 16,
  alignItems: 'flex-start',
};

const discussionCopy = {
  minWidth: 0,
  flex: 1,
};

const discussionTitleRow = {
  display: 'flex',
  gap: 10,
  alignItems: 'flex-start',
  justifyContent: 'space-between',
};

const discussionTitle = {
  margin: 0,
  color: '#eef0f6',
  fontSize: 18,
  letterSpacing: '-0.03em',
};

const discussionPreview = {
  margin: '8px 0 0',
  color: '#cbd5e1',
  lineHeight: 1.55,
  fontSize: 14,
};

const discussionMeta = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px 14px',
  marginTop: 12,
  color: '#94a3b8',
  fontSize: 12,
};

const discussionVoteBox = {
  minWidth: 120,
  padding: 14,
  borderRadius: 16,
  background: 'rgba(124,111,247,0.08)',
  border: '1px solid rgba(124,111,247,0.18)',
  textAlign: 'center',
};

const discussionVoteValue = {
  fontSize: 20,
  fontWeight: 900,
  color: '#fff',
};

const discussionVoteLabel = {
  color: '#cbd5e1',
  fontSize: 12,
  marginTop: 4,
};

const tagWrap = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
};

const tagPill = {
  padding: '8px 11px',
  borderRadius: 999,
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  color: '#dbeafe',
  fontSize: 12,
  fontWeight: 700,
};

const statusPill = {
  padding: '7px 10px',
  borderRadius: 999,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.03)',
  fontSize: 11,
  fontWeight: 800,
  whiteSpace: 'nowrap',
};

const sidebar = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  minWidth: 0,
};

const sideCard = {
  ...glassCardStyle(),
  padding: 18,
};

const stackGap = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const statLine = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  padding: '10px 0',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
};

const statLabel = {
  color: '#94a3b8',
  fontSize: 12,
};

const statValue = {
  color: '#eef0f6',
  fontSize: 14,
};

const trendItem = {
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.03)',
  color: '#eef0f6',
  padding: '12px 14px',
  borderRadius: 16,
  textAlign: 'left',
  fontWeight: 700,
};

const leaderMini = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const leaderMiniItem = {
  display: 'flex',
  gap: 12,
  alignItems: 'center',
  padding: '10px 0',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
};

const leaderMiniRank = {
  width: 28,
  height: 28,
  borderRadius: '50%',
  background: 'rgba(124,111,247,0.16)',
  display: 'grid',
  placeItems: 'center',
  color: '#fff',
  fontSize: 12,
  fontWeight: 800,
  flexShrink: 0,
};

const leaderMiniMeta = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

const viewBtn = {
  marginTop: 12,
  width: '100%',
  border: 'none',
  borderRadius: 14,
  padding: '12px 14px',
  background: 'linear-gradient(135deg, #7c6ff7, #38bdf8)',
  color: '#fff',
  fontWeight: 800,
};

const notificationItem = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 0',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
};

const notifDot = {
  width: 8,
  height: 8,
  borderRadius: '50%',
  flexShrink: 0,
};

const notificationText = {
  color: '#dbeafe',
  fontSize: 13,
  lineHeight: 1.45,
};

const modalBackdrop = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(3, 7, 18, 0.82)',
  backdropFilter: 'blur(12px)',
  display: 'grid',
  placeItems: 'center',
  zIndex: 100,
  padding: 18,
};

const modalCard = {
  width: 'min(920px, 100%)',
  maxHeight: '88vh',
  overflow: 'auto',
  padding: 22,
  borderRadius: 26,
  background: 'linear-gradient(135deg, rgba(12,14,24,0.98), rgba(17,23,39,0.98))',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 24px 70px rgba(0,0,0,0.5)',
};

const modalHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'flex-start',
  marginBottom: 16,
};

const modalTitle = {
  margin: '8px 0 0',
  fontSize: 'clamp(22px, 2.4vw, 32px)',
  letterSpacing: '-0.04em',
  lineHeight: 1.1,
};

const closeBtn = {
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.05)',
  color: '#eef0f6',
  borderRadius: 12,
  width: 40,
  height: 40,
  display: 'grid',
  placeItems: 'center',
  flexShrink: 0,
};

const askForm = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const field = {
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
  background: 'rgba(255,255,255,0.04)',
  color: '#eef0f6',
  padding: '14px 16px',
  outline: 'none',
  fontSize: 14,
};

const suggestionBlock = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  padding: 14,
  borderRadius: 18,
  background: 'rgba(124,111,247,0.06)',
  border: '1px solid rgba(124,111,247,0.12)',
};

const suggestionLabel = {
  color: '#cbd5e1',
  fontWeight: 700,
  fontSize: 13,
};

const suggestionGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 10,
};

const suggestionCard = {
  textAlign: 'left',
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.03)',
  borderRadius: 16,
  padding: 14,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  color: '#eef0f6',
};

const formGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 12,
};

const fileField = {
  color: '#cbd5e1',
  fontSize: 13,
};

const submitBtn = {
  border: 'none',
  borderRadius: 16,
  padding: '14px 16px',
  background: 'linear-gradient(135deg, #7c6ff7, #38bdf8)',
  color: '#fff',
  fontWeight: 800,
};

const successMessage = {
  padding: '12px 14px',
  borderRadius: 14,
  background: 'rgba(34,197,94,0.12)',
  border: '1px solid rgba(34,197,94,0.2)',
  color: '#bbf7d0',
  fontWeight: 700,
};

const detailModal = {
  width: 'min(1100px, 100%)',
  maxHeight: '90vh',
  overflow: 'auto',
  padding: 22,
  borderRadius: 28,
  background: 'linear-gradient(135deg, rgba(12,14,24,0.99), rgba(17,23,39,0.99))',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 28px 80px rgba(0,0,0,0.55)',
};

const detailHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'flex-start',
  marginBottom: 16,
};

const detailTitle = {
  margin: '8px 0 0',
  fontSize: 'clamp(24px, 2.5vw, 34px)',
  lineHeight: 1.08,
  letterSpacing: '-0.04em',
};

const detailMeta = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px 12px',
  color: '#94a3b8',
  fontSize: 12,
  marginTop: 10,
};

const questionPanel = {
  padding: 18,
  borderRadius: 20,
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.06)',
  marginBottom: 16,
};

const questionBody = {
  margin: 0,
  color: '#dbeafe',
  lineHeight: 1.7,
  fontSize: 15,
};

const answersHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  marginBottom: 14,
};

const answersTitle = {
  margin: 0,
  fontSize: 18,
  letterSpacing: '-0.03em',
};

const answersCount = {
  color: '#94a3b8',
  fontSize: 12,
  fontWeight: 700,
};

const answerList = {
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
};

const answerCard = {
  padding: 16,
  borderRadius: 20,
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.06)',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const acceptedAnswerCard = {
  background: 'rgba(34,197,94,0.08)',
  border: '1px solid rgba(34,197,94,0.24)',
  boxShadow: '0 0 0 1px rgba(34,197,94,0.06), 0 0 32px rgba(34,197,94,0.08)',
};

const answerTop = {
  display: 'flex',
  gap: 12,
  alignItems: 'flex-start',
};

const avatar = {
  width: 42,
  height: 42,
  borderRadius: '50%',
  background: 'linear-gradient(135deg, rgba(124,111,247,0.95), rgba(56,189,248,0.85))',
  display: 'grid',
  placeItems: 'center',
  fontWeight: 900,
  color: '#fff',
  flexShrink: 0,
};

const answerMeta = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  minWidth: 0,
};

const answerNameRow = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 8,
};

const roleBadge = {
  padding: '5px 8px',
  borderRadius: 999,
  background: 'rgba(56,189,248,0.12)',
  border: '1px solid rgba(56,189,248,0.2)',
  color: '#dbeafe',
  fontSize: 11,
  fontWeight: 800,
};

const spBadge = {
  padding: '5px 8px',
  borderRadius: 999,
  background: 'rgba(124,111,247,0.12)',
  border: '1px solid rgba(124,111,247,0.22)',
  color: '#eef0f6',
  fontSize: 11,
  fontWeight: 800,
};

const miniBadge = {
  padding: '5px 8px',
  borderRadius: 999,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#cbd5e1',
  fontSize: 11,
  fontWeight: 700,
};

const answerMetaText = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
  color: '#94a3b8',
  fontSize: 12,
};

const acceptedPill = {
  color: '#86efac',
  fontWeight: 800,
};

const answerContent = {
  margin: 0,
  color: '#e5e7eb',
  lineHeight: 1.65,
  fontSize: 14,
};

const answerActions = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 10,
};

const actionBtn = {
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.03)',
  color: '#e5e7eb',
  padding: '9px 12px',
  borderRadius: 14,
  fontWeight: 700,
};

const acceptBtn = {
  border: '1px solid rgba(34,197,94,0.25)',
  background: 'rgba(34,197,94,0.12)',
  color: '#bbf7d0',
  padding: '9px 12px',
  borderRadius: 14,
  fontWeight: 800,
};

const replyThread = {
  marginLeft: 54,
  paddingLeft: 14,
  borderLeft: '1px solid rgba(124,111,247,0.22)',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const replyItem = {
  display: 'flex',
  gap: 10,
  alignItems: 'flex-start',
  padding: '10px 0',
};

const replyAvatar = {
  width: 30,
  height: 30,
  borderRadius: '50%',
  background: 'rgba(124,111,247,0.16)',
  display: 'grid',
  placeItems: 'center',
  color: '#eef0f6',
  fontSize: 12,
  fontWeight: 800,
  flexShrink: 0,
};

const replyTextStyle = {
  margin: '4px 0 0',
  color: '#cbd5e1',
  fontSize: 13,
  lineHeight: 1.6,
};

const replyComposer = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const replyField = {
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
  background: 'rgba(255,255,255,0.04)',
  color: '#eef0f6',
  minHeight: 88,
  padding: 14,
  outline: 'none',
  resize: 'vertical',
};

const submitReplyBtn = {
  alignSelf: 'flex-start',
  border: 'none',
  borderRadius: 14,
  padding: '11px 14px',
  background: 'linear-gradient(135deg, #7c6ff7, #38bdf8)',
  color: '#fff',
  fontWeight: 800,
};

export default CommunityHubPage;
