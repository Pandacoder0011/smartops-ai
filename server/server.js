import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import connectDB from './config/db.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import DashboardMetric from './models/DashboardMetric.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express App
const app = express();
const server = http.createServer(app);

// Create upload folder if not exists
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Expose socketio to requests
app.set('socketio', io);

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: '*',
  credentials: true
}));

// Request Logging
app.use(morgan('dev'));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use('/api', limiter);

// Request body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);

// Health Check API
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

// Socket connection logic
io.on('connection', (socket) => {
  console.log(`Socket client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`Socket client disconnected: ${socket.id}`);
  });
});

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
    }
  } catch (error) {
    // Silent catch during initial db load
  }
}, 8000);

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`SmartOps AI server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
