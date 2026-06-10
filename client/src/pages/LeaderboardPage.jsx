import { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { fetchLeaderboard, fetchMyRank } from '../api';

const filters = [
  { key: 'all-time', label: 'All Time', apiValue: 'all' },
  { key: 'monthly', label: 'Monthly', apiValue: 'monthly' },
  { key: 'weekly', label: 'Weekly', apiValue: 'weekly' },
];

const fallbackLeaderboardByPeriod = {
  all: [
    { rank: 1, name: 'Arjun Kumar', college: 'IIT Ropar', totalSp: 2850, periodSp: 0, phase: 'platinum', streak: 24 },
    { rank: 2, name: 'Priya Singh', college: 'IIT Ropar', totalSp: 2640, periodSp: 0, phase: 'platinum', streak: 21 },
    { rank: 3, name: 'Raj Patel', college: 'IIT Ropar', totalSp: 2520, periodSp: 0, phase: 'gold', streak: 18 },
    { rank: 4, name: 'Neha Verma', college: 'IIT Ropar', totalSp: 2380, periodSp: 0, phase: 'gold', streak: 16 },
    { rank: 5, name: 'Aditya Sharma', college: 'IIT Ropar', totalSp: 2250, periodSp: 0, phase: 'gold', streak: 14 },
    { rank: 6, name: 'Riya Gupta', college: 'IIT Ropar', totalSp: 2140, periodSp: 0, phase: 'silver', streak: 13 },
    { rank: 7, name: 'Vikram Singh', college: 'IIT Ropar', totalSp: 2010, periodSp: 0, phase: 'silver', streak: 12 },
    { rank: 8, name: 'Anjali Nair', college: 'IIT Ropar', totalSp: 1920, periodSp: 0, phase: 'silver', streak: 12 },
    { rank: 9, name: 'Deepak Roy', college: 'IIT Ropar', totalSp: 1840, periodSp: 0, phase: 'silver', streak: 10 },
    { rank: 10, name: 'Sneha Das', college: 'IIT Ropar', totalSp: 1760, periodSp: 0, phase: 'silver', streak: 10 },
    { rank: 11, name: 'Rohit Joshi', college: 'IIT Ropar', totalSp: 1680, periodSp: 0, phase: 'bronze', streak: 8 },
    { rank: 12, name: 'Divya Sharma', college: 'IIT Ropar', totalSp: 1590, periodSp: 0, phase: 'bronze', streak: 7 },
  ],
  monthly: [
    { rank: 1, name: 'Arjun Kumar', college: 'IIT Ropar', totalSp: 740, periodSp: 0, phase: 'platinum', streak: 24 },
    { rank: 2, name: 'Priya Singh', college: 'IIT Ropar', totalSp: 690, periodSp: 0, phase: 'platinum', streak: 21 },
    { rank: 3, name: 'Raj Patel', college: 'IIT Ropar', totalSp: 655, periodSp: 0, phase: 'gold', streak: 18 },
    { rank: 4, name: 'Neha Verma', college: 'IIT Ropar', totalSp: 612, periodSp: 0, phase: 'gold', streak: 16 },
    { rank: 5, name: 'Aditya Sharma', college: 'IIT Ropar', totalSp: 585, periodSp: 0, phase: 'gold', streak: 14 },
    { rank: 6, name: 'Riya Gupta', college: 'IIT Ropar', totalSp: 552, periodSp: 0, phase: 'silver', streak: 13 },
    { rank: 7, name: 'Vikram Singh', college: 'IIT Ropar', totalSp: 512, periodSp: 0, phase: 'silver', streak: 12 },
    { rank: 8, name: 'Anjali Nair', college: 'IIT Ropar', totalSp: 478, periodSp: 0, phase: 'silver', streak: 12 },
    { rank: 9, name: 'Deepak Roy', college: 'IIT Ropar', totalSp: 452, periodSp: 0, phase: 'silver', streak: 10 },
    { rank: 10, name: 'Sneha Das', college: 'IIT Ropar', totalSp: 430, periodSp: 0, phase: 'silver', streak: 10 },
    { rank: 11, name: 'Rohit Joshi', college: 'IIT Ropar', totalSp: 395, periodSp: 0, phase: 'bronze', streak: 8 },
    { rank: 12, name: 'Divya Sharma', college: 'IIT Ropar', totalSp: 372, periodSp: 0, phase: 'bronze', streak: 7 },
  ],
  weekly: [
    { rank: 1, name: 'Arjun Kumar', college: 'IIT Ropar', totalSp: 180, periodSp: 0, phase: 'platinum', streak: 24 },
    { rank: 2, name: 'Priya Singh', college: 'IIT Ropar', totalSp: 168, periodSp: 0, phase: 'platinum', streak: 21 },
    { rank: 3, name: 'Raj Patel', college: 'IIT Ropar', totalSp: 161, periodSp: 0, phase: 'gold', streak: 18 },
    { rank: 4, name: 'Neha Verma', college: 'IIT Ropar', totalSp: 149, periodSp: 0, phase: 'gold', streak: 16 },
    { rank: 5, name: 'Aditya Sharma', college: 'IIT Ropar', totalSp: 141, periodSp: 0, phase: 'gold', streak: 14 },
    { rank: 6, name: 'Riya Gupta', college: 'IIT Ropar', totalSp: 136, periodSp: 0, phase: 'silver', streak: 13 },
    { rank: 7, name: 'Vikram Singh', college: 'IIT Ropar', totalSp: 129, periodSp: 0, phase: 'silver', streak: 12 },
    { rank: 8, name: 'Anjali Nair', college: 'IIT Ropar', totalSp: 121, periodSp: 0, phase: 'silver', streak: 12 },
    { rank: 9, name: 'Deepak Roy', college: 'IIT Ropar', totalSp: 116, periodSp: 0, phase: 'silver', streak: 10 },
    { rank: 10, name: 'Sneha Das', college: 'IIT Ropar', totalSp: 108, periodSp: 0, phase: 'silver', streak: 10 },
    { rank: 11, name: 'Rohit Joshi', college: 'IIT Ropar', totalSp: 101, periodSp: 0, phase: 'bronze', streak: 8 },
    { rank: 12, name: 'Divya Sharma', college: 'IIT Ropar', totalSp: 94, periodSp: 0, phase: 'bronze', streak: 7 },
  ],
};

function getInitials(name = '') {
  return name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase();
}

function readLeaderboardState(storageKey) {
  try {
    const raw = sessionStorage.getItem(storageKey);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function LeaderboardPage({ variant = 'public' }) {
  const navigate = useNavigate();
  const isStudentView = variant === 'student';
  const studentName = sessionStorage.getItem('samagama-display-name') || 'You';
  const studentId = sessionStorage.getItem('samagama-user-id');
  const storageKey = isStudentView ? 'samagama-leaderboard-student-state' : 'samagama-leaderboard-public-state';

  const [activeFilter, setActiveFilter] = useState(() => readLeaderboardState(storageKey)?.filter || 'all-time');
  const [searchQuery, setSearchQuery] = useState(() => readLeaderboardState(storageKey)?.search || '');

  const [leaderboard, setLeaderboard] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [loading, setLoading] = useState(true);

  // Persist filter/search to sessionStorage
  useEffect(() => {
    sessionStorage.setItem(storageKey, JSON.stringify({ filter: activeFilter, search: searchQuery }));
  }, [activeFilter, searchQuery, storageKey]);

  // Fetch leaderboard data when period changes
  useEffect(() => {
    const apiPeriod = filters.find(f => f.key === activeFilter)?.apiValue || 'all';
    setLoading(true);
    fetchLeaderboard(apiPeriod)
      .then(data => {
        if (Array.isArray(data)) {
          setLeaderboard(data.length ? data : (fallbackLeaderboardByPeriod[apiPeriod] || []));
        } else {
          setLeaderboard(fallbackLeaderboardByPeriod[apiPeriod] || []);
        }
      })
      .catch(() => setLeaderboard(fallbackLeaderboardByPeriod[apiPeriod] || []))
      .finally(() => setLoading(false));
  }, [activeFilter]);

  // Fetch student's own rank when in student view
  useEffect(() => {
    if (!isStudentView) return;
    fetchMyRank()
      .then(data => {
        if (data && typeof data.rank === 'number') {
          setMyRank(data);
        }
      })
      .catch(() => {});
  }, [isStudentView, activeFilter]);

  // Search
  const visibleData = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    let data = leaderboard;
    if (query) {
      data = data.filter(item =>
        (item.name || '').toLowerCase().includes(query) ||
        (item.college || '').toLowerCase().includes(query),
      );
    }
    return data;
  }, [leaderboard, searchQuery]);

  const top3 = visibleData.slice(0, 3);
  const hasResults = visibleData.length > 0;
  const leaderboardColumns = isStudentView
    ? ['Rank', 'Name', 'College', 'SP Points', 'Period SP']
    : ['Rank', 'Name', 'College', 'SP Points'];

  // Find the current student's row in the leaderboard
  const myLeaderboardEntry = useMemo(() => {
    if (!studentId) return null;
    return leaderboard.find(entry => entry.id === studentId || entry._id === studentId);
  }, [leaderboard, studentId]);

  const studentStats = myRank || {};
  const studentCards = isStudentView
    ? [
        { label: 'Your Rank', value: myRank ? `#${myRank.rank}` : '—' },
        { label: 'Your SP Points', value: myRank?.spurtiPoints ?? leaderboard.find(e => e.id === studentId || e._id === studentId)?.totalSp ?? '—' },
        { label: 'Percentile', value: myRank ? `${myRank.percentile}%` : '—' },
        { label: 'Community Size', value: myRank ? String(myRank.total) : '—' },
      ]
    : [];

  return (
    <div className={`leaderboard-page ${isStudentView ? 'student-mode' : ''}`}>
      <section className="leaderboard-hero leaderboard-surface">
        <div className="hero-content">
          {isStudentView && (
            <div className="leaderboard-back-row">
              <button type="button" className="leaderboard-back-btn" onClick={() => navigate('/dashboard')}>
                ← Back to Dashboard
              </button>
              <span className="leaderboard-back-copy">Personalized student rankings</span>
            </div>
          )}

          <h1 className="hero-title">Community Leaderboard</h1>
          <p className="hero-sub">
            {isStudentView
              ? 'Track your personal rank, compare contributions, and keep climbing the Samagama leaderboard.'
              : 'Top contributors helping students across Samagama'}
          </p>

          {isStudentView && (
            <div className="student-personal-grid">
              {studentCards.map(card => (
                <article key={card.label} className="student-personal-card">
                  <span className="student-personal-label">{card.label}</span>
                  <strong className="student-personal-value">{card.value}</strong>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="leaderboard-toolbar leaderboard-surface">
        <div className="search-bar-wrapper">
          <span className="search-icon">⌕</span>
          <input
            type="text"
            placeholder={isStudentView ? 'Search by name or college' : 'Search contributor by name'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="leaderboard-toolbar-row">
          <div className="filter-chips" role="tablist" aria-label="Leaderboard period">
            {filters.map(filter => (
              <button
                key={filter.key}
                type="button"
                className={`filter-chip ${activeFilter === filter.key ? 'active' : ''}`}
                onClick={() => setActiveFilter(filter.key)}
                aria-pressed={activeFilter === filter.key}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {isStudentView && (
            <div className="leaderboard-toolbar-note">
              Your row is highlighted automatically, and your view stays saved when you come back.
            </div>
          )}
        </div>
      </section>

      <section className="podium-section">
        <div className="section-heading">
          <h2 className="section-title">Top 3 Contributors</h2>
          <p className="section-subtitle">
            A clean look at the leaders for the selected period.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: 32 }}>Loading rankings…</div>
        ) : (
          <div className="podium-container">
            {[
              { podiumClass: 'silver', item: top3[1] },
              { podiumClass: 'gold', item: top3[0] },
              { podiumClass: 'bronze', item: top3[2] },
            ].map(({ podiumClass, item }) => {
              if (!item) return null;
              return (
                <article key={`${item.rank}-${item.name}`} className={`podium-card ${podiumClass}`}>
                  <div className="rank-chip">#{item.rank}</div>
                  <div className="podium-avatar" aria-hidden="true">
                    {getInitials(item.name)}
                  </div>
                  <div className="podium-info">
                    <h3>{item.name}</h3>
                    <p className="podium-sp">{item.totalSp} SP Points</p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="table-section leaderboard-surface">
        <div className="section-heading compact">
          <h2 className="section-title">Leaderboard</h2>
          <p className="section-subtitle">
            Rankings based on SP points for the selected period.
          </p>
        </div>

        <div className="table-wrapper">
          <table className="leaderboard-table">
            <thead>
              <tr>
                {leaderboardColumns.map(column => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={isStudentView ? 5 : 4}>
                    <div className="leaderboard-empty-state">Loading leaderboard…</div>
                  </td>
                </tr>
              ) : hasResults ? (
                visibleData.map(item => {
                  const isMe = item.id === studentId || item._id === studentId;
                  return (
                    <tr key={`${activeFilter}-${item.rank}-${item.name}`} className={isMe ? 'leaderboard-row-you' : ''}>
                      <td className="rank-cell">#{item.rank}</td>
                      <td className="user-cell">
                        <span className="user-avatar">{getInitials(item.name)}</span>
                        <span className="user-name">
                          {item.name}
                          {isMe && <span className="leaderboard-you-badge">You</span>}
                        </span>
                      </td>
                      <td className="user-cell" style={{ fontSize: 12, color: '#94a3b8' }}>{item.college || '—'}</td>
                      <td className="sp-cell">{item.totalSp}</td>
                      {isStudentView && (
                        <td className="sp-cell" style={{ color: '#38bdf8' }}>
                          {item.periodSp > 0 ? `+${item.periodSp}` : '0'}
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={isStudentView ? 5 : 4}>
                    <div className="leaderboard-empty-state">
                      No contributors found.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="leaderboard-bottom">
        {isStudentView ? (
          <article className="cta-card leaderboard-surface student-cta">
            <div className="cta-copy">
              <span className="cta-kicker">Your contribution snapshot</span>
              <h2 className="section-title">Know Your Rank</h2>
              <p className="section-subtitle">
                Here&apos;s your current SP standing for the selected period.
              </p>
            </div>

            <div className="cta-stats signed-in">
              <div className="cta-stat">
                <span className="cta-stat-label">Your SP Points</span>
                <strong className="cta-stat-value">
                  {myLeaderboardEntry?.totalSp ?? myRank?.spurtiPoints ?? '—'}
                </strong>
              </div>
              <div className="cta-stat">
                <span className="cta-stat-label">Your Rank</span>
                <strong className="cta-stat-value">#{myLeaderboardEntry?.rank ?? myRank?.rank ?? '—'}</strong>
              </div>
              <div className="cta-stat">
                <span className="cta-stat-label">Period SP</span>
                <strong className="cta-stat-value">
                  {myLeaderboardEntry?.periodSp > 0 ? `+${myLeaderboardEntry.periodSp}` : '0'}
                </strong>
              </div>
              <div className="cta-stat">
                <span className="cta-stat-label">Percentile</span>
                <strong className="cta-stat-value">
                  {myRank?.percentile ? `${myRank.percentile}%` : '—'}
                </strong>
              </div>
            </div>

            <div className="cta-status-row student-footer-actions">
              <span className="cta-status-label">Status</span>
              <span className="cta-status-pill">Active · {filters.find(f => f.key === activeFilter)?.label}</span>
              <div className="student-footer-buttons">
                <button type="button" className="student-footer-btn" onClick={() => navigate('/dashboard')}>
                  Back to Dashboard
                </button>
                <NavLink to="/student/spurti-points" className="student-footer-btn student-footer-btn-secondary">
                  View Spurti Points
                </NavLink>
              </div>
            </div>
          </article>
        ) : (
          <article className="cta-card leaderboard-surface">
            <div className="cta-copy">
              <span className="cta-kicker">Private leaderboard details</span>
              <h2 className="section-title">Want to know your rank?</h2>
              <p className="section-subtitle">
                Sign in to view your SP Points, rank, achievements, and contribution history.
              </p>
            </div>

            <NavLink to="/login" className="cta-button">
              Sign In Here
            </NavLink>
          </article>
        )}
      </section>
    </div>
  );
}

export default LeaderboardPage;
