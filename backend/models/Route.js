const mongoose = require('mongoose');

// Individual GPS point within a route
const gpsPointSchema = new mongoose.Schema({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  altitude: { type: Number, default: null },
  speed: { type: Number, default: null },      // m/s
  heading: { type: Number, default: null },    // degrees
  accuracy: { type: Number, default: null },   // meters
  timestamp: { type: Date, required: true },
}, { _id: false });

// Detected stop within a route
const stopSchema = new mongoose.Schema({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  arrivalTime: { type: Date, required: true },
  departureTime: { type: Date, default: null },
  duration: { type: Number, default: 0 },     // seconds
  address: { type: String, default: '' },
  note: { type: String, default: '' },
}, { _id: true });

// Full route schema
const routeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  name: {
    type: String,
    default: '',
    maxlength: [100, 'Route name cannot exceed 100 characters'],
  },
  description: {
    type: String,
    default: '',
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  tags: [{ type: String, trim: true }],
  color: { type: String, default: '#22d3a0' },
  type: {
    type: String,
    enum: ['hiking', 'driving', 'cycling', 'walking', 'running', 'other'],
    default: 'other',
  },

  // Status
  status: {
    type: String,
    enum: ['active', 'paused', 'completed'],
    default: 'active',
  },
  isFavorite: { type: Boolean, default: false },

  // GPS data
  points: [gpsPointSchema],
  stops: [stopSchema],

  // Computed stats
  stats: {
    totalDistance: { type: Number, default: 0 },    // meters
    totalDuration: { type: Number, default: 0 },    // seconds
    movingTime: { type: Number, default: 0 },       // seconds
    stopTime: { type: Number, default: 0 },         // seconds
    avgSpeed: { type: Number, default: 0 },          // m/s
    maxSpeed: { type: Number, default: 0 },          // m/s
    avgAltitude: { type: Number, default: null },
    maxAltitude: { type: Number, default: null },
    minAltitude: { type: Number, default: null },
    elevationGain: { type: Number, default: 0 },    // meters
    pointCount: { type: Number, default: 0 },
    stopCount: { type: Number, default: 0 },
  },

  // Bounding box for map display
  bounds: {
    north: { type: Number, default: null },
    south: { type: Number, default: null },
    east: { type: Number, default: null },
    west: { type: Number, default: null },
  },

  startTime: { type: Date, default: null },
  endTime: { type: Date, default: null },

  // Session tracking
  sessionId: { type: String, default: null },
}, {
  timestamps: true,
});

// Index for geospatial queries
routeSchema.index({ user: 1, createdAt: -1 });
routeSchema.index({ user: 1, status: 1 });

// Auto-generate name if not set
routeSchema.pre('save', function (next) {
  if (!this.name) {
    const date = (this.startTime || this.createdAt || new Date())
      .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    this.name = `Route – ${date}`;
  }
  next();
});

module.exports = mongoose.model('Route', routeSchema);
