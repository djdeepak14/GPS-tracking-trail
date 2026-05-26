const { validationResult } = require('express-validator');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const logger = require('../config/logger');

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      const field = existingUser.email === email ? 'Email' : 'Username';
      return res.status(400).json({ success: false, message: `${field} already in use` });
    }

    const user = await User.create({ username, email, password });
    const token = generateToken(user._id);

    logger.info(`New user registered: ${user.email}`);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    user.lastSeen = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);
    logger.info(`User logged in: ${user.email}`);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const { username, bio, preferences } = req.body;
    const updateData = {};

    if (username) updateData.username = username;
    if (bio !== undefined) updateData.bio = bio;
    if (preferences) updateData.preferences = { ...(req.user.preferences?.toObject ? req.user.preferences.toObject() : req.user.preferences), ...preferences };

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.json({ success: true, message: 'Profile updated', user });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/auth/password
 * @desc    Change password
 * @access  Private
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};
