const express = require('express');
const router = express.Router();
const { startSession, addPoint, addBatchPoints, stopSession, pauseSession, resumeSession, getActiveSession } = require('../controllers/trackingController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/start', startSession);
router.post('/point', addPoint);
router.post('/batch', addBatchPoints);
router.post('/stop', stopSession);
router.post('/pause', pauseSession);
router.post('/resume', resumeSession);
router.get('/active', getActiveSession);

module.exports = router;
