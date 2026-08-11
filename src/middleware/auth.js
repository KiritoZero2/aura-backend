const jwt = require('jsonwebtoken');

const COOKIE_NAME = 'aura_token';

function signToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };
}

function setAuthCookie(res, userId) {
  const token = signToken(userId);
  res.cookie(COOKIE_NAME, token, cookieOptions());
  return token;
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions(), maxAge: 0 });
}

function extractToken(req) {
  const fromCookie = req.cookies?.[COOKIE_NAME];
  if (fromCookie) return fromCookie;

  const authHeader = req.headers['authorization'] || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return null;
}

function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'No autenticado.' });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch (err) {
    clearAuthCookie(res);
    return res.status(401).json({ error: 'Sesión inválida o expirada.' });
  }
}

// Igual que requireAuth, pero además busca el username y role en la BD y los adjunta
// a req.username y req.userRole. Lo usan las rutas de feedback y admin.
function requireAuthWithUsername(req, res, next) {
  requireAuth(req, res, async (err) => {
    if (err) return next(err);
    try {
      const User = require('../models/User');
      const user = await User.findById(req.userId);
      if (!user) return res.status(401).json({ error: 'No autenticado.' });
      req.username = user.username;
      req.userRole = user.role || 'free';
      next();
    } catch (e) {
      next(e);
    }
  });
}

// Middleware de roles: úsalo después de requireAuth o requireAuthWithUsername.
// Ejemplo: router.get('/admin/users', requireAuth, requireRole('admin'), ctrl.listUsers)
function requireRole(...roles) {
  return async (req, res, next) => {
    try {
      // Si requireAuthWithUsername ya corrió, tenemos req.userRole; si no, lo buscamos.
      if (!req.userRole) {
        const User = require('../models/User');
        const user = await User.findById(req.userId);
        if (!user) return res.status(401).json({ error: 'No autenticado.' });
        req.userRole = user.role || 'free';
      }
      if (!roles.includes(req.userRole)) {
        return res.status(403).json({ error: 'No tienes permisos para esta acción.' });
      }
      next();
    } catch (e) {
      next(e);
    }
  };
}

module.exports = { requireAuth, requireAuthWithUsername, requireRole, setAuthCookie, clearAuthCookie, COOKIE_NAME };
