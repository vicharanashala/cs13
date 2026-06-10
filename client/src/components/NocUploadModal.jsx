import { useEffect, useMemo, useRef, useState } from 'react';
import { getJourneyMilestone } from '../internshipJourney';
import { uploadNoc } from '../api';

const MAX_NOC_BYTES = 1024 * 1024;

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
  if (status === 'rejected') return 'rejected';
  if (status === 'pending') return 'pending';
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
  if (tone === 'pending') {
    return {
      background: 'rgba(59,130,246,0.14)',
      color: '#93c5fd',
      border: '1px solid rgba(59,130,246,0.22)',
    };
  }
  if (tone === 'rejected') {
    return {
      background: 'rgba(248,113,113,0.12)',
      color: '#fecaca',
      border: '1px solid rgba(248,113,113,0.22)',
    };
  }
  return {
    background: 'rgba(107,114,128,0.18)',
    color: '#cbd5e1',
    border: '1px solid rgba(107,114,128,0.22)',
  };
}

function fileToDataUrl(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

function NocUploadModal({ mission, open, onClose }) {
  const [version, setVersion] = useState(0);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef(null);
  const timerRef = useRef(null);

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
    function onKeyDown(event) {
      if (event.key === 'Escape') onClose?.();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const current = useMemo(() => (mission ? getJourneyMilestone(mission.id) : null), [mission, version]);

  useEffect(() => {
    if (!current) return;
    const latestFileName = current.data?.fileName || current.submissions?.[0]?.files?.[0]?.name || '';
    setFile(latestFileName ? { name: latestFileName } : null);
    setPreview(current.data?.previewUrl || current.data?.submittedFilePreview || current.submissions?.[0]?.files?.[0]?.previewUrl || '');
  }, [current?.id, current?.data?.approvalStatus, current?.data?.fileName, current?.data?.previewUrl, current?.data?.submittedFilePreview]);

  useEffect(() => {
    if (!message) return undefined;
    const timer = window.setTimeout(() => setMessage(''), 2600);
    return () => window.clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  if (!open || !mission || !current) return null;

  const status = (() => {
    if (current.data?.approvalStatus === 'Approved' || current.status === 'completed') return 'approved';
    if (current.data?.approvalStatus === 'Rejected') return 'rejected';
    if (current.status === 'pending_review' || current.data?.approvalStatus === 'Pending Review' || current.data?.approvalStatus === 'Needs Changes') return 'pending';
    return 'locked';
  })();

  const statusLabel = {
    approved: 'Approved',
    pending: current.data?.approvalStatus === 'Needs Changes' ? 'Needs Changes' : 'Pending',
    rejected: 'Rejected',
    locked: 'Pending',
  }[status];

  const statusToneValue = statusTone(status);
  const latestSubmission = current.submissions?.[0] || null;
  const latestSubmittedAt = latestSubmission?.submittedAt || current.data?.uploadedAt || current.data?.lastReviewedAt || '';
  const hasUpload = Boolean(file || preview || current.data?.fileName);
  const deadlineDate = current.dueDate ? new Date(`${current.dueDate}T23:59:59`) : null;
  const deadlinePassed = Boolean(deadlineDate && deadlineDate.getTime() < Date.now());
  const submissionClosed = deadlinePassed && status !== 'approved' && !current.data?.allowLateSubmission;
  const existingFileName = current.data?.fileName || latestSubmission?.files?.[0]?.name || '';
  const hasReplacementSelection = Boolean(file && file.name && file.name !== existingFileName);
  const submitLabel = hasUpload ? (hasReplacementSelection ? 'Submit Replacement' : 'Re-upload NOC') : 'Upload NOC';

  async function prepareFile(nextFile) {
    if (!nextFile) return;
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    const name = nextFile.name.toLowerCase();
    if (!allowed.includes(nextFile.type) && !['.jpg', '.jpeg', '.png', '.pdf'].some(ext => name.endsWith(ext))) {
      setMessage('Accepted formats: JPG, JPEG, PNG, PDF.');
      return;
    }
    if (nextFile.size > MAX_NOC_BYTES) {
      setMessage('File size must be 1 MB or smaller.');
      return;
    }
    setBusy(true);
    setProgress(12);
    const dataUrl = await fileToDataUrl(nextFile);
    setFile(nextFile);
    setPreview(dataUrl);
    setProgress(100);
    window.setTimeout(() => {
      setBusy(false);
      setMessage(`${nextFile.name} is ready to upload.`);
      setProgress(0);
    }, 350);
  }

  function triggerFilePicker() {
    if (submissionClosed) {
      setMessage('Submission closed for this milestone.');
      return;
    }
    fileInputRef.current?.click();
  }

  async function handleFileChange(event) {
    const nextFile = event.target.files?.[0];
    if (!nextFile) return;
    await prepareFile(nextFile);
    event.target.value = '';
  }

  async function handleSubmit() {
    if (submissionClosed) {
      setMessage('Deadline passed. Submission is closed.');
      return;
    }
    if (!file) {
      setMessage('Choose a file before uploading.');
      return;
    }

    setBusy(true);
    setProgress(10);
    try {
      const result = await uploadNoc(file);
      setProgress(100);
      if (result.error) throw new Error(result.error);
      setMessage('NOC uploaded successfully and sent for admin review.');
      window.dispatchEvent(new Event('samagama-journey-updated'));
    } catch (err) {
      setMessage(err.message || 'Upload failed. Please try again.');
    } finally {
      setBusy(false);
      setProgress(0);
    }
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragActive(false);
    if (submissionClosed) {
      setMessage('Submission closed for this milestone.');
      return;
    }
    const nextFile = event.dataTransfer.files?.[0];
    if (nextFile) prepareFile(nextFile);
  }

  const submittedAtText = latestSubmittedAt ? formatClock(latestSubmittedAt) : '—';
  const deadlineText = current.dueDate ? `Due ${compactDate(current.dueDate)}` : 'No deadline set';

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <div>
            <div style={styles.kicker}>Document Upload</div>
            <h2 style={styles.title}>Upload Signed NOC</h2>
            <p style={styles.subtitle}>Upload, preview, replace, and track the status of your signed NOC from the college.</p>
          </div>
          <div style={styles.headerRight}>
            <span style={{ ...styles.statusPill, ...toneStyles(statusToneValue) }}>{statusLabel}</span>
            <button type="button" onClick={onClose} style={styles.closeBtn}>✕</button>
          </div>
        </div>

        <div style={styles.heroGrid}>
          <div style={styles.heroCard}>
            <span style={styles.heroLabel}>Deadline</span>
            <strong style={styles.heroValue}>{deadlineText}</strong>
          </div>
          <div style={styles.heroCard}>
            <span style={styles.heroLabel}>Status</span>
            <strong style={styles.heroValue}>{statusLabel}</strong>
          </div>
          <div style={styles.heroCard}>
            <span style={styles.heroLabel}>Uploaded On</span>
            <strong style={styles.heroValue}>{submittedAtText}</strong>
          </div>
          <div style={styles.heroCard}>
            <span style={styles.heroLabel}>Preview</span>
            <strong style={styles.heroValue}>{preview ? 'Preview available' : 'No preview yet'}</strong>
          </div>
        </div>

        <div style={styles.layout}>
          <div style={styles.leftCol}>
            <section style={styles.section}>
              <SectionTitle title="Upload status" />
              <div style={styles.snapshotCard}>
                <div style={styles.snapshotRow}>
                  <span style={styles.snapshotLabel}>Current file</span>
                  <strong style={styles.snapshotValue}>{current.data?.fileName || latestSubmission?.files?.[0]?.name || 'No file uploaded'}</strong>
                </div>
                <div style={styles.snapshotRow}>
                  <span style={styles.snapshotLabel}>View uploaded NOC</span>
                  {preview ? (
                    <a href={preview} target="_blank" rel="noreferrer" style={styles.linkText}>Open preview</a>
                  ) : (
                    <span style={styles.emptyInline}>Preview not available yet</span>
                  )}
                </div>
                <div style={styles.snapshotRow}>
                  <span style={styles.snapshotLabel}>Submission history</span>
                  <strong style={styles.snapshotValue}>{current.submissions?.length ? `${current.submissions.length} record(s)` : 'No prior uploads'}</strong>
                </div>
                <div style={styles.snapshotFooter}>
                  {status === 'approved'
                    ? 'Approved uploads remain available for reference.'
                    : status === 'rejected'
                      ? 'Re-upload after addressing the reviewer remarks.'
                      : 'You can re-upload before approval if needed.'}
                </div>
              </div>
            </section>

          </div>

          <div style={styles.rightCol}>
            <section style={styles.section}>
              <SectionTitle title="Drag & Drop Upload" />
              <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" onChange={handleFileChange} style={{ display: 'none' }} />
              <div
                style={{
                  ...styles.dropzone,
                  ...(dragActive ? styles.dropzoneActive : {}),
                  ...(submissionClosed ? styles.dropzoneDisabled : {}),
                }}
                onDragOver={e => {
                  e.preventDefault();
                  if (!submissionClosed) setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={triggerFilePicker}
              >
                <div style={styles.dropzoneTitle}>Drag & Drop NOC</div>
                <div style={styles.dropzoneSub}>Accepted formats: JPG, JPEG, PNG, PDF</div>
                <div style={styles.dropzoneMeta}>Maximum size: 1 MB</div>
                {file && (
                  <div style={styles.fileChip}>
                    <span>{file.name}</span>
                    <button
                      type="button"
                      style={styles.fileRemoveBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        setPreview('');
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div style={styles.progressWrap}>
                <div style={styles.progressMeta}>
                  <span>Upload progress</span>
                  <strong>{busy ? `${progress}%` : hasUpload ? 'Ready' : 'Idle'}</strong>
                </div>
                <div style={styles.progressTrack}>
                  <div style={{ ...styles.progressFill, width: `${progress}%` }} />
                </div>
              </div>
              <button
                type="button"
                style={styles.primaryBtn}
                onClick={hasUpload && !hasReplacementSelection ? triggerFilePicker : handleSubmit}
                disabled={submissionClosed}
              >
                {submitLabel}
              </button>
            </section>
          </div>
        </div>

        {message && <div style={styles.toast}>{message}</div>}
      </div>
    </div>
  );
}

function SectionTitle({ title }) {
  return (
    <div style={styles.sectionHeading}>
      <span style={styles.sectionLabel}>{title}</span>
    </div>
  );
}

function compactDate(value) {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(new Date(value));
  } catch {
    return value;
  }
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
  snapshotFooter: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 1.5,
  },
  emptyInline: {
    color: '#94a3b8',
    fontSize: 13,
  },
  notesCard: {
    padding: 14,
    borderRadius: 18,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    display: 'grid',
    gap: 8,
  },
  notesLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#94a3b8',
    fontWeight: 700,
  },
  notesValue: {
    color: '#e2e8f0',
    fontSize: 13,
    lineHeight: 1.6,
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
  primaryBtn: {
    border: 'none',
    borderRadius: 14,
    padding: '12px 14px',
    background: 'linear-gradient(135deg, #7c6ff7, #38bdf8)',
    color: '#fff',
    fontWeight: 800,
    boxShadow: '0 16px 28px rgba(124,111,247,0.22)',
    opacity: 1,
  },
  progressWrap: {
    display: 'grid',
    gap: 10,
  },
  progressMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: 700,
  },
  progressTrack: {
    height: 8,
    background: 'rgba(255,255,255,0.06)',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    background: 'linear-gradient(90deg, #22c55e, #22d3ee, #3b82f6)',
    transition: 'width 0.2s ease',
  },
  linkText: {
    color: '#93c5fd',
    fontWeight: 700,
    textDecoration: 'none',
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
  legendGrid: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  legendItem: {
    padding: '8px 12px',
    borderRadius: 999,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: 700,
  },
};

export default NocUploadModal;
