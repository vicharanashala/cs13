import React, { useEffect, useState, Suspense, useContext } from 'react';
import { Routes, Route, NavLink, useNavigate, useLocation, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import FaqPage from './pages/FaqPage';
import DoubtPage from './pages/DoubtPage';
import YakshaPage from './pages/YakshaPage';
import LeaderboardPage from './pages/LeaderboardPage';
import OverviewPage from './pages/OverviewPage';
import SpurtiPointsPage from './pages/SpurtiPointsPage';
import CommunityHubPage from './pages/CommunityHubPage';
import InternshipTasksPage from './pages/InternshipTasksPage';
import AuthContext from './authContext';
import { apiGetMe } from './api';
import './index.css';

class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// ── Auth bootstrap ─────────────────────────────────────────────────
// Validates a stored JWT against the backend on every app startup.
// Falls back to a "session-expired" login if the token is invalid.

function useAuthBootstrap() {
  const [user, setUser] = useState(null);
  // authLoaded = false while we validate the stored token
  const [authLoaded, setAuthLoaded] = useState(false);
  const [bootError, setBootError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function validateToken() {
      const storedToken = sessionStorage.getItem('samagama-token');
      if (!storedToken) {
        setAuthLoaded(true);
        return;
      }

      try {
        const data = await apiGetMe();
        if (cancelled) return;

        const u = data.user;
        if (!u) throw new Error('No user data');

        // Populate sessionStorage with verified user data
        sessionStorage.setItem('samagama-user-id', u._id);
        sessionStorage.setItem('samagama-role', u.role);
        sessionStorage.setItem('samagama-email', u.email || '');
        sessionStorage.setItem(
          'samagama-display-name',
          u.name || deriveDisplayName(u.role, u.email)
        );

        setUser(u);
      } catch (err) {
        if (cancelled) return;
        // Token invalid or network error — clear all auth data
        sessionStorage.removeItem('samagama-token');
        sessionStorage.removeItem('samagama-user-id');
        sessionStorage.removeItem('samagama-role');
        sessionStorage.removeItem('samagama-email');
        sessionStorage.removeItem('samagama-display-name');
        setBootError('Session expired. Please sign in again.');
      } finally {
        if (!cancelled) setAuthLoaded(true);
      }
    }

    validateToken();
    return () => { cancelled = true; };
  }, []);

  return { user, setUser, authLoaded, bootError };
}

function deriveDisplayName(selectedRole, email) {
  if (selectedRole === 'admin') return 'Samagama Admin Team';
  const localPart = (email || '').split('@')[0].trim();
  if (!localPart) return 'Student';
  const normalized = localPart.replace(/[._-]+/g, ' ').trim();
  if (!normalized || normalized.length < 3) return 'Student';
  if (/^(student|demo|test|user)$/i.test(normalized)) return 'Student';
  const titleCased = normalized
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
  return titleCased.length >= 5 ? titleCased : 'Student';
}

// ── ProtectedRoute Route Guard ──────────────────────────────────────
function ProtectedRoute({ children, role }) {
  const { user } = useContext(AuthContext);
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (role === 'admin' && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  if (role === 'student' && user.role !== 'student') {
    return <Navigate to="/admin" replace />;
  }
  return children;
}

function App() {
  const { user, setUser, authLoaded, bootError } = useAuthBootstrap();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogin(selectedRole, email, userData) {
    const userObj = userData || { role: selectedRole, email };
    setUser(userObj);
    sessionStorage.setItem('samagama-role', userObj.role);
    sessionStorage.setItem('samagama-email', userObj.email || '');
    sessionStorage.setItem('samagama-display-name', deriveDisplayName(userObj.role, userObj.email));
    if (userObj._id) sessionStorage.setItem('samagama-user-id', userObj._id);

    if (userObj.role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  }

  function handleLogout() {
    setUser(null);
    sessionStorage.removeItem('samagama-token');
    sessionStorage.removeItem('samagama-user-id');
    sessionStorage.removeItem('samagama-role');
    sessionStorage.removeItem('samagama-email');
    sessionStorage.removeItem('samagama-display-name');
    navigate('/');
  }

  const isHome = location.pathname === '/';
  const isLogin = location.pathname === '/login';

  // Block all rendering until auth is validated
  if (!authLoaded) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: '#0d0d14',
        color: '#94a3b8',
        fontFamily: 'inherit',
      }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            border: '3px solid rgba(124,111,247,0.3)',
            borderTopColor: '#7c6ff7',
            animation: 'spin 0.8s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <span style={{ fontSize: 15 }}>Loading Samagama…</span>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, handleLogin, handleLogout }}>
      <div className="app-shell">

        {/* ── Homepage Header ───────────────────────────── */}
        {isHome && (
          <header className="home-header">
            <div className="brand-wrap">
              <span className="brand">Samagama</span>
            </div>
            <nav className="nav-links">
              {user ? (
                <button onClick={handleLogout} className="sign-btn ghost">Sign Out</button>
              ) : (
                <NavLink to="/login" className="sign-btn">Sign In</NavLink>
              )}
            </nav>
          </header>
        )}

        {/* ── Boot error banner (session expired) ──────── */}
        {bootError && !user && (
          <div style={{
            background: 'rgba(239,68,68,0.12)',
            borderBottom: '1px solid rgba(239,68,68,0.25)',
            color: '#fca5a5',
            textAlign: 'center',
            padding: '10px 20px',
            fontSize: 14,
          }}>
            {bootError}
          </div>
        )}

        <main className={isHome ? 'page-container home-container' : 'page-container'}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route
              path="/login"
              element={
                user
                  ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} />
                  : <LoginPage onLogin={handleLogin} />
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute role="student">
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute role="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/doubts" element={<DoubtPage user={user} role={user?.role} />} />
            <Route path="/yaksha" element={<YakshaPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route
              path="/student/leaderboard"
              element={
                <ProtectedRoute role="student">
                  <LeaderboardPage variant="student" />
                </ProtectedRoute>
              }
            />
            <Route path="/overview" element={<OverviewPage />} />
            <Route
              path="/student/spurti-points"
              element={
                <ProtectedRoute role="student">
                  <SpurtiPointsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/tasks"
              element={
                <ProtectedRoute role="student">
                  <Suspense fallback={
                    <div style={{
                      color: 'white',
                      padding: '2rem',
                      background: '#0a0a1a',
                      minHeight: '100vh'
                    }}>
                      Loading Internship Tasks...
                    </div>
                  }>
                    <InternshipTasksPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/internship-tasks"
              element={
                <ProtectedRoute role="student">
                  <Suspense fallback={
                    <div style={{
                      color: 'white',
                      padding: '2rem',
                      background: '#0a0a1a',
                      minHeight: '100vh'
                    }}>
                      Loading Internship Tasks...
                    </div>
                  }>
                    <InternshipTasksPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/community-hub"
              element={
                <RouteErrorBoundary
                  fallback={
                    <div style={{
                      minHeight: '60vh', display: 'grid', placeItems: 'center',
                      textAlign: 'center', gap: 12, color: '#eef0f6',
                    }}>
                      <div>
                        <h2 style={{ margin: 0, fontSize: 28 }}>Community Hub</h2>
                        <p style={{ margin: '10px 0 0', color: '#94a3b8' }}>
                          We hit a rendering issue while loading the discussion hub.
                        </p>
                        <button
                          type="button"
                          onClick={() => navigate('/dashboard')}
                          style={{
                            marginTop: 18, border: 'none', borderRadius: 14,
                            padding: '12px 16px',
                            background: 'linear-gradient(135deg, #7c6ff7, #38bdf8)',
                            color: '#fff', fontWeight: 800,
                          }}
                        >
                          Back to Dashboard
                        </button>
                      </div>
                    </div>
                  }
                >
                  <CommunityHubPage />
                </RouteErrorBoundary>
              }
            />
          </Routes>
        </main>
      </div>
    </AuthContext.Provider>
  );
}

export default App;
