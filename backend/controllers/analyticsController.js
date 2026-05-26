const Route = require('../models/Route');
const DailyAnalytics = require('../models/Analytics');
const User = require('../models/User');

/**
 * @route   GET /api/analytics/overview
 * @desc    Get overall stats for user
 */
exports.getOverview = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [recentCount, totalRoutes, activeRoute] = await Promise.all([
      Route.countDocuments({ user: req.user._id, createdAt: { $gte: thirtyDaysAgo } }),
      Route.countDocuments({ user: req.user._id, status: 'completed' }),
      Route.findOne({ user: req.user._id, status: 'active' }).select('name startTime stats'),
    ]);

    res.json({
      success: true,
      data: {
        lifetime: user.stats,
        totalRoutes,
        recentRoutes: recentCount,
        activeRoute,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/analytics/daily
 * @desc    Get daily analytics for past N days
 */
exports.getDailyStats = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    const stats = await DailyAnalytics.find({
      user: req.user._id,
      date: { $gte: startDate },
    }).sort({ date: 1 }).select('-heatmapPoints');

    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/analytics/heatmap
 * @desc    Get heatmap data for past N days
 */
exports.getHeatmap = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    const analytics = await DailyAnalytics.find({
      user: req.user._id,
      date: { $gte: startDate },
    }).select('heatmapPoints');

    const heatmapPoints = analytics.flatMap(a => a.heatmapPoints);
    res.json({ success: true, data: heatmapPoints });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/analytics/stops
 * @desc    Get visited places timeline
 */
exports.getStopsTimeline = async (req, res, next) => {
  try {
    const { limit = 50 } = req.query;

    const routes = await Route.find({
      user: req.user._id,
      'stops.0': { $exists: true },
    }).select('name stops startTime').sort({ createdAt: -1 }).limit(20);

    const allStops = routes.flatMap(r =>
      r.stops.map(s => ({ ...s.toObject(), routeName: r.name, routeId: r._id }))
    );

    // Sort by arrival time desc
    allStops.sort((a, b) => new Date(b.arrivalTime) - new Date(a.arrivalTime));

    res.json({ success: true, data: allStops.slice(0, parseInt(limit)) });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/analytics/speed-chart
 * @desc    Get speed data for a specific route
 */
exports.getSpeedChart = async (req, res, next) => {
  try {
    const { routeId } = req.params;
    const route = await Route.findOne({ _id: routeId, user: req.user._id }).select('points name');

    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });

    const speedData = route.points
      .filter(p => p.speed !== null)
      .map(p => ({
        time: p.timestamp,
        speed: (p.speed || 0) * 3.6, // m/s to km/h
        altitude: p.altitude,
      }));

    res.json({ success: true, data: speedData, routeName: route.name });
  } catch (error) {
    next(error);
  }
};
