const User = require('../models/User');

const ROLES_VALIDOS = ['free', 'premium', 'admin'];

// GET /api/admin/users
// Devuelve lista de todos los usuarios (sin passwordHash, gracias al toJSON del modelo).
async function listUsers(req, res, next) {
  try {
    const users = await User.find().sort({ createdAt: -1 }).limit(1000);
    res.json({ users: users.map((u) => u.toJSON()) });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/admin/users/:id/role
// Cambia el rol de cualquier usuario. Un admin no puede quitarse su propio rol admin.
async function changeRole(req, res, next) {
  try {
    const { id } = req.params;
    const role = req.body.role;

    if (!ROLES_VALIDOS.includes(role)) {
      return res.status(400).json({ error: `Rol inválido. Valores permitidos: ${ROLES_VALIDOS.join(', ')}.` });
    }

    // Buscar el usuario objetivo
    const target = await User.findById(id);
    if (!target) return res.status(404).json({ error: 'Usuario no encontrado.' });

    // Un admin no puede bajarse a sí mismo (evita quedarse sin acceso)
    if (target._id.toString() === req.userId && role !== 'admin') {
      return res.status(400).json({ error: 'No puedes cambiar tu propio rol de administrador.' });
    }

    target.role = role;
    await target.save();

    res.json({ user: target.toJSON() });
  } catch (err) {
    next(err);
  }
}

module.exports = { listUsers, changeRole };
