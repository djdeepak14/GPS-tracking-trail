const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET /api/users/profile
router.get('/profile', async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('stats.favoriteRoutes', 'name type stats createdAt');
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/users/account
router.delete('/account', async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { isActive: false });
    res.json({ success: true, message: 'Account deactivated' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
