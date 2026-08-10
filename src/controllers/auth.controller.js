const bcrypt = require('bcryptjs');
const User = require('../models/User');
const UserData = require('../models/UserData');
const { setAuthCookie, clearAuthCookie } = require('../middleware/auth');

const SALT_ROUNDS = 12;

async function register(req, res, next) {
  try {
    const name = (req.body.name || '').trim();
    const username = (req.body.username || '').trim().toLowerCase();
    const password = req.body.password || '';

    if (!name || !username || !password) {
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

async function login(req, res, next) {
  try {
    const username = (req.body.username || '').trim().toLowerCase();
    const password = req.body.password || '';

    if (!username || !password) {
      return res.status(400).json({ error: 'Completa todos los campos.' });
    }

    const user = await User.findOne({ username }).select('+passwordHash');
    if (!user) {
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

async function updateProfile(req, res, next) {
  try {
    const name = (req.body.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Nombre inválido.' });
    const user = await User.findByIdAndUpdate(req.userId, { name }, { new: true });
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

module.exports = { register, login, logout, me, updateProfile, changePassword };
