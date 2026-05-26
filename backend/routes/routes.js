const express = require('express');
const router = express.Router();
const { getRoutes, getRoute, createRoute, updateRoute, deleteRoute, exportRoute } = require('../controllers/routeController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getRoutes);
router.post('/', createRoute);
router.get('/:id', getRoute);
router.patch('/:id', updateRoute);
router.delete('/:id', deleteRoute);
router.get('/:id/export', exportRoute);

module.exports = router;
