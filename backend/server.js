/**
 * TrailTracker Pro - Main Server
 * Express + Socket.IO + MongoDB
 */
require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const logger = require('./config/logger');
const { initSocket } = require('./socket/socketManager');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth');
const routeRoutes = require('./routes/routes');
const trackingRoutes = require('./routes/tracking');
const analyticsRoutes = require('./routes/analytics');
const userRoutes = require('./routes/users');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = initSocket(server);
app.set('io', io);

// ======================
// DB CONNECTION
// ======================
connectDB();

// ======================
// SECURITY MIDDLEWARE
// ======================
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  })
);

// ======================
// CORS CONFIG (Fixed for Vercel + Previews)
// ======================
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'https://gps-tracking-trail.vercel.app',
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like Postman, mobile apps)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }

      console.log('🚫 Blocked by CORS:', origin); // Helpful for debugging
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ======================
// RATE LIMITING
// ======================
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
});

app.use('/api/', limiter);

// ======================
// BODY PARSER
// ======================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ======================
// LOGGING
// ======================
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ======================
// HEALTH CHECK ROUTE
// ======================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 TrailTracker Pro API is running',
  });
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'TrailTracker Pro API health OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ======================
// API ROUTES
// ======================
app.use('/api/auth', authRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);

// ======================
// 404 HANDLER
// ======================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ======================
// GLOBAL ERROR HANDLER
// ======================
app.use(errorHandler);

// ======================
// SERVER START
// ======================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  logger.info(`🚀 TrailTracker Pro server running on port ${PORT}`);
  logger.info(`📡 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🌍 Client URL: ${process.env.CLIENT_URL}`);
});

// ======================
// EXPORTS
// ======================
module.exports = { app, server, io };