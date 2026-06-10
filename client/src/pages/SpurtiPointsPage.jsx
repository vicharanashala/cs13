import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchSpurtiPoints, fetchLeaderboard } from '../api';

const tabs = ['SP Statement', 'Achievements', 'Badges', 'Leaderboard'];

const glass = {
  background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 22,
  backdropFilter: 'blur(18px)',
  boxShadow: '0 12px 32px rgba(0,0,0,0.28)',
};

const badgeChips = ['FAQ Expert', 'Helpful Contributor', 'Top Reviewer', 'Positive Contributor', 'Community Helper'];

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function SpurtiPointsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('SP Statement');
  const [search, setSearch] = useState('');
  const [spurtiData, setSpurtiData] = useState({ spurtiPoints: 0, rank: null, percentile: null, totalStudents: 0, transactions: [] });
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [spurtiError, setSpurtiError] = useState(false);

  const role = sessionStorage.getItem('samagama-role');
  const displayName = sessionStorage.getItem('samagama-display-name') || 'Student';

  // Redirect non-students
  useEffect(() => {
    if (role && role !== 'student') {
      navigate('/dashboard');
    }
  }, [role, navigate]);

  // Fetch SP data on mount
  useEffect(() => {
    fetchSpurtiPoints()
      .then(data => {
        if (data && typeof data.spurtiPoints === 'number') {
          setSpurtiData(data);
        } else {
          setSpurtiError(true);
        }
      })
      .catch(() => setSpurtiError(true))
      .finally(() => setLoading(false));
  }, []);

  // Fetch leaderboard when that tab is opened
  useEffect(() => {
    if (activeTab !== 'Leaderboard') return;
    fetchLeaderboard('all')
      .then(data => {
        if (Array.isArray(data)) {
          setLeaderboard(data.slice(0, 10));
        }
      })
      .catch(() => {});
  }, [activeTab]);

  const filteredStatements = useMemo(() => {
    const query = search.trim().toLowerCase();
    const rows = spurtiData.transactions || [];
    if (!query) return rows;
    return rows.filter(row =>
      [row.reason, row.category, formatDate(row.createdAt)]
        .some(val => (val || '').toLowerCase().includes(query)),
    );
  }, [search, spurtiData.transactions]);

  // Community top 3
  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  const stats = [
    { label: 'Current Rank', value: spurtiData.rank ? `#${spurtiData.rank}` : '—' },
    { label: 'Need for next rank', value: '—' },
    { label: 'Need for Top 50', value: '—' },
  ];

  const comparisonStats = [
    { label: 'Your SP', value: String(spurtiData.spurtiPoints) },
    { label: 'Community Avg', value: spurtiData.totalStudents > 0 ? '—' : '—' },
    { label: 'Top 50 Cutoff', value: '—' },
    { label: 'Top 10 Cutoff', value: '—' },
  ];

  return (
    <div style={page}>
      <div style={bgOrbA} />
      <div style={bgOrbB} />

      <div style={inner}>
        <header style={hero}>
          <button type="button" onClick={() => navigate('/dashboard')} style={backBtn}>
            ← Back to Dashboard
          </button>

          <div style={heroCenter}>
            <div style={eyebrow}>SPURTI POINTS BANK</div>
            <h1 style={title}>{loading ? 'Loading…' : displayName}</h1>
            <p style={subtitle}>Track every credit, debit, rank change, and achievement in one place.</p>
          </div>

          <div style={summaryCard}>
            <span style={summaryLabel}>Current SP Points</span>
            <strong style={summaryValue}>
              {loading ? '—' : spurtiError ? '!' : spurtiData.spurtiPoints}
            </strong>
            <span style={summaryLabel}>Current Rank</span>
            <strong style={summaryValue}>
              {spurtiData.rank ? `#${spurtiData.rank}` : '—'}
            </strong>
          </div>
        </header>

        <section style={statsGrid}>
          <article style={card}>
            <SectionHeading title="Current Standing" />
            <div style={cardStack}>
              {stats.map(item => (
                <LineItem key={item.label} label={item.label} value={item.value} />
              ))}
            </div>
          </article>

          <article style={card}>
            <SectionHeading title="Community Comparison" />
            <div style={pillGrid}>
              {comparisonStats.map(item => (
                <MiniStat key={item.label} label={item.label} value={item.value} />
              ))}
            </div>
          </article>

          <article style={card}>
            <SectionHeading title="Activity Health" />
            <div style={cardStack}>
              <LineItem label="Attendance %" value="98%" />
              <LineItem label="SP Balance" value={String(spurtiData.spurtiPoints)} />
              <LineItem label="Community Rank" value={spurtiData.rank ? `#${spurtiData.rank} of ${spurtiData.totalStudents}` : '—'} />
              <LineItem label="Percentile" value={spurtiData.percentile ? `${spurtiData.percentile}th` : '—'} />
            </div>
          </article>

          <article style={card}>
            <SectionHeading title="Badges" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {badgeChips.map(chip => (
                <span key={chip} style={badgeChip}>{chip}</span>
              ))}
            </div>
          </article>
        </section>

        <section style={chartRow}>
          <article style={{ ...card, flex: '1 1 520px' }}>
            <SectionHeading title="SP Growth Chart" />
            <div style={chartWrap}>
              {loading ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>Loading…</div>
              ) : (
                <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>
                  Chart data will appear here once you have SP transactions.
                </div>
              )}
            </div>
          </article>

          <article style={{ ...card, flex: '1 1 340px' }}>
            <SectionHeading title="What To Do Next" />
            <div style={cardStack}>
              <ActionLine text="Answer questions to earn SP Points" />
              <ActionLine text="Contribute FAQs to earn bonus SP" />
              <ActionLine text="Helpful answers get accepted and earn more" />
            </div>
          </article>
        </section>

        <section style={tabsBar}>
          {tabs.map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{ ...tabBtn, ...(activeTab === tab ? tabBtnActive : {}) }}
            >
              {tab}
            </button>
          ))}
        </section>

        <section style={{ ...card, padding: 20 }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: 32 }}>Loading…</div>
          ) : activeTab === 'SP Statement' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={statementToolbar}>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search SP statement…"
                  style={searchInput}
                />
                <div style={statementHint}>
                  {filteredStatements.length} transaction{filteredStatements.length !== 1 ? 's' : ''}
                </div>
              </div>

              {filteredStatements.length === 0 ? (
                <div style={{ color: '#94a3b8', textAlign: 'center', padding: '32px 0' }}>
                  No SP transactions yet. Start contributing to earn points!
                </div>
              ) : (
                <div style={tableWrap}>
                  <table style={table}>
                    <thead>
                      <tr>
                        <th style={th}>Date</th>
                        <th style={th}>Credit</th>
                        <th style={th}>Debit</th>
                        <th style={th}>Balance</th>
                        <th style={th}>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStatements.map(row => (
                        <tr key={row._id || `${row.createdAt}-${row.reason}`}>
                          <td style={td}>{formatDate(row.createdAt)}</td>
                          <td style={creditCell}>{row.amount > 0 ? `+${row.amount}` : ''}</td>
                          <td style={debitCell}>{row.amount < 0 ? `${row.amount}` : ''}</td>
                          <td style={balanceCell}>{row.balanceAfter ?? '—'}</td>
                          <td style={td}>{row.reason || row.category || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'Achievements' && (
            <div style={achievementsGrid}>
              {[
                { title: 'FAQ Expert', level: spurtiData.spurtiPoints >= 100 ? 'Earned' : 'Locked' },
                { title: 'Helpful Contributor', level: spurtiData.spurtiPoints >= 50 ? 'Earned' : 'Locked' },
                { title: 'Top Reviewer', level: spurtiData.spurtiPoints >= 200 ? 'Earned' : 'Locked' },
                { title: 'Positive Contributor', level: spurtiData.spurtiPoints >= 25 ? 'Earned' : 'Locked' },
              ].map(item => (
                <div key={item.title} style={achievementCard}>
                  <strong style={{ color: item.level === 'Earned' ? '#eef0f6' : '#64748b' }}>{item.title}</strong>
                  <span style={{ color: item.level === 'Earned' ? '#22c55e' : '#94a3b8', fontSize: 12 }}>{item.level}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'Badges' && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {badgeChips.map(chip => (
                <span key={chip} style={badgeChip}>{chip}</span>
              ))}
            </div>
          )}

          {activeTab === 'Leaderboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={topThree}>
                {top3.map(item => (
                  <div key={item._id || item.rank} style={topThreeItem}>
                    <div style={topThreeRank}>{item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : '🥉'}</div>
                    <strong style={{ color: '#eef0f6' }}>{item.name}</strong>
                    <span style={{ color: '#fbbf24', fontWeight: 800 }}>{item.totalSp} SP</span>
                  </div>
                ))}
              </div>

              <div style={tableWrap}>
                <table style={table}>
                  <thead>
                    <tr>
                      <th style={th}>Rank</th>
                      <th style={th}>Name</th>
                      <th style={th}>SP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rest.map(item => (
                      <tr key={item._id || item.rank}>
                        <td style={td}>{item.rank}</td>
                        <td style={td}>{item.name}</td>
                        <td style={{ ...td, color: '#fbbf24', fontWeight: 700 }}>{item.totalSp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        <section style={stickyRankCard}>
          <div>
            <div style={stickyRankLabel}>
              Your SP Points: <strong style={{ color: '#f8fafc' }}>{spurtiData.spurtiPoints}</strong>
            </div>
            <div style={stickyRankLabel}>
              Your Rank: <strong style={{ color: '#f8fafc' }}>{spurtiData.rank ? `#${spurtiData.rank}` : '—'}</strong>
            </div>
          </div>
          <div style={stickyRankText}>Keep contributing to climb the leaderboard.</div>
        </section>
      </div>
    </div>
  );
}

function SectionHeading({ title }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={sectionLabel}>{title}</div>
    </div>
  );
}

function LineItem({ label, value }) {
  return (
    <div style={lineItem}>
      <span style={lineLabel}>{label}</span>
      <strong style={lineValue}>{value}</strong>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div style={miniStat}>
      <span style={lineLabel}>{label}</span>
      <strong style={{ color: '#f8fafc', fontSize: 16 }}>{value}</strong>
    </div>
  );
}

function ActionLine({ text }) {
  return (
    <div style={actionLine}>
      <span style={actionDot} />
      <span style={{ color: '#dbeafe', fontSize: 13, lineHeight: 1.5 }}>{text}</span>
    </div>
  );
}

const page = {
  minHeight: '100vh',
  background: 'radial-gradient(ellipse at 20% 20%, #14102d 0%, #0d0d1a 50%, #07090f 100%)',
  color: '#eef0f6',
  position: 'relative',
  overflow: 'hidden',
};

const bgOrbA = {
  position: 'fixed',
  top: '-10%',
  left: '-8%',
  width: 560,
  height: 560,
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(124,111,247,0.16) 0%, transparent 70%)',
  pointerEvents: 'none',
};

const bgOrbB = {
  position: 'fixed',
  bottom: '-15%',
  right: '-8%',
  width: 500,
  height: 500,
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 70%)',
  pointerEvents: 'none',
};

const inner = {
  position: 'relative',
  zIndex: 1,
  maxWidth: 1360,
  margin: '0 auto',
  padding: '24px 24px 84px',
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
};

const hero = {
  display: 'grid',
  gridTemplateColumns: 'auto 1fr auto',
  gap: 18,
  alignItems: 'center',
  padding: '18px 20px',
  ...glass,
};

const backBtn = {
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.05)',
  color: '#eef0f6',
  borderRadius: 14,
  padding: '10px 14px',
  fontWeight: 700,
};

const heroCenter = {
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const eyebrow = {
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: '0.2em',
  color: '#a78bfa',
  textTransform: 'uppercase',
};

const title = {
  margin: 0,
  fontSize: 'clamp(24px, 3vw, 36px)',
  lineHeight: 1.05,
  letterSpacing: '-0.04em',
};

const subtitle = {
  margin: 0,
  color: '#cbd5e1',
  fontSize: 14,
};

const summaryCard = {
  minWidth: 220,
  padding: 18,
  borderRadius: 20,
  background: 'linear-gradient(135deg, rgba(124,111,247,0.22), rgba(59,130,246,0.14))',
  border: '1px solid rgba(124,111,247,0.26)',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

const summaryLabel = {
  color: '#dbeafe',
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  fontWeight: 700,
};

const summaryValue = {
  color: '#fff',
  fontSize: 20,
  fontWeight: 900,
  marginBottom: 6,
};

const statsGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
  gap: 16,
};

const card = {
  padding: 20,
  borderRadius: 22,
  ...glass,
};

const sectionLabel = {
  color: '#a78bfa',
  fontSize: 13,
  fontWeight: 800,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
};

const cardStack = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const lineItem = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 14,
  padding: '12px 0',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
};

const lineLabel = {
  color: '#94a3b8',
  fontSize: 12,
};

const lineValue = {
  color: '#eef0f6',
  fontSize: 15,
};

const pillGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 10,
};

const miniStat = {
  padding: 14,
  borderRadius: 16,
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.06)',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const badgeChip = {
  padding: '8px 12px',
  borderRadius: 999,
  background: 'rgba(124,111,247,0.12)',
  border: '1px solid rgba(124,111,247,0.22)',
  color: '#dbeafe',
  fontSize: 12,
  fontWeight: 700,
};

const chartRow = {
  display: 'flex',
  gap: 16,
  flexWrap: 'wrap',
};

const chartWrap = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const tabsBar = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
};

const tabBtn = {
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.04)',
  color: '#cbd5e1',
  padding: '10px 14px',
  borderRadius: 14,
  fontWeight: 700,
};

const tabBtnActive = {
  background: 'linear-gradient(135deg, rgba(124,111,247,0.28), rgba(59,130,246,0.16))',
  color: '#fff',
  borderColor: 'rgba(124,111,247,0.3)',
};

const statementToolbar = {
  display: 'flex',
  gap: 12,
  alignItems: 'center',
  flexWrap: 'wrap',
};

const searchInput = {
  minWidth: 280,
  flex: '1 1 280px',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 14,
  color: '#eef0f6',
  padding: '12px 14px',
  outline: 'none',
};

const statementHint = {
  color: '#94a3b8',
  fontSize: 12,
};

const tableWrap = {
  overflow: 'auto',
  maxHeight: 360,
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,0.06)',
};

const table = {
  width: '100%',
  borderCollapse: 'collapse',
  minWidth: 720,
};

const th = {
  position: 'sticky',
  top: 0,
  background: 'rgba(9,12,22,0.96)',
  color: '#cbd5e1',
  textAlign: 'left',
  padding: '14px 14px',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
};

const td = {
  padding: '13px 14px',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
  color: '#eef0f6',
  fontSize: 13,
};

const creditCell = { ...td, color: '#22c55e', fontWeight: 800 };
const debitCell = { ...td, color: '#ef4444', fontWeight: 800 };
const balanceCell = { ...td, color: '#f8fafc', fontWeight: 800 };

const achievementsGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 14,
};

const achievementCard = {
  padding: 16,
  borderRadius: 18,
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.06)',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const topThree = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 12,
};

const topThreeItem = {
  padding: 16,
  borderRadius: 18,
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.06)',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const topThreeRank = {
  fontSize: 18,
};

const stickyRankCard = {
  position: 'sticky',
  bottom: 16,
  marginTop: 4,
  padding: '16px 18px',
  borderRadius: 18,
  background: 'linear-gradient(135deg, rgba(124,111,247,0.2), rgba(56,189,248,0.12))',
  border: '1px solid rgba(124,111,247,0.22)',
  boxShadow: '0 16px 32px rgba(0,0,0,0.24)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
};

const stickyRankLabel = {
  color: '#cbd5e1',
  fontSize: 13,
  fontWeight: 600,
};

const stickyRankText = {
  color: '#eef0f6',
  fontSize: 13,
  fontWeight: 700,
};

export default SpurtiPointsPage;