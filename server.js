require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');

const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/auth.routes');
const dataRoutes = require('./src/routes/data.routes');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

// ── Seguridad básica de cabeceras HTTP ──
app.use(helmet());

// ── CORS: solo el origen configurado puede llamar a la API, y con cookies ──
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5500';
const FIXED_ORIGINS = FRONTEND_ORIGIN.split(',').map(o => o.trim());
const LOCALHOST_ANY_PORT = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (FIXED_ORIGINS.includes(origin)) return callback(null, true);
      if (LOCALHOST_ANY_PORT.test(origin)) return callback(null, true);
      return callback(new Error('Origen no permitido por CORS: ' + origin));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(mongoSanitize()); // limpia claves tipo "$where" o "." en el body/query

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);

app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 AURA backend escuchando en http://localhost:${PORT}`);
  });
});
