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
const feedbackRoutes = require('./src/routes/feedback.routes');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

// ── Seguridad básica de cabeceras HTTP ──
app.use(helmet());

// ── CORS: acepta tu(s) origen(es) web fijos + cualquier localhost:puerto (necesario para la APK) ──
// html2app (y herramientas similares) sirven tu HTML desde un servidor interno en
// http://localhost:PUERTO_ALEATORIO — el puerto cambia, así que no podemos poner un solo valor fijo.
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5500';
// Si tienes varias URLs web fijas (ej. Netlify + localhost de pruebas), sepáralas por comas:
// FRONTEND_ORIGIN=https://tu-sitio.netlify.app,http://localhost:5500
const FIXED_ORIGINS = FRONTEND_ORIGIN.split(',').map((o) => o.trim());
const LOCALHOST_ANY_PORT = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // curl, health checks, etc.
      if (FIXED_ORIGINS.includes(origin)) return callback(null, true);
      if (LOCALHOST_ANY_PORT.test(origin)) return callback(null, true);
      return callback(new Error('Origen no permitido por CORS: ' + origin));
    },
    credentials: true, // necesario para que la cookie httpOnly viaje (web normal)
  })
);
app.options('*', cors());

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(mongoSanitize()); // limpia claves tipo "$where" o "." en el body/query

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/feedback', feedbackRoutes);

app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 AURA backend escuchando en http://localhost:${PORT}`);
  });
});
