import { useState } from 'react';
import { apiLogin, apiRegister } from '../api';

const ROLES = [
  { id: 'student', label: 'Student Login', desc: 'Access your dashboard, tasks & SP Points' },
  { id: 'admin', label: 'Admin Login', desc: 'Manage students, applications & moderation' },
];

function LoginPage({ onLogin }) {
  const [selectedRole, setSelectedRole] = useState('student');
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [college, setCollege] = useState('');
  const [department, setDepartment] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (isSignUp) {
      if (!name || !email || !password) {
        setError('Please fill in all required fields (Name, Email, Password)');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
      setLoading(true);
      try {
        const payload = {
          name,
          email,
          password,
          college,
          department,
          role: selectedRole
        };
        const data = await apiRegister(payload);
        if (!data?.token || !data?.user) {
          throw new Error('Registration response was incomplete');
        }
        sessionStorage.setItem('samagama-token', data.token);
        sessionStorage.setItem('samagama-user-id', data.user._id);
        onLogin(data.user.role, data.user.email || email, data.user);
      } catch (err) {
        setError(err.message || 'Registration failed. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      if (!email || !password) {
        setError('Please fill in all fields');
        return;
      }
      setLoading(true);
      try {
        const data = await apiLogin(email, password);
        if (!data?.token || !data?.user) {
          throw new Error('Login response was incomplete');
        }
        sessionStorage.setItem('samagama-token', data.token);
        sessionStorage.setItem('samagama-user-id', data.user._id);
        onLogin(data.user.role, data.user.email || email, data.user);
      } catch (err) {
        setError(err.message || 'Invalid credentials. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.orb1} />
      <div style={styles.orb2} />

      <div style={styles.card}>
        <div style={styles.logoWrap}>
          <div style={styles.logo}>⚡</div>
          <div>
            <h1 style={styles.title}>Samagama</h1>
            <p style={styles.subtitle}>IIT Ropar · Internship Portal</p>
          </div>
        </div>

        <div style={styles.roleGrid}>
          {ROLES.map(r => (
            <button
              key={r.id}
              style={{ ...styles.roleBtn, ...(selectedRole === r.id ? styles.roleBtnActive : {}) }}
              onClick={() => setSelectedRole(r.id)}
              type="button"
            >
              <span style={styles.roleLabel}>
                {r.label.replace('Login', isSignUp ? 'Sign Up' : 'Login')}
              </span>
              <span style={styles.roleDesc}>{r.desc}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {isSignUp && (
            <div style={styles.field}>
              <label style={styles.label}>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="John Doe"
                style={styles.input}
                required
              />
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Username or email"
              style={styles.input}
              autoComplete="username"
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={styles.input}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              required
            />
          </div>

          {isSignUp && (
            <>
              <div style={styles.field}>
                <label style={styles.label}>College / University</label>
                <input
                  type="text"
                  value={college}
                  onChange={e => setCollege(e.target.value)}
                  placeholder="IIT Ropar"
                  style={styles.input}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  placeholder="Computer Science"
                  style={styles.input}
                />
              </div>
            </>
          )}

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" style={styles.submitBtn} disabled={loading}>
            {loading 
              ? (isSignUp ? 'Signing up...' : 'Signing in...') 
              : (isSignUp 
                  ? `Sign up as ${selectedRole === 'admin' ? 'Admin' : 'Student'} →` 
                  : `Sign in as ${selectedRole === 'admin' ? 'Admin' : 'Student'} →`
                )
            }
          </button>
        </form>

        <div style={styles.footer}>
          {!isSignUp && (
            <>
              {!showForgot ? (
                <button style={styles.linkBtn} onClick={() => setShowForgot(true)}>
                  Forgot Password?
                </button>
              ) : (
                <p style={styles.forgotMsg}>
                  Reset link sent to {email || 'your email'}. Check your inbox.
                </p>
              )}
            </>
          )}
          <p style={styles.signupHint}>
            {isSignUp ? (
              <>
                Already registered?{' '}
                <button 
                  type="button" 
                  style={styles.linkBtn} 
                  onClick={() => { 
                    setIsSignUp(false); 
                    setError(''); 
                  }}
                >
                  Sign In →
                </button>
              </>
            ) : (
              <>
                Not registered?{' '}
                <button 
                  type="button" 
                  style={styles.linkBtn} 
                  onClick={() => { 
                    setIsSignUp(true); 
                    setError(''); 
                  }}
                >
                  Sign Up →
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'radial-gradient(ellipse at 30% 30%, #1a1040 0%, #0d0d1a 50%, #07090f 100%)',
    position: 'relative',
    overflow: 'hidden',
    padding: '24px',
  },
  orb1: {
    position: 'absolute', top: '-15%', left: '-10%',
    width: 500, height: 500,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(124,111,247,0.18) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  orb2: {
    position: 'absolute', bottom: '-10%', right: '-5%',
    width: 400, height: 400,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  card: {
    position: 'relative', zIndex: 1,
    width: '100%', maxWidth: 480,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 28,
    padding: '40px 36px',
    display: 'flex', flexDirection: 'column', gap: 28,
    backdropFilter: 'blur(20px)',
    boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
  },
  logoWrap: { display: 'flex', alignItems: 'center', gap: 14 },
  logo: {
    width: 48, height: 48,
    borderRadius: 14,
    background: 'linear-gradient(135deg, rgba(124,111,247,0.3), rgba(6,182,212,0.2))',
    border: '1px solid rgba(124,111,247,0.3)',
    display: 'grid', placeItems: 'center',
    fontSize: 22,
  },
  title: {
    margin: 0, fontSize: 22, fontWeight: 800,
    letterSpacing: '-0.03em', color: '#eef0f6',
  },
  subtitle: { margin: 0, fontSize: 12, color: '#64748b' },
  roleGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
  },
  roleBtn: {
    padding: '14px 16px', borderRadius: 16,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#94a3b8', cursor: 'pointer',
    display: 'flex', flexDirection: 'column', gap: 4,
    textAlign: 'left', transition: 'all 0.2s ease',
  },
  roleBtnActive: {
    background: 'rgba(124,111,247,0.14)',
    border: '1px solid rgba(124,111,247,0.35)',
    color: '#eef0f6',
    boxShadow: '0 0 20px rgba(124,111,247,0.15)',
  },
  roleLabel: { fontSize: 13, fontWeight: 700, display: 'block' },
  roleDesc: { fontSize: 11, opacity: 0.7, display: 'block' },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.05em' },
  input: {
    padding: '12px 14px', borderRadius: 12,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#eef0f6', fontSize: 14,
    outline: 'none', transition: 'border-color 0.2s ease',
  },
  error: { margin: 0, color: '#f87171', fontSize: 13 },
  submitBtn: {
    padding: '14px', borderRadius: 14, border: 'none',
    background: 'linear-gradient(135deg, #7c6ff7, #6d5fd7)',
    color: 'white', fontWeight: 700, fontSize: 15,
    cursor: 'pointer', transition: 'all 0.2s ease',
    boxShadow: '0 4px 20px rgba(124,111,247,0.35)',
  },
  footer: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 },
  linkBtn: {
    background: 'none', border: 'none', color: '#7c6ff7',
    fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0,
  },
  forgotMsg: { margin: 0, color: '#6ee7b7', fontSize: 13, textAlign: 'center' },
  signupHint: { margin: 0, color: '#64748b', fontSize: 12 },
};

export default LoginPage;
