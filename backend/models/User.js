const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
  },
  avatar: {
    type: String,
    default: null,
  },
  bio: {
    type: String,
    maxlength: [200, 'Bio cannot exceed 200 characters'],
    default: '',
  },
  preferences: {
    units: { type: String, enum: ['metric', 'imperial'], default: 'metric' },
    theme: { type: String, enum: ['dark', 'light', 'auto'], default: 'dark' },
    mapStyle: { type: String, default: 'standard' },
    defaultTrailColor: { type: String, default: '#22d3a0' },
    autoCenter: { type: Boolean, default: true },
    trackingInterval: { type: Number, default: 5000 }, // ms
  },
  stats: {
    totalDistance: { type: Number, default: 0 }, // meters
    totalTime: { type: Number, default: 0 },     // seconds
    totalRoutes: { type: Number, default: 0 },
    totalStops: { type: Number, default: 0 },
    favoriteRoutes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Route' }],
  },
  isActive: { type: Boolean, default: true },
  lastSeen: { type: Date, default: Date.now },
  socketId: { type: String, default: null },
}, {
  timestamps: true,
});

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive data from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
