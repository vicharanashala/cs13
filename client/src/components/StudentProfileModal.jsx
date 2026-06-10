import { useEffect, useMemo, useRef, useState } from 'react';
import {
  buildProfileSummary,
  createBlankProfile,
  getStudentProfile,
  hasSubmittedProfile,
  markProfileOpened,
  profileCompletionScore,
  saveStudentProfile,
} from '../studentProfile';

const fieldGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 12,
};

const fieldStack = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: 12,
};

function ProfileModalSection({ title, children, subtitle }) {
  return (
    <section style={styles.section}>
      <div style={styles.sectionHeader}>
        <div>
          <div style={styles.sectionTitle}>{title}</div>
          {subtitle && <div style={styles.sectionSubtitle}>{subtitle}</div>}
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text', textarea = false, disabled = false, helper, required = false }) {
  return (
    <label style={styles.field}>
      <span style={styles.label}>
        {label}
        {required && <span style={styles.required}> *</span>}
      </span>
      {textarea ? (
        <textarea
          rows="4"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          style={styles.input}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          style={styles.input}
        />
      )}
      {helper && <span style={styles.helper}>{helper}</span>}
    </label>
  );
}

function ReadOnlyRow({ label, value }) {
  return (
    <div style={styles.readOnlyRow}>
      <span style={styles.readOnlyLabel}>{label}</span>
      <strong style={styles.readOnlyValue}>{value || 'Not provided'}</strong>
    </div>
  );
}

function ProfileDetailCard({ title, children, accent = 'neutral' }) {
  return (
    <div style={{
      ...styles.detailCard,
      ...(accent === 'good' ? styles.detailCardGood : {}),
      ...(accent === 'warning' ? styles.detailCardWarning : {}),
      ...(accent === 'info' ? styles.detailCardInfo : {}),
    }}>
      <div style={styles.detailCardTitle}>{title}</div>
      {children}
    </div>
  );
}

function StudentProfileModal({ open, onClose, userId, displayName, email }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState(() => createBlankProfile({ fullName: displayName, email }));
  const [draft, setDraft] = useState(() => createBlankProfile({ fullName: displayName, email }));
  const onCloseRef = useRef(onClose);

  const submitted = hasSubmittedProfile(profile);
  const completion = useMemo(() => profileCompletionScore(submitted ? profile : draft), [profile, draft, submitted]);
  const summary = useMemo(() => buildProfileSummary(submitted ? profile : draft), [profile, draft, submitted]);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;
    let mounted = true;
    setLoading(true);
    setError('');
    setMessage('');

    const current = getStudentProfile(userId, { fullName: displayName, email });
    markProfileOpened(userId);

    if (mounted) {
      setProfile(current);
      setDraft(current);
      setEditing(!hasSubmittedProfile(current));
      setLoading(false);
    }

    function handleEscape(event) {
      if (event.key === 'Escape') onCloseRef.current?.();
    }

    window.addEventListener('keydown', handleEscape);
    return () => {
      mounted = false;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [open, userId, displayName, email]);

  useEffect(() => {
    if (!open) return undefined;
    function syncProfile() {
      const current = getStudentProfile(userId, { fullName: displayName, email });
      setProfile(current);
      if (!editing) setDraft(current);
    }

    window.addEventListener('samagama-profile-updated', syncProfile);
    return () => window.removeEventListener('samagama-profile-updated', syncProfile);
  }, [open, userId, displayName, email, editing]);

  if (!open) return null;

  function updateDraft(key, value) {
    setDraft(prev => ({ ...prev, [key]: value }));
  }

  function updateNested(key, nestedKey, value) {
    setDraft(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        [nestedKey]: value,
      },
    }));
  }

  function setDocument(key, file) {
    if (!file) return;
    updateNested(key, 'fileName', file.name);
    updateNested(key, 'uploadedAt', new Date().toISOString());
    updateNested(key, 'status', 'Uploaded');
    setMessage(`${file.name} uploaded.`);
  }

  function validate(value) {
    const required = [
      ['fullName', 'Full name'],
      ['email', 'Email address'],
      ['phone', 'Phone number'],
      ['city', 'City'],
      ['college', 'College / University'],
      ['degree', 'Program / Degree'],
      ['department', 'Department / Branch'],
      ['year', 'Year of study'],
      ['semester', 'Semester'],
      ['rollNumber', 'Roll / Registration number'],
      ['cgpa', 'CGPA / Percentage'],
      ['github', 'GitHub URL'],
      ['portfolio', 'Portfolio URL'],
      ['linkedin', 'LinkedIn URL'],
      ['projects', 'Projects'],
      ['experience', 'Experience'],
      ['skills', 'Skills'],
      ['internshipTrack', 'Preferred internship track'],
      ['interestAreas', 'Interest areas'],
      ['workingMode', 'Working mode preference'],
      ['availability', 'Availability'],
      ['motivation', 'Motivation'],
    ];

    const nextErrors = {};
    required.forEach(([key, label]) => {
      if (!String(value?.[key] || '').trim()) nextErrors[key] = `${label} is required.`;
    });

    if (!String(value?.cv?.fileName || '').trim()) {
      nextErrors.cv = 'Upload your CV / resume to continue.';
    }

    return nextErrors;
  }

  async function handleSave() {
    setError('');
    setMessage('');
    const nextErrors = validate(draft);
    if (Object.keys(nextErrors).length > 0) {
      setError(Object.values(nextErrors)[0]);
      return;
    }

    setSaving(true);
    await new Promise(resolve => window.setTimeout(resolve, 250));

    const next = {
      ...draft,
      submittedAt: profile.submittedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastOpenedAt: profile.lastOpenedAt || new Date().toISOString(),
    };
    const saved = saveStudentProfile(userId, next);
    setProfile(saved);
    setDraft(saved);
    setEditing(false);
    setSaving(false);
    setMessage(profile.submittedAt ? 'Profile updated successfully.' : 'Application submitted successfully.');
  }

  function startEdit() {
    setDraft(profile);
    setEditing(true);
    setError('');
    setMessage('');
  }

  function cancelEdit() {
    if (!submitted) {
      setDraft(createBlankProfile({ fullName: displayName, email }));
      return;
    }
    setDraft(profile);
    setEditing(false);
    setError('');
    setMessage('');
  }

  const viewMode = submitted && !editing;
  const data = viewMode ? profile : draft;
  const title = viewMode ? 'Your Profile' : submitted ? 'Edit Your Profile' : 'Complete Your Application';

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <div>
            <div style={styles.kicker}>View Your Profile</div>
            <h2 style={styles.title}>{title}</h2>
            <p style={styles.subtitle}>
              {submitted
                ? 'Your submitted application is stored below. You can view or update it anytime.'
                : 'Complete your application once, then return here to view or edit the saved details.'}
            </p>
          </div>

          <div style={styles.headerActions}>
            <div style={styles.statusPill}>{submitted ? 'Submitted' : 'Draft'}</div>
            <button type="button" onClick={onClose} style={styles.closeBtn}>✕</button>
          </div>
        </div>

        <div style={styles.summaryRow}>
          <ProfileDetailCard title="Profile Completion" accent="info">
            <div style={styles.bigValue}>{completion}%</div>
            <div style={styles.smallText}>of profile fields filled</div>
            <div style={styles.progressTrack}>
              <div style={{ ...styles.progressFill, width: `${completion}%` }} />
            </div>
          </ProfileDetailCard>

          <ProfileDetailCard title="Application Status" accent={submitted ? 'good' : 'warning'}>
            <div style={styles.bigValue}>{submitted ? 'Submitted' : 'Not submitted'}</div>
            <div style={styles.smallText}>
              {submitted ? `Submitted on ${profile.submittedAt ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(profile.submittedAt)) : '—'}` : 'Your draft is ready to be completed.'}
            </div>
          </ProfileDetailCard>

          <ProfileDetailCard title="Document Status" accent="neutral">
            <div style={styles.docStack}>
              <div style={styles.docRow}>
                <span>CV / Resume</span>
                <strong>{data.cv?.status || 'Not uploaded'}</strong>
              </div>
              <div style={styles.docRow}>
                <span>Supporting Doc</span>
                <strong>{data.supportingDocument?.status || 'Not uploaded'}</strong>
              </div>
            </div>
          </ProfileDetailCard>

          <ProfileDetailCard title="Last Updated" accent="neutral">
            <div style={styles.bigValue}>{profile.updatedAt ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(profile.updatedAt)) : '—'}</div>
            <div style={styles.smallText}>{profile.lastOpenedAt ? `Viewed ${new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(profile.lastOpenedAt))}` : 'Not opened yet'}</div>
          </ProfileDetailCard>
        </div>

        {loading ? (
          <div style={styles.loadingState}>Loading profile…</div>
        ) : (
          <div style={styles.contentGrid}>
            <div style={styles.leftCol}>
              <ProfileModalSection title="Saved Profile Summary" subtitle="A quick overview of the application currently stored for this student.">
                <div style={styles.summaryList}>
                  {summary.map(item => (
                    <div key={item.label} style={styles.summaryItem}>
                      <span style={styles.summaryLabel}>{item.label}</span>
                      <strong style={styles.summaryValue}>{item.value}</strong>
                    </div>
                  ))}
                </div>
              </ProfileModalSection>

              <ProfileModalSection title="Personal Details" subtitle="Tell us about yourself.">
                {viewMode ? (
                  <div style={styles.readOnlyGrid}>
                    <ReadOnlyRow label="Full name" value={profile.fullName} />
                    <ReadOnlyRow label="Email address" value={profile.email} />
                    <ReadOnlyRow label="Phone number" value={profile.phone} />
                    <ReadOnlyRow label="Gender" value={profile.gender} />
                    <ReadOnlyRow label="Date of birth" value={profile.dateOfBirth} />
                    <ReadOnlyRow label="City" value={profile.city} />
                  </div>
                ) : (
                  <div style={fieldGrid}>
                    <Field label="Full name" value={data.fullName} onChange={value => updateDraft('fullName', value)} placeholder="Your full name" required />
                    <Field label="Email address" value={data.email} onChange={value => updateDraft('email', value)} placeholder="you@iitropar.ac.in" type="email" required />
                    <Field label="Phone number" value={data.phone} onChange={value => updateDraft('phone', value)} placeholder="10-digit phone number" required />
                    <Field label="Gender" value={data.gender} onChange={value => updateDraft('gender', value)} placeholder="Gender" required />
                    <Field label="Date of birth" value={data.dateOfBirth} onChange={value => updateDraft('dateOfBirth', value)} type="date" required />
                    <Field label="City" value={data.city} onChange={value => updateDraft('city', value)} placeholder="Your city" required />
                    <Field label="Address" value={data.address} onChange={value => updateDraft('address', value)} placeholder="Address / locality" textarea helper="Optional, but helpful for records." />
                  </div>
                )}
              </ProfileModalSection>

              <ProfileModalSection title="Academic Details" subtitle="Share your academic background.">
                {viewMode ? (
                  <div style={styles.readOnlyGrid}>
                    <ReadOnlyRow label="College / University" value={profile.college} />
                    <ReadOnlyRow label="Program / Degree" value={profile.degree} />
                    <ReadOnlyRow label="Department / Branch" value={profile.department} />
                    <ReadOnlyRow label="Year of study" value={profile.year} />
                    <ReadOnlyRow label="Semester" value={profile.semester} />
                    <ReadOnlyRow label="Roll / Registration number" value={profile.rollNumber} />
                    <ReadOnlyRow label="CGPA / Percentage" value={profile.cgpa} />
                  </div>
                ) : (
                  <div style={fieldGrid}>
                    <Field label="College / University" value={data.college} onChange={value => updateDraft('college', value)} placeholder="Institution name" required />
                    <Field label="Program / Degree" value={data.degree} onChange={value => updateDraft('degree', value)} placeholder="B.Tech / M.Tech / B.Sc / etc." required />
                    <Field label="Department / Branch" value={data.department} onChange={value => updateDraft('department', value)} placeholder="CSE, AI, ECE, etc." required />
                    <Field label="Year of study" value={data.year} onChange={value => updateDraft('year', value)} placeholder="1st / 2nd / 3rd / 4th" required />
                    <Field label="Semester" value={data.semester} onChange={value => updateDraft('semester', value)} placeholder="Current semester" required />
                    <Field label="Roll / Registration number" value={data.rollNumber} onChange={value => updateDraft('rollNumber', value)} placeholder="Roll or registration number" required />
                    <Field label="CGPA / Percentage" value={data.cgpa} onChange={value => updateDraft('cgpa', value)} placeholder="CGPA or percentage" required />
                  </div>
                )}
              </ProfileModalSection>

              <ProfileModalSection title="Project / Experience Details" subtitle="Show the work you have already done.">
                {viewMode ? (
                  <div style={styles.readOnlyGrid}>
                    <ReadOnlyRow label="GitHub" value={profile.github} />
                    <ReadOnlyRow label="Portfolio" value={profile.portfolio} />
                    <ReadOnlyRow label="LinkedIn" value={profile.linkedin} />
                    <ReadOnlyRow label="Projects" value={profile.projects} />
                    <ReadOnlyRow label="Experience" value={profile.experience} />
                    <ReadOnlyRow label="Skills" value={profile.skills} />
                  </div>
                ) : (
                  <div style={fieldGrid}>
                    <Field label="GitHub URL" value={data.github} onChange={value => updateDraft('github', value)} placeholder="https://github.com/..." required />
                    <Field label="Portfolio URL" value={data.portfolio} onChange={value => updateDraft('portfolio', value)} placeholder="https://your-portfolio.com" required />
                    <Field label="LinkedIn URL" value={data.linkedin} onChange={value => updateDraft('linkedin', value)} placeholder="https://linkedin.com/in/..." required />
                    <Field label="Projects" value={data.projects} onChange={value => updateDraft('projects', value)} placeholder="Summarize projects you want us to know about" textarea required />
                    <Field label="Experience" value={data.experience} onChange={value => updateDraft('experience', value)} placeholder="Internships, research, freelance, clubs..." textarea required />
                    <Field label="Skills" value={data.skills} onChange={value => updateDraft('skills', value)} placeholder="Python, React, ML, design..." textarea required />
                  </div>
                )}
              </ProfileModalSection>
            </div>

            <div style={styles.rightCol}>
              <ProfileModalSection title="Internship / Interest Details" subtitle="Tell us what you want to work on.">
                {viewMode ? (
                  <div style={styles.readOnlyGrid}>
                    <ReadOnlyRow label="Preferred track" value={profile.internshipTrack} />
                    <ReadOnlyRow label="Interest areas" value={profile.interestAreas} />
                    <ReadOnlyRow label="Working mode" value={profile.workingMode} />
                    <ReadOnlyRow label="Availability" value={profile.availability} />
                    <ReadOnlyRow label="Why this internship?" value={profile.motivation} />
                  </div>
                ) : (
                  <div style={fieldStack}>
                    <Field label="Preferred internship track" value={data.internshipTrack} onChange={value => updateDraft('internshipTrack', value)} placeholder="Applied AI, Open Source, Web, etc." required />
                    <Field label="Interest areas" value={data.interestAreas} onChange={value => updateDraft('interestAreas', value)} placeholder="NLP, systems, design, cloud..." textarea required />
                    <Field label="Working mode preference" value={data.workingMode} onChange={value => updateDraft('workingMode', value)} placeholder="Remote / hybrid / on-site" required />
                    <Field label="Availability" value={data.availability} onChange={value => updateDraft('availability', value)} placeholder="When can you start and how many hours?" required />
                    <Field label="Why this internship?" value={data.motivation} onChange={value => updateDraft('motivation', value)} placeholder="Tell us briefly why you want to join" textarea required />
                  </div>
                )}
              </ProfileModalSection>

              <ProfileModalSection title="Uploaded CV / Document Status" subtitle="Track the files linked to your application.">
                {viewMode ? (
                  <div style={styles.docList}>
                    <div style={styles.docCard}>
                      <div>
                        <div style={styles.docLabel}>CV / Resume</div>
                        <strong style={styles.docName}>{profile.cv?.fileName || 'Not uploaded'}</strong>
                        <div style={styles.docMeta}>{profile.cv?.uploadedAt ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(profile.cv.uploadedAt)) : 'Upload status not available'}</div>
                      </div>
                      <span style={styles.docStatus}>{profile.cv?.status || 'Not uploaded'}</span>
                    </div>

                    <div style={styles.docCard}>
                      <div>
                        <div style={styles.docLabel}>Supporting document</div>
                        <strong style={styles.docName}>{profile.supportingDocument?.fileName || 'Not uploaded'}</strong>
                        <div style={styles.docMeta}>{profile.supportingDocument?.uploadedAt ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(profile.supportingDocument.uploadedAt)) : 'Upload status not available'}</div>
                      </div>
                      <span style={styles.docStatus}>{profile.supportingDocument?.status || 'Not uploaded'}</span>
                    </div>
                  </div>
                ) : (
                  <div style={styles.uploadGrid}>
                    <label style={styles.uploadCard}>
                      <span style={styles.label}>Upload CV / Resume *</span>
                      <input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={e => setDocument('cv', e.target.files?.[0])} />
                      <div style={styles.uploadStatus}>{data.cv?.fileName ? `${data.cv.fileName} · ${data.cv.status}` : 'No file uploaded yet'}</div>
                    </label>

                    <label style={styles.uploadCard}>
                      <span style={styles.label}>Supporting document</span>
                      <input type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" onChange={e => setDocument('supportingDocument', e.target.files?.[0])} />
                      <div style={styles.uploadStatus}>{data.supportingDocument?.fileName ? `${data.supportingDocument.fileName} · ${data.supportingDocument.status}` : 'Optional document not uploaded'}</div>
                    </label>
                  </div>
                )}
              </ProfileModalSection>

              <ProfileModalSection title="Field Status" subtitle="Empty fields will simply display as not provided.">
                <div style={styles.summaryList}>
                  {[
                    { label: 'Full name', value: data.fullName || 'Not provided' },
                    { label: 'College', value: data.college || 'Not provided' },
                    { label: 'Track', value: data.internshipTrack || 'Not provided' },
                    { label: 'CV', value: data.cv?.status || 'Not uploaded' },
                  ].map(item => (
                    <div key={item.label} style={styles.summaryItem}>
                      <span style={styles.summaryLabel}>{item.label}</span>
                      <strong style={styles.summaryValue}>{item.value}</strong>
                    </div>
                  ))}
                </div>
              </ProfileModalSection>

              {error && <div style={styles.errorState}>{error}</div>}
              {message && <div style={styles.successState}>{message}</div>}

              <div style={styles.actionRow}>
                {viewMode ? (
                  <>
                    <button type="button" style={styles.secondaryBtn} onClick={onClose}>Close</button>
                    <button type="button" style={styles.primaryBtn} onClick={startEdit}>Edit Profile</button>
                  </>
                ) : (
                  <>
                    <button type="button" style={styles.secondaryBtn} onClick={cancelEdit}>Cancel</button>
                    <button type="button" style={styles.primaryBtn} onClick={handleSave} disabled={saving}>
                      {saving ? 'Saving…' : (submitted ? 'Update Profile' : 'Submit Application')}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 260,
    background: 'rgba(3,7,18,0.78)',
    backdropFilter: 'blur(12px)',
    display: 'grid',
    placeItems: 'center',
    padding: 18,
  },
  modal: {
    width: 'min(1360px, 100%)',
    maxHeight: '92vh',
    overflow: 'auto',
    borderRadius: 28,
    padding: 24,
    background: 'linear-gradient(180deg, rgba(8,12,28,0.98), rgba(3,7,18,0.98))',
    border: '1px solid rgba(148,163,184,0.16)',
    boxShadow: '0 32px 90px rgba(0,0,0,0.56)',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 18,
  },
  kicker: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.16em',
    color: '#94a3b8',
    fontWeight: 800,
    marginBottom: 8,
  },
  title: {
    margin: 0,
    fontSize: 'clamp(24px, 2.8vw, 34px)',
    color: '#f8fafc',
    fontWeight: 800,
    letterSpacing: '-0.04em',
  },
  subtitle: {
    margin: '8px 0 0',
    color: '#94a3b8',
    lineHeight: 1.6,
    maxWidth: 800,
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  statusPill: {
    padding: '8px 12px',
    borderRadius: 999,
    background: 'rgba(124,111,247,0.12)',
    border: '1px solid rgba(124,111,247,0.22)',
    color: '#e9d5ff',
    fontSize: 12,
    fontWeight: 800,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.05)',
    color: '#eef0f6',
    fontSize: 16,
    fontWeight: 800,
  },
  summaryRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 12,
    marginBottom: 18,
  },
  detailCard: {
    padding: 16,
    borderRadius: 20,
    background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
    border: '1px solid rgba(255,255,255,0.08)',
    display: 'grid',
    gap: 8,
    minHeight: 110,
  },
  detailCardGood: {
    background: 'linear-gradient(135deg, rgba(34,197,94,0.14), rgba(255,255,255,0.02))',
    borderColor: 'rgba(34,197,94,0.18)',
  },
  detailCardWarning: {
    background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(255,255,255,0.02))',
    borderColor: 'rgba(245,158,11,0.18)',
  },
  detailCardInfo: {
    background: 'linear-gradient(135deg, rgba(59,130,246,0.14), rgba(255,255,255,0.02))',
    borderColor: 'rgba(59,130,246,0.18)',
  },
  detailCardTitle: {
    fontSize: 11,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: '#94a3b8',
    fontWeight: 800,
  },
  bigValue: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: 800,
    letterSpacing: '-0.03em',
  },
  smallText: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 1.5,
  },
  progressTrack: {
    marginTop: 4,
    width: '100%',
    height: 6,
    borderRadius: 999,
    background: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    background: 'linear-gradient(90deg, #7c6ff7, #38bdf8)',
  },
  docStack: {
    display: 'grid',
    gap: 10,
  },
  docRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'center',
    color: '#cbd5e1',
    fontSize: 12,
  },
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
    gap: 18,
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  rightCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  section: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 22,
    padding: 18,
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: '#dbeafe',
    fontWeight: 800,
  },
  sectionSubtitle: {
    marginTop: 6,
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 1.5,
  },
  readOnlyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 12,
  },
  readOnlyRow: {
    padding: 14,
    borderRadius: 16,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    display: 'grid',
    gap: 6,
  },
  readOnlyLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#94a3b8',
    fontWeight: 700,
  },
  readOnlyValue: {
    color: '#f8fafc',
    fontSize: 13,
    lineHeight: 1.5,
    fontWeight: 700,
  },
  field: {
    display: 'grid',
    gap: 8,
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: 700,
  },
  label: {
    color: '#cbd5e1',
  },
  required: {
    color: '#fca5a5',
  },
  helper: {
    color: '#94a3b8',
    fontSize: 11,
    lineHeight: 1.4,
  },
  input: {
    width: '100%',
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.05)',
    color: '#eef0f6',
    borderRadius: 14,
    padding: '12px 14px',
    transition: 'all 0.2s ease',
    outline: 'none',
  },
  summaryList: {
    display: 'grid',
    gap: 10,
  },
  summaryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
    padding: '12px 14px',
    borderRadius: 14,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: 700,
  },
  summaryValue: {
    fontSize: 12,
    color: '#f8fafc',
    fontWeight: 800,
    textAlign: 'right',
  },
  uploadGrid: {
    display: 'grid',
    gap: 12,
  },
  uploadCard: {
    display: 'grid',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  uploadStatus: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 1.5,
  },
  docList: {
    display: 'grid',
    gap: 10,
  },
  docCard: {
    padding: 14,
    borderRadius: 16,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  docLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#94a3b8',
    fontWeight: 700,
    marginBottom: 6,
  },
  docName: {
    display: 'block',
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: 800,
    marginBottom: 4,
  },
  docMeta: {
    color: '#94a3b8',
    fontSize: 11,
    lineHeight: 1.4,
  },
  docStatus: {
    padding: '6px 10px',
    borderRadius: 999,
    background: 'rgba(124,111,247,0.12)',
    border: '1px solid rgba(124,111,247,0.18)',
    color: '#e9d5ff',
    fontSize: 11,
    fontWeight: 800,
    whiteSpace: 'nowrap',
  },
  errorState: {
    padding: '12px 14px',
    borderRadius: 14,
    background: 'rgba(239,68,68,0.12)',
    border: '1px solid rgba(239,68,68,0.2)',
    color: '#fecaca',
    fontSize: 13,
    fontWeight: 700,
  },
  successState: {
    padding: '12px 14px',
    borderRadius: 14,
    background: 'rgba(16,185,129,0.12)',
    border: '1px solid rgba(16,185,129,0.2)',
    color: '#a7f3d0',
    fontSize: 13,
    fontWeight: 700,
  },
  actionRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 12,
    flexWrap: 'wrap',
  },
  primaryBtn: {
    border: 'none',
    borderRadius: 14,
    padding: '12px 16px',
    background: 'linear-gradient(135deg, #7c6ff7, #38bdf8)',
    color: '#fff',
    fontWeight: 800,
    boxShadow: '0 16px 28px rgba(124,111,247,0.22)',
  },
  secondaryBtn: {
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: '12px 16px',
    background: 'rgba(255,255,255,0.04)',
    color: '#e2e8f0',
    fontWeight: 800,
  },
  loadingState: {
    padding: 20,
    borderRadius: 18,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    color: '#94a3b8',
    fontSize: 13,
  },
};

export default StudentProfileModal;
