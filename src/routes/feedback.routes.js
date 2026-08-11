const express = require('express');
const { requireAuthWithUsername } = require('../middleware/auth');
const ctrl = require('../controllers/feedback.controller');

const router = express.Router();

router.use(requireAuthWithUsername); // hay que estar logueado para leer/escribir, pero se ve el feedback de TODOS

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.post('/:id/vote', ctrl.vote);
router.patch('/:id/status', ctrl.updateStatus); // solo admins (validado en el controller)
router.delete('/:id', ctrl.destroy);            // solo admins (validado en el controller)

module.exports = router;
