import express from 'express';
import cors from 'cors';
import { CORS_ORIGINS } from './config/index.js';
import { ensureSchema } from './db/connection.js';

// Import route modules
import authRoutes from './routes/auth.js';
import calendarRoutes from './routes/calendar.js';
import aiRoutes from './routes/ai.js';
import dashboardRoutes from './routes/dashboard.js';
import socialRoutes from './routes/social.js';

// Initialize database schema
ensureSchema();

// Create Express app
const app = express();

// Global middleware
app.use(cors({ origin: CORS_ORIGINS, credentials: true }));
app.use(express.json());

// Request logger middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[API] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'healthy', service: 'Social Gen SaaS Express Backend' });
});

// Mount route modules
app.use('/api/auth', authRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/social', socialRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ detail: 'Not Found' });
});

export default app;
