import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  downloadJourneyCertificate,
  downloadJourneyOfferLetter,
  formatJourneyDate,
  getJourneyMilestone,
  submitJourneyFinalProject,
  submitJourneyReview,
  submitJourneyStart,
  submitJourneyTeam,
  submitJourneyWeeklyReview,
  submitJourneyZoomId,
} from '../internshipJourney';
import NocUploadModal from '../components/NocUploadModal';
import TeamWorkflowModal from '../components/TeamWorkflowModal';
import WeeklyReviewSubmissionModal from '../components/WeeklyReviewSubmissionModal';

const GOOGLE_FORM_LINK = import.meta.env.VITE_GOOGLE_FORM_LINK || 'https://forms.gle/sk9cnARQxyb3ubiz9';

function statusTone(status) {
  if (status === 'completed') return 'done';
  if (status === 'active') return 'active';
  if (status === 'pending_review') return 'review';
  return 'locked';
}

function toneStyles(tone) {
  if (tone === 'done') {
    return {
      background: 'rgba(34,197,94,0.14)',
      color: '#86efac',
      border: '1px solid rgba(34,197,94,0.22)',
    };
  }
  if (tone === 'active') {
    return {
      background: 'rgba(59,130,246,0.16)',
      color: '#93c5fd',
      border: '1px solid rgba(59,130,246,0.28)',
    };
  }
  if (tone === 'review') {
    return {
      background: 'rgba(251,191,36,0.12)',
      color: '#fde68a',
      border: '1px solid rgba(251,191,36,0.24)',
    };
  }
  return {
    background: 'rgba(107,114,128,0.18)',
    color: '#cbd5e1',
    border: '1px solid rgba(107,114,128,0.22)',
  };
}

function JourneyDetailModal({ mission, open, onClose }) {
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);
  const [message, setMessage] = useState('');
  const [offerLetterLoading, setOfferLetterLoading] = useState(false);
  const [offerLetterError, setOfferLetterError] = useState('');
  const [confirmStartDate, setConfirmStartDate] = useState('');
  const [confirmEndDate, setConfirmEndDate] = useState('');
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [nocFileName, setNocFileName] = useState('');
  const [nocPreview, setNocPreview] = useState('');
  const [zoomId, setZoomId] = useState('');
  const [teamMode, setTeamMode] = useState('Create team');
  const [teamName, setTeamName] = useState('');
  const [teamMembers, setTeamMembers] = useState('');
  const [weeklyNote, setWeeklyNote] = useState('');
  const [weeklyLinks, setWeeklyLinks] = useState('');
  const [projectNote, setProjectNote] = useState('');
  const [projectTasks, setProjectTasks] = useState('');
  const [projectLinks, setProjectLinks] = useState('');
  const [projectFiles, setProjectFiles] = useState('');

  useEffect(() => {
    function syncJourney() {
      setVersion(v => v + 1);
    }

    if (!open) return undefined;
    window.addEventListener('samagama-journey-updated', syncJourney);
    return () => window.removeEventListener('samagama-journey-updated', syncJourney);
  }, [open]);

  const current = useMemo(() => (mission ? getJourneyMilestone(mission.id) : null), [mission, version]);

  useEffect(() => {
    if (!current) return;
    setConfirmStartDate(current.data?.startDate || '');
    setConfirmEndDate(current.data?.endDate || '');
    setDateModalOpen(false);
    setNocFileName(current.data?.fileName || '');
    setNocPreview(current.data?.previewUrl || '');
    setZoomId(current.data?.zoomId || '');
    setTeamMode(current.data?.team?.mode || 'Create team');
    setTeamName(current.data?.team?.name || '');
    setTeamMembers(Array.isArray(current.data?.team?.members) ? current.data.team.members.join(', ') : '');
    setWeeklyNote(current.data?.weeklyNote || '');
    setWeeklyLinks(Array.isArray(current.data?.reportLinks) ? current.data.reportLinks.join(', ') : '');
    setProjectNote(current.data?.projectNote || '');
    setProjectTasks(Array.isArray(current.data?.tasks) ? current.data.tasks.join(', ') : '');
    setProjectLinks(Array.isArray(current.data?.projectLinks) ? current.data.projectLinks.join(', ') : '');
    setProjectFiles(Array.isArray(current.data?.files) ? current.data.files.map(file => file.name || file).join(', ') : '');
    setOfferLetterLoading(false);
    setOfferLetterError('');
  }, [current?.id]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && open) {
        onClose?.();
      }
    }

    if (!open) return undefined;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open || !mission || !current) return null;

  if (current.id === 5) {
    return <NocUploadModal mission={mission} open={open} onClose={onClose} />;
  }

  if (current.id === 10) {
    return <WeeklyReviewSubmissionModal mission={mission} open={open} onClose={onClose} />;
  }

  if (current.id === 9) {
    return <TeamWorkflowModal mission={mission} open={open} onClose={onClose} />;
  }

  const tone = statusTone(current.status);
  const completionText = current.completionDate ? `Completed on ${formatJourneyDate(current.completionDate)}` : 'Not completed yet';
  const deadlinesText = current.dueDate ? `Due ${new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(new Date(`${current.dueDate}T23:59:59`))}` : 'No deadline available';
  const offerIssuedAt = current.id === 6 ? current.data?.issuedAt || current.data?.generatedAt || '' : '';
  const isRecentOfferLetter = Boolean(offerIssuedAt && (Date.now() - new Date(offerIssuedAt).getTime()) < 48 * 60 * 60 * 1000);
  const relatedRouteLabel = current.relatedRoute === '/yaksha'
    ? 'Open Yaksha'
    : current.relatedRoute === '/overview'
      ? 'Open Overview'
      : current.relatedRoute === '/dashboard'
        ? 'Open Dashboard'
        : 'Open Related Page';

  function flash(text) {
    setMessage(text);
    window.setTimeout(() => setMessage(''), 2000);
  }

  function parseList(value) {
    return value
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
  }

  async function handleNocFile(file) {
    if (!file) return;
    setNocFileName(file.name);
    const previewUrl = await new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
    setNocPreview(previewUrl);
  }

  function handleSavePeriod() {
    if (!confirmStartDate || !confirmEndDate) {
      flash('Choose both a start date and an end date.');
      return;
    }
    if (new Date(confirmEndDate).getTime() < new Date(confirmStartDate).getTime()) {
      flash('End date cannot be earlier than the start date.');
      return;
    }
    const durationDays = Math.max(1, Math.round((new Date(`${confirmEndDate}T23:59:59`).getTime() - new Date(`${confirmStartDate}T00:00:00`).getTime()) / (1000 * 60 * 60 * 24)) + 1);
    submitJourneyReview(4, {
      title: 'Internship period confirmation',
      comment: 'Student selected internship dates for admin approval.',
      data: {
        startDate: confirmStartDate,
        endDate: confirmEndDate,
        durationDays,
        submittedAt: new Date().toISOString(),
        approvalStatus: 'Pending Approval',
        submissionStatus: 'submitted',
      },
      by: 'Student',
    });
    setDateModalOpen(false);
    flash('Dates submitted for admin approval.');
  }

  function handleSubmitNoc() {
    submitJourneyReview(5, {
      title: 'Signed NOC',
      comment: 'A new signed NOC version was uploaded from the student dashboard.',
      files: nocFileName ? [{ name: nocFileName, previewUrl: nocPreview }] : [],
      data: {
        fileName: nocFileName,
        previewUrl: nocPreview,
      },
      by: 'Student',
    }, { keepStatus: true });
    flash('NOC uploaded and sent for admin review.');
  }

  function handleDownloadOfferLetter() {
    if (!offerIssuedAt) {
      setOfferLetterError('Offer letter has not been issued yet.');
      flash('Offer letter has not been issued yet.');
      return;
    }

    setOfferLetterLoading(true);
    setOfferLetterError('');

    window.setTimeout(() => {
      try {
        downloadJourneyOfferLetter();
        const filename = current.data?.fileName || 'Vicharanashala_Offer_Letter.pdf';
        const content = `Vicharanashala Internship Offer Letter\n\nStudent: Samagama Student\nMilestone: Download Offer Letter\nIssue date: ${formatJourneyDate(offerIssuedAt)}\nDownloaded: ${new Date().toLocaleString('en-IN')}\n\nPlease keep this copy for your records.`;
        const blob = new Blob([content], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.URL.revokeObjectURL(url);
        flash('Offer letter downloaded.');
      } catch (error) {
        const nextError = error?.message || 'Unable to download offer letter right now.';
        setOfferLetterError(nextError);
        flash(nextError);
      } finally {
        setOfferLetterLoading(false);
      }
    }, 650);
  }

  function handleZoomSubmit() {
    if (!zoomId.trim()) return;
    submitJourneyZoomId(zoomId.trim());
    flash('Zoom ID saved and milestone unlocked.');
  }

  function handleStartInternship() {
    submitJourneyStart();
    flash('Internship started.');
  }

  function handleTeamSave() {
    submitJourneyTeam({
      mode: teamMode,
      name: teamName.trim(),
      members: parseList(teamMembers),
    });
    flash('Team saved and milestone completed.');
  }

  function handleWeeklyReviewSubmit() {
    submitJourneyWeeklyReview({
      comment: weeklyNote.trim(),
      links: parseList(weeklyLinks),
      progressNotes: weeklyNote.trim(),
    });
    flash('Weekly review submitted for admin review.');
  }

  function handleFinalSubmit() {
    submitJourneyFinalProject({
      comment: projectNote.trim(),
      tasks: parseList(projectTasks),
      links: parseList(projectLinks),
      files: parseList(projectFiles).map(name => ({ name })),
      certificateEligible: false,
    });
    flash('Final project review submitted.');
  }

  function handleCertificateDownload() {
    if (!current.data?.certificateEligible) {
      flash('Certificate will unlock after final approval.');
      return;
    }
    downloadJourneyCertificate();
    const content = `Samagama Internship Certificate\n\nStudent: Samagama Student\nMilestone: Project Work & Finish Internship\nIssued: ${new Date().toLocaleString('en-IN')}`;
    const blob = new Blob([content], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'Samagama_Internship_Certificate.pdf';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
    flash('Certificate downloaded.');
  }

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <div>
            <div style={styles.kicker}>Internship Journey</div>
            <h2 style={styles.title}>{current.title}</h2>
            <p style={styles.subtitle}>{current.desc}</p>
          </div>

          <div style={styles.headerRight}>
            <span style={{ ...styles.statusPill, ...toneStyles(tone) }}>
              {current.status === 'pending_review' ? 'Pending Review' : current.status === 'completed' ? 'Completed' : current.status === 'active' ? 'Active' : 'Locked'}
            </span>
            <button type="button" onClick={onClose} style={styles.closeBtn}>✕</button>
          </div>
        </div>

        <div style={styles.quickRow}>
          <div style={styles.quickCard}>
            <span style={styles.quickLabel}>Deadline</span>
            <strong style={styles.quickValue}>{deadlinesText}</strong>
          </div>
          <div style={styles.quickCard}>
            <span style={styles.quickLabel}>Current State</span>
            <strong style={styles.quickValue}>{completionText}</strong>
          </div>
          <div style={styles.quickCard}>
            <span style={styles.quickLabel}>Next Step</span>
            <strong style={styles.quickValue}>{current.nextActions?.[0] || 'Continue the journey'}</strong>
          </div>
        </div>

        <div style={styles.content}>
          <div style={styles.leftCol}>
            <section style={styles.section}>
              <SectionHeading title="Instructions" />
              <ul style={styles.list}>
                {current.instructions?.map(item => <li key={item}>{item}</li>)}
              </ul>
            </section>
          </div>

          <div style={styles.rightCol}>
            <section style={styles.section}>
              <SectionHeading title="Actions" />

              {current.id === 4 && (
                <div style={styles.actionCard}>
                  <div style={styles.actionTitle}>Confirm internship dates</div>
                  <div style={styles.helperText}>
                    Select your internship start and end dates. The dates remain saved after refresh, and the step stays pending approval until the admin confirms it.
                  </div>
                  <button type="button" style={styles.primaryBtn} onClick={() => setDateModalOpen(true)}>
                    Open Date Picker
                  </button>
                  {current.data?.startDate && current.data?.endDate && (
                    <div style={styles.readOnlyCard}>
                      <div style={styles.readOnlyGrid}>
                        <div>
                          <strong>Start date</strong>
                          <span>{formatJourneyDate(current.data.startDate)}</span>
                        </div>
                        <div>
                          <strong>End date</strong>
                          <span>{formatJourneyDate(current.data.endDate)}</span>
                        </div>
                        <div>
                          <strong>Duration</strong>
                          <span>{current.data.durationDays ? `${current.data.durationDays} days` : '—'}</span>
                        </div>
                        <div>
                          <strong>Status</strong>
                          <span>{current.status === 'pending_review' ? 'Pending Approval' : current.status === 'completed' ? 'Completed' : 'Active'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {current.id === 1 && (
                <div style={styles.actionCard}>
                  <div style={styles.actionTitle}>Open the application form</div>
                  <div style={styles.helperText}>Complete the internship application in the official Google Form. It opens in a new browser tab.</div>
                  <a
                    href={GOOGLE_FORM_LINK}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      ...styles.primaryBtn,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    Open Application Form
                  </a>
                </div>
              )}

              {current.id === 5 && (
                <div style={styles.actionCard}>
                  <div style={styles.actionTitle}>Upload signed NOC</div>
                  <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={async e => handleNocFile(e.target.files?.[0])} />
                  <div style={styles.previewCard}>
                    <div style={styles.previewLabel}>Current file</div>
                    <strong style={styles.previewTitle}>{nocFileName || 'No file uploaded'}</strong>
                    {nocPreview && (
                      <a href={nocPreview} target="_blank" rel="noreferrer" style={styles.previewLink}>
                        Open preview
                      </a>
                    )}
                  </div>
                  <button type="button" style={styles.primaryBtn} onClick={handleSubmitNoc} disabled={!nocFileName}>
                    Submit NOC for Review
                  </button>
                </div>
              )}

              {current.id === 6 && (
                <div style={styles.actionCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div>
                      <div style={styles.actionTitle}>Secure offer letter download</div>
                      <div style={styles.helperText}>
                        {offerIssuedAt
                          ? `Issued on ${formatJourneyDate(offerIssuedAt)}. Download it securely from the portal.`
                          : 'Awaiting admin issue. The download button unlocks automatically once issued.'}
                      </div>
                    </div>
                    {isRecentOfferLetter && (
                      <span style={{
                        padding: '6px 10px',
                        borderRadius: 999,
                        background: 'rgba(59,130,246,0.16)',
                        color: '#93c5fd',
                        border: '1px solid rgba(59,130,246,0.24)',
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: '0.08em',
                      }}>
                        NEW
                      </span>
                    )}
                  </div>
                  <div style={styles.readOnlyCard}>
                    <strong>Issue date</strong>
                    <span>{offerIssuedAt ? formatJourneyDate(offerIssuedAt) : 'Not issued yet'}</span>
                  </div>
                  {offerLetterError && (
                    <div style={{ padding: 12, borderRadius: 14, background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.2)', color: '#fecaca', fontSize: 13, lineHeight: 1.5 }}>
                      {offerLetterError}
                    </div>
                  )}
                  <button
                    type="button"
                    style={{
                      ...styles.primaryBtn,
                      opacity: offerIssuedAt ? 1 : 0.55,
                    }}
                    onClick={handleDownloadOfferLetter}
                    disabled={!offerIssuedAt || offerLetterLoading}
                  >
                    {offerLetterLoading ? 'Preparing PDF...' : 'Download Offer Letter'}
                  </button>
                </div>
              )}

              {current.id === 7 && (
                <div style={styles.actionCard}>
                  <div style={styles.actionTitle}>Provide Zoom ID</div>
                  <label style={styles.field}>
                    <span>Zoom ID</span>
                    <input value={zoomId} onChange={e => setZoomId(e.target.value)} placeholder="Enter your Zoom ID" />
                  </label>
                  <button type="button" style={styles.primaryBtn} onClick={handleZoomSubmit}>
                    Save Zoom ID
                  </button>
                </div>
              )}

              {current.id === 8 && (
                <div style={styles.actionCard}>
                  <div style={styles.actionTitle}>Start the internship</div>
                  <div style={styles.helperText}>Once you confirm this step, the internship begins and mentor assignment becomes active.</div>
                  <button type="button" style={styles.primaryBtn} onClick={handleStartInternship}>
                    Start Internship
                  </button>
                </div>
              )}

              {current.id === 9 && (
                <div style={styles.actionCard}>
                  <div style={styles.actionTitle}>Form your project team</div>
                  <label style={styles.field}>
                    <span>Team mode</span>
                    <select value={teamMode} onChange={e => setTeamMode(e.target.value)}>
                      {['Create team', 'Join team', 'Manage team'].map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                  <label style={styles.field}>
                    <span>Team name</span>
                    <input value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="Project team name" />
                  </label>
                  <label style={styles.field}>
                    <span>Members</span>
                    <textarea rows="3" value={teamMembers} onChange={e => setTeamMembers(e.target.value)} placeholder="Comma separated names" />
                  </label>
                  <button type="button" style={styles.primaryBtn} onClick={handleTeamSave}>
                    Save Team
                  </button>
                </div>
              )}

              {current.id === 10 && (
                <div style={styles.actionCard}>
                  <div style={styles.actionTitle}>Weekly review submission</div>
                  <label style={styles.field}>
                    <span>Progress note</span>
                    <textarea rows="4" value={weeklyNote} onChange={e => setWeeklyNote(e.target.value)} placeholder="What did you complete this week?" />
                  </label>
                  <label style={styles.field}>
                    <span>Report links</span>
                    <input value={weeklyLinks} onChange={e => setWeeklyLinks(e.target.value)} placeholder="Comma separated links" />
                  </label>
                  <button type="button" style={styles.primaryBtn} onClick={handleWeeklyReviewSubmit}>
                    Submit Weekly Review
                  </button>
                </div>
              )}

              {current.id === 11 && (
                <div style={styles.actionCard}>
                  <div style={styles.actionTitle}>Project work & certificate</div>
                  <div style={styles.helperText}>Complete your project work, submit the final review, and unlock the certificate when approved.</div>
                  <label style={styles.field}>
                    <span>Project note</span>
                    <textarea rows="4" value={projectNote} onChange={e => setProjectNote(e.target.value)} placeholder="Summarize your final work" />
                  </label>
                  <label style={styles.field}>
                    <span>Task checklist</span>
                    <input value={projectTasks} onChange={e => setProjectTasks(e.target.value)} placeholder="Comma separated tasks" />
                  </label>
                  <label style={styles.field}>
                    <span>Submission links</span>
                    <input value={projectLinks} onChange={e => setProjectLinks(e.target.value)} placeholder="Comma separated links" />
                  </label>
                  <label style={styles.field}>
                    <span>Attachments</span>
                    <input value={projectFiles} onChange={e => setProjectFiles(e.target.value)} placeholder="Comma separated file names" />
                  </label>
                  <button type="button" style={styles.primaryBtn} onClick={handleFinalSubmit}>
                    Submit Final Review
                  </button>
                  <button
                    type="button"
                    style={{
                      ...styles.secondaryBtn,
                      opacity: current.data?.certificateEligible || current.status === 'completed' ? 1 : 0.5,
                    }}
                    onClick={handleCertificateDownload}
                  >
                    Download Certificate
                  </button>
                </div>
              )}

              {current.id === 2 && (
                <div style={styles.actionCard}>
                  <div style={styles.actionTitle}>Interview result snapshot</div>
                  <div style={styles.readOnlyStats}>
                    <SmallStat label="Score" value={String(current.result?.interviewScore || 92)} />
                    <SmallStat label="Status" value={current.result?.selectionStatus || 'Selected'} />
                  </div>
                  <div style={styles.readOnlyCard}>
                    <strong>Remarks</strong>
                    <span>{current.result?.remarks || 'Interview remarks available.'}</span>
                  </div>
                  <div style={styles.readOnlyCard}>
                    <strong>Feedback</strong>
                    <span>{current.result?.feedback || 'Review the feedback and continue.'}</span>
                  </div>
                </div>
              )}

              {current.id === 3 && (
                <div style={styles.actionCard}>
                  <div style={styles.actionTitle}>Selection result</div>
                  <div style={styles.readOnlyStats}>
                    <SmallStat label="Selection" value={current.result?.selectionStatus || 'Selected'} />
                    <SmallStat label="Interview Score" value={String(current.result?.interviewScore || 92)} />
                  </div>
                  <div style={styles.readOnlyCard}>
                    <strong>Yellow VINS panel</strong>
                    <span>{current.result?.remarks || 'Your result is available on the dashboard panel.'}</span>
                  </div>
                  <button type="button" style={styles.secondaryBtn} onClick={() => navigate(current.relatedRoute || '/dashboard')}>
                    {relatedRouteLabel}
                  </button>
                </div>
              )}

              {message && <div style={styles.toast}>{message}</div>}
            </section>
          </div>
        </div>

        {dateModalOpen && current.id === 4 && (
          <div style={styles.dateOverlay} onClick={() => setDateModalOpen(false)}>
            <div style={styles.dateModal} onClick={e => e.stopPropagation()}>
              <div style={styles.dateHeader}>
                <div>
                  <div style={styles.kicker}>Calendar</div>
                  <h3 style={{ margin: 0, color: '#f8fafc', fontSize: 22 }}>Confirm Internship Period</h3>
                  <div style={styles.helperText}>Choose a start date and end date. Past dates are disabled and the end date cannot be earlier than the start date.</div>
                </div>
                <button type="button" onClick={() => setDateModalOpen(false)} style={styles.closeBtn}>✕</button>
              </div>
              <div style={styles.fieldRow}>
                <label style={styles.field}>
                  <span>Start Date</span>
                  <input
                    type="date"
                    value={confirmStartDate}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={e => {
                      const nextStart = e.target.value;
                      setConfirmStartDate(nextStart);
                      if (confirmEndDate && nextStart && new Date(confirmEndDate).getTime() < new Date(nextStart).getTime()) {
                        setConfirmEndDate('');
                      }
                    }}
                  />
                </label>
                <label style={styles.field}>
                  <span>End Date</span>
                  <input
                    type="date"
                    value={confirmEndDate}
                    min={confirmStartDate || new Date().toISOString().slice(0, 10)}
                    onChange={e => setConfirmEndDate(e.target.value)}
                  />
                </label>
              </div>
              <div style={styles.readOnlyCard}>
                <div style={styles.readOnlyGrid}>
                  <div>
                    <strong>Selected start</strong>
                    <span>{confirmStartDate ? formatJourneyDate(confirmStartDate) : 'Choose a start date'}</span>
                  </div>
                  <div>
                    <strong>Selected end</strong>
                    <span>{confirmEndDate ? formatJourneyDate(confirmEndDate) : 'Choose an end date'}</span>
                  </div>
                  <div>
                    <strong>Duration</strong>
                    <span>
                      {confirmStartDate && confirmEndDate && new Date(confirmEndDate).getTime() >= new Date(confirmStartDate).getTime()
                        ? `${Math.max(1, Math.round((new Date(`${confirmEndDate}T23:59:59`).getTime() - new Date(`${confirmStartDate}T00:00:00`).getTime()) / (1000 * 60 * 60 * 24)) + 1)} days`
                        : '—'}
                    </span>
                  </div>
                  <div>
                    <strong>Status</strong>
                    <span>Pending Approval</span>
                  </div>
                </div>
              </div>
              <div style={styles.actionsRow}>
                <button type="button" style={styles.primaryBtn} onClick={handleSavePeriod}>
                  Confirm Dates
                </button>
                <button type="button" style={styles.secondaryBtn} onClick={() => setDateModalOpen(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
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

function SmallStat({ label, value }) {
  return (
    <div style={styles.smallStat}>
      <span style={styles.smallStatLabel}>{label}</span>
      <strong style={styles.smallStatValue}>{value}</strong>
    </div>
  );
}

const styles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 260,
    display: 'grid',
    placeItems: 'center',
    padding: 18,
    background: 'rgba(2,8,23,0.72)',
    backdropFilter: 'blur(12px)',
  },
  modal: {
    width: 'min(1240px, 100%)',
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
  quickRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 12,
    marginBottom: 18,
  },
  quickCard: {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.025))',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: 16,
    minHeight: 88,
  },
  quickLabel: {
    display: 'block',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: '#94a3b8',
    fontWeight: 700,
    marginBottom: 8,
  },
  quickValue: {
    display: 'block',
    color: '#f8fafc',
    fontSize: 14,
    lineHeight: 1.45,
  },
  content: {
    display: 'grid',
    gridTemplateColumns: '1.4fr 0.95fr',
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
  list: {
    margin: 0,
    paddingLeft: 18,
    color: '#cbd5e1',
    lineHeight: 1.7,
    display: 'grid',
    gap: 8,
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
  emptyText: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 1.6,
  },
  actionCard: {
    background: 'linear-gradient(135deg, rgba(124,111,247,0.12), rgba(56,189,248,0.08))',
    border: '1px solid rgba(124,111,247,0.18)',
    borderRadius: 20,
    padding: 16,
    display: 'grid',
    gap: 12,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: 800,
    color: '#f8fafc',
    letterSpacing: '-0.02em',
  },
  helperText: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 1.6,
  },
  fieldRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
  },
  field: {
    display: 'grid',
    gap: 8,
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: 700,
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
  secondaryBtn: {
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: '12px 14px',
    background: 'rgba(255,255,255,0.04)',
    color: '#e2e8f0',
    fontWeight: 800,
  },
  previewCard: {
    padding: 14,
    borderRadius: 16,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    display: 'grid',
    gap: 6,
  },
  previewLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: '#94a3b8',
    fontWeight: 700,
  },
  previewTitle: {
    color: '#f8fafc',
    fontSize: 14,
  },
  previewLink: {
    color: '#93c5fd',
    fontSize: 12,
    fontWeight: 700,
    textDecoration: 'none',
  },
  readOnlyCard: {
    padding: 14,
    borderRadius: 16,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    display: 'grid',
    gap: 6,
  },
  readOnlyStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 10,
  },
  smallStat: {
    padding: 12,
    borderRadius: 16,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    display: 'grid',
    gap: 6,
  },
  smallStatLabel: {
    fontSize: 11,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    fontWeight: 700,
  },
  smallStatValue: {
    fontSize: 15,
    color: '#f8fafc',
    fontWeight: 800,
  },
  toast: {
    position: 'fixed',
    right: 24,
    bottom: 24,
    zIndex: 280,
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

export default JourneyDetailModal;
