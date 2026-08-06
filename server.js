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
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true, // necesario para que la cookie httpOnly viaje
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
