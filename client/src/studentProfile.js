const PROFILE_KEY = 'samagama-student-profile';

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function profileKey(userId) {
  return `${PROFILE_KEY}:${userId || 'student'}`;
}

function defaultDocumentState(fileName = '', uploadedAt = '') {
  return {
    fileName,
    uploadedAt,
    status: fileName ? 'Uploaded' : 'Not uploaded',
  };
}

export function createBlankProfile(defaults = {}) {
  return {
    fullName: defaults.fullName || '',
    email: defaults.email || '',
    phone: '',
    gender: '',
    dateOfBirth: '',
    city: '',
    address: '',
    college: '',
    degree: '',
    department: '',
    year: '',
    semester: '',
    rollNumber: '',
    cgpa: '',
    github: '',
    portfolio: '',
    linkedin: '',
    projects: '',
    experience: '',
    skills: '',
    internshipTrack: '',
    interestAreas: '',
    workingMode: '',
    availability: '',
    motivation: '',
    cv: defaultDocumentState(),
    supportingDocument: defaultDocumentState(),
    summaryNotes: '',
    submittedAt: '',
    updatedAt: '',
    lastOpenedAt: '',
  };
}

export function getStudentProfile(userId, defaults = {}) {
  if (typeof window === 'undefined') return createBlankProfile(defaults);
  const saved = readJson(profileKey(userId), null);
  if (!saved) return createBlankProfile(defaults);
  return {
    ...createBlankProfile(defaults),
    ...saved,
    cv: {
      ...defaultDocumentState(),
      ...saved.cv,
    },
    supportingDocument: {
      ...defaultDocumentState(),
      ...saved.supportingDocument,
    },
  };
}

export function saveStudentProfile(userId, profile) {
  if (typeof window === 'undefined') return profile;
  const next = {
    ...profile,
    updatedAt: new Date().toISOString(),
  };
  writeJson(profileKey(userId), next);
  window.dispatchEvent(new Event('samagama-profile-updated'));
  return next;
}

export function markProfileOpened(userId) {
  const current = getStudentProfile(userId);
  return saveStudentProfile(userId, {
    ...current,
    lastOpenedAt: new Date().toISOString(),
  });
}

export function hasSubmittedProfile(profile) {
  return Boolean(profile?.submittedAt);
}

export function profileCompletionScore(profile) {
  if (!profile) return 0;
  const fields = [
    profile.fullName,
    profile.email,
    profile.phone,
    profile.gender,
    profile.dateOfBirth,
    profile.city,
    profile.college,
    profile.degree,
    profile.department,
    profile.year,
    profile.semester,
    profile.rollNumber,
    profile.cgpa,
    profile.github,
    profile.portfolio,
    profile.linkedin,
    profile.projects,
    profile.experience,
    profile.skills,
    profile.internshipTrack,
    profile.interestAreas,
    profile.workingMode,
    profile.availability,
    profile.motivation,
    profile.cv?.fileName,
    profile.supportingDocument?.fileName,
  ];

  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

export function buildProfileSummary(profile) {
  return [
    { label: 'Submission', value: profile?.submittedAt ? 'Submitted' : 'Draft' },
    { label: 'Updated', value: profile?.updatedAt ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(profile.updatedAt)) : '—' },
    { label: 'CV Status', value: profile?.cv?.status || 'Not uploaded' },
    { label: 'Documents', value: profile?.supportingDocument?.status || 'Not uploaded' },
  ];
}

