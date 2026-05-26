const Route = require('../models/Route');
const User = require('../models/User');
const DailyAnalytics = require('../models/Analytics');
const { calculateDistance, computeRouteStats, detectStop } = require('../utils/geoUtils');
const logger = require('../config/logger');
const { v4: uuidv4 } = require('uuid');

const STOP_THRESHOLD_METERS = 30;  // within 30m = stopped
const STOP_THRESHOLD_SECONDS = 60; // stopped for 60s = a stop

/**
 * @route   POST /api/tracking/start
 * @desc    Start a new tracking session
 */
exports.startSession = async (req, res, next) => {
  try {
    const { name, type, color } = req.body;
    const sessionId = uuidv4();

    const route = await Route.create({
      user: req.user._id,
      name: name || '',
      type: type || 'other',
      color: color || req.user.preferences?.defaultTrailColor || '#22d3a0',
      status: 'active',
      sessionId,
      startTime: new Date(),
    });

    logger.info(`Tracking session started: ${sessionId}`);
    res.status(201).json({ success: true, data: { route, sessionId } });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/tracking/point
 * @desc    Add GPS point to active route
 */
exports.addPoint = async (req, res, next) => {
  try {
    const { routeId, lat, lng, altitude, speed, heading, accuracy, timestamp } = req.body;

    if (!routeId || lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, message: 'routeId, lat, lng are required' });
    }

    const route = await Route.findOne({ _id: routeId, user: req.user._id, status: 'active' });
    if (!route) {
      return res.status(404).json({ success: false, message: 'Active route not found' });
    }

    const newPoint = {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      altitude: altitude ? parseFloat(altitude) : null,
      speed: speed ? parseFloat(speed) : null,
      heading: heading ? parseFloat(heading) : null,
      accuracy: accuracy ? parseFloat(accuracy) : null,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    };

    route.points.push(newPoint);

    // Recompute route stats
    const stats = computeRouteStats(route.points);
    route.stats = { ...route.stats, ...stats };

    // Update bounding box
    updateBounds(route, newPoint);

    // Check for stop detection
    const stop = detectStop(route.points, STOP_THRESHOLD_METERS, STOP_THRESHOLD_SECONDS);
    if (stop && !route.stops.find(s => Math.abs(s.arrivalTime - stop.arrivalTime) < 5000)) {
      route.stops.push(stop);
      route.stats.stopCount = route.stops.length;
    }

    await route.save();

    // Emit real-time update via Socket.IO
    const io = req.app.get('io');
    io.to(`user:${req.user._id}`).emit('location:update', {
      routeId,
      point: newPoint,
      stats: route.stats,
    });

    res.json({ success: true, data: { point: newPoint, stats: route.stats } });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/tracking/batch
 * @desc    Add multiple GPS points (offline sync)
 */
exports.addBatchPoints = async (req, res, next) => {
  try {
    const { routeId, points } = req.body;

    if (!routeId || !Array.isArray(points) || !points.length) {
      return res.status(400).json({ success: false, message: 'routeId and points array required' });
    }

    const route = await Route.findOne({ _id: routeId, user: req.user._id });
    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });

    const validPoints = points.map(p => ({
      lat: parseFloat(p.lat),
      lng: parseFloat(p.lng),
      altitude: p.altitude ? parseFloat(p.altitude) : null,
      speed: p.speed ? parseFloat(p.speed) : null,
      heading: p.heading ? parseFloat(p.heading) : null,
      accuracy: p.accuracy ? parseFloat(p.accuracy) : null,
      timestamp: p.timestamp ? new Date(p.timestamp) : new Date(),
    }));

    route.points.push(...validPoints);
    const stats = computeRouteStats(route.points);
    route.stats = { ...route.stats, ...stats };

    validPoints.forEach(p => updateBounds(route, p));
    await route.save();

    res.json({ success: true, data: { addedPoints: validPoints.length, stats: route.stats } });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/tracking/stop
 * @desc    Stop tracking session and finalize route
 */
exports.stopSession = async (req, res, next) => {
  try {
    const { routeId } = req.body;

    const route = await Route.findOne({ _id: routeId, user: req.user._id });
    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });

    route.status = 'completed';
    route.endTime = new Date();

    // Final stats computation
    const stats = computeRouteStats(route.points);
    route.stats = { ...route.stats, ...stats };

    await route.save();

    // Update user cumulative stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: {
        'stats.totalDistance': route.stats.totalDistance,
        'stats.totalTime': route.stats.totalDuration,
        'stats.totalRoutes': 1,
        'stats.totalStops': route.stats.stopCount,
      },
    });

    // Update daily analytics
    await updateDailyAnalytics(req.user._id, route);

    logger.info(`Route completed: ${routeId}, distance: ${route.stats.totalDistance}m`);
    res.json({ success: true, data: route });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/tracking/pause
 * @desc    Pause tracking session
 */
exports.pauseSession = async (req, res, next) => {
  try {
    const { routeId } = req.body;
    const route = await Route.findOneAndUpdate(
      { _id: routeId, user: req.user._id },
      { $set: { status: 'paused' } },
      { new: true }
    );
    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });
    res.json({ success: true, data: route });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/tracking/resume
 * @desc    Resume paused tracking session
 */
exports.resumeSession = async (req, res, next) => {
  try {
    const { routeId } = req.body;
    const route = await Route.findOneAndUpdate(
      { _id: routeId, user: req.user._id },
      { $set: { status: 'active' } },
      { new: true }
    );
    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });
    res.json({ success: true, data: route });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/tracking/active
 * @desc    Get active tracking session if any
 */
exports.getActiveSession = async (req, res, next) => {
  try {
    const route = await Route.findOne({ user: req.user._id, status: 'active' }).sort({ createdAt: -1 });
    res.json({ success: true, data: route });
  } catch (error) {
    next(error);
  }
};

// === Helpers ===

function updateBounds(route, point) {
  if (!route.bounds.north || point.lat > route.bounds.north) route.bounds.north = point.lat;
  if (!route.bounds.south || point.lat < route.bounds.south) route.bounds.south = point.lat;
  if (!route.bounds.east || point.lng > route.bounds.east) route.bounds.east = point.lng;
  if (!route.bounds.west || point.lng < route.bounds.west) route.bounds.west = point.lng;
}

async function updateDailyAnalytics(userId, route) {
  const dateString = new Date().toISOString().split('T')[0];
  const heatmapSample = route.points
    .filter((_, i) => i % 10 === 0)
    .map(p => ({ lat: p.lat, lng: p.lng, weight: 1 }));

  await DailyAnalytics.findOneAndUpdate(
    { user: userId, dateString },
    {
      $setOnInsert: { date: new Date(), dateString },
      $inc: {
        totalDistance: route.stats.totalDistance,
        totalDuration: route.stats.totalDuration,
        movingTime: route.stats.movingTime,
        stopTime: route.stats.stopTime,
        routeCount: 1,
        stopCount: route.stats.stopCount,
        pointCount: route.stats.pointCount,
      },
      $push: { heatmapPoints: { $each: heatmapSample } },
    },
    { upsert: true }
  );
}
