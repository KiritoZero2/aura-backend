const Feedback = require('../models/Feedback');

const TIPOS = ['sugerencia', 'bug'];
const ESTADOS = ['recibido', 'en_revision', 'planeado', 'en_progreso', 'completado', 'rechazado'];

// Público para cualquier usuario autenticado: no se filtra por dueño, a propósito,
// porque la idea es que todos vean las sugerencias de todos.
async function list(_req, res, next) {
  try {
    const items = await Feedback.find().sort({ createdAt: -1 }).limit(500);
    res.json({ items: items.map((i) => i.toJSON()) });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const tipo = TIPOS.includes(req.body.tipo) ? req.body.tipo : 'sugerencia';
    const titulo = (req.body.titulo || '').trim();
    const descripcion = (req.body.descripcion || '').trim();
    if (!titulo) return res.status(400).json({ error: 'El título es obligatorio.' });

    const item = await Feedback.create({
      tipo,
      titulo,
      descripcion,
      autor: req.username,
      votantes: [req.username],
      votos: 1,
    });
    res.status(201).json({ item: item.toJSON() });
  } catch (err) {
    next(err);
  }
}

async function vote(req, res, next) {
  try {
    const item = await Feedback.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'No encontrado.' });

    const i = item.votantes.indexOf(req.username);
    if (i > -1) {
      item.votantes.splice(i, 1);
      item.votos = Math.max(0, item.votos - 1);
    } else {
      item.votantes.push(req.username);
      item.votos += 1;
    }
    await item.save();
    res.json({ item: item.toJSON() });
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    // Solo admins pueden cambiar el estado de una sugerencia
    if (req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Solo los administradores pueden cambiar el estado.' });
    }
    const estado = req.body.estado;
    if (!ESTADOS.includes(estado)) return res.status(400).json({ error: 'Estado inválido.' });
    const item = await Feedback.findByIdAndUpdate(req.params.id, { estado }, { new: true });
    if (!item) return res.status(404).json({ error: 'No encontrado.' });
    res.json({ item: item.toJSON() });
  } catch (err) {
    next(err);
  }
}

async function destroy(req, res, next) {
  try {
    // Solo admins pueden eliminar sugerencias
    if (req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Solo los administradores pueden eliminar sugerencias.' });
    }
    const item = await Feedback.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: 'No encontrado.' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, vote, updateStatus, destroy };
