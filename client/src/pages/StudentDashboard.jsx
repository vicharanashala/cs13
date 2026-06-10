import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../authContext';
import { fetchAnnouncements, fetchMyTasks, fetchAnnouncementReadState, fetchMyTeam, markAnnouncementRead as persistAnnouncementRead, submitTask } from '../api';
import {
  getAnnouncementDeadlineInfo,
  getAnnouncementsForAudience,
  getAnnouncements,
  getAnnouncementCategoryIcon,
  isAnnouncementActive,
  formatAnnouncementTime,
} from '../announcements';
import JourneyDetailModal from './JourneyDetailModal';
import {
  formatTaskDate,
  getInternshipTasks,
  getTaskDeadlineInfo,
  getTaskStatus,
  getTaskSummary,
  markInternshipTaskCompleted,
  selectInternshipTaskSlot,
} from '../internshipTasks';
import {
  ensureJourneyReminders,
  getJourneyMilestone,
  getJourneyMilestones,
  getJourneyProgress,
  getJourneyState,
  submitJourneyTeam,
} from '../internshipJourney';
import StudentProfileModal from '../components/StudentProfileModal';

const getTargetBadgeStyle = (targetAudience) => {
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
    fontSize: '11px',
    fontWeight: 'bold',
    background: bg,
    border: border,
    color: color,
  };
};

const getTargetBadgeLabel = (targetAudience) => {
  const t = String(targetAudience || '').toLowerCase();
  if (t.includes('bronze')) return 'Bronze';
  if (t.includes('silver')) return 'Silver';
  if (t.includes('gold')) return 'Gold';
  return 'All';
};

const getTimeAgo = (dateTime) => {
  if (!dateTime) return '';
  const now = new Date();
  const past = new Date(dateTime);
  const diffMs = now.getTime() - past.getTime();
  if (diffMs < 0) return 'Just now';
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
};

const newBadgeStyle = {
  padding: '4px 10px',
  borderRadius: 12,
  fontSize: '11px',
  fontWeight: 'bold',
  background: 'rgba(59, 130, 246, 0.15)',
  border: '1px solid rgba(59, 130, 246, 0.3)',
  color: '#60a5fa',
};

/* ── Shared glass helpers ──────────────────────────────────────────────── */
const GLASS = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.09)',
  radius: 20,
  backdrop: 'blur(16px)',
};

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
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        <span style={{ marginRight: 6 }}>{icon}</span>{label}
      </h3>
      {action}
    </div>
  );
}

function ProgressBar({ value, max = 100, color = '#7c6ff7' }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 999, transition: 'width 0.6s ease' }} />
    </div>
  );
}

/* ── Card: Galaxy Mission Map ──────────────────────────────────────────── */
function buildSmoothPath(points) {
  if (!points.length) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const c1x = p1.x + ((p2.x - p0.x) / 6);
    const c1y = p1.y + ((p2.y - p0.y) / 6);
    const c2x = p2.x - ((p3.x - p1.x) / 6);
    const c2y = p2.y - ((p3.y - p1.y) / 6);

    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }

  return d;
}

/* ── Card: Galaxy Mission Map ──────────────────────────────────────────── */
function MissionMap() {
  const [journeyVersion, setJourneyVersion] = useState(0);
  const [hoveredMission, setHoveredMission] = useState(null);
  const [selectedMissionId, setSelectedMissionId] = useState(null);
  const [toast, setToast] = useState('');
  const toastTimerRef = useRef(null);

  useEffect(() => {
    ensureJourneyReminders();

    function syncJourney() {
      setJourneyVersion(v => v + 1);
    }

    window.addEventListener('samagama-journey-updated', syncJourney);
    return () => window.removeEventListener('samagama-journey-updated', syncJourney);
  }, []);

  const missions = useMemo(() => getJourneyMilestones().map(item => ({
    id: item.id,
    title: item.title,
    desc: item.desc,
    status: item.status,
    data: item.data,
    relatedRoute: item.relatedRoute,
  })), [journeyVersion]);
  const journeyProgress = useMemo(() => getJourneyProgress({ milestones: getJourneyMilestones().reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {}) }), [journeyVersion]);

  const pointPositions = useMemo(() => ([
    { x: 60, y: 280 },
    { x: 190, y: 220 },
    { x: 320, y: 150 },
    { x: 450, y: 220 },
    { x: 580, y: 150 },
    { x: 710, y: 220 },
    { x: 840, y: 280 },
    { x: 970, y: 220 },
    { x: 1100, y: 150 },
    { x: 1230, y: 220 },
    { x: 1360, y: 150 },
  ]), []);

  const stars = useMemo(() => Array.from({ length: 200 }, (_, index) => ({
    id: index,
    left: `${Math.round(Math.random() * 10000) / 100}%`,
    top: `${Math.round(Math.random() * 10000) / 100}%`,
    size: 1 + Math.round(Math.random() * 2),
    opacity: 0.2 + Math.random() * 0.8,
    duration: 1.8 + Math.random() * 3.8,
    delay: Math.random() * 3.5,
    tint: Math.random() > 0.72 ? (Math.random() > 0.5 ? '#93c5fd' : '#c4b5fd') : '#ffffff',
  })), []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  const completedCount = journeyProgress.completed;
  const pathD = "M 60,280 C 125,280 125,220 190,220 C 255,220 255,150 320,150 C 385,150 385,220 450,220 C 515,220 515,150 580,150 C 645,150 645,220 710,220 C 775,220 775,280 840,280 C 905,280 905,220 970,220 C 1035,220 1035,150 1100,150 C 1165,150 1165,220 1230,220 C 1295,220 1295,150 1360,150";
  const shipStart = pointPositions[5];
  const shipEnd = pointPositions[6];
  const shipX = (shipStart.x + shipEnd.x) / 2;
  const shipY = (shipStart.y + shipEnd.y) / 2;
  const shipAngle = Math.atan2(shipEnd.y - shipStart.y, shipEnd.x - shipStart.x) * 180 / Math.PI;

  function handleLockedClick() {
    setToast('Complete previous steps to unlock this mission');
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(''), 2000);
  }

  function handleMissionClick(mission) {
    if (mission.status === 'locked') {
      handleLockedClick();
      return;
    }

    setSelectedMissionId(mission.id);
  }

  function getMissionStatusLabel(mission) {
    if (mission.id === 4) {
      if (mission.data?.approvalStatus === 'Approved' || mission.status === 'completed') return 'Approved';
      if (mission.data?.approvalStatus === 'Rejected') return 'Rejected';
      if (mission.status === 'pending_review') return 'Pending Approval';
      return mission.status === 'active' ? 'Select Dates' : 'Locked';
    }

    if (mission.id === 5) {
      if (mission.data?.approvalStatus === 'Approved' || mission.status === 'completed') return 'Approved';
      if (mission.data?.approvalStatus === 'Rejected') return 'Rejected';
      if (mission.status === 'pending_review') return 'Pending';
      return mission.status === 'active' ? 'Pending Upload' : 'Locked';
    }

    if (mission.id === 10) {
      if (mission.data?.approvalStatus === 'Approved' || mission.status === 'completed') return 'Approved';
      if (mission.data?.approvalStatus === 'Rejected') return 'Rejected';
      if (mission.status === 'pending_review') return 'Submitted';
      return mission.status === 'active' ? 'Pending Submission' : 'Locked';
    }

    if (mission.status === 'completed') return 'Done';
    if (mission.status === 'active') return 'Active';
    if (mission.status === 'pending_review') return 'Review';
    return 'Locked';
  }

  function getTooltipAction(mission) {
    if (mission.id === 4) {
      if (mission.data?.approvalStatus === 'Approved' || mission.status === 'completed') return 'Click to revisit →';
      if (mission.data?.approvalStatus === 'Rejected') return 'Click to update dates →';
      if (mission.status === 'pending_review') return 'Waiting for admin approval →';
      return 'Click to confirm dates →';
    }

    if (mission.id === 5) {
      if (mission.data?.approvalStatus === 'Rejected') return 'Click to re-upload →';
      if (mission.status === 'pending_review') return 'Waiting for admin review →';
      if (mission.status === 'completed' || mission.data?.approvalStatus === 'Approved') return 'Click to revisit →';
      return 'Click to upload NOC →';
    }

    if (mission.id === 10) {
      if (mission.data?.approvalStatus === 'Approved' || mission.status === 'completed') return 'Click to revisit →';
      if (mission.data?.approvalStatus === 'Rejected') return 'Click to update review →';
      if (mission.status === 'pending_review') return 'Waiting for mentor review →';
      return 'Click to submit weekly review →';
    }

    if (mission.status === 'completed') return 'Click to revisit →';
    if (mission.status === 'active') return 'Click to continue →';
    if (mission.status === 'pending_review') return 'Waiting for admin review →';
    return '🔒 Complete previous steps first';
  }

  function getBadgeStyle(mission) {
    if (mission.id === 4 || mission.id === 5 || mission.id === 10) {
      if (mission.data?.approvalStatus === 'Rejected') return missionStyles.badgeLocked;
      if (mission.data?.approvalStatus === 'Approved' || mission.status === 'completed') return missionStyles.badgeDone;
      return mission.status === 'pending_review' ? missionStyles.badgeActive : missionStyles.badgeActive;
    }
    if (mission.status === 'completed') return missionStyles.badgeDone;
    if (mission.status === 'active' || mission.status === 'pending_review') return missionStyles.badgeActive;
    return missionStyles.badgeLocked;
  }

  return (
    <section style={missionStyles.board}>
      <div style={missionStyles.header}>
        <SectionTitle icon="🗺️" label="Galaxy Mission Map" />
        <div style={missionStyles.progressCount}>{completedCount} / {missions.length} COMPLETE</div>
      </div>

      <div style={missionStyles.canvas}>
        <div style={missionStyles.nebulaPurple} />
        <div style={missionStyles.nebulaTeal} />

        <div style={missionStyles.starDrift}>
          {stars.map(star => (
            <span
              key={star.id}
              style={{
                ...missionStyles.star,
                left: star.left,
                top: star.top,
                width: star.size,
                height: star.size,
                opacity: star.opacity,
                background: star.tint,
                animation: `twinkle ${star.duration}s ease-in-out infinite ${star.delay}s`,
              }}
            />
          ))}
        </div>

        <div style={{ overflow: 'hidden', width: '100%', position: 'relative' }}>
          <div style={{ position: 'relative', width: '100%', height: '300px' }}>
            <svg viewBox="0 0 1400 380" preserveAspectRatio="xMidYMid meet" style={missionStyles.svg} width="100%" height="100%" aria-hidden="true">
              <defs>
                <linearGradient id="missionPathGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#38bdf6" stopOpacity="0.35" />
                  <stop offset="50%" stopColor="#60a5fa" stopOpacity="1" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.45" />
                </linearGradient>
                <filter id="missionPathBlur">
                  <feGaussianBlur stdDeviation="2.5" />
                </filter>
              </defs>
              <path d={pathD} style={missionStyles.pathGlow} />
              <path d={pathD} style={missionStyles.pathLine} />
            </svg>

            <div
              style={{
                ...missionStyles.ship,
                left: `${shipX / 14}%`,
                top: `${shipY / 3.8}%`,
                transform: `translate(-50%, -50%) rotate(${shipAngle + 90}deg)`,
              }}
              aria-hidden="true"
            >
              🚀
            </div>

            {missions.map((mission, index) => {
              const point = pointPositions[index];
              const isDone = mission.status === 'completed';
              const isActive = mission.status === 'active' || mission.status === 'pending_review';
              const isLocked = mission.status === 'locked';
              const size = isActive ? 52 : 44;
              
              let labelAbove = false;
              if (point.y <= 180) {
                labelAbove = false;
              } else if (point.y >= 250) {
                labelAbove = true;
              } else {
                labelAbove = ((index - 1) / 2) % 2 === 0;
              }

              const tooltipBelow = labelAbove;

              const labelStyle = labelAbove ? {
                ...missionStyles.labelWrap,
                position: 'absolute',
                bottom: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                marginBottom: '8px',
                pointerEvents: 'none',
              } : {
                ...missionStyles.labelWrap,
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                marginTop: '8px',
                pointerEvents: 'none',
              };

              const tooltipStyle = {
                ...missionStyles.tooltip,
                left: '50%',
                ...(tooltipBelow ? {
                  top: '100%',
                  bottom: 'auto',
                  transform: 'translate(-50%, 12px)',
                } : {
                  bottom: '100%',
                  top: 'auto',
                  transform: 'translate(-50%, -12px)',
                }),
              };

              return (
                <button
                  key={mission.id}
                  type="button"
                  aria-label={mission.title}
                  onClick={() => handleMissionClick(mission)}
                  onMouseEnter={() => setHoveredMission(mission.id)}
                  onMouseLeave={() => setHoveredMission(null)}
                  style={{
                    ...missionStyles.node,
                    left: `${point.x / 14}%`,
                    top: `${point.y / 3.8}%`,
                    width: size,
                    height: size,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isDone && <span style={{ ...missionStyles.glow, ...missionStyles.glowDone, width: size * 2.1, height: size * 2.1 }} />}
                  {isActive && <span style={{ ...missionStyles.glow, ...missionStyles.glowActive, width: size * 2.5, height: size * 2.5 }} />}

                  <div
                    style={{
                      ...missionStyles.planet,
                      width: size,
                      height: size,
                      ...(isDone ? missionStyles.planetDone : {}),
                      ...(isActive ? missionStyles.planetActive : {}),
                      ...(isLocked ? missionStyles.planetLocked : {}),
                    }}
                  >
                    <span
                      style={{
                        ...missionStyles.orbit,
                        ...(isDone ? missionStyles.orbitDone : {}),
                        ...(isActive ? missionStyles.orbitActiveOne : {}),
                        ...(isLocked ? missionStyles.orbitLocked : {}),
                        width: size * 1.95,
                        height: size * 0.72,
                        marginLeft: -(size * 0.975),
                        marginTop: -(size * 0.36),
                        animation: isDone
                          ? 'orbit 6s linear infinite'
                          : isActive
                            ? 'orbit 6s linear infinite'
                            : 'none',
                      }}
                    />
                    {isActive && (
                      <span
                        style={{
                          ...missionStyles.orbit,
                          ...missionStyles.orbitActiveTwo,
                          width: size * 2.35,
                          height: size * 0.88,
                          marginLeft: -(size * 1.175),
                          marginTop: -(size * 0.44),
                          animation: 'orbit 9s linear infinite reverse',
                        }}
                      />
                    )}
                    {isActive && <span style={missionStyles.pulseRing} />}
                    <span style={missionStyles.planetIcon}>
                      {isDone ? '✓' : isActive ? '◆' : '🔒'}
                    </span>
                  </div>

                  <div style={labelStyle}>
                    <strong
                      style={{
                        ...missionStyles.labelTitle,
                        ...(isDone ? missionStyles.labelDone : {}),
                        ...(isActive ? missionStyles.labelActive : {}),
                        ...(isLocked ? missionStyles.labelLocked : {}),
                      }}
                    >
                      {mission.title}
                    </strong>
                    <span
                      style={{
                        ...missionStyles.labelDesc,
                        ...(isDone ? missionStyles.labelDone : {}),
                        ...(isActive ? missionStyles.labelActive : {}),
                        ...(isLocked ? missionStyles.labelLocked : {}),
                      }}
                    >
                      {mission.desc}
                    </span>
                  </div>

                  {hoveredMission === mission.id && (
                    <div style={tooltipStyle}>
                      <div style={missionStyles.tooltipTitleRow}>
                        <strong style={missionStyles.tooltipTitle}>{mission.title}</strong>
                        <span style={{ ...missionStyles.tooltipBadge, ...getBadgeStyle(mission) }}>
                          {getMissionStatusLabel(mission)}
                        </span>
                      </div>
                      <div style={missionStyles.tooltipDesc}>{mission.desc}</div>
                      <div style={{ ...missionStyles.tooltipFooter, ...(mission.status === 'active' || mission.status === 'pending_review' ? missionStyles.tooltipFooterActive : {}) }}>
                        {getTooltipAction(mission)}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {toast && <div style={missionStyles.toast}>{toast}</div>}

        <div style={missionStyles.footer}>
          <div style={missionStyles.footerMeta}>
            <span style={missionStyles.footerText}>Mission Progress</span>
            <span style={missionStyles.footerText}>{completedCount}/11 steps completed</span>
          </div>
          <div style={missionStyles.progressBarWrap}>
            <ProgressBar value={completedCount} max={missions.length} color="#22d3ee" />
          </div>
        </div>
      </div>

      <JourneyDetailModal
        open={Boolean(selectedMissionId)}
        mission={missions.find(item => item.id === selectedMissionId) || null}
        onClose={() => setSelectedMissionId(null)}
      />
    </section>
  );
}

const missionStyles = {
  board: {
    gridColumn: '1 / -1',
    position: 'relative',
    marginBottom: 8,
    padding: '0 14px',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 14,
    position: 'relative',
    zIndex: 2,
    padding: '0 4px',
  },
  progressCount: {
    padding: '10px 14px',
    borderRadius: 999,
    background: 'rgba(17,24,39,0.74)',
    border: '1px solid rgba(56,189,248,0.25)',
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: 800,
    whiteSpace: 'nowrap',
    boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
  },
  canvas: {
    position: 'relative',
    height: 420,
    borderRadius: 32,
    background: '#020817',
    border: '1px solid rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  svg: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  pathGlow: {
    fill: 'none',
    stroke: 'rgba(74,144,217,0.16)',
    strokeWidth: 11,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    filter: 'url(#missionPathBlur)',
  },
  pathLine: {
    fill: 'none',
    stroke: '#4a90d9',
    strokeWidth: 3,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    strokeDasharray: '8 6',
    animation: 'dashFlow 12s linear infinite',
  },
  starDrift: {
    position: 'absolute',
    inset: 0,
    animation: 'drift 120s linear infinite',
  },
  star: {
    position: 'absolute',
    borderRadius: '50%',
    boxShadow: '0 0 8px rgba(255,255,255,0.35)',
    animationFillMode: 'both',
  },
  nebulaPurple: {
    position: 'absolute',
    top: '10%',
    left: '8%',
    width: 320,
    height: 320,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(168,85,247,0.22), transparent 70%)',
    opacity: 0.04,
    filter: 'blur(32px)',
  },
  nebulaTeal: {
    position: 'absolute',
    bottom: '12%',
    right: '10%',
    width: 280,
    height: 280,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(45,212,191,0.2), transparent 72%)',
    opacity: 0.04,
    filter: 'blur(32px)',
  },
  ship: {
    position: 'absolute',
    zIndex: 5,
    fontSize: 24,
    filter: 'drop-shadow(0 0 14px rgba(56,189,248,0.45))',
    animation: 'shipFloat 3.2s ease-in-out infinite',
    pointerEvents: 'none',
  },
  node: {
    position: 'absolute',
    transform: 'translate(-50%, -50%)',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    display: 'grid',
    justifyItems: 'center',
    gap: 12,
    zIndex: 3,
  },
  glow: {
    position: 'absolute',
    borderRadius: '50%',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
  },
  glowDone: {
    background: 'radial-gradient(circle, rgba(34,197,94,0.42), transparent 70%)',
    filter: 'blur(10px)',
  },
  glowActive: {
    background: 'radial-gradient(circle, rgba(59,130,246,0.55), transparent 70%)',
    filter: 'blur(12px)',
    animation: 'pulse 2s ease-out infinite, bob 3s ease-in-out infinite',
  },
  planet: {
    position: 'relative',
    display: 'grid',
    placeItems: 'center',
    borderRadius: '50%',
    boxSizing: 'border-box',
    overflow: 'visible',
    zIndex: 2,
  },
  planetDone: {
    background: '#22c55e',
    boxShadow: '0 0 0 8px rgba(34,197,94,0.08), 0 0 30px rgba(34,197,94,0.42)',
  },
  planetActive: {
    background: '#3b82f6',
    boxShadow: '0 0 0 10px rgba(59,130,246,0.14), 0 0 34px rgba(59,130,246,0.55)',
    animation: 'bob 3s ease-in-out infinite',
  },
  planetLocked: {
    background: '#1f2937',
    border: '1px solid #374151',
    boxShadow: 'none',
  },
  orbit: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    borderRadius: '50%',
    boxSizing: 'border-box',
    pointerEvents: 'none',
  },
  orbitDone: {
    border: '1px solid rgba(255,255,255,0.32)',
  },
  orbitActiveOne: {
    border: '1px solid rgba(255,255,255,0.45)',
  },
  orbitActiveTwo: {
    border: '1px dashed rgba(255,255,255,0.26)',
  },
  orbitLocked: {
    border: '1px solid rgba(255,255,255,0.12)',
  },
  pulseRing: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 82,
    height: 82,
    borderRadius: '50%',
    border: '2px solid rgba(59,130,246,0.34)',
    transform: 'translate(-50%, -50%)',
    animation: 'pulse 2s ease-out infinite',
    pointerEvents: 'none',
  },
  planetIcon: {
    fontSize: 19,
    fontWeight: 900,
    color: '#ffffff',
    lineHeight: 1,
    zIndex: 2,
  },
  labelWrap: {
    maxWidth: 110,
    textAlign: 'center',
    lineHeight: 1.2,
  },
  labelTitle: {
    display: 'block',
    fontSize: 10,
    fontWeight: 800,
    color: '#ffffff',
    letterSpacing: '-0.01em',
  },
  labelDesc: {
    display: 'block',
    marginTop: 3,
    fontSize: 9,
    color: '#94a3b8',
    lineHeight: 1.25,
  },
  labelDone: {
    color: '#ffffff',
  },
  labelActive: {
    color: '#60a5fa',
  },
  labelLocked: {
    color: '#6b7280',
  },
  tooltip: {
    position: 'absolute',
    zIndex: 9,
    width: 240,
    padding: '14px 14px 12px',
    background: 'rgba(10, 15, 40, 0.95)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    boxShadow: '0 18px 42px rgba(0,0,0,0.32)',
    pointerEvents: 'none',
    backdropFilter: 'blur(16px)',
  },
  tooltipAbove: {
    transform: 'translate(-50%, -110%)',
  },
  tooltipBelow: {
    transform: 'translate(-50%, 18px)',
  },
  tooltipTitleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  tooltipTitle: {
    fontSize: 13,
    fontWeight: 800,
    color: '#ffffff',
  },
  tooltipBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px 8px',
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: '0.03em',
    whiteSpace: 'nowrap',
  },
  badgeDone: {
    background: 'rgba(34,197,94,0.14)',
    color: '#86efac',
    border: '1px solid rgba(34,197,94,0.25)',
  },
  badgeActive: {
    background: 'rgba(59,130,246,0.16)',
    color: '#93c5fd',
    border: '1px solid rgba(59,130,246,0.28)',
  },
  badgeLocked: {
    background: 'rgba(107,114,128,0.16)',
    color: '#cbd5e1',
    border: '1px solid rgba(107,114,128,0.24)',
  },
  tooltipDesc: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 1.45,
    marginBottom: 10,
  },
  tooltipFooter: {
    color: '#a5b4fc',
    fontSize: 12,
    fontWeight: 700,
  },
  tooltipFooterActive: {
    color: '#60a5fa',
  },
  toast: {
    position: 'absolute',
    left: '50%',
    bottom: 86,
    transform: 'translateX(-50%)',
    zIndex: 12,
    padding: '12px 16px',
    borderRadius: 12,
    background: 'rgba(10, 15, 40, 0.96)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 700,
    boxShadow: '0 18px 42px rgba(0,0,0,0.34)',
    backdropFilter: 'blur(16px)',
  },
  footer: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 16,
    zIndex: 4,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  footerMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  footerText: {
    fontSize: 12,
    color: '#cbd5e1',
    fontWeight: 700,
  },
  progressBarWrap: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 999,
    padding: 6,
    boxShadow: '0 10px 24px rgba(0,0,0,0.18)',
  },
};

/* ── Card: SP Points ───────────────────────────────────────────────────── */
function SPPoints() {
  const [streak, setStreak] = useState(7);
  const points = [
    { label: 'SP Balance',   val: '2,840',  icon: '⚡', color: '#fbbf24' },
    { label: 'Rank',         val: '#12',    icon: '🏆', color: '#a78bfa' },
    { label: 'Day Streak',   val: `${streak}d`, icon: '🔥', color: '#f97316' },
    { label: 'Answers',      val: '48',     icon: '💬', color: '#6ee7b7' },
  ];
  return (
    <div style={glassCard()}>
      <SectionTitle icon="⚡" label="SP Points" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {points.map(p => (
          <div key={p.label} style={{
            padding: '16px', borderRadius: 14,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <span style={{ fontSize: 20 }}>{p.icon}</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: p.color, letterSpacing: '-0.03em' }}>{p.val}</span>
            <span style={{ fontSize: 11, color: '#64748b' }}>{p.label}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 12, background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: '#f97316' }}>🔥 {streak}-day contribution streak!</span>
        <button style={{ fontSize: 11, background: 'rgba(249,115,22,0.2)', border: 'none', borderRadius: 8, padding: '4px 10px', color: '#f97316', cursor: 'pointer' }}>Claim +3 SP</button>
      </div>
    </div>
  );
}

/* ── Card: Internship Progress ─────────────────────────────────────────── */
function InternshipProgress() {
  const totalDays = 90, completedDays = 34;
  const phases = [
    { label: 'Orientation',    pct: 100, color: '#22c55e' },
    { label: 'Skill Building', pct: 78,  color: '#7c6ff7' },
    { label: 'Project Phase',  pct: 42,  color: '#f59e0b' },
    { label: 'Final Review',   pct: 0,   color: '#64748b' },
  ];
  return (
    <div style={glassCard()}>
      <SectionTitle icon="🚀" label="Internship Progress" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: 28, fontWeight: 800, color: '#eef0f6', letterSpacing: '-0.03em' }}>
            {Math.round((completedDays / totalDays) * 100)}%
          </span>
          <span style={{ fontSize: 12, color: '#64748b' }}>{completedDays} of {totalDays} days</span>
        </div>
        <ProgressBar value={completedDays} max={totalDays} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 4 }}>
          {phases.map(p => (
            <div key={p.label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>{p.label}</span>
                <span style={{ fontSize: 11, color: p.color }}>{p.pct}%</span>
              </div>
              <ProgressBar value={p.pct} color={p.color} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Card: Profile Status ──────────────────────────────────────────────── */
function ProfileStatus() {
  const fields = [
    { label: 'Basic Info',     pct: 100, ok: true },
    { label: 'NOC Upload',     pct: 100, ok: true },
    { label: 'Project Details', pct: 75, ok: true },
    { label: 'Mentor Confirm',  pct: 50, ok: false },
    { label: 'Bank Details',   pct: 0,  ok: false },
  ];
  return (
    <div style={glassCard()}>
      <SectionTitle icon="👤" label="Profile Status" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {fields.map(f => (
          <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {f.ok
                ? <span style={{ color: '#22c55e', fontSize: 14 }}>✓</span>
                : <span style={{ color: f.pct === 0 ? '#ef4444' : '#f59e0b', fontSize: 14 }}>○</span>}
              <span style={{ fontSize: 13, color: '#94a3b8' }}>{f.label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 60, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 999 }}>
                <div style={{ width: `${f.pct}%`, height: '100%', background: f.ok ? '#22c55e' : '#f59e0b', borderRadius: 999 }} />
              </div>
              <span style={{ fontSize: 11, color: '#64748b', width: 28 }}>{f.pct}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Card: Community Hub ───────────────────────────────────────────────── */
function CommunityHub({ onOpen }) {
  const posts = [
    { title: 'How to structure a good SOP?',     meta: 'SOP Writing · 23 answers',   votes: 47, tag: 'faq' },
    { title: 'Best resources for ML basics?',    meta: 'Resources · 31 answers',     votes: 89, tag: 'help' },
    { title: 'NOC timeline — when to apply?',    meta: 'NOC · 12 answers',           votes: 34, tag: 'process' },
  ];
  return (
    <div style={{ ...glassCard(), cursor: 'pointer' }} onClick={onOpen} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpen?.(); }}>
      <SectionTitle icon="💬" label="Community Hub" action={<button type="button" style={linkBtn} onClick={(e) => { e.stopPropagation(); onOpen?.(); }}>View all →</button>} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {posts.map(p => (
          <div key={p.title} style={{
            padding: '14px', borderRadius: 14,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', justifyContent: 'space-between', gap: 12,
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 13, color: '#eef0f6', fontWeight: 600 }}>{p.title}</span>
              <span style={{ fontSize: 11, color: '#64748b' }}>{p.meta}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <span style={{ fontSize: 14, color: '#7c6ff7' }}>▲</span>
              <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700 }}>{p.votes}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Card: Notifications ───────────────────────────────────────────────── */
function ZoroAssistant({ onOpenYaksha }) {
  const [prompt, setPrompt] = useState('');
  const prompts = [
    'NOC Help',
    'Certificate Queries',
    'Internship Timeline',
    'Offer Letter',
    'Interview Help',
    'SP Points',
    'Eligibility',
  ];

  return (
    <div style={{
      ...glassCard(),
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 12px 38px rgba(0,0,0,0.34), 0 0 34px rgba(124,111,247,0.08)',
    }}>
      <div style={{
        position: 'absolute',
        inset: 'auto -8% -24% auto',
        width: 260,
        height: 260,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,111,247,0.18) 0%, rgba(124,111,247,0.02) 55%, transparent 75%)',
        filter: 'blur(10px)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        inset: '-18% auto auto -10%',
        width: 180,
        height: 180,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 70%)',
        filter: 'blur(18px)',
        pointerEvents: 'none',
      }} />

      <SectionTitle icon="🤖" label="Zoro AI Assistant" />
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 16,
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        marginBottom: 18,
      }}>
        <div style={{ maxWidth: 860 }}>
          <p style={{ margin: '-4px 0 12px', color: '#94a3b8', fontSize: 14, lineHeight: 1.6 }}>
            Ask anything about internships, NOC, certificates, offer letters, eligibility, deadlines, interviews, SP points, and Samagama.
          </p>
        </div>
        <div style={{
          padding: '10px 12px',
          borderRadius: 14,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: '#dbeafe',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.04em',
          whiteSpace: 'nowrap',
        }}>
          Zoro Online
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'relative' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: 12,
          alignItems: 'stretch',
        }}>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Ask Zoro anything..."
            rows="4"
            style={{
              width: '100%',
              border: '1px solid rgba(124,111,247,0.18)',
              background: 'rgba(255,255,255,0.04)',
              color: '#eef0f6',
              borderRadius: 18,
              padding: '16px 18px',
              resize: 'vertical',
              minHeight: 124,
              outline: 'none',
              boxShadow: '0 0 0 1px rgba(124,111,247,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
          />
          <button
            type="button"
            onClick={onOpenYaksha}
            style={{
              border: 'none',
              borderRadius: 18,
              padding: '0 22px',
              minWidth: 140,
              background: 'linear-gradient(135deg, #7c6ff7, #38bdf8)',
              color: '#fff',
              fontWeight: 800,
              boxShadow: '0 14px 28px rgba(124,111,247,0.24)',
            }}
          >
            Ask
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {prompts.map(item => (
            <button
              key={item}
              type="button"
              onClick={() => setPrompt(item)}
              style={{
                border: '1px solid rgba(255,255,255,0.08)',
                background: prompt === item ? 'rgba(124,111,247,0.16)' : 'rgba(255,255,255,0.03)',
                color: prompt === item ? '#f8fafc' : '#dbeafe',
                borderRadius: 999,
                padding: '9px 12px',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Card: Leaderboard ─────────────────────────────────────────────────── */
function Leaderboard({ onOpen }) {
  const ranks = [
    { rank: 1, name: 'Priya Sharma',    sp: '4,210', badge: '🥇' },
    { rank: 2, name: 'Arjun Mehta',     sp: '3,870', badge: '🥈' },
    { rank: 3, name: 'Sneha Reddy',    sp: '3,540', badge: '🥉' },
    { rank: 12, name: 'You',           sp: '2,840', badge: '⚡', me: true },
  ];
  return (
    <div
      style={{ ...glassCard(), cursor: 'pointer' }}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={event => {
        if ((event.key === 'Enter' || event.key === ' ') && onOpen) {
          event.preventDefault();
          onOpen();
        }
      }}
    >
      <SectionTitle
        icon="🏆"
        label="Leaderboard"
        action={(
          <button
            type="button"
            style={linkBtn}
            onClick={event => {
              event.stopPropagation();
              onOpen?.();
            }}
          >
            View Leaderboard →
          </button>
        )}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {ranks.map(r => (
          <div key={r.rank} style={{
            padding: '10px 14px', borderRadius: 12,
            background: r.me ? 'rgba(124,111,247,0.12)' : 'rgba(255,255,255,0.02)',
            border: `1px solid ${r.me ? 'rgba(124,111,247,0.3)' : 'rgba(255,255,255,0.05)'}`,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 14, width: 20, textAlign: 'center', color: r.me ? '#7c6ff7' : '#64748b', fontWeight: r.me ? 800 : 400 }}>{r.rank}</span>
            <span style={{ fontSize: 14 }}>{r.badge}</span>
            <span style={{ flex: 1, fontSize: 13, color: r.me ? '#c4b5fd' : '#94a3b8', fontWeight: r.me ? 700 : 400 }}>{r.name}</span>
            <span style={{ fontSize: 12, color: '#fbbf24', fontWeight: 700 }}>⚡{r.sp}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Card: Internship Tasks ────────────────────────────────────────────── */
export function InternshipTasks() {
  const [tasks, setTasks] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [slotDrafts, setSlotDrafts] = useState({});

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchMyTasks();
        setTasks(Array.isArray(data) ? data : []);
      } catch { setTasks([]); }
    }
    load();
    function sync() { load(); }
    window.addEventListener('samagama-tasks-updated', sync);
    return () => window.removeEventListener('samagama-tasks-updated', sync);
  }, []);

  const summary = getTaskSummary(tasks);

  async function handleComplete(taskId) {
    await submitTask(taskId, { status: 'completed', completedAt: new Date().toISOString() });
    setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: 'completed' } : t));
    setExpandedTaskId(prev => (prev === taskId ? null : prev));
    setSlotDrafts(prev => {
      const next = { ...prev };
      delete next[taskId];
      return next;
    });
  }

  async function handleSelectSlot(taskId, slot) {
    await submitTask(taskId, { selectedSlot: slot, status: 'completed' });
    setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: 'completed', selectedSlot: slot } : t));
    setExpandedTaskId(prev => (prev === taskId ? null : prev));
    setSlotDrafts(prev => {
      const next = { ...prev };
      delete next[taskId];
      return next;
    });
  }

  function handleOpenLink(link) {
    if (!link) return;
    window.open(link, '_blank', 'noopener,noreferrer');
  }

  function handleToggleTask(task) {
    const isExpanded = expandedTaskId === task.id;
    setExpandedTaskId(isExpanded ? null : task.id);
    setSlotDrafts(prev => {
      const next = { ...prev };
      if (isExpanded) {
        delete next[task.id];
      } else {
        next[task.id] = task.selectedSlot || '';
      }
      return next;
    });
  }

  function getStatusLabel(status) {
    if (status === 'completed') return 'Completed';
    if (status === 'missed') return 'Missed';
    return 'Pending';
  }

  const visibleTasks = tasks.filter(task => {
    const status = getTaskStatus(task);
    if (activeFilter === 'pending') return status === 'pending' || status === 'in-progress';
    if (activeFilter === 'completed') return status === 'completed';
    if (activeFilter === 'missed') return status === 'missed';
    return true;
  });

  function getDueLabel(task) {
    const status = getTaskStatus(task);
    const deadlineInfo = getTaskDeadlineInfo(task);
    const deadlineDate = new Date(`${task.deadline}T23:59:59`);
    if (status === 'completed') {
      return `Completed${task.completedAt ? ` on ${formatTaskDate(task.completedAt)}` : ''}`;
    }
    if (status === 'missed') {
      return 'Overdue';
    }
    if (deadlineInfo.daysRemaining === 0) return 'Due Today';
    if (deadlineInfo.daysRemaining === 1) return 'Due Tomorrow';
    if (deadlineInfo.daysRemaining != null && deadlineInfo.daysRemaining <= 2) {
      return `${deadlineInfo.daysRemaining} Days Left`;
    }
    if (!Number.isNaN(deadlineDate.getTime())) {
      return `Due ${new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(deadlineDate)}`;
    }
    return deadlineInfo.label;
  }

  return (
    <div style={glassCard()}>
      <SectionTitle icon="📋" label="Internship Tasks" action={`${summary.total} active`} />

      <div style={taskStyles.summaryRail}>
        {[
          { label: 'Total Tasks', value: summary.total },
          { label: 'Pending', value: summary.pending + summary.inProgress },
          { label: 'Completed', value: summary.completed },
          { label: 'Missed', value: summary.missed },
        ].map(item => (
          <div key={item.label} style={taskStyles.summaryPill}>
            <span style={taskStyles.summaryLabel}>{item.label}</span>
            <strong style={taskStyles.summaryValue}>{item.value}</strong>
          </div>
        ))}
      </div>

      <div style={taskStyles.filterBar}>
        {[
          { key: 'all', label: 'All' },
          { key: 'pending', label: 'Pending' },
          { key: 'completed', label: 'Completed' },
          { key: 'missed', label: 'Missed' },
        ].map(filter => (
          <button
            key={filter.key}
            type="button"
            onClick={() => setActiveFilter(filter.key)}
            style={{
              ...taskStyles.filterTab,
              ...(activeFilter === filter.key ? taskStyles.filterTabActive : {}),
            }}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {tasks.length === 0 ? (
        <div style={taskStyles.emptyState}>No active internship tasks assigned.</div>
      ) : visibleTasks.length === 0 ? (
        <div style={taskStyles.emptyState}>No tasks match this filter.</div>
      ) : (
        <div style={taskStyles.taskList}>
          {visibleTasks.map(task => {
            const status = getTaskStatus(task);
            const isMissed = status === 'missed';
            const canSelectSlot = Array.isArray(task.slots) && task.slots.length > 0 && status !== 'completed';
            const isCompleted = status === 'completed';
            const isExpanded = expandedTaskId === task.id;
            const deadlineInfo = getTaskDeadlineInfo(task);
            const isDueSoon = !isCompleted && !isMissed && deadlineInfo.daysRemaining != null && deadlineInfo.daysRemaining <= 2;
            const accent = isMissed
              ? 'rgba(239,68,68,0.38)'
              : isCompleted
                ? 'rgba(34,197,94,0.38)'
                : isDueSoon
                  ? 'rgba(251,191,36,0.38)'
                  : 'rgba(124,111,247,0.22)';
            const dueLabel = getDueLabel(task);
            const slotDraft = slotDrafts[task.id] || '';

            return (
              <article
                key={task.id}
                style={{
                  ...taskStyles.taskRow,
                  borderLeftColor: accent,
                  opacity: isCompleted ? 0.62 : 1,
                  ...(isMissed ? taskStyles.taskRowMissed : {}),
                }}
                onClick={() => handleToggleTask(task)}
                role="button"
                tabIndex={0}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleToggleTask(task);
                  }
                }}
              >
                <button
                  type="button"
                  onClick={event => {
                    event.stopPropagation();
                    if (canSelectSlot && !isCompleted) {
                      handleToggleTask(task);
                      return;
                    }
                    handleComplete(task.id);
                  }}
                  aria-label={canSelectSlot && !isCompleted ? `Expand ${task.title}` : `Mark ${task.title} as completed`}
                  style={{
                    ...taskStyles.checkCircle,
                    ...(isCompleted ? taskStyles.checkCircleCompleted : {}),
                    ...(isMissed ? taskStyles.checkCircleMissed : {}),
                    ...(canSelectSlot && !isCompleted ? taskStyles.checkCircleActionable : {}),
                  }}
                >
                  {isCompleted ? '✓' : ''}
                </button>

                <div style={taskStyles.rowMain}>
                  <div style={taskStyles.rowTopLine}>
                    <div style={taskStyles.rowTitleWrap}>
                      <div style={taskStyles.taskCategory}>{task.category}</div>
                      <div style={{
                        ...taskStyles.rowTitle,
                        ...(isCompleted ? taskStyles.rowTitleCompleted : {}),
                        ...(isMissed ? taskStyles.rowTitleMissed : {}),
                      }}>
                        {task.title}
                      </div>
                      <div style={taskStyles.rowDesc}>{task.description}</div>
                    </div>

                    <div style={taskStyles.rowRight}>
                      <div style={taskStyles.deadlineStack}>
                        <span style={{
                          ...taskStyles.dueLabel,
                          ...(isMissed ? taskStyles.dueLabelMissed : {}),
                          ...(isCompleted ? taskStyles.dueLabelCompleted : {}),
                          ...(isDueSoon ? taskStyles.dueLabelSoon : {}),
                        }}>
                          {dueLabel}
                        </span>
                        <span style={{
                          ...taskStyles.metaTiny,
                          ...(isCompleted ? taskStyles.metaTinyCompleted : {}),
                          ...(isMissed ? taskStyles.metaTinyMissed : {}),
                        }}>
                          {task.selectedSlot ? `Slot ${task.selectedSlot}` : task.priority}
                        </span>
                      </div>
                      <span style={{
                        ...taskStyles.statusPill,
                        ...(status === 'pending' || status === 'in-progress' ? taskStyles.statusPillPending : {}),
                        ...(status === 'completed' ? taskStyles.statusPillCompleted : {}),
                        ...(status === 'missed' ? taskStyles.statusPillMissed : {}),
                        ...(isDueSoon && !isMissed && !isCompleted ? taskStyles.statusPillSoon : {}),
                      }}>
                        {getStatusLabel(status)}
                      </span>
                      <span style={taskStyles.expandChevron}>{isExpanded ? '▾' : '▸'}</span>
                    </div>
                  </div>

                  <div style={{
                    ...taskStyles.expandHint,
                    ...(isExpanded ? taskStyles.expandHintActive : {}),
                  }}>
                    {isExpanded ? 'Click to collapse' : 'Click to expand'}
                  </div>

                  {isExpanded && (
                    <div style={taskStyles.expandedPanel} onClick={event => event.stopPropagation()}>
                      {!isCompleted && canSelectSlot && (
                        <div style={taskStyles.slotSection}>
                          <div style={taskStyles.sectionLabel}>Available Slots</div>
                          <div style={taskStyles.slotChips}>
                            {task.slots.map(slot => (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => setSlotDrafts(prev => ({ ...prev, [task.id]: slot }))}
                                style={{
                                  ...taskStyles.slotChip,
                                  ...(slotDraft === slot ? taskStyles.slotChipActive : {}),
                                }}
                              >
                                {slot}
                              </button>
                            ))}
                          </div>
                          <div style={taskStyles.expandedActionRow}>
                            <button
                              type="button"
                              onClick={() => handleSelectSlot(task.id, slotDraft)}
                              disabled={!slotDraft}
                              style={{
                                ...taskStyles.confirmBtn,
                                ...(slotDraft ? taskStyles.confirmBtnActive : taskStyles.confirmBtnDisabled),
                              }}
                            >
                              Confirm Selection
                            </button>
                          </div>
                        </div>
                      )}

                      {!isCompleted && !canSelectSlot && task.attachmentLink && (
                        <div style={taskStyles.expandedActionRow}>
                          <button
                            type="button"
                            style={taskStyles.inlineLinkBtn}
                            onClick={() => handleOpenLink(task.attachmentLink)}
                          >
                            Open attachment
                          </button>
                        </div>
                      )}

                      {isCompleted && (
                        <div style={taskStyles.completedNote}>
                          <span>Completed</span>
                          {task.completedAt && <span>on {formatTaskDate(task.completedAt)}</span>}
                        </div>
                      )}

                      {!isCompleted && !canSelectSlot && !task.attachmentLink && (
                        <div style={taskStyles.helpNote}>No extra actions needed. Use the left circle to complete it.</div>
                      )}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
/* duplicate block removed */

/* ── Card: Achievement Badges ──────────────────────────────────────────── */
function AchievementBadges() {
  const badges = [
    { emoji: '🌟', label: 'Early Bird',      desc: 'First 100 signups',  earned: true },
    { emoji: '💬', label: 'First Answer',    desc: 'Post your first answer', earned: true },
    { emoji: '🎯', label: 'Helpful Hand',    desc: '10 accepted answers', earned: true },
    { emoji: '🏆', label: 'Top Contributor', desc: 'Reach 1k SP',        earned: false },
    { emoji: '⚡', label: 'Streak Master',   desc: '30-day streak',      earned: false },
    { emoji: '🚀', label: 'Mission Ready',   desc: 'Complete all missions', earned: false },
  ];
  return (
    <div style={glassCard({ gridColumn: '1 / -1' })}>
      <SectionTitle icon="🏅" label="Achievement Badges" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
        {badges.map(b => (
          <div key={b.label} style={{
            padding: '16px', borderRadius: 14,
            background: b.earned ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.02)',
            border: `1px solid ${b.earned ? 'rgba(251,191,36,0.25)' : 'rgba(255,255,255,0.06)'}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center',
            opacity: b.earned ? 1 : 0.5,
          }}>
            <span style={{ fontSize: 28 }}>{b.emoji}</span>
            <strong style={{ fontSize: 12, color: '#eef0f6' }}>{b.label}</strong>
            <span style={{ fontSize: 11, color: '#64748b' }}>{b.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Dashboard layout ──────────────────────────────────────────────────── */
function StudentDashboard() {
  const { handleLogout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const notificationMenuRef = useRef(null);
  const notificationButtonRef = useRef(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [announcementDetail, setAnnouncementDetail] = useState(null);
  const announcementDetailRef = useRef(null);
  const [readAnnouncementIds, setReadAnnouncementIds] = useState([]);
  const [pendingReadAnnouncementId, setPendingReadAnnouncementId] = useState(null);
  const [announcementSort, setAnnouncementSort] = useState('latest');
  const [announcementAudienceFilter, setAnnouncementAudienceFilter] = useState('all');
  const [taskOverview, setTaskOverview] = useState({ total: 0, pending: 0, completed: 0, missed: 0, inProgress: 0 });
  const [announcementsLoaded, setAnnouncementsLoaded] = useState(false);
  const [journeyTick, setJourneyTick] = useState(0);
  const loginTimestampRef = useRef(new Date());
  const displayName = typeof window !== 'undefined'
    ? (sessionStorage.getItem('samagama-display-name') || sessionStorage.getItem('samagama-email') || 'Student')
    : 'Student';
  const loginTime = new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
    hour12: false,
  }).format(loginTimestampRef.current) + ' IST';
  const userId = typeof window !== 'undefined'
    ? (sessionStorage.getItem('samagama-user-id') || 'student')
    : 'student';
  useEffect(() => {
    async function loadAnnouncements() {
      try {
        const data = await fetchAnnouncements();
        setAnnouncements(Array.isArray(data) ? data : []);
      } catch { setAnnouncements([]); } finally { setAnnouncementsLoaded(true); }
    }
    loadAnnouncements();
    const interval = setInterval(loadAnnouncements, 60000);
    function sync() { loadAnnouncements(); }
    window.addEventListener('samagama-announcements-updated', sync);
    return () => {
      clearInterval(interval);
      window.removeEventListener('samagama-announcements-updated', sync);
    };
  }, []);

  const journeyState = useMemo(() => getJourneyState(), [journeyTick]);
  const summaryCards = [
    { label: 'SP Points', value: String(journeyState.spPoints ?? 120) },
  ];
  const studentAnnouncements = useMemo(() => {
    const audience = announcementAudienceFilter === 'all' ? 'All Students' : announcementAudienceFilter;
    const active = getAnnouncementsForAudience(announcements, audience);
    const filtered = active.filter(item => isAnnouncementActive(item));
    const urgencyOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    const sorted = [...filtered].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (announcementSort === 'pinned') return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || new Date(b.dateTime) - new Date(a.dateTime);
      if (announcementSort === 'urgency') {
        const diff = (urgencyOrder[a.urgencyLevel] ?? 9) - (urgencyOrder[b.urgencyLevel] ?? 9);
        if (diff !== 0) return diff;
      }
      if (announcementSort === 'active') {
        const activeDiff = Number(isAnnouncementActive(b)) - Number(isAnnouncementActive(a));
        if (activeDiff !== 0) return activeDiff;
      }
      return new Date(b.dateTime || b.createdAt) - new Date(a.dateTime || a.createdAt);
    });
    return sorted;
  }, [announcements, announcementAudienceFilter, announcementSort]);
  const unreadCount = useMemo(
    () => studentAnnouncements.filter(item => !readAnnouncementIds.includes(item.id)).length,
    [studentAnnouncements, readAnnouncementIds],
  );

  useEffect(() => {
    function handleDocumentClick(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
      if (announcementDetailRef.current) {
        return;
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

    async function syncAnnouncements() {
      try {
        const data = await fetchAnnouncements();
        setAnnouncements(Array.isArray(data) ? data : []);
      } catch { /* ignore */ }
    }

    async function syncTasks() {
      try {
        const data = await fetchMyTasks();
        const fresh = Array.isArray(data) ? data : [];
        setTasks(fresh);
        setTaskOverview(getTaskSummary(fresh));
      } catch { /* ignore */ }
    }

    function syncJourney() {
      setJourneyTick(value => value + 1);
    }

    async function syncReadState() {
      try {
        const state = await fetchAnnouncementReadState(userId);
        setReadAnnouncementIds(Array.isArray(state?.ids) ? state.ids : []);
      } catch {
        setReadAnnouncementIds([]);
      }
    }

    document.addEventListener('mousedown', handleDocumentClick);
    window.addEventListener('samagama-announcements-updated', syncAnnouncements);
    window.addEventListener('samagama-tasks-updated', syncTasks);
    window.addEventListener('samagama-journey-updated', syncJourney);
    window.addEventListener('samagama-teams-updated', syncJourney);
    window.addEventListener('storage', syncAnnouncements);
    window.addEventListener('storage', syncTasks);
    window.addEventListener('storage', syncJourney);
    syncReadState();
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      window.removeEventListener('samagama-announcements-updated', syncAnnouncements);
      window.removeEventListener('samagama-tasks-updated', syncTasks);
      window.removeEventListener('samagama-journey-updated', syncJourney);
      window.removeEventListener('samagama-teams-updated', syncJourney);
      window.removeEventListener('storage', syncAnnouncements);
      window.removeEventListener('storage', syncTasks);
      window.removeEventListener('storage', syncJourney);
    };
  }, [userId]);

  useEffect(() => {
    let active = true;

    async function syncTeamProgress() {
      if (!userId || userId === 'student') return;
      try {
        const context = await fetchMyTeam(userId, userId);
        if (!active || !context?.team || !context.journeyReady) return;
        const milestone9 = getJourneyMilestone(9);
        if (milestone9?.status !== 'completed') {
          submitJourneyTeam({
            team: context.team,
            role: context.role || 'member',
            members: context.team?.members || [],
            status: context.team?.status || 'active',
            note: 'Project team synced from the team workflow.',
            spDelta: 10,
          });
        }
      } catch {
        // Ignore sync errors to keep the dashboard stable.
      }
    }

    syncTeamProgress();
    const interval = window.setInterval(syncTeamProgress, 15000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [userId, journeyTick]);

  function openAnnouncement(announcement) {
    setPendingReadAnnouncementId(readAnnouncementIds.includes(announcement.id) ? null : announcement.id);
    announcementDetailRef.current = announcement;
    setAnnouncementDetail(announcement);
    setNotificationOpen(true);
  }

  function openProfilePanel() {
    setProfilePanelOpen(true);
    setNotificationOpen(false);
    setProfileMenuOpen(false);
  }

  function closeAnnouncementDetail() {
    const announcementId = pendingReadAnnouncementId;
    if (announcementId && !readAnnouncementIds.includes(announcementId)) {
      setReadAnnouncementIds(prev => [announcementId, ...prev]);
      persistAnnouncementRead(userId, announcementId).catch(() => {});
    }
    setPendingReadAnnouncementId(null);
    announcementDetailRef.current = null;
    setAnnouncementDetail(null);
  }

  return (
    <div style={dashPage}>
      {/* Background orbs */}
      <div style={styles.orb1} />
      <div style={styles.orb2} />

      <div style={dashPageInner}>
        <header style={navStyles.bar}>
          <button type="button" onClick={() => navigate('/')} style={navStyles.backBtn} className="student-nav-back-btn">
            ← Back to Home
          </button>

          <div style={navStyles.centerTitle}>Student Portal</div>

          <div style={navStyles.rightRow}>
            <div ref={notificationMenuRef} style={navStyles.notificationWrap}>
              <button
                ref={notificationButtonRef}
                type="button"
                aria-label="Notifications"
                aria-expanded={notificationOpen}
                style={navStyles.iconBtn}
                className="student-nav-icon-btn"
                onClick={() => {
                  setProfileMenuOpen(false);
                  setNotificationOpen(prev => !prev);
                }}
              >
                <span style={navStyles.iconGlyph}>🔔</span>
                {unreadCount > 0 && (
                  <span style={navStyles.notificationDot}>{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
              </button>

              {notificationOpen && (
                <div style={navStyles.notificationPanel}>
                  <div style={navStyles.notificationHeader}>
                    <div>
                      <div style={navStyles.notificationTitle}>Announcements</div>
                      <div style={navStyles.notificationSubtitle}>Latest updates from the Samagama team</div>
                    </div>
                  </div>

                  <div style={navStyles.notificationList}>
                    {studentAnnouncements.length === 0 ? (
                      <div style={navStyles.emptyState}>
                        <strong style={navStyles.emptyTitle}>No announcements yet.</strong>
                        <p style={navStyles.emptyText}>
                          You&apos;ll see internship updates, meetings, NOC notices, certificate releases, and other important information here.
                        </p>
                      </div>
                    ) : (
                      studentAnnouncements.map(announcement => {
                        const unread = !readAnnouncementIds.includes(announcement.id);
                        return (
                        <button
                          key={announcement.id}
                          type="button"
                          className="student-announcement-card"
                          style={{
                            ...navStyles.announcementCard,
                            ...(announcement.pinned ? navStyles.pinnedCard : {}),
                              ...(unread ? navStyles.unreadCard : {}),
                            }}
                            onClick={() => openAnnouncement(announcement)}
                          >
                          <div style={navStyles.announcementTopRow}>
                              <div style={{
                                ...navStyles.announcementAccent,
                                ...(unread ? navStyles.announcementAccentUnread : navStyles.announcementAccentRead),
                              }} />
                              <div style={navStyles.announcementIcon}>{getAnnouncementCategoryIcon(announcement.category)}</div>
                              <div style={navStyles.announcementBody}>
                                <div style={navStyles.announcementMetaRow}>
                                  <span style={navStyles.categoryBadge}>{announcement.category}</span>
                                  {announcement.pinned && <span style={navStyles.pinnedBadge}>📌 Pinned Announcement</span>}
                                  {unread && <span style={navStyles.newBadge}>NEW</span>}
                                </div>
                                <div style={{ ...navStyles.announcementTitle, ...(unread ? navStyles.announcementTitleUnread : {}) }}>
                                  {announcement.title}
                                </div>
                                <div style={navStyles.announcementPreview}>{announcement.preview}</div>
                                <div style={navStyles.announcementBottomRow}>
                                  <span style={navStyles.adminBadge}>Admin Team</span>
                                  <span style={navStyles.timeText}>{formatAnnouncementTime(announcement.dateTime)}</span>
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
            <button type="button" style={navStyles.pointsBtn} className="student-nav-points-btn" onClick={() => navigate('/student/spurti-points')} title="View Spurti Points">
              <span style={navStyles.pointsIcon}>⚡</span>
              <span>SP: {journeyState.spPoints ?? 120}</span>
            </button>
            <button
              type="button"
              style={navStyles.profileBtn}
              className="student-nav-profile-btn"
              onClick={openProfilePanel}
              title="View Your Profile"
            >
              View Profile
            </button>
            <div ref={profileMenuRef} style={navStyles.profileWrap}>
              <button
                type="button"
                aria-label="Profile menu"
                aria-expanded={profileMenuOpen}
                onClick={() => {
                  setNotificationOpen(false);
                  setProfileMenuOpen(prev => !prev);
                }}
                style={navStyles.avatarBtn}
                className="student-nav-avatar-btn"
              >
                A
                <span style={navStyles.avatarChevron}>▾</span>
              </button>
              {profileMenuOpen && (
                <div style={navStyles.dropdown}>
                  <button
                    type="button"
                    onClick={() => {
                      openProfilePanel();
                    }}
                    style={navStyles.dropdownItem}
                    className="student-nav-dropdown-item"
                  >
                    View Your Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      handleLogout();
                    }}
                    style={navStyles.dropdownItem}
                    className="student-nav-dropdown-item"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div style={studentLoginBannerStyles.bar}>
          <span style={studentLoginBannerStyles.name}>{String(displayName).toUpperCase()}</span>
          <span style={studentLoginBannerStyles.text}>has logged in at</span>
          <span style={studentLoginBannerStyles.time}>{loginTime}</span>
        </div>

        {announcementDetail && (
          <div style={navStyles.modalBackdrop} onClick={closeAnnouncementDetail}>
            <div style={navStyles.modalCard} onClick={e => e.stopPropagation()}>
              <div style={navStyles.modalHeader}>
                <div>
                  <div style={navStyles.notificationTitle}>Announcement</div>
                  <h2 style={navStyles.modalTitle}>{announcementDetail.title}</h2>
                </div>
                <button type="button" style={navStyles.closeBtn} onClick={closeAnnouncementDetail}>
                  ✕
                </button>
              </div>

              <div style={navStyles.modalMeta}>
                <span style={navStyles.categoryBadge}>{announcementDetail.category}</span>
                <span style={announcementFeedStyles.typeBadge}>{announcementDetail.urgencyLevel || announcementDetail.priority || 'Medium'}</span>
                {announcementDetail.pinned && <span style={navStyles.pinnedBadge}>📌 Pinned Announcement</span>}
                <span style={navStyles.adminBadge}>{announcementDetail.postedBy}</span>
                <span style={navStyles.timeText}>{formatAnnouncementTime(announcementDetail.dateTime)}</span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                <span style={announcementFeedStyles.categoryPill}>{announcementDetail.targetAudience || 'All Students'}</span>
                <span style={announcementFeedStyles.deadlinePill(getAnnouncementDeadlineInfo(announcementDetail).expired, announcementDetail.urgencyLevel)}>
                  {getAnnouncementDeadlineInfo(announcementDetail).label}
                </span>
                <span style={announcementFeedStyles.typeBadge}>{announcementDetail.status || 'published'}</span>
              </div>

              <div style={navStyles.modalContent}>{announcementDetail.content}</div>

              {announcementDetail.links?.length > 0 && (
                <div style={navStyles.linksSection}>
                  <div style={navStyles.linksHeading}>Attached Links</div>
                  <div style={navStyles.linksList}>
                    {announcementDetail.links.map(link => (
                      <a key={link.url} href={link.url} target="_blank" rel="noreferrer" style={navStyles.linkItem}>
                        {link.label}
                        <span style={navStyles.linkUrl}>{link.url}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <StudentProfileModal
          open={profilePanelOpen}
          onClose={() => setProfilePanelOpen(false)}
          userId={userId}
          displayName={displayName}
          email={typeof window !== 'undefined' ? (sessionStorage.getItem('samagama-email') || '') : ''}
        />

        <section style={headerStyles.shell}>
          <div style={headerStyles.banner}>
            <span style={headerStyles.bannerDot} />
            <span style={headerStyles.bannerText}>
              <strong>STUDENT</strong> logged in at {loginTime}
            </span>
          </div>

          <div style={headerStyles.hero}>
            <div style={headerStyles.heroCopy}>
              <h1 style={headerStyles.title}>Welcome, Student 👋</h1>
              <p style={headerStyles.subtitle}>Here&apos;s what&apos;s happening in your community.</p>
            </div>
          </div>

          <section style={summaryStyles.row}>
            {summaryCards.map(card => (
              <div
                key={card.label}
                style={{
                  ...summaryStyles.card,
                  ...(card.label === 'SP Points' ? summaryStyles.cardFeatured : {}),
                }}
              >
                <span
                  style={{
                    ...summaryStyles.label,
                    ...(card.label === 'SP Points' ? summaryStyles.labelFeatured : {}),
                  }}
                >
                  {card.label}
                </span>
                <strong
                  style={{
                    ...summaryStyles.value,
                    ...(card.label === 'SP Points' ? summaryStyles.valueFeatured : {}),
                  }}
                >
                  {card.value}
                </strong>
              </div>
            ))}
          </section>
        </section>

        <MissionMap />

        <section style={announcementFeedStyles.shell}>
          <div style={glassCard()}>
            <SectionTitle icon="📢" label="Announcements Feed" action={`${studentAnnouncements.length} active`} />
            <div style={announcementFeedStyles.filterBar}>
              {[
                { key: 'latest', label: 'Latest' },
                { key: 'pinned', label: 'Pinned' },
                { key: 'active', label: 'Active' },
                { key: 'urgency', label: 'Urgency' },
              ].map(item => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setAnnouncementSort(item.key)}
                  style={{
                    ...taskStyles.filterTab,
                    ...(announcementSort === item.key ? taskStyles.filterTabActive : {}),
                  }}
                >
                  {item.label}
                </button>
              ))}
              <div style={{ flex: 1 }} />
              {[
                { key: 'all', label: 'All Students' },
                { key: 'department', label: 'Department-specific' },
                { key: 'internship', label: 'Internship Students' },
                { key: 'final', label: 'Final Year' },
                { key: 'batch', label: 'Selected Batch' },
              ].map(item => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setAnnouncementAudienceFilter(item.key === 'all' ? 'all' : item.label)}
                  style={{
                    ...taskStyles.filterTab,
                    ...(announcementAudienceFilter === (item.key === 'all' ? 'all' : item.label) ? taskStyles.filterTabActive : {}),
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {studentAnnouncements.length === 0 ? (
              <div style={taskStyles.emptyState}>
                No announcements yet. Check back later.
              </div>
            ) : (
              <div style={announcementFeedStyles.grid}>
                {studentAnnouncements.slice(0, 6).map(announcement => {
                  const unread = !readAnnouncementIds.includes(announcement.id);
                  const isNew = (Date.now() - new Date(announcement.createdAt || announcement.dateTime || Date.now()).getTime()) < 24 * 60 * 60 * 1000;
                  const targetLabel = getTargetBadgeLabel(announcement.targetAudience);

                  return (
                    <div
                      key={announcement.id}
                      onClick={() => openAnnouncement(announcement)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={event => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          openAnnouncement(announcement);
                        }
                      }}
                      style={{
                        ...announcementFeedStyles.card,
                        ...(announcement.pinned ? announcementFeedStyles.cardPinned : {}),
                        ...(unread ? announcementFeedStyles.cardUnread : {}),
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', width: '100%' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                          <span style={getTargetBadgeStyle(announcement.targetAudience)}>
                            {targetLabel}
                          </span>
                          {isNew && (
                            <span style={newBadgeStyle}>
                              New
                            </span>
                          )}
                          {announcement.pinned && <span style={{ fontSize: '14px' }}>📌</span>}
                        </div>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                          {getTimeAgo(announcement.createdAt || announcement.dateTime)}
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                        <strong style={{ fontSize: '16px', color: '#fff', fontWeight: 'bold' }}>
                          {announcement.title}
                        </strong>
                        <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                          {announcement.content || announcement.message}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section style={featureTilesStyles.grid}>
          <button type="button" onClick={() => navigate('/community-hub')} style={{ ...featureTilesStyles.tile, ...featureTilesStyles.tileCommunity }}>
            <div style={featureTilesStyles.tileIcon}>💬</div>
            <div style={featureTilesStyles.tileCopy}>
              <div style={featureTilesStyles.tileTitle}>Community Hub</div>
              <div style={featureTilesStyles.tileText}>Ask doubts, answer peers, browse discussions.</div>
              <div style={featureTilesStyles.tileStats}>342 active discussions</div>
            </div>
            <div style={featureTilesStyles.tileAction}>Open Community →</div>
          </button>

          <button type="button" onClick={() => navigate('/yaksha')} style={{ ...featureTilesStyles.tile, ...featureTilesStyles.tileZoro }}>
            <div style={featureTilesStyles.tileIcon}>🤖</div>
            <div style={featureTilesStyles.tileCopy}>
              <div style={featureTilesStyles.tileTitle}>Zoro AI Assistant</div>
              <div style={featureTilesStyles.tileText}>Get instant answers about internships, NOC, deadlines and certificates.</div>
              <div style={featureTilesStyles.tileStats}>Available 24/7</div>
            </div>
            <div style={featureTilesStyles.tileAction}>Ask Zoro →</div>
          </button>

          <button type="button" onClick={() => navigate('/student/leaderboard')} style={{ ...featureTilesStyles.tile, ...featureTilesStyles.tileLeaderboard }}>
            <div style={featureTilesStyles.tileIcon}>🏆</div>
            <div style={featureTilesStyles.tileCopy}>
              <div style={featureTilesStyles.tileTitle}>Leaderboard</div>
              <div style={featureTilesStyles.tileText}>See top contributors and community rankings.</div>
              <div style={featureTilesStyles.tileStats}>340+ contributors</div>
            </div>
            <div style={featureTilesStyles.tileAction}>View Leaderboard →</div>
          </button>

          <button type="button" onClick={() => navigate('/student/tasks')} style={{ ...featureTilesStyles.tile, ...featureTilesStyles.tileTasks }}>
            <div style={featureTilesStyles.tileIcon}>📋</div>
            <div style={featureTilesStyles.tileCopy}>
              <div style={featureTilesStyles.tileTitle}>Internship Tasks</div>
              <div style={featureTilesStyles.tileText}>Track assigned tasks, deadlines and submissions.</div>
              <div style={featureTilesStyles.tileStats}>
                {taskOverview.pending + taskOverview.inProgress} Pending • {taskOverview.completed} Completed
              </div>
            </div>
            <div style={featureTilesStyles.tileAction}>View Tasks →</div>
          </button>
        </section>
      </div>
    </div>
  );
}

const linkBtn = {
  background: 'none', border: 'none', color: '#7c6ff7',
  fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0,
};

const dashPage = {
  minHeight: '100vh',
  background: 'radial-gradient(ellipse at 15% 40%, #12082a 0%, #0d0d1a 45%, #07090f 100%)',
  position: 'relative',
  overflow: 'hidden',
};

const styles = {
  orb1: {
    position: 'fixed', top: '-10%', left: '-8%',
    width: 600, height: 600, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(124,111,247,0.14) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  orb2: {
    position: 'fixed', bottom: '-15%', right: '-5%',
    width: 500, height: 500, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
};

const dashGrid = {
  position: 'relative', zIndex: 1,
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: 20,
};

const dashPageInner = {
  position: 'relative',
  zIndex: 1,
  maxWidth: 1320,
  margin: '0 auto',
  padding: '16px 24px 64px',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
};

const summaryStyles = {
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 0,
  },
  card: {
    flex: '1 1 220px',
    minHeight: 102,
    padding: '16px 18px',
    borderRadius: 18,
    background: 'rgba(255,255,255,0.045)',
    border: '1px solid rgba(255,255,255,0.08)',
    backdropFilter: 'blur(16px)',
    boxShadow: '0 10px 28px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.04)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 8,
  },
  cardFeatured: {
    minHeight: 118,
    background: 'linear-gradient(135deg, rgba(124,111,247,0.16), rgba(59,130,246,0.1))',
    border: '1px solid rgba(124,111,247,0.24)',
    boxShadow: '0 16px 34px rgba(0,0,0,0.28), 0 0 24px rgba(124,111,247,0.12)',
  },
  label: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
  },
  labelFeatured: {
    fontSize: 13,
    letterSpacing: '0.18em',
    color: '#c4b5fd',
  },
  value: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: 800,
    letterSpacing: '-0.02em',
  },
  valueFeatured: {
    fontSize: 28,
    lineHeight: 1,
    color: '#ffffff',
  },
};

const taskStyles = {
  summaryRail: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  summaryPill: {
    minWidth: 130,
    flex: '1 1 150px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '10px 14px',
    borderRadius: 14,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    backdropFilter: 'blur(14px)',
  },
  summaryLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: '#94a3b8',
    fontWeight: 700,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 800,
    color: '#f8fafc',
    letterSpacing: '-0.03em',
  },
  filterBar: {
    display: 'inline-flex',
    flexWrap: 'wrap',
    gap: 8,
    padding: 6,
    borderRadius: 999,
    background: 'rgba(255,255,255,0.035)',
    border: '1px solid rgba(255,255,255,0.07)',
    marginBottom: 12,
  },
  filterTab: {
    border: '1px solid transparent',
    background: 'transparent',
    color: '#94a3b8',
    borderRadius: 999,
    padding: '8px 14px',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  },
  filterTabActive: {
    background: 'linear-gradient(135deg, rgba(124,111,247,0.24), rgba(59,130,246,0.18))',
    border: '1px solid rgba(124,111,247,0.28)',
    color: '#ffffff',
    boxShadow: '0 8px 20px rgba(124,111,247,0.14)',
  },
  emptyState: {
    padding: '18px',
    borderRadius: 16,
    background: 'rgba(255,255,255,0.03)',
    border: '1px dashed rgba(255,255,255,0.12)',
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
  },
  taskList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  taskRow: {
    borderLeft: '3px solid rgba(124,111,247,0.24)',
    borderRadius: 18,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    padding: '14px 14px 12px 12px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    cursor: 'pointer',
    boxShadow: '0 10px 28px rgba(0,0,0,0.18)',
    transition: 'transform 160ms ease, border-color 160ms ease, background 160ms ease',
  },
  taskRowMissed: {
    background: 'rgba(239,68,68,0.06)',
    border: '1px solid rgba(239,68,68,0.16)',
  },
  checkCircle: {
    width: 24,
    height: 24,
    minWidth: 24,
    borderRadius: '50%',
    border: '1.5px solid rgba(148,163,184,0.5)',
    background: 'rgba(15,23,42,0.75)',
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 900,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    cursor: 'pointer',
    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.03)',
  },
  checkCircleActionable: {
    borderColor: 'rgba(124,111,247,0.55)',
    boxShadow: '0 0 0 4px rgba(124,111,247,0.08)',
  },
  checkCircleCompleted: {
    borderColor: 'rgba(34,197,94,0.55)',
    background: 'linear-gradient(135deg, rgba(34,197,94,0.22), rgba(16,185,129,0.2))',
    color: '#dcfce7',
    boxShadow: '0 0 0 4px rgba(34,197,94,0.08)',
  },
  checkCircleMissed: {
    borderColor: 'rgba(239,68,68,0.55)',
    background: 'rgba(239,68,68,0.12)',
    color: '#fecaca',
  },
  rowMain: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  rowTopLine: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
    flexWrap: 'wrap',
  },
  rowTitleWrap: {
    minWidth: 0,
    flex: '1 1 320px',
  },
  taskCategory: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: '0.14em',
    color: '#a5b4fc',
    fontWeight: 800,
    marginBottom: 4,
  },
  rowTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: 800,
    lineHeight: 1.2,
    marginBottom: 4,
  },
  rowTitleCompleted: {
    color: '#d1fae5',
  },
  rowTitleMissed: {
    color: '#fecaca',
  },
  rowDesc: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 1.45,
    display: '-webkit-box',
    WebkitLineClamp: 1,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  rowRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    marginLeft: 'auto',
  },
  deadlineStack: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 3,
  },
  dueLabel: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: 800,
    whiteSpace: 'nowrap',
  },
  dueLabelCompleted: {
    color: '#86efac',
  },
  dueLabelMissed: {
    color: '#fca5a5',
  },
  dueLabelSoon: {
    color: '#fbbf24',
  },
  metaTiny: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  metaTinyCompleted: {
    color: '#86efac',
  },
  metaTinyMissed: {
    color: '#fca5a5',
  },
  statusPill: {
    borderRadius: 999,
    padding: '7px 10px',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.03em',
    whiteSpace: 'nowrap',
    border: '1px solid transparent',
  },
  statusPillPending: {
    background: 'rgba(124,111,247,0.1)',
    color: '#c4b5fd',
    borderColor: 'rgba(124,111,247,0.18)',
  },
  statusPillCompleted: {
    background: 'rgba(34,197,94,0.12)',
    color: '#86efac',
    borderColor: 'rgba(34,197,94,0.2)',
  },
  statusPillMissed: {
    background: 'rgba(239,68,68,0.12)',
    color: '#fca5a5',
    borderColor: 'rgba(239,68,68,0.2)',
  },
  statusPillSoon: {
    background: 'rgba(251,191,36,0.12)',
    color: '#fbbf24',
    borderColor: 'rgba(251,191,36,0.22)',
  },
  expandChevron: {
    color: '#64748b',
    fontSize: 15,
    fontWeight: 900,
    width: 14,
    textAlign: 'center',
  },
  expandHint: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.02em',
  },
  expandHintActive: {
    color: '#c4b5fd',
  },
  expandedPanel: {
    marginTop: 2,
    paddingTop: 10,
    borderTop: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  slotSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  sectionLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: '#94a3b8',
    fontWeight: 700,
  },
  slotChips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotChip: {
    border: '1px solid rgba(124,111,247,0.22)',
    background: 'rgba(124,111,247,0.1)',
    color: '#eef2ff',
    borderRadius: 999,
    padding: '8px 10px',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  },
  slotChipActive: {
    borderColor: 'rgba(124,111,247,0.42)',
    background: 'linear-gradient(135deg, rgba(124,111,247,0.22), rgba(59,130,246,0.16))',
    boxShadow: '0 0 0 4px rgba(124,111,247,0.08)',
  },
  expandedActionRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 10,
  },
  confirmBtn: {
    borderRadius: 14,
    padding: '10px 14px',
    fontSize: 12,
    fontWeight: 800,
    border: '1px solid transparent',
  },
  confirmBtnActive: {
    background: 'linear-gradient(135deg, rgba(124,111,247,0.24), rgba(59,130,246,0.18))',
    borderColor: 'rgba(124,111,247,0.28)',
    color: '#ffffff',
    cursor: 'pointer',
  },
  confirmBtnDisabled: {
    background: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.08)',
    color: '#64748b',
    cursor: 'not-allowed',
  },
  inlineLinkBtn: {
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    color: '#e2e8f0',
    borderRadius: 14,
    padding: '10px 12px',
    fontSize: 12,
    fontWeight: 800,
    cursor: 'pointer',
  },
  completedNote: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    color: '#86efac',
    fontSize: 12,
    fontWeight: 700,
  },
  helpNote: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: 600,
  },
};

const featureTilesStyles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 14,
    marginTop: 2,
  },
  tile: {
    width: '100%',
    textAlign: 'left',
    padding: '18px 18px 16px',
    borderRadius: 18,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'linear-gradient(135deg, rgba(255,255,255,0.055), rgba(255,255,255,0.028))',
    boxShadow: '0 10px 28px rgba(0,0,0,0.22)',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
    cursor: 'pointer',
  },
  tileCommunity: {
    borderColor: 'rgba(59,130,246,0.18)',
  },
  tileZoro: {
    borderColor: 'rgba(124,111,247,0.18)',
  },
  tileLeaderboard: {
    borderColor: 'rgba(245,158,11,0.18)',
  },
  tileTasks: {
    borderColor: 'rgba(34,197,94,0.18)',
  },
  tileIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    display: 'grid',
    placeItems: 'center',
    fontSize: 22,
    flexShrink: 0,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  tileCopy: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  tileTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: 800,
    letterSpacing: '-0.02em',
  },
  tileText: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 1.45,
  },
  tileStats: {
    color: '#a5b4fc',
    fontSize: 12,
    fontWeight: 700,
  },
  tileAction: {
    alignSelf: 'center',
    whiteSpace: 'nowrap',
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 800,
    padding: '10px 12px',
    borderRadius: 14,
    background: 'linear-gradient(135deg, rgba(124,111,247,0.18), rgba(59,130,246,0.16))',
    border: '1px solid rgba(124,111,247,0.22)',
  },
};

const announcementFeedStyles = {
  shell: {
    marginTop: 2,
  },
  filterBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
    alignItems: 'center',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 14,
  },
  card: {
    width: '100%',
    textAlign: 'left',
    borderRadius: 18,
    padding: '16px 16px 14px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'linear-gradient(135deg, rgba(255,255,255,0.055), rgba(255,255,255,0.028))',
    boxShadow: '0 10px 28px rgba(0,0,0,0.22)',
    display: 'grid',
    gap: 12,
    cursor: 'pointer',
  },
  cardPinned: {
    borderColor: 'rgba(251,191,36,0.22)',
    boxShadow: '0 10px 28px rgba(0,0,0,0.22), 0 0 24px rgba(251,191,36,0.08)',
  },
  cardUnread: {
    background: 'linear-gradient(135deg, rgba(124,111,247,0.14), rgba(59,130,246,0.08))',
    borderColor: 'rgba(124,111,247,0.28)',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
  },
  cardHeader: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
    flex: 1,
    minWidth: 0,
  },
  cardTitleWrap: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  cardMetaRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  urgencyBadge: level => ({
    padding: '5px 9px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 800,
    border:
      level === 'Critical'
        ? '1px solid rgba(239,68,68,0.28)'
        : level === 'High'
          ? '1px solid rgba(249,115,22,0.24)'
          : level === 'Medium'
            ? '1px solid rgba(251,191,36,0.22)'
            : '1px solid rgba(148,163,184,0.18)',
    background:
      level === 'Critical'
        ? 'rgba(239,68,68,0.16)'
        : level === 'High'
          ? 'rgba(249,115,22,0.14)'
          : level === 'Medium'
            ? 'rgba(251,191,36,0.14)'
            : 'rgba(148,163,184,0.12)',
    color:
      level === 'Critical'
        ? '#fecaca'
        : level === 'High'
          ? '#fed7aa'
          : level === 'Medium'
            ? '#fde68a'
            : '#cbd5e1',
  }),
  typeBadge: {
    padding: '5px 9px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 800,
    background: 'rgba(56,189,248,0.12)',
    border: '1px solid rgba(56,189,248,0.18)',
    color: '#dbeafe',
  },
  pinnedIcon: {
    fontSize: 14,
    color: '#fde68a',
  },
  readDot: unread => ({
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: unread ? '#7c6ff7' : 'rgba(148,163,184,0.55)',
    boxShadow: unread ? '0 0 0 6px rgba(124,111,247,0.08)' : 'none',
  }),
  cardTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: 800,
    lineHeight: 1.25,
  },
  cardTitleUnread: {
    textShadow: '0 0 16px rgba(255,255,255,0.08)',
  },
  cardPreview: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 1.5,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  cardMetaCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
    flexShrink: 0,
  },
  deadlinePill: (expired, level) => ({
    padding: '5px 9px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 800,
    border:
      expired
        ? '1px solid rgba(239,68,68,0.24)'
        : level === 'Critical'
          ? '1px solid rgba(239,68,68,0.22)'
          : level === 'High'
            ? '1px solid rgba(249,115,22,0.22)'
            : '1px solid rgba(124,111,247,0.18)',
    background:
      expired
        ? 'rgba(239,68,68,0.12)'
        : level === 'Critical'
          ? 'rgba(239,68,68,0.12)'
          : level === 'High'
            ? 'rgba(249,115,22,0.12)'
            : 'rgba(124,111,247,0.12)',
    color:
      expired
        ? '#fecaca'
        : level === 'Critical'
          ? '#fecaca'
          : level === 'High'
            ? '#fed7aa'
            : '#ddd6fe',
  }),
  timeStamp: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  cardBottom: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  categoryPill: {
    padding: '5px 9px',
    borderRadius: 999,
    background: 'rgba(124,111,247,0.12)',
    border: '1px solid rgba(124,111,247,0.18)',
    color: '#e9d5ff',
    fontSize: 11,
    fontWeight: 800,
  },
  adminPill: {
    padding: '5px 9px',
    borderRadius: 999,
    background: 'rgba(34,197,94,0.12)',
    border: '1px solid rgba(34,197,94,0.18)',
    color: '#bbf7d0',
    fontSize: 11,
    fontWeight: 800,
  },
  attachmentBtn: {
    marginLeft: 'auto',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    color: '#eef0f6',
    borderRadius: 14,
    padding: '8px 12px',
    fontSize: 12,
    fontWeight: 800,
  },
  noAttachment: {
    marginLeft: 'auto',
    color: '#64748b',
    fontSize: 12,
    fontWeight: 700,
  },
};

const studentLoginBannerStyles = {
  bar: {
    width: '100%',
    minHeight: 42,
    background: '#0a0a0a',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    fontSize: 14,
    fontWeight: 400,
    letterSpacing: '0.01em',
    padding: '8px 16px',
    marginBottom: 14,
    textAlign: 'center',
  },
  name: {
    fontWeight: 800,
    letterSpacing: '0.08em',
  },
  text: {
    fontWeight: 400,
    color: '#ffffff',
  },
  time: {
    fontWeight: 800,
    color: '#a78bfa',
    whiteSpace: 'nowrap',
  },
};

const headerStyles = {
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
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#22c55e',
    boxShadow: '0 0 0 6px rgba(34,197,94,0.08)',
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
    maxWidth: 560,
  },
  heroNote: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: '14px 16px',
    borderRadius: 18,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 10px 28px rgba(0,0,0,0.22)',
    minWidth: 220,
  },
  heroNoteLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
  },
  heroNoteValue: {
    color: '#eef0f6',
    fontSize: 14,
    fontWeight: 700,
  },
};

const navStyles = {
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
  pointsBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    border: '1px solid rgba(124,111,247,0.22)',
    borderRadius: 14,
    padding: '11px 14px',
    background: 'linear-gradient(135deg, rgba(124,111,247,0.28), rgba(59,130,246,0.18))',
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: 800,
    boxShadow: '0 10px 24px rgba(0,0,0,0.18)',
  },
  pointsIcon: {
    fontSize: 14,
    lineHeight: 1,
  },
  profileBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: '11px 14px',
    background: 'rgba(255,255,255,0.05)',
    color: '#eef0f6',
    fontSize: 13,
    fontWeight: 800,
    boxShadow: '0 10px 24px rgba(0,0,0,0.18)',
  },
  profileWrap: {
    position: 'relative',
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
  markAllBtn: {
    border: '1px solid rgba(124,111,247,0.25)',
    background: 'rgba(124,111,247,0.12)',
    color: '#e9d5ff',
    borderRadius: 14,
    padding: '10px 12px',
    fontSize: 12,
    fontWeight: 800,
    whiteSpace: 'nowrap',
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
  unreadCard: {
    background: 'linear-gradient(135deg, rgba(124,111,247,0.12), rgba(255,255,255,0.05))',
    boxShadow: '0 0 0 1px rgba(124,111,247,0.12), 0 0 28px rgba(124,111,247,0.16)',
    borderColor: 'rgba(124,111,247,0.26)',
    opacity: 1,
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
  announcementAccentRead: {
    background: 'rgba(148,163,184,0.35)',
    boxShadow: 'none',
    opacity: 0.7,
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
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(3,7,18,0.76)',
    backdropFilter: 'blur(12px)',
    display: 'grid',
    placeItems: 'center',
    zIndex: 90,
    padding: 18,
  },
  modalCard: {
    width: 'min(760px, 100%)',
    borderRadius: 26,
    padding: 22,
    background: 'linear-gradient(135deg, rgba(12,14,24,0.98), rgba(17,23,39,0.98))',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 28px 80px rgba(0,0,0,0.55)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    margin: '8px 0 0',
    color: '#f8fafc',
    fontSize: 'clamp(24px, 2.6vw, 34px)',
    letterSpacing: '-0.04em',
    lineHeight: 1.1,
  },
  closeBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.05)',
    color: '#eef0f6',
    flexShrink: 0,
  },
  modalMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  modalContent: {
    whiteSpace: 'pre-wrap',
    color: '#dbeafe',
    lineHeight: 1.8,
    fontSize: 14,
    padding: 18,
    borderRadius: 20,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  linksSection: {
    marginTop: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  linksHeading: {
    color: '#c4b5fd',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    fontWeight: 800,
  },
  linksList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  linkItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: 14,
    borderRadius: 16,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    color: '#eef0f6',
    textDecoration: 'none',
  },
  linkUrl: {
    color: '#94a3b8',
    fontSize: 12,
    wordBreak: 'break-all',
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
  signOutBtn: {
    border: 'none',
    borderRadius: 14,
    padding: '11px 16px',
    background: 'linear-gradient(135deg, #7c6ff7, #6d5fd7)',
    color: '#fff',
    fontWeight: 800,
  },
};

export default StudentDashboard;
