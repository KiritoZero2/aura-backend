const express = require('express');
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/data.controller');

const router = express.Router();

router.use(requireAuth); // nada en este archivo es accesible sin sesión válida

router.get('/', ctrl.getData);
router.put('/', ctrl.putData);

module.exports = router;
