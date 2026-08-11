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
const adminRoutes = require('./src/routes/admin.routes');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

// ── Seguridad básica de cabeceras HTTP ──
app.use(helmet());

// ── CORS: acepta tu(s) origen(es) web fijos + cualquier localhost:puerto (necesario para la APK) ──
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5500';
const FIXED_ORIGINS = FRONTEND_ORIGIN.split(',').map((o) => o.trim());
const LOCALHOST_ANY_PORT = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

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

// Subido de 1mb a 2mb: una foto de perfil comprimida (320px, jpeg) en base64 puede pesar
// varios cientos de KB; 2mb da margen sin abrir la puerta a payloads abusivos.
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use(mongoSanitize()); // limpia claves tipo "$where" o "." en el body/query

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/admin', adminRoutes);

app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 QuantumCash backend escuchando en http://localhost:${PORT}`);
  });
});
