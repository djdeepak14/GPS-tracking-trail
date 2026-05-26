const Route = require('../models/Route');
const User = require('../models/User');
const { calculateDistance, computeRouteStats } = require('../utils/geoUtils');
const logger = require('../config/logger');

/**
 * @route   GET /api/routes
 * @desc    Get all routes for current user
 */
exports.getRoutes = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, type, search, favorite } = req.query;
    const filter = { user: req.user._id };

    if (status) filter.status = status;
    if (type) filter.type = type;
    if (favorite === 'true') filter.isFavorite = true;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const total = await Route.countDocuments(filter);
    const routes = await Route.find(filter)
      .select('-points') // Exclude heavy GPS data from list
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: routes,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/routes/:id
 * @desc    Get single route with full GPS points
 */
exports.getRoute = async (req, res, next) => {
  try {
    const route = await Route.findOne({ _id: req.params.id, user: req.user._id });
    if (!route) {
      return res.status(404).json({ success: false, message: 'Route not found' });
    }
    res.json({ success: true, data: route });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/routes
 * @desc    Create new route
 */
exports.createRoute = async (req, res, next) => {
  try {
    const { name, description, type, color, tags } = req.body;
    const route = await Route.create({
      user: req.user._id,
      name,
      description,
      type,
      color: color || req.user.preferences?.defaultTrailColor || '#22d3a0',
      tags: tags || [],
      startTime: new Date(),
      status: 'active',
    });

    logger.info(`Route created: ${route._id} by user ${req.user._id}`);
    res.status(201).json({ success: true, data: route });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/routes/:id
 * @desc    Update route metadata
 */
exports.updateRoute = async (req, res, next) => {
  try {
    const { name, description, type, color, tags, isFavorite, status } = req.body;
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (type) updateData.type = type;
    if (color) updateData.color = color;
    if (tags) updateData.tags = tags;
    if (isFavorite !== undefined) updateData.isFavorite = isFavorite;
    if (status) {
      updateData.status = status;
      if (status === 'completed') updateData.endTime = new Date();
    }

    const route = await Route.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });
    res.json({ success: true, data: route });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/routes/:id
 * @desc    Delete route
 */
exports.deleteRoute = async (req, res, next) => {
  try {
    const route = await Route.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });

    // Update user stats
    await User.findByIdAndUpdate(req.user._id, { $inc: { 'stats.totalRoutes': -1 } });

    res.json({ success: true, message: 'Route deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/routes/:id/export
 * @desc    Export route in GPX, JSON, or CSV format
 */
exports.exportRoute = async (req, res, next) => {
  try {
    const { format = 'json' } = req.query;
    const route = await Route.findOne({ _id: req.params.id, user: req.user._id });
    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });

    if (format === 'gpx') {
      const gpx = generateGPX(route);
      res.setHeader('Content-Type', 'application/gpx+xml');
      res.setHeader('Content-Disposition', `attachment; filename="${route.name}.gpx"`);
      return res.send(gpx);
    }

    if (format === 'csv') {
      const csv = generateCSV(route);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${route.name}.csv"`);
      return res.send(csv);
    }

    // Default JSON
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${route.name}.json"`);
    res.json(route);
  } catch (error) {
    next(error);
  }
};

// === Helpers ===

function generateGPX(route) {
  const points = route.points.map(p =>
    `    <trkpt lat="${p.lat}" lon="${p.lng}">
      ${p.altitude ? `<ele>${p.altitude}</ele>` : ''}
      <time>${new Date(p.timestamp).toISOString()}</time>
      ${p.speed ? `<extensions><speed>${p.speed}</speed></extensions>` : ''}
    </trkpt>`
  ).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="TrailTracker Pro">
  <metadata>
    <name>${route.name}</name>
    <time>${route.startTime?.toISOString() || new Date().toISOString()}</time>
  </metadata>
  <trk>
    <name>${route.name}</name>
    <trkseg>
${points}
    </trkseg>
  </trk>
</gpx>`;
}

function generateCSV(route) {
  const header = 'timestamp,latitude,longitude,altitude,speed,heading,accuracy\n';
  const rows = route.points.map(p =>
    `${p.timestamp},${p.lat},${p.lng},${p.altitude || ''},${p.speed || ''},${p.heading || ''},${p.accuracy || ''}`
  ).join('\n');
  return header + rows;
}
