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
    secure: true, // obligatorio cuando sameSite es 'none'
    sameSite: 'none', // necesario porque la APK corre en un origen distinto al del backend
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };
}

function setAuthCookie(res, userId) {
  const token = signToken(userId);
  res.cookie(COOKIE_NAME, token, cookieOptions());
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions(), maxAge: 0 });
}

function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
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

module.exports = { requireAuth, setAuthCookie, clearAuthCookie, COOKIE_NAME };
