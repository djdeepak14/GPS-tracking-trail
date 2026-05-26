/**
 * TrailTracker Pro - Database Seeder
 * Run: npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Route = require('../models/Route');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/trailtracker';

function generateTrail(startLat, startLng, count = 60) {
  const trail = [];
  let lat = startLat, lng = startLng;
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    lat += (Math.random() - 0.5) * 0.001;
    lng += (Math.random() - 0.3) * 0.001;
    trail.push({
      lat: parseFloat(lat.toFixed(6)),
      lng: parseFloat(lng.toFixed(6)),
      altitude: parseFloat((15 + Math.random() * 25).toFixed(1)),
      speed:    parseFloat((1 + Math.random() * 4).toFixed(2)),
      heading:  parseFloat((Math.random() * 360).toFixed(1)),
      accuracy: parseFloat((3 + Math.random() * 7).toFixed(1)),
      timestamp: new Date(now - (count - i) * 12000),
    });
  }
  return trail;
}

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    await User.deleteMany({});
    await Route.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create demo user — let the model's pre-save hook hash the password normally
    const user = await User.create({
      username: 'trailblazer',
      email: 'demo@trailtracker.pro',
      password: 'demo1234',           // plain text — model hashes it
      bio: 'Avid hiker and urban explorer 🥾',
      preferences: {
        units: 'metric',
        theme: 'dark',
        defaultTrailColor: '#22d3a0',
        autoCenter: true,
        trackingInterval: 5000,
      },
      stats: {
        totalDistance: 45230,
        totalTime: 18000,
        totalRoutes: 3,
        totalStops: 8,
      },
    });
    console.log(`👤 Created: ${user.email} / demo1234`);

    const routeConfigs = [
      { name: 'Morning Run – Töölönlahti',  type: 'running',  color: '#22d3a0', lat: 60.1760, lng: 24.9270, daysAgo: 1  },
      { name: 'City Walk – Old Town',        type: 'walking',  color: '#60a5fa', lat: 60.1675, lng: 24.9514, daysAgo: 3  },
      { name: 'Evening Cycle – Seaside',     type: 'cycling',  color: '#f59e0b', lat: 60.1550, lng: 24.9220, daysAgo: 7  },
    ];

    for (const cfg of routeConfigs) {
      const points = generateTrail(cfg.lat, cfg.lng, 60);
      const totalDist = Math.round(2000 + Math.random() * 6000);
      const duration  = Math.round(1800 + Math.random() * 3600);
      const startTime = new Date(Date.now() - cfg.daysAgo * 86400000);
      const endTime   = new Date(startTime.getTime() + duration * 1000);

      await Route.create({
        user:   user._id,
        name:   cfg.name,
        type:   cfg.type,
        color:  cfg.color,
        status: 'completed',
        points,
        stops: [{
          lat:         points[20].lat,
          lng:         points[20].lng,
          arrivalTime: points[20].timestamp,
          departureTime: new Date(points[20].timestamp.getTime() + 240000),
          duration:    240,
          note:        'Rest stop',
        }],
        stats: {
          totalDistance: totalDist,
          totalDuration: duration,
          movingTime:    Math.round(duration * 0.82),
          stopTime:      Math.round(duration * 0.18),
          avgSpeed:      parseFloat((totalDist / duration).toFixed(3)),
          maxSpeed:      parseFloat((totalDist / duration * 1.9).toFixed(3)),
          elevationGain: Math.round(Math.random() * 60),
          pointCount:    60,
          stopCount:     1,
        },
        bounds: {
          north: cfg.lat + 0.012,
          south: cfg.lat - 0.012,
          east:  cfg.lng + 0.012,
          west:  cfg.lng - 0.012,
        },
        startTime,
        endTime,
      });
      console.log(`🗺️  Route: ${cfg.name}`);
    }

    console.log('\n✨ Seed complete!');
    console.log('   Login → demo@trailtracker.pro / demo1234');
    process.exit(0);
  } catch (err) {
    console.error('❌', err.message);
    process.exit(1);
  }
}

seed();
