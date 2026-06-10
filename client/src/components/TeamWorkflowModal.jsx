import { useEffect, useMemo, useState } from 'react';
import {
  createTeam,
  fetchMyTeam,
  requestJoinTeam,
  respondJoinRequest,
  respondTeamInvite,
} from '../api';
import { createAnnouncement } from '../announcements';
import { getStudentSession } from '../studentSession';
import { submitJourneyTeam } from '../internshipJourney';

const defaultMembers = () => [{ name: '', email: '' }];

function formatDateTime(value) {
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

function StatChip({ label, value, tone = 'neutral' }) {
  const colors = {
    neutral: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#e2e8f0' },
    blue: { background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.22)', color: '#bfdbfe' },
    green: { background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.22)', color: '#bbf7d0' },
    amber: { background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.22)', color: '#fde68a' },
    red: { background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.22)', color: '#fecaca' },
  };
  const style = colors[tone] || colors.neutral;
  return (
    <div style={{ padding: 14, borderRadius: 18, ...style }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'inherit', opacity: 0.75, fontWeight: 800 }}>{label}</div>
      <div style={{ marginTop: 6, fontSize: 16, fontWeight: 800, color: 'inherit' }}>{value}</div>
    </div>
  );
}

function TeamWorkflowModal({ mission, open, onClose }) {
  const session = getStudentSession();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState('chooser');
  const [message, setMessage] = useState('');
  const [teamContext, setTeamContext] = useState(null);
  const [leaderEmail, setLeaderEmail] = useState('');
  const [joinNote, setJoinNote] = useState('');
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    domain: '',
    maxMembers: '10',
    members: defaultMembers(),
  });

  useEffect(() => {
    if (!open) return undefined;

    let active = true;
    async function loadTeam() {
      setLoading(true);
      try {
        if (!session.email) {
          setTeamContext(null);
          setView('chooser');
          return;
        }
        const data = await fetchMyTeam(session.email, session.email);
        if (!active) return;
        setTeamContext(data);
        if (data?.team) {
          setView('manage');
        } else {
          setView((data?.invites?.length || data?.joinRequests?.length) ? 'manage' : 'chooser');
        }
      } catch {
        if (active) {
          setTeamContext(null);
          setView('chooser');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadTeam();
    const interval = window.setInterval(loadTeam, 15000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [open, session.email]);

  useEffect(() => {
    if (!open) return undefined;
    function syncTeam() {
      fetchMyTeam(session.email, session.email)
        .then(data => {
          setTeamContext(data);
          if (!data?.team) {
            setView((data?.invites?.length || data?.joinRequests?.length) ? 'manage' : 'chooser');
          } else {
            setView('manage');
          }
        })
        .catch(() => {});
    }

    window.addEventListener('samagama-teams-updated', syncTeam);
    window.addEventListener('storage', syncTeam);
    return () => {
      window.removeEventListener('samagama-teams-updated', syncTeam);
      window.removeEventListener('storage', syncTeam);
    };
  }, [open, session.email]);

  const team = teamContext?.team || null;
  const role = teamContext?.role || null;
  const joinRequests = teamContext?.joinRequests || [];
  const invites = teamContext?.invites || [];
  const members = team?.members || [];
  const pendingInvites = useMemo(() => invites.filter(item => item.status === 'pending'), [invites]);
  const acceptedInvites = useMemo(() => invites.filter(item => item.status === 'accepted'), [invites]);
  const myJoinRequests = useMemo(() => joinRequests.filter(item => item.studentId === session.email || item.studentEmail === session.email), [joinRequests, session.email]);

  function flash(text) {
    setMessage(text);
    window.setTimeout(() => setMessage(''), 2400);
  }

  function dispatchRefresh() {
    window.dispatchEvent(new Event('samagama-teams-updated'));
    window.dispatchEvent(new Event('samagama-journey-updated'));
  }

  function updateCreateMember(index, field, value) {
    setCreateForm(prev => ({
      ...prev,
      members: prev.members.map((row, rowIndex) => (
        rowIndex === index ? { ...row, [field]: value } : row
      )),
    }));
  }

  function addCreateMemberRow() {
    setCreateForm(prev => ({ ...prev, members: [...prev.members, { name: '', email: '' }] }));
  }

  function removeCreateMemberRow(index) {
    setCreateForm(prev => ({
      ...prev,
      members: prev.members.filter((_, rowIndex) => rowIndex !== index).length
        ? prev.members.filter((_, rowIndex) => rowIndex !== index)
        : defaultMembers(),
    }));
  }

  async function handleCreateTeam(event) {
    event.preventDefault();
    if (!session.email || !createForm.name.trim() || !createForm.description.trim() || !createForm.domain.trim()) return;
    setBusy(true);
    try {
      const payload = {
        studentId: session.email,
        studentName: session.displayName,
        studentEmail: session.email,
        name: createForm.name.trim(),
        description: createForm.description.trim(),
        domain: createForm.domain.trim(),
        maxMembers: Number(createForm.maxMembers || 10),
        members: createForm.members.filter(row => row.email?.trim() || row.name?.trim()),
      };
      const response = await createTeam(payload);
      if (response?.error) throw new Error(response.error);
      submitJourneyTeam({
        team: response,
        role: 'leader',
        members: response.members || [],
        status: response.status,
        note: 'Project team created and invitations sent.',
        spDelta: 10,
      });
      createAnnouncement({
        title: `Team created: ${response.name}`,
        message: `Your project team "${response.name}" is ready. Invitations were sent to the added teammates.`,
        category: 'Announcement',
        priority: 'Medium',
        pinned: false,
        postedBy: session.displayName,
      });
      dispatchRefresh();
      setTeamContext({ team: response, role: 'leader', invites: response.invites || [], joinRequests: response.joinRequests || [], journeyReady: true });
      setView('manage');
      flash('Team created successfully.');
    } catch (error) {
      flash(error?.message || 'Unable to create team right now.');
    } finally {
      setBusy(false);
    }
  }

  async function handleJoinRequest(event) {
    event.preventDefault();
    if (!leaderEmail.trim()) return;
    setBusy(true);
    try {
      const response = await requestJoinTeam({
        studentId: session.email,
        studentName: session.displayName,
        studentEmail: session.email,
        leaderEmail: leaderEmail.trim(),
        note: joinNote.trim(),
      });
      if (response?.error) throw new Error(response.error);
      setTeamContext({ team: response.team, role: 'applicant', invites: [], joinRequests: [], journeyReady: false });
      setView('manage');
      createAnnouncement({
        title: 'Join request sent',
        message: `You requested to join the team led by ${leaderEmail.trim()}.`,
        category: 'Announcement',
        priority: 'Low',
        pinned: false,
        postedBy: session.displayName,
      });
      dispatchRefresh();
      flash('Join request sent to the team lead.');
    } catch (error) {
      flash(error?.message || 'Unable to send join request.');
    } finally {
      setBusy(false);
    }
  }

  async function handleJoinRequestResponse(requestId, action) {
    setBusy(true);
    try {
      const response = await respondJoinRequest(requestId, action);
      if (response?.error) throw new Error(response.error);
      setTeamContext(prev => ({
        ...prev,
        team: response.team,
        joinRequests: (prev?.joinRequests || []).map(item => (
          item._id === requestId ? { ...item, status: action === 'accept' ? 'accepted' : 'rejected' } : item
        )),
      }));
      dispatchRefresh();
      createAnnouncement({
        title: action === 'accept' ? 'Join request approved' : 'Join request rejected',
        message: action === 'accept'
          ? 'A student request to join your team has been approved.'
          : 'A student request to join your team has been rejected.',
        category: 'Announcement',
        priority: action === 'accept' ? 'Low' : 'Medium',
        pinned: false,
        postedBy: session.displayName,
      });
      flash(action === 'accept' ? 'Join request accepted.' : 'Join request rejected.');
    } catch (error) {
      flash(error?.message || 'Unable to update join request.');
    } finally {
      setBusy(false);
    }
  }

  async function handleInviteResponse(inviteId, action) {
    setBusy(true);
    try {
      const invite = invites.find(item => item._id === inviteId);
      const response = await respondTeamInvite(inviteId, action);
      if (response?.error) throw new Error(response.error);
      setTeamContext(prev => ({
        ...prev,
        team: response.team,
        invites: (prev?.invites || []).map(item => (
          item._id === inviteId ? { ...item, status: action === 'accept' ? 'accepted' : 'rejected' } : item
        )),
      }));
      if (action === 'accept') {
        submitJourneyTeam({
          team: response.team,
          role: 'member',
          members: response.team?.members || [],
          status: response.team?.status,
          note: 'You joined the project team successfully.',
          spDelta: 10,
        });
        createAnnouncement({
          title: 'Team invitation accepted',
          message: `You accepted the project team invitation from ${invite?.senderName || 'your lead'}.`,
          category: 'Announcement',
          priority: 'Low',
          pinned: false,
          postedBy: session.displayName,
        });
      } else {
        createAnnouncement({
          title: 'Team invitation declined',
          message: `You declined the project team invitation from ${invite?.senderName || 'your lead'}.`,
          category: 'Announcement',
          priority: 'Low',
          pinned: false,
          postedBy: session.displayName,
        });
      }
      dispatchRefresh();
      flash(action === 'accept' ? 'Invitation accepted.' : 'Invitation declined.');
    } catch (error) {
      flash(error?.message || 'Unable to respond to invitation.');
    } finally {
      setBusy(false);
    }
  }

  const hasAnyTeamFlow = Boolean(team || pendingInvites.length || acceptedInvites.length || joinRequests.length || role);

  if (!open || !mission) return null;

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <div>
            <div style={styles.kicker}>Internship Journey</div>
            <h2 style={styles.title}>Form Your Project Team</h2>
            <p style={styles.subtitle}>
              Choose whether you want to lead a team or join one. Team creation, join requests, invitations, and approvals are connected to the mission flow.
            </p>
          </div>
          <div style={styles.headerRight}>
            <span style={styles.badge}>{team?.status || 'draft'}</span>
            <button type="button" onClick={onClose} style={styles.closeBtn}>✕</button>
          </div>
        </div>

        <div style={styles.topStats}>
          <StatChip label="Student" value={session.displayName || 'Student'} tone="blue" />
          <StatChip label="Team Status" value={team?.status || 'Not started'} tone={team?.status === 'active' ? 'green' : team?.status === 'rejected' ? 'red' : 'amber'} />
          <StatChip label="Mission" value={mission.title} tone="neutral" />
          <StatChip label="Team Members" value={team ? String(team.memberCount || 1) : '0'} tone="neutral" />
        </div>

        {!loading && !hasAnyTeamFlow && view === 'chooser' && (
          <div style={styles.chooserGrid}>
            <button type="button" style={styles.choiceCard} onClick={() => setView('lead')}>
              <div style={styles.choiceIcon}>👑</div>
              <div style={styles.choiceTitle}>Yes, I’ll lead</div>
              <div style={styles.choiceText}>Create a team, add members, and invite teammates from the project workflow.</div>
            </button>
            <button type="button" style={styles.choiceCard} onClick={() => setView('join')}>
              <div style={styles.choiceIcon}>🤝</div>
              <div style={styles.choiceTitle}>No, I’ll join a team</div>
              <div style={styles.choiceText}>Send a join request to a team lead and wait for approval.</div>
            </button>
          </div>
        )}

        <div style={styles.content}>
          <div style={styles.leftCol}>
            {loading && (
              <div style={styles.panel}>
                <div style={styles.panelTitle}>Loading team workflow...</div>
                <div style={styles.helper}>Checking your current team status and invitations.</div>
              </div>
            )}

            {!loading && view === 'lead' && (
              <form style={styles.panel} onSubmit={handleCreateTeam}>
                <div style={styles.panelTitle}>Team leader flow</div>
                <div style={styles.helper}>Leader details are auto-filled. Add teammates, invite them, and submit your team.</div>

                <div style={styles.readOnlyCard}>
                  <div style={styles.readOnlyGrid}>
                    <div>
                      <span style={styles.label}>Leader name</span>
                      <strong style={styles.value}>{session.displayName}</strong>
                    </div>
                    <div>
                      <span style={styles.label}>Leader email</span>
                      <strong style={styles.value}>{session.email || 'Not available'}</strong>
                    </div>
                  </div>
                </div>

                <div style={styles.formGrid}>
                  <label style={styles.field}>
                    <span>Team Name</span>
                    <input value={createForm.name} onChange={e => setCreateForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Team Nova" />
                  </label>
                  <label style={styles.field}>
                    <span>Domain / Tech Stack</span>
                    <input value={createForm.domain} onChange={e => setCreateForm(prev => ({ ...prev, domain: e.target.value }))} placeholder="MERN, AI/ML, Figma" />
                  </label>
                </div>

                <label style={styles.field}>
                  <span>Team Description</span>
                  <textarea
                    rows="4"
                    value={createForm.description}
                    onChange={e => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Short description of your team and project goals."
                  />
                </label>

                <div style={styles.subSectionHeader}>
                  <span>Member Name + Email rows</span>
                  <button type="button" style={styles.inlineBtn} onClick={addCreateMemberRow}>+ Add Row</button>
                </div>

                <div style={styles.rowsWrap}>
                  {createForm.members.map((row, index) => (
                    <div key={`${index}-${row.email}`} style={styles.memberRow}>
                      <input
                        value={row.name}
                        onChange={e => updateCreateMember(index, 'name', e.target.value)}
                        placeholder="Member name"
                      />
                      <input
                        value={row.email}
                        onChange={e => updateCreateMember(index, 'email', e.target.value)}
                        placeholder="Member email"
                      />
                      <button type="button" style={styles.removeBtn} onClick={() => removeCreateMemberRow(index)}>Remove</button>
                    </div>
                  ))}
                </div>

                <label style={styles.field}>
                  <span>Max members</span>
                  <input
                    type="number"
                    min="2"
                    max="20"
                    value={createForm.maxMembers}
                    onChange={e => setCreateForm(prev => ({ ...prev, maxMembers: e.target.value }))}
                    placeholder="10"
                  />
                </label>

                <div style={styles.actionsRow}>
                  <button type="submit" disabled={busy} style={styles.primaryBtn}>
                    {busy ? 'Creating...' : 'Submit Team'}
                  </button>
                  <button type="button" style={styles.secondaryBtn} onClick={() => setView('chooser')}>
                    Back
                  </button>
                </div>
              </form>
            )}

            {!loading && view === 'join' && (
              <form style={styles.panel} onSubmit={handleJoinRequest}>
                <div style={styles.panelTitle}>Join team flow</div>
                <div style={styles.helper}>Send a request to the team lead and wait for an Accept or Reject response.</div>

                <div style={styles.readOnlyCard}>
                  <div style={styles.readOnlyGrid}>
                    <div>
                      <span style={styles.label}>Your name</span>
                      <strong style={styles.value}>{session.displayName}</strong>
                    </div>
                    <div>
                      <span style={styles.label}>Your email</span>
                      <strong style={styles.value}>{session.email || 'Not available'}</strong>
                    </div>
                  </div>
                </div>

                <label style={styles.field}>
                  <span>Team Lead Email</span>
                  <input
                    value={leaderEmail}
                    onChange={e => setLeaderEmail(e.target.value)}
                    placeholder="team-lead@college.edu"
                  />
                </label>

                <label style={styles.field}>
                  <span>Request note (optional)</span>
                  <textarea
                    rows="3"
                    value={joinNote}
                    onChange={e => setJoinNote(e.target.value)}
                    placeholder="Why would you like to join this team?"
                  />
                </label>

                <div style={styles.actionsRow}>
                  <button type="submit" disabled={busy} style={styles.primaryBtn}>
                    {busy ? 'Sending...' : 'Request to Join'}
                  </button>
                  <button type="button" style={styles.secondaryBtn} onClick={() => setView('chooser')}>
                    Back
                  </button>
                </div>
              </form>
            )}

            {!loading && view === 'manage' && (
              <div style={{ display: 'grid', gap: 16 }}>
                {team ? (
                  <div style={styles.panel}>
                    <div style={styles.panelTitle}>{team.name}</div>
                    <div style={styles.helper}>{team.description}</div>
                    <div style={styles.metaRow}>
                      <StatChip label="Domain" value={team.domain || '—'} tone="neutral" />
                      <StatChip label="Created" value={formatDateTime(team.createdAt)} tone="neutral" />
                    </div>
                    <div style={styles.memberSummary}>
                      <div style={styles.summaryCard}>
                        <span>Leader</span>
                        <strong>{team.leaderName}</strong>
                      </div>
                      <div style={styles.summaryCard}>
                        <span>Accepted members</span>
                        <strong>{team.memberCount}</strong>
                      </div>
                      <div style={styles.summaryCard}>
                        <span>Pending invites</span>
                        <strong>{team.pendingInviteCount}</strong>
                      </div>
                      <div style={styles.summaryCard}>
                        <span>Join requests</span>
                        <strong>{joinRequests.length}</strong>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={styles.panel}>
                    <div style={styles.panelTitle}>No team created yet</div>
                    <div style={styles.helper}>You can create a team, request to join, or wait for an invite.</div>
                  </div>
                )}

                {team?.members?.length ? (
                  <div style={styles.panel}>
                    <div style={styles.panelTitle}>Team members</div>
                    <div style={styles.stack}>
                      {team.members.map(member => (
                        <div key={member._id} style={styles.personRow}>
                          <div>
                            <div style={styles.personName}>{member.studentName || member.studentId}</div>
                            <div style={styles.personMeta}>{member.studentEmail || member.studentId}</div>
                          </div>
                          <div style={styles.personStatus}>{member.role === 'leader' ? 'Leader' : member.status}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {role === 'leader' && (
                  <div style={styles.panel}>
                    <div style={styles.panelTitle}>Join requests</div>
                    <div style={styles.stack}>
                      {joinRequests.length === 0 && <div style={styles.helper}>No join requests yet.</div>}
                      {joinRequests.map(request => (
                        <div key={request._id} style={styles.requestCard}>
                          <div>
                            <div style={styles.personName}>{request.studentName}</div>
                            <div style={styles.personMeta}>{request.studentEmail}</div>
                            {request.note && <div style={{ ...styles.personMeta, marginTop: 6 }}>{request.note}</div>}
                            <div style={{ ...styles.personMeta, marginTop: 6 }}>Requested {formatDateTime(request.createdAt)}</div>
                          </div>
                          <div style={styles.requestActions}>
                            <button type="button" disabled={busy} style={styles.acceptBtn} onClick={() => handleJoinRequestResponse(request._id, 'accept')}>
                              Accept
                            </button>
                            <button type="button" disabled={busy} style={styles.rejectBtn} onClick={() => handleJoinRequestResponse(request._id, 'reject')}>
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {pendingInvites.length > 0 && (
                  <div style={styles.panel}>
                    <div style={styles.panelTitle}>Invitations</div>
                    <div style={styles.stack}>
                      {pendingInvites.map(invite => (
                        <div key={invite._id} style={styles.requestCard}>
                          <div>
                            <div style={styles.personName}>{invite.senderName || 'Project lead'}</div>
                            <div style={styles.personMeta}>{invite.receiverEmail}</div>
                            <div style={{ ...styles.personMeta, marginTop: 6 }}>Invited {formatDateTime(invite.createdAt)}</div>
                          </div>
                          <div style={styles.requestActions}>
                            <button type="button" disabled={busy} style={styles.acceptBtn} onClick={() => handleInviteResponse(invite._id, 'accept')}>
                              Accept
                            </button>
                            <button type="button" disabled={busy} style={styles.rejectBtn} onClick={() => handleInviteResponse(invite._id, 'reject')}>
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {acceptedInvites.length > 0 && (
                  <div style={styles.panel}>
                    <div style={styles.panelTitle}>Accepted invitations</div>
                    <div style={styles.stack}>
                      {acceptedInvites.map(invite => (
                        <div key={invite._id} style={styles.personRow}>
                          <div>
                            <div style={styles.personName}>{invite.senderName || 'Project lead'}</div>
                            <div style={styles.personMeta}>{invite.receiverEmail}</div>
                          </div>
                          <div style={styles.personStatus}>Accepted</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {teamContext?.journeyReady && (
                  <div style={styles.panel}>
                    <div style={styles.panelTitle}>Mission progression</div>
                    <div style={styles.helper}>Your project team is synced with the internship journey and milestone 9 is ready to show as complete.</div>
                  </div>
                )}

                {(role === 'applicant' || (!team && myJoinRequests.length > 0)) && (
                  <div style={styles.panel}>
                    <div style={styles.panelTitle}>Join request pending</div>
                    <div style={styles.helper}>Your request has been sent to the team lead. You’ll be notified when it is accepted or rejected.</div>
                  </div>
                )}

                {teamContext?.team && role !== 'leader' && !pendingInvites.length && role !== 'applicant' && (
                  <div style={styles.panel}>
                    <div style={styles.panelTitle}>Team request status</div>
                    <div style={styles.helper}>If your request was rejected, you can try another team using the join flow.</div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={styles.rightCol}>
            <div style={styles.panel}>
              <div style={styles.panelTitle}>Workflow guide</div>
              <div style={styles.stack}>
                <div style={styles.guideStep}><strong>1.</strong> Choose lead or join.</div>
                <div style={styles.guideStep}><strong>2.</strong> Leaders create the team and add member rows.</div>
                <div style={styles.guideStep}><strong>3.</strong> Invites and join requests stay visible here.</div>
                <div style={styles.guideStep}><strong>4.</strong> Accepted members update the journey automatically.</div>
              </div>
            </div>

            <div style={styles.panel}>
              <div style={styles.panelTitle}>Current notifications</div>
              <div style={styles.stack}>
                <div style={styles.helper}>Team creation, join requests, acceptances, and rejections appear here as you work through the flow.</div>
                {message && <div style={styles.toast}>{message}</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 270,
    background: 'rgba(2,8,23,0.76)',
    backdropFilter: 'blur(12px)',
    display: 'grid',
    placeItems: 'center',
    padding: 18,
  },
  modal: {
    width: 'min(1280px, 100%)',
    maxHeight: '92vh',
    overflow: 'auto',
    borderRadius: 28,
    border: '1px solid rgba(148,163,184,0.16)',
    background: 'linear-gradient(180deg, rgba(8,12,28,0.98), rgba(3,7,18,0.98))',
    boxShadow: '0 32px 90px rgba(0,0,0,0.58)',
    padding: 24,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 18,
    alignItems: 'flex-start',
  },
  kicker: {
    fontSize: 11,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.14em',
    fontWeight: 800,
    marginBottom: 8,
  },
  title: {
    margin: 0,
    color: '#f8fafc',
    fontSize: 30,
    fontWeight: 800,
    letterSpacing: '-0.04em',
  },
  subtitle: {
    margin: '10px 0 0',
    color: '#94a3b8',
    lineHeight: 1.6,
    maxWidth: 760,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  badge: {
    padding: '8px 12px',
    borderRadius: 999,
    background: 'rgba(124,111,247,0.16)',
    border: '1px solid rgba(124,111,247,0.24)',
    color: '#ddd6fe',
    fontSize: 12,
    fontWeight: 800,
    textTransform: 'capitalize',
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
  topStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 12,
    marginTop: 18,
    marginBottom: 18,
  },
  chooserGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 14,
    marginBottom: 16,
  },
  choiceCard: {
    textAlign: 'left',
    borderRadius: 22,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'linear-gradient(135deg, rgba(124,111,247,0.14), rgba(56,189,248,0.08))',
    padding: 20,
    color: '#fff',
  },
  choiceIcon: {
    fontSize: 28,
    marginBottom: 10,
  },
  choiceTitle: {
    fontSize: 18,
    fontWeight: 800,
    marginBottom: 8,
  },
  choiceText: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 1.6,
  },
  content: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: 16,
  },
  leftCol: {
    display: 'grid',
    gap: 16,
  },
  rightCol: {
    display: 'grid',
    gap: 16,
  },
  panel: {
    padding: 18,
    borderRadius: 22,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  panelTitle: {
    fontSize: 15,
    fontWeight: 800,
    color: '#f8fafc',
    marginBottom: 10,
    letterSpacing: '-0.01em',
  },
  helper: {
    color: '#94a3b8',
    lineHeight: 1.6,
    fontSize: 13,
  },
  readOnlyCard: {
    marginTop: 16,
    padding: 14,
    borderRadius: 18,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  readOnlyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 12,
  },
  label: {
    display: 'block',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#94a3b8',
    marginBottom: 6,
    fontWeight: 700,
  },
  value: {
    color: '#f8fafc',
    fontSize: 14,
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 12,
  },
  field: {
    display: 'grid',
    gap: 8,
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: 700,
    marginTop: 16,
  },
  subSectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: 800,
  },
  inlineBtn: {
    border: '1px solid rgba(124,111,247,0.2)',
    background: 'rgba(124,111,247,0.12)',
    color: '#e9d5ff',
    borderRadius: 999,
    padding: '8px 12px',
    fontSize: 12,
    fontWeight: 800,
  },
  rowsWrap: {
    display: 'grid',
    gap: 10,
    marginTop: 12,
  },
  memberRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 10,
    alignItems: 'center',
  },
  removeBtn: {
    border: '1px solid rgba(239,68,68,0.2)',
    background: 'rgba(239,68,68,0.12)',
    color: '#fecaca',
    borderRadius: 12,
    padding: '11px 12px',
    fontWeight: 800,
  },
  actionsRow: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
    marginTop: 18,
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
  metaRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 12,
    marginTop: 12,
  },
  memberSummary: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
    gap: 10,
    marginTop: 16,
  },
  summaryCard: {
    padding: 14,
    borderRadius: 16,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    display: 'grid',
    gap: 6,
    color: '#cbd5e1',
  },
  stack: {
    display: 'grid',
    gap: 10,
  },
  personRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  personName: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: 800,
  },
  personMeta: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
  },
  personStatus: {
    color: '#c4b5fd',
    fontWeight: 800,
    fontSize: 12,
    textTransform: 'capitalize',
  },
  requestCard: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  requestActions: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
  },
  acceptBtn: {
    border: '1px solid rgba(34,197,94,0.24)',
    background: 'rgba(34,197,94,0.12)',
    color: '#bbf7d0',
    borderRadius: 12,
    padding: '10px 14px',
    fontWeight: 800,
  },
  rejectBtn: {
    border: '1px solid rgba(239,68,68,0.22)',
    background: 'rgba(239,68,68,0.12)',
    color: '#fecaca',
    borderRadius: 12,
    padding: '10px 14px',
    fontWeight: 800,
  },
  guideStep: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 1.6,
  },
  toast: {
    padding: '12px 14px',
    borderRadius: 14,
    background: 'rgba(10,15,40,0.96)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: 700,
    boxShadow: '0 18px 42px rgba(0,0,0,0.34)',
  },
};

export default TeamWorkflowModal;
