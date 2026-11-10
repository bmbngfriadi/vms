import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import prisma from './db.js';
import authRoutes from './routes/auth.js';
import masterRoutes from './routes/master.js';
import visitsRoutes, { publicRouter } from './routes/visits.js';
import waRoutes from './routes/wa.js';
import featuresRoutes from './routes/features.js';
import { startWhatsApp } from './wa/client.js';

dotenv.config();

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 24) {
  console.error('FATAL: JWT_SECRET wajib diisi minimal 24 karakter. Periksa file .env');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Berjalan di belakang reverse proxy (nginx) — penting agar rate limit per-IP akurat
app.set('trust proxy', 1);

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true); // same-origin / curl
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error('Origin tidak diizinkan'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 2000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Terlalu banyak permintaan. Coba lagi nanti.' }
  })
);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'VMS Plant Batam', time: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/master', masterRoutes);
app.use('/api/visits', visitsRoutes);
app.use('/api/wa', waRoutes);
app.use('/api/features', featuresRoutes);
app.use('/api/public', publicRouter);

app.use((req, res) => res.status(404).json({ error: `Endpoint ${req.method} ${req.path} tidak ditemukan` }));

app.use((err, _req, res, _next) => {
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Terjadi kesalahan pada server' : err.message
  });
});

const server = app.listen(PORT, () => {
  console.log(`VMS API listening on :${PORT}`);
  startWhatsApp().catch((e) => console.error('[WA] Gagal start:', e.message));
});

const shutdown = async () => {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
