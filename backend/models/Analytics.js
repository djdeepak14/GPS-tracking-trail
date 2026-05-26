const mongoose = require('mongoose');

const dailyAnalyticsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: { type: Date, required: true },
  dateString: { type: String, required: true }, // YYYY-MM-DD

  // Daily aggregates
  totalDistance: { type: Number, default: 0 },    // meters
  totalDuration: { type: Number, default: 0 },    // seconds
  movingTime: { type: Number, default: 0 },
  stopTime: { type: Number, default: 0 },
  avgSpeed: { type: Number, default: 0 },
  maxSpeed: { type: Number, default: 0 },
  routeCount: { type: Number, default: 0 },
  stopCount: { type: Number, default: 0 },
  pointCount: { type: Number, default: 0 },

  // Heatmap data: array of {lat, lng, weight}
  heatmapPoints: [{
    lat: Number,
    lng: Number,
    weight: { type: Number, default: 1 },
  }],
}, {
  timestamps: true,
});

dailyAnalyticsSchema.index({ user: 1, dateString: 1 }, { unique: true });

module.exports = mongoose.model('DailyAnalytics', dailyAnalyticsSchema);
