import 'dotenv/config';

// 🔑 Startup check & debug logging
const requiredEnv = [
  'CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'MONGODB_URI',
];

const missing = requiredEnv.filter(k => !process.env[k]);
if (missing.length) {
  console.error('❌ Missing required env vars:', missing.join(', '));
  process.exit(1);
}
console.log('✅ All required env vars loaded');

console.log('🔑 Env check:');
console.log('  CLERK_PUBLISHABLE_KEY:',
  process.env.CLERK_PUBLISHABLE_KEY ?
  `${process.env.CLERK_PUBLISHABLE_KEY.substring(0, 12)}...` :
  '❌ MISSING');
console.log('  CLERK_SECRET_KEY:',
  process.env.CLERK_SECRET_KEY ?
  `${process.env.CLERK_SECRET_KEY.substring(0, 10)}...` :
  '❌ MISSING');
console.log('  MONGODB_URI:',
  process.env.MONGODB_URI ? '✅ Set' : '❌ MISSING');

import express from 'express';
import http from 'http';
import { initSocket } from './config/socket.js';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import crudRoutes from './routes/crudRoutes.js';
import seedRoutes from './routes/seedRoutes.js';
import { clerkAuthSetup } from './middleware/clerkAuth.js';
import DashboardMetric from './models/DashboardMetric.js';

// Initialize Express App
const app = express();

// Trust proxy for correct client IP detection under reverse proxies (Render, Vercel, etc.)
app.set('trust proxy', 1);

const server = http.createServer(app);

// Connect DB
connectDB();

// Create upload folder if not exists
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Socket.io Setup
const io = initSocket(server);

// Expose socketio to requests
app.set('socketio', io);

// Security & Optimization Middlewares
app.use(helmet());
app.use(compression());

// Request Logging
app.use(morgan('dev'));

// CORS Setup (Supports process.env.CLIENT_URL whitelist in production)
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map(url => url.trim())
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);

    if (process.env.NODE_ENV === 'production') {
      if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        console.warn(`🚨 CORS Blocked: Origin ${origin} not permitted by CLIENT_URL whitelist.`);
        callback(new Error('Blocked by CORS policy'), false);
      }
    } else {
      callback(null, true);
    }
  },
  credentials: true
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // limit each IP to 10000 requests per windowMs (relaxed for local testing)
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use('/api', limiter);

// Webhook Routes (Mounted before express.json() to support SVIX raw body parsing)
app.use('/api/webhooks', webhookRoutes);

// Request body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Apply Clerk middleware globally for incoming requests
app.use(clerkAuthSetup);

// Health Check API
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  let dbStatus = 'disconnected';
  if (dbState === 1) dbStatus = 'connected';
  else if (dbState === 2) dbStatus = 'connecting';
  else if (dbState === 3) dbStatus = 'disconnecting';

  res.status(200).json({
    status: 'healthy',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    clerkConfigured: !!process.env.CLERK_SECRET_KEY,
    database: {
      status: dbStatus,
      readyState: dbState
    }
  });
});

// Protected API Routes
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/seed', seedRoutes);
app.use('/api', crudRoutes);

// Telemetry Metric Emulator for premium visual updates
setInterval(async () => {
  try {
    const metrics = await DashboardMetric.find({});
    if (metrics.length > 0) {
      // Pick a random metric to fluctuate slightly
      const randomIndex = Math.floor(Math.random() * metrics.length);
      const metric = metrics[randomIndex];
      
      const fluctuationPercent = (Math.random() * 4 - 2) / 100; // -2% to +2%
      metric.previousValue = metric.value;
      
      if (metric.name === 'System Uptime') {
        // Keep uptime close to 100
        metric.value = parseFloat(Math.min(100, Math.max(99.8, metric.value + (Math.random() * 0.04 - 0.02))).toFixed(2));
      } else {
        metric.value = parseFloat(Math.max(1, metric.value * (1 + fluctuationPercent)).toFixed(2));
      }
      
      // Update history trend
      if (metric.trend) {
        metric.trend.push(metric.value);
        if (metric.trend.length > 10) {
          metric.trend.shift();
        }
      }
      
      await metric.save();
      io.emit('metric_update', metric);
      io.emit('dashboard-update', metric);
    }
  } catch (error) {
    // Silent catch during initial db load
  }
}, 8000);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('🔴 Global error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5005;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
