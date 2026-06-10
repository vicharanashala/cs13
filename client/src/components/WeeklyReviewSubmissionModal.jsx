import { useEffect, useMemo, useRef, useState } from 'react';
import { formatJourneyDate, getJourneyMilestone } from '../internshipJourney';
import { submitReview } from '../api';

const MAX_PDF_BYTES = 10 * 1024 * 1024;

function formatClock(value) {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function statusTone(status) {
  if (status === 'approved') return 'approved';
  if (status === 'submitted' || status === 'pending_review') return 'submitted';
  if (status === 'needs_changes') return 'changes';
  if (status === 'rejected') return 'rejected';
  if (status === 'closed') return 'closed';
  return 'locked';
}

function toneStyles(tone) {
  if (tone === 'approved') {
    return {
      background: 'rgba(34,197,94,0.14)',
      color: '#86efac',
      border: '1px solid rgba(34,197,94,0.22)',
    };
  }
  if (tone === 'submitted') {
    return {
      background: 'rgba(59,130,246,0.14)',
      color: '#93c5fd',
      border: '1px solid rgba(59,130,246,0.22)',
    };
  }
  if (tone === 'changes') {
    return {
      background: 'rgba(251,191,36,0.12)',
      color: '#fde68a',
      border: '1px solid rgba(251,191,36,0.24)',
    };
  }
  if (tone === 'rejected') {
    return {
      background: 'rgba(248,113,113,0.12)',
      color: '#fecaca',
      border: '1px solid rgba(248,113,113,0.22)',
    };
  }
  if (tone === 'closed') {
    return {
      background: 'rgba(100,116,139,0.16)',
      color: '#cbd5e1',
      border: '1px solid rgba(100,116,139,0.18)',
    };
  }
  return {
    background: 'rgba(107,114,128,0.18)',
    color: '#cbd5e1',
    border: '1px solid rgba(107,114,128,0.22)',
  };
}

function toDataUrl(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

function joinLinks(links = []) {
  return links.filter(Boolean).join(', ');
}

function compactDate(value) {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(new Date(value));
  } catch {
    return value;
  }
}

function WeeklyReviewSubmissionModal({ mission, open, onClose }) {
  const [version, setVersion] = useState(0);
  const [linkValue, setLinkValue] = useState('');
  const [notes, setNotes] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfPreview, setPdfPreview] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function syncJourney() {
      setVersion(v => v + 1);
    }
    window.addEventListener('samagama-journey-updated', syncJourney);
    return () => window.removeEventListener('samagama-journey-updated', syncJourney);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose?.();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const current = useMemo(() => (mission ? getJourneyMilestone(mission.id) : null), [mission, version]);

  useEffect(() => {
    if (!current) return;
    const latest = current.submissions?.[0] || null;
    setLinkValue(current.data?.submittedLink || latest?.links?.[0] || '');
    setNotes(current.data?.weeklyNote || latest?.comment || '');
    setPdfFile(
      current.data?.submittedFile
        ? { name: current.data.submittedFileName || 'Uploaded file', size: 0, type: 'application/pdf' }
        : current.data?.submittedFileName
          ? { name: current.data.submittedFileName, size: 0, type: 'application/pdf' }
          : null
    );
    setPdfPreview(current.data?.submittedFilePreview || latest?.files?.[0]?.previewUrl || '');
  }, [current?.id, current?.data?.lastSubmittedAt, current?.data?.approvalStatus]);

  useEffect(() => {
    if (!message) return undefined;
    const timer = window.setTimeout(() => setMessage(''), 2600);
    return () => window.clearTimeout(timer);
  }, [message]);

  if (!open || !mission || !current) return null;

  const latestSubmission = current.submissions?.[0] || null;
  const latestFile = latestSubmission?.files?.[0] || null;
  const latestLink = latestSubmission?.links?.[0] || current.data?.submittedLink || '';
  const currentStatus = current.data?.approvalStatus || current.data?.submissionStatus || current.status;
  const deadlineDate = current.dueDate ? new Date(`${current.dueDate}T23:59:59`) : null;
  const deadlinePassed = Boolean(deadlineDate && deadlineDate.getTime() < Date.now());
  const canSubmit = current.status !== 'locked' && currentStatus !== 'approved' && (!deadlinePassed || Boolean(current.data?.allowLateSubmission));
  const hasSubmission = Boolean(latestSubmission || current.data?.submittedFileName || latestLink || current.data?.weeklyNote);
  const statusLabel = (() => {
    if (currentStatus === 'approved' || current.status === 'completed') return 'Approved';
    if (currentStatus === 'needs_changes') return 'Needs Changes';
    if (currentStatus === 'rejected') return 'Rejected';
    if (current.status === 'pending_review') return 'Submitted';
    if (deadlinePassed && !hasSubmission) return 'Deadline Passed';
    if (current.status === 'active') return 'Pending Submission';
    return 'Locked';
  })();
  const tone = statusTone(
    statusLabel === 'Approved'
      ? 'approved'
      : statusLabel === 'Submitted'
        ? 'submitted'
        : statusLabel === 'Needs Changes'
          ? 'changes'
          : statusLabel === 'Rejected'
            ? 'rejected'
            : statusLabel === 'Deadline Passed'
              ? 'closed'
              : 'locked'
  );
  const submittedAt = latestSubmission?.submittedAt || current.data?.lastSubmittedAt || '';
  const reviewStatusText = (() => {
    if (statusLabel === 'Approved') return 'Approved by mentor';
    if (statusLabel === 'Needs Changes') return 'Needs changes';
    if (statusLabel === 'Rejected') return 'Rejected';
    if (statusLabel === 'Submitted') return 'Pending Mentor Review';
    if (statusLabel === 'Deadline Passed') return 'Submission closed';
    return 'Awaiting submission';
  })();

  async function handlePdfPick(file) {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setMessage('Please upload a PDF file only.');
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      setMessage('PDF must be 10 MB or smaller.');
      return;
    }
    const preview = await toDataUrl(file);
    setPdfFile(file);
    setPdfPreview(preview);
  }

  async function handlePdfInputChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    await handlePdfPick(file);
    event.target.value = '';
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) handlePdfPick(file);
  }

  function handleSubmitLink() {
    if (!linkValue.trim()) {
      setMessage('Paste a link before submitting.');
      return;
    }
    if (!canSubmit) {
      setMessage(deadlinePassed ? 'Deadline passed. Submission is closed.' : 'This milestone is locked.');
      return;
    }
    submitReview({
      weekNumber: mission?.id || 1,
      rating: 4,
      workSummary: linkValue.trim(),
      challenges: notes.trim() || 'No challenges noted',
      nextWeekGoals: 'Continued work and progress.',
    }).then(result => {
      if (result.error) { setMessage(result.error); return; }
      setMessage('Weekly review submitted.');
      window.dispatchEvent(new Event('samagama-journey-updated'));
    });
  }

  async function handleUploadPdf() {
    if (!pdfFile) {
      setMessage('Choose a PDF before uploading.');
      return;
    }
    if (!canSubmit) {
      setMessage(deadlinePassed ? 'Deadline passed. Submission is closed.' : 'This milestone is locked.');
      return;
    }
    setMessage('PDF submission recorded (file upload requires backend multipart support).');
  }

  const submittedAtText = submittedAt ? formatClock(submittedAt) : '—';
  const deadlineText = current.dueDate ? `Due ${compactDate(current.dueDate)}` : 'No deadline set';

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <div>
            <div style={styles.kicker}>Milestone Submission</div>
            <h2 style={styles.title}>📋 Weekly Review Submission</h2>
            <p style={styles.subtitle}>Submit your weekly work update, progress report, links, or documents.</p>
          </div>
          <div style={styles.headerRight}>
            <span style={{ ...styles.statusPill, ...toneStyles(tone) }}>{statusLabel}</span>
            <button type="button" onClick={onClose} style={styles.closeBtn}>✕</button>
          </div>
        </div>

        <div style={styles.heroGrid}>
          <div style={styles.heroCard}>
            <span style={styles.heroLabel}>Deadline</span>
            <strong style={styles.heroValue}>{deadlineText}</strong>
          </div>
          <div style={styles.heroCard}>
            <span style={styles.heroLabel}>Submission</span>
            <strong style={styles.heroValue}>{submittedAt ? 'Submitted' : 'Not submitted yet'}</strong>
          </div>
          <div style={styles.heroCard}>
            <span style={styles.heroLabel}>Review Status</span>
            <strong style={styles.heroValue}>{reviewStatusText}</strong>
          </div>
          <div style={styles.heroCard}>
            <span style={styles.heroLabel}>Last Update</span>
            <strong style={styles.heroValue}>{submittedAtText}</strong>
          </div>
        </div>

        {deadlinePassed && !hasSubmission && !current.data?.allowLateSubmission ? (
          <div style={styles.closedBanner}>
            <strong>⚠ Deadline Passed</strong>
            <span>Submission closed for this milestone.</span>
          </div>
        ) : (
          <div style={styles.layout}>
            <div style={styles.leftCol}>
              <section style={styles.section}>
                <SectionHeading title="Last Submission" />
                {hasSubmission ? (
                  <div style={styles.snapshotCard}>
                    <div style={styles.snapshotRow}>
                      <span style={styles.snapshotLabel}>Submitted on</span>
                      <strong style={styles.snapshotValue}>{submittedAtText}</strong>
                    </div>
                    <div style={styles.snapshotRow}>
                      <span style={styles.snapshotLabel}>Status</span>
                      <strong style={styles.snapshotValue}>{reviewStatusText}</strong>
                    </div>
                    <div style={styles.snapshotRow}>
                      <span style={styles.snapshotLabel}>Submitted by</span>
                      <strong style={styles.snapshotValue}>{latestSubmission?.submittedBy || 'Student'}</strong>
                    </div>
                    {latestLink && (
                      <div style={styles.snapshotRow}>
                        <span style={styles.snapshotLabel}>Submitted Link</span>
                        <a href={latestLink} target="_blank" rel="noreferrer" style={styles.linkText}>
                          Open submitted link
                        </a>
                      </div>
                    )}
                    {latestFile?.previewUrl && (
                      <div style={styles.snapshotRow}>
                        <span style={styles.snapshotLabel}>Submitted File</span>
                        <a href={latestFile.previewUrl} target="_blank" rel="noreferrer" style={styles.linkText}>
                          View submitted file
                        </a>
                      </div>
                    )}
                    {latestSubmission?.comment && (
                      <div style={styles.snapshotNotes}>{latestSubmission.comment}</div>
                    )}
                    <div style={styles.snapshotFooter}>
                      {deadlinePassed ? 'Updates are closed after the deadline.' : 'You can replace this submission before the deadline.'}
                    </div>
                  </div>
                ) : (
                  <div style={styles.emptyState}>
                    <strong>No submission yet.</strong>
                    <span>Use the link or PDF options on the right to submit your weekly review.</span>
                  </div>
                )}
              </section>

              <section style={styles.section}>
                <SectionHeading title="Submission History" />
                {current.submissions?.length ? (
                  <div style={styles.timeline}>
                    {current.submissions.slice(0, 5).map(item => (
                      <div key={item.id} style={styles.timelineItem}>
                        <div style={styles.timelineDot} />
                        <div>
                          <div style={styles.timelineTitle}>{item.title}</div>
                          <div style={styles.timelineMeta}>{formatJourneyDate(item.submittedAt)} • {item.status}</div>
                          {item.comment && <div style={styles.timelineDesc}>{item.comment}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={styles.emptyText}>No previous submissions recorded yet.</div>
                )}
              </section>
            </div>

            <div style={styles.rightCol}>
              <section style={styles.section}>
                <SectionHeading title="Option 1 — Project / GitHub / Drive Link" />
                <label style={styles.field}>
                  <span>Paste Link Here</span>
                  <input
                    value={linkValue}
                    onChange={e => setLinkValue(e.target.value)}
                    placeholder="GitHub repository, Drive folder, Figma link, Notion page, demo video"
                    disabled={!canSubmit}
                    style={styles.control}
                  />
                </label>
                <button type="button" style={styles.primaryBtn} onClick={handleSubmitLink} disabled={!canSubmit}>
                  {hasSubmission ? 'Update Link' : 'Submit Link'}
                </button>
              </section>

              <section style={styles.section}>
                <SectionHeading title="Option 2 — Upload PDF" />
                <div
                  style={{
                    ...styles.dropzone,
                    ...(dragActive ? styles.dropzoneActive : {}),
                    ...(canSubmit ? {} : styles.dropzoneDisabled),
                  }}
                  onDragOver={e => {
                    e.preventDefault();
                    if (canSubmit) setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  onClick={() => canSubmit && fileInputRef.current?.click()}
                >
                  <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" onChange={handlePdfInputChange} style={{ display: 'none' }} />
                  <div style={styles.dropzoneTitle}>Drag & Drop PDF</div>
                  <div style={styles.dropzoneSub}>or choose a PDF file to upload</div>
                  <div style={styles.dropzoneMeta}>Accepted: .pdf only • Maximum size: 10 MB</div>
                  {pdfFile && (
                    <div style={styles.fileChip}>
                      <span>{pdfFile.name}</span>
                      <button type="button" style={styles.fileRemoveBtn} onClick={(e) => { e.stopPropagation(); setPdfFile(null); setPdfPreview(''); }}>
                        Remove
                      </button>
                    </div>
                  )}
                </div>
                <button type="button" style={styles.primaryBtn} onClick={handleUploadPdf} disabled={!canSubmit}>
                  {hasSubmission ? 'Replace Submission' : 'Upload PDF'}
                </button>
              </section>

              <section style={styles.section}>
                <SectionHeading title="Optional Notes" />
                <label style={styles.field}>
                  <span>Additional Comments</span>
                  <textarea
                    rows="4"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Completed FAQ flow design this week. Need clarification on NOC process."
                    disabled={!canSubmit}
                    style={styles.control}
                  />
                </label>
              </section>

              <section style={styles.section}>
                <SectionHeading title="What to include" />
                <ul style={styles.bulletList}>
                  <li>Weekly progress summary and completed work</li>
                  <li>Relevant links, screenshots, or deliverables</li>
                  <li>Blockers or questions for mentor review</li>
                </ul>
              </section>
            </div>
          </div>
        )}

        {message && <div style={styles.toast}>{message}</div>}
      </div>
    </div>
  );
}

function SectionHeading({ title }) {
  return (
    <div style={styles.sectionHeading}>
      <span style={styles.sectionLabel}>{title}</span>
    </div>
  );
}

const styles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 290,
    display: 'grid',
    placeItems: 'center',
    padding: 18,
    background: 'rgba(2,8,23,0.72)',
    backdropFilter: 'blur(12px)',
  },
  modal: {
    width: 'min(1280px, 100%)',
    maxHeight: '92vh',
    overflow: 'auto',
    borderRadius: 28,
    background: 'linear-gradient(180deg, rgba(8,12,28,0.98), rgba(3,7,18,0.98))',
    border: '1px solid rgba(148,163,184,0.16)',
    boxShadow: '0 32px 90px rgba(0,0,0,0.56)',
    padding: 24,
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
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: '#94a3b8',
    fontWeight: 800,
    marginBottom: 8,
  },
  title: {
    margin: 0,
    fontSize: 30,
    color: '#f8fafc',
    fontWeight: 800,
    letterSpacing: '-0.04em',
  },
  subtitle: {
    margin: '8px 0 0',
    color: '#94a3b8',
    lineHeight: 1.6,
    maxWidth: 760,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  statusPill: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 12px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: '0.03em',
    whiteSpace: 'nowrap',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: 800,
  },
  heroGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 12,
    marginBottom: 18,
  },
  heroCard: {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.025))',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 18,
    padding: 14,
  },
  heroLabel: {
    display: 'block',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: '#94a3b8',
    fontWeight: 700,
    marginBottom: 8,
  },
  heroValue: {
    display: 'block',
    color: '#f8fafc',
    fontSize: 14,
    lineHeight: 1.45,
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '1.05fr 0.95fr',
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
  sectionHeading: {
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: '#cbd5e1',
    fontWeight: 800,
  },
  snapshotCard: {
    padding: 14,
    borderRadius: 18,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    display: 'grid',
    gap: 12,
  },
  snapshotRow: {
    display: 'grid',
    gap: 4,
  },
  snapshotLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#94a3b8',
    fontWeight: 700,
  },
  snapshotValue: {
    fontSize: 14,
    color: '#f8fafc',
    fontWeight: 700,
  },
  snapshotNotes: {
    padding: 12,
    borderRadius: 14,
    background: 'rgba(124,111,247,0.1)',
    border: '1px solid rgba(124,111,247,0.16)',
    color: '#e2e8f0',
    fontSize: 13,
    lineHeight: 1.6,
  },
  snapshotFooter: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 1.5,
  },
  emptyState: {
    display: 'grid',
    gap: 6,
    color: '#cbd5e1',
    lineHeight: 1.6,
    fontSize: 13,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 1.6,
  },
  timeline: {
    display: 'grid',
    gap: 12,
  },
  timelineItem: {
    display: 'grid',
    gridTemplateColumns: '14px 1fr',
    gap: 12,
    alignItems: 'start',
  },
  timelineDot: {
    width: 10,
    height: 10,
    marginTop: 6,
    borderRadius: '50%',
    background: '#7c6ff7',
    boxShadow: '0 0 0 6px rgba(124,111,247,0.08)',
  },
  timelineTitle: {
    fontSize: 13,
    fontWeight: 800,
    color: '#f8fafc',
  },
  timelineMeta: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
  },
  timelineDesc: {
    fontSize: 12,
    color: '#cbd5e1',
    marginTop: 6,
    lineHeight: 1.5,
  },
  field: {
    display: 'grid',
    gap: 8,
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: 700,
  },
  control: {
    width: '100%',
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    color: '#f8fafc',
    padding: '12px 14px',
    outline: 'none',
    resize: 'vertical',
  },
  primaryBtn: {
    border: 'none',
    borderRadius: 14,
    padding: '12px 14px',
    background: 'linear-gradient(135deg, #7c6ff7, #38bdf8)',
    color: '#fff',
    fontWeight: 800,
    boxShadow: '0 16px 28px rgba(124,111,247,0.22)',
  },
  dropzone: {
    borderRadius: 18,
    border: '1px dashed rgba(148,163,184,0.28)',
    background: 'rgba(255,255,255,0.03)',
    padding: 18,
    display: 'grid',
    gap: 6,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  dropzoneActive: {
    borderColor: 'rgba(56,189,248,0.5)',
    background: 'rgba(56,189,248,0.08)',
  },
  dropzoneDisabled: {
    cursor: 'not-allowed',
    opacity: 0.65,
  },
  dropzoneTitle: {
    fontSize: 15,
    fontWeight: 800,
    color: '#f8fafc',
  },
  dropzoneSub: {
    fontSize: 13,
    color: '#cbd5e1',
  },
  dropzoneMeta: {
    fontSize: 12,
    color: '#94a3b8',
  },
  fileChip: {
    marginTop: 8,
    padding: '10px 12px',
    borderRadius: 14,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'center',
    color: '#e2e8f0',
    fontSize: 13,
  },
  fileRemoveBtn: {
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    color: '#e2e8f0',
    borderRadius: 12,
    padding: '8px 10px',
    fontWeight: 800,
    fontSize: 12,
  },
  linkText: {
    color: '#93c5fd',
    fontWeight: 700,
    textDecoration: 'none',
    fontSize: 13,
  },
  closedBanner: {
    padding: 18,
    borderRadius: 18,
    background: 'rgba(248,113,113,0.08)',
    border: '1px solid rgba(248,113,113,0.18)',
    color: '#fecaca',
    display: 'grid',
    gap: 6,
    marginTop: 4,
  },
  bulletList: {
    margin: 0,
    paddingLeft: 18,
    display: 'grid',
    gap: 8,
    color: '#cbd5e1',
    lineHeight: 1.6,
    fontSize: 13,
  },
  toast: {
    position: 'fixed',
    right: 24,
    bottom: 24,
    zIndex: 310,
    padding: '12px 16px',
    borderRadius: 14,
    background: 'rgba(10,15,40,0.96)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: 700,
    boxShadow: '0 18px 42px rgba(0,0,0,0.34)',
  },
};

export default WeeklyReviewSubmissionModal;
