import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import departmentRoutes from './routes/department.routes.js';
import visitorRoutes from './routes/visitor.routes.js';
import whatsappRoutes from './routes/whatsapp.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import activityRoutes from './routes/activity.routes.js';
import blacklistRoutes from './routes/blacklist.routes.js';
import settingRoutes from './routes/setting.routes.js';
import { initWhatsApp } from './services/whatsapp.service.js';
import prisma from './config/database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares (Tahap 15)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global API Rate Limiting (Tahap 15 Keamanan)
const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use('/api', globalApiLimiter);

// Health Check (Tahap 14)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'PT Cemindo Gemilang Tbk - VMS API',
    plant: 'Plant Batam',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/activity-logs', activityRoutes);
app.use('/api/blacklist', blacklistRoutes);
app.use('/api/settings', settingRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler (Tahap 15: Hide internal database stack traces in response)
app.use((err, req, res, next) => {
  console.error('[Global Error]', err);
  const status = err.status || 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'An unexpected internal server error occurred'
      : err.message || 'Internal Server Error';
  res.status(status).json({ error: message });
});

// Start Server
const server = app.listen(PORT, async () => {
  console.log(`=======================================================`);
  console.log(`🏭 PT CEMINDO GEMILANG TBK - PLANT BATAM`);
  console.log(`🚀 VISITOR MANAGEMENT SYSTEM (VMS) BACKEND STARTED`);
  console.log(`📡 Listening on Port: ${PORT}`);
  console.log(`🔒 Security: Helmet & Rate Limiting ACTIVE`);
  console.log(`=======================================================`);

  // Initialize WhatsApp Baileys service if WA_SERVICE_URL is not set (standalone mode)
  if (!process.env.WA_SERVICE_URL) {
    try {
      console.log('[WhatsApp] Initializing in-process Baileys service...');
      await initWhatsApp();
    } catch (err) {
      console.warn('[WhatsApp] Startup notice: Baileys initialization will retry:', err.message);
    }
  } else {
    console.log(`[WhatsApp] Dedicated Microservice Mode: ${process.env.WA_SERVICE_URL}`);
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});
