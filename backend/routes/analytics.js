const express = require('express');
const router = express.Router();
const { getOverview, getDailyStats, getHeatmap, getStopsTimeline, getSpeedChart } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/overview', getOverview);
router.get('/daily', getDailyStats);
router.get('/heatmap', getHeatmap);
router.get('/stops', getStopsTimeline);
router.get('/speed/:routeId', getSpeedChart);

module.exports = router;
