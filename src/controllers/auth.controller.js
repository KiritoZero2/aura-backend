const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const UserData = require('../models/UserData');
const { setAuthCookie, clearAuthCookie } = require('../middleware/auth');

const SALT_ROUNDS = 12;
const googleClient = new OAuth2Client();
const MAX_AVATAR_CHARS = 400000; // ~300KB en base64, de sobra para un avatar ya comprimido a 320px

async function register(req, res, next) {
  try {
    const username = (req.body.username || '').trim().toLowerCase();
    const password = req.body.password || '';
    // name es opcional desde la v6: si no viene, usamos el username como nombre de perfil
    const name = (req.body.name || username).trim();

    if (!username || !password) {
      return res.status(400).json({ error: 'Completa todos los campos.' });
    }
    if (!/^[a-z0-9_]{3,30}$/.test(username)) {
      return res.status(400).json({ error: 'Usuario inválido: solo letras, números y _ (mín. 3 caracteres).' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener mínimo 8 caracteres.' });
    }

    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(409).json({ error: 'Ese usuario ya existe.' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({ name, username, passwordHash });
    const data = await UserData.create({ user: user._id });

    const token = setAuthCookie(res, user._id.toString());
    res.status(201).json({ user: user.toJSON(), data: data.toJSON(), token });
  } catch (err) {
    next(err);
  }
}

function googleConfig(_req, res) {
  res.set('Cache-Control', 'no-store');
  res.json({ clientId: process.env.GOOGLE_CLIENT_ID || null });
}

function buildGoogleUsername(email) {
  const local = String(email.split('@')[0] || '').toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 24);
  return local.length >= 3 ? local : 'google_user';
}

async function uniqueGoogleUsername(email) {
  const base = buildGoogleUsername(email);
  if (!await User.exists({ username: base })) return base;
  for (let attempt = 0; attempt < 8; attempt++) {
    const username = (base.slice(0, 23) + '_' + crypto.randomBytes(3).toString('hex')).slice(0, 30);
    if (!await User.exists({ username })) return username;
  }
  throw new Error('No se pudo reservar un nombre de usuario para la cuenta Google.');
}

async function googleLogin(req, res, next) {
  try {
    const idToken = req.body.idToken;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) return res.status(503).json({ error: 'El acceso con Google aún no está configurado en el servidor.' });
    if (typeof idToken !== 'string' || idToken.length < 20 || idToken.length > 20000) {
      return res.status(400).json({ error: 'La credencial de Google no es válida.' });
    }

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({ idToken, audience: clientId });
      payload = ticket.getPayload();
    } catch (_verificationError) {
      return res.status(401).json({ error: 'La credencial de Google no es válida o expiró.' });
    }
    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      return res.status(401).json({ error: 'Google no confirmó el correo de esta cuenta.' });
    }

    const email = payload.email.trim().toLowerCase();
    let user = await User.findOne({ googleId: payload.sub });
    if (!user) {
      user = await User.findOne({ email }).select('+passwordHash');
      if (user) {
        const googleIsAuthority = email.endsWith('@gmail.com') || Boolean(payload.hd);
        if (user.googleId && user.googleId !== payload.sub) {
          return res.status(409).json({ error: 'Ese correo ya está vinculado a otra cuenta de Google.' });
        }
        if (!googleIsAuthority) {
          return res.status(409).json({ error: 'Ya existe una cuenta con ese correo. Entra con su método original para evitar duplicar datos.' });
        }
        user.googleId = payload.sub;
        user.email = email;
        await user.save();
      } else {
        const username = await uniqueGoogleUsername(email);
        const name = String(payload.name || email.split('@')[0]).trim().slice(0, 60) || username;
        try {
          user = await User.create({ name, username, email, googleId: payload.sub });
        } catch (createError) {
          if (createError.code !== 11000) throw createError;
          user = await User.findOne({ googleId: payload.sub });
          if (!user) return res.status(409).json({ error: 'La cuenta Google ya está asociada. Intenta iniciar sesión otra vez.' });
        }
      }
    }

    let data = await UserData.findOne({ user: user._id });
    if (!data) data = await UserData.create({ user: user._id });
    const token = setAuthCookie(res, user._id.toString());
    return res.json({ user: user.toJSON(), data: data.toJSON(), token });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const username = (req.body.username || '').trim().toLowerCase();
    const password = req.body.password || '';

    if (!username || !password) {
      return res.status(400).json({ error: 'Completa todos los campos.' });
    }

    const user = await User.findOne({ username }).select('+passwordHash');
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
    }

    let data = await UserData.findOne({ user: user._id });
    if (!data) data = await UserData.create({ user: user._id });

    const token = setAuthCookie(res, user._id.toString());
    res.json({ user: user.toJSON(), data: data.toJSON(), token });
  } catch (err) {
    next(err);
  }
}

function logout(_req, res) {
  clearAuthCookie(res);
  res.json({ ok: true });
}

async function me(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(401).json({ error: 'No autenticado.' });
    let data = await UserData.findOne({ user: user._id });
    if (!data) data = await UserData.create({ user: user._id });
    res.json({ user: user.toJSON(), data: data.toJSON() });
  } catch (err) {
    next(err);
  }
}

// Actualiza nombre y/o foto de perfil.
// avatarUrl en el body puede ser:
//   - ausente (undefined)  -> no se toca la foto actual
//   - null                  -> se elimina la foto (vuelve a mostrar la inicial)
//   - "data:image/..."      -> se guarda la nueva foto (ya viene comprimida desde el navegador)
async function updateProfile(req, res, next) {
  try {
    const name = (req.body.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Nombre inválido.' });

    const update = { name };

    if (Object.prototype.hasOwnProperty.call(req.body, 'avatarUrl')) {
      const avatarUrl = req.body.avatarUrl;
      if (avatarUrl === null) {
        update.avatarUrl = null;
      } else if (typeof avatarUrl === 'string' && avatarUrl.startsWith('data:image/')) {
        if (avatarUrl.length > MAX_AVATAR_CHARS) {
          return res.status(413).json({ error: 'La imagen es demasiado grande.' });
        }
        update.avatarUrl = avatarUrl;
      } else {
        return res.status(400).json({ error: 'Formato de imagen inválido.' });
      }
    }

    const user = await User.findByIdAndUpdate(req.userId, update, { new: true, runValidators: true });
    res.json({ user: user.toJSON() });
  } catch (err) {
    next(err);
  }
}

// Cambiar contraseña: exige la contraseña actual para evitar que alguien con el celular
// desbloqueado (o el token robado desde localStorage) pueda tomar la cuenta por completo.
async function changePassword(req, res, next) {
  try {
    const currentPassword = req.body.currentPassword || '';
    const newPassword = req.body.newPassword || '';

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Completa todos los campos.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener mínimo 8 caracteres.' });
    }

    const user = await User.findById(req.userId).select('+passwordHash');
    if (!user) return res.status(401).json({ error: 'No autenticado.' });

    if (!user.passwordHash) {
      return res.status(400).json({ error: 'Esta cuenta usa Google para iniciar sesión; continúa usando Google.' });
    }

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'La contraseña actual no es correcta.' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await user.save();

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, googleConfig, googleLogin, logout, me, updateProfile, changePassword };
