const UserData = require('../models/UserData');

const MAX_ITEMS = 20000; // límite de cordura para evitar payloads abusivos

function isArray(v) {
  return Array.isArray(v);
}

async function getData(req, res, next) {
  try {
    const data = await UserData.findOne({ user: req.userId });
    if (!data) return res.status(404).json({ error: 'Sin datos.' });
    res.json({ data: data.toJSON() });
  } catch (err) {
    next(err);
  }
}

// Reemplaza el documento completo de datos del usuario autenticado.
// Solo puede tocar SU PROPIO documento (req.userId viene del JWT, no del body).
async function putData(req, res, next) {
  try {
    const { movimientos, categorias, presupuestos, metas, usdRate } = req.body || {};

    if (!isArray(movimientos) || !isArray(categorias) || !isArray(presupuestos) || !isArray(metas)) {
      return res.status(400).json({ error: 'Formato de datos inválido.' });
    }
    const total = movimientos.length + categorias.length + presupuestos.length + metas.length;
    if (total > MAX_ITEMS) {
      return res.status(413).json({ error: 'Demasiados registros en un solo guardado.' });
    }

    const update = {
      movimientos,
      categorias,
      presupuestos,
      metas,
    };
    if (typeof usdRate === 'number' && usdRate > 0) {
      update.usdRate = usdRate;
    }

    const data = await UserData.findOneAndUpdate(
      { user: req.userId },
      { $set: update },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({ data: data.toJSON() });
  } catch (err) {
    next(err);
  }
}

module.exports = { getData, putData };
