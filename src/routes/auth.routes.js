const express = require('express');
const rateLimit = require('express-rate-limit');
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/auth.controller');

const router = express.Router();

// Frena intentos de fuerza bruta contra login/registro
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Intenta de nuevo en unos minutos.' },
});

// También limitamos el cambio de contraseña: si alguien roba el token, no queremos
// que pueda probar la contraseña actual a fuerza bruta sin límite.
const passwordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Intenta de nuevo en unos minutos.' },
});

router.post('/register', authLimiter, ctrl.register);
router.post('/login', authLimiter, ctrl.login);
router.post('/logout', ctrl.logout);
router.get('/me', requireAuth, ctrl.me);
router.patch('/profile', requireAuth, ctrl.updateProfile);
router.patch('/password', requireAuth, passwordLimiter, ctrl.changePassword);

module.exports = router;
