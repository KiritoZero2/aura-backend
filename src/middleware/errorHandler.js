// Manejador de errores centralizado. Nunca filtra detalles internos (stack, queries) al cliente.
function errorHandler(err, req, res, _next) {
  console.error('❌', err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Datos inválidos.' });
  }
  if (err.code === 11000) {
    return res.status(409).json({ error: 'El recurso ya existe.' });
  }

  res.status(err.status || 500).json({ error: 'Error interno del servidor.' });
}

module.exports = errorHandler;
