const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Attach user to req.user if a valid token is present.
// Does NOT block requests — use requireAuth() for protected routes.
async function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return next();

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'samagama_jwt_secret_2026');
    const user = await User.findById(payload.userId).select('-password');
    if (user) req.user = user;
  } catch {
    // Invalid/expired token — treat as unauthenticated
  }
  next();
}

// Require a valid JWT. Returns 401 if missing or invalid.
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'samagama_jwt_secret_2026');
    req.userId = payload.userId;
    req.userRole = payload.role;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Require admin role. Must be used after requireAuth.
function requireAdmin(req, res, next) {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = { optionalAuth, requireAuth, requireAdmin };