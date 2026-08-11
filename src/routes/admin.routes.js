const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/admin.controller');

const router = express.Router();

// Todas las rutas de admin exigen: (1) estar autenticado, (2) tener rol 'admin'
router.use(requireAuth, requireRole('admin'));

router.get('/users', ctrl.listUsers);
router.patch('/users/:id/role', ctrl.changeRole);

module.exports = router;
