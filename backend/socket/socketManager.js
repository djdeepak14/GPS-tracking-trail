const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../config/logger');

let io;

/**
 * Initialize Socket.IO server with authentication middleware
 */
function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // JWT authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('_id username email');
      if (!user) return next(new Error('User not found'));

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    logger.info(`Socket connected: ${socket.id} for user ${userId}`);

    // Join user-specific room
    socket.join(`user:${userId}`);

    // Update user socket ID
    User.findByIdAndUpdate(userId, { socketId: socket.id, lastSeen: new Date() }).catch(() => {});

    // Emit connection confirmation
    socket.emit('connected', {
      socketId: socket.id,
      userId,
      timestamp: new Date().toISOString(),
    });

    // Handle joining a tracking session room (for multi-device)
    socket.on('join:session', (sessionId) => {
      socket.join(`session:${sessionId}`);
      logger.debug(`User ${userId} joined session: ${sessionId}`);
    });

    // Handle leaving a session room
    socket.on('leave:session', (sessionId) => {
      socket.leave(`session:${sessionId}`);
    });

    // Handle real-time location broadcast from client
    socket.on('location:broadcast', (data) => {
      // Broadcast to all other devices of the same user
      socket.to(`user:${userId}`).emit('location:received', {
        ...data,
        fromSocket: socket.id,
        timestamp: new Date().toISOString(),
      });
    });

    // Handle tracking status changes
    socket.on('tracking:status', (data) => {
      socket.to(`user:${userId}`).emit('tracking:status:update', data);
    });

    // Heartbeat for connection health
    socket.on('ping:heartbeat', () => {
      socket.emit('pong:heartbeat', { timestamp: Date.now() });
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id} (${reason})`);
      User.findByIdAndUpdate(userId, { socketId: null, lastSeen: new Date() }).catch(() => {});
    });
  });

  logger.info('✅ Socket.IO initialized');
  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}

module.exports = { initSocket, getIO };
