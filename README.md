# 🗺️ TrailTracker Pro

**Professional GPS Navigation & Route Tracking Application**

A full-stack, production-ready GPS tracking platform combining the best of Google Timeline, Strava, and hiking trail trackers. Built with React, Node.js, MongoDB, Leaflet.js, and Socket.IO.

---

## ✨ Features

### 🛰️ Live GPS Tracking
- Real-time position tracking via browser Geolocation API
- Live polyline trail drawn on map as you move
- Speed, altitude, heading, and accuracy display
- Auto-center map on current location
- Pause/resume tracking sessions

### 🗺️ Interactive Map
- OpenStreetMap powered by Leaflet.js
- 4 map styles: Standard, Dark, Satellite, Terrain
- Custom animated position marker with accuracy ring
- Historical route overlay
- Clickable markers with coordinate popups

### 📁 Route History
- All routes stored in MongoDB with full GPS point arrays
- Search, filter by type, and favorite routes
- Inline route editing (rename)
- Export routes as **GPX**, **CSV**, or **JSON**
- Delete routes with confirmation

### 🛑 Stop Detection
- Automatic stop detection (stays within 30m for 60+ seconds)
- Stop arrival/departure times and duration stored
- Visited places timeline in Analytics

### 📊 Analytics Dashboard
- Daily distance, routes, speed, and stop charts (Chart.js)
- Active vs. rest days doughnut chart
- Lifetime stats: distance, time, routes, stops
- Selectable date ranges: 7d / 14d / 30d / 90d
- Recent stops timeline

### 🔐 Authentication
- JWT-based login/register
- Password hashing with bcryptjs (12 rounds)
- Protected routes, token persistence
- User profile and preference management

### ⚡ Real-Time
- Socket.IO for live location broadcasting
- Multi-device support via user rooms
- Connection heartbeat

---

## 🛠️ Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 18, Vite, Tailwind CSS        |
| Maps      | Leaflet.js, React-Leaflet, OpenStreetMap |
| Charts    | Chart.js, React-ChartJS-2           |
| State     | Zustand                             |
| Realtime  | Socket.IO client                    |
| HTTP      | Axios                               |
| Backend   | Node.js, Express.js                 |
| Database  | MongoDB, Mongoose                   |
| Auth      | JWT, bcryptjs                       |
| Realtime  | Socket.IO                           |
| Logging   | Winston, Morgan                     |
| Security  | Helmet, express-rate-limit, CORS    |

---

## 📂 Project Structure

```
trailtracker-pro/
├── backend/
│   ├── config/          # DB connection, logger
│   ├── controllers/     # Business logic
│   │   ├── authController.js
│   │   ├── routeController.js
│   │   ├── trackingController.js
│   │   └── analyticsController.js
│   ├── middleware/      # Auth, error handler
│   ├── models/          # Mongoose schemas
│   │   ├── User.js
│   │   ├── Route.js
│   │   └── Analytics.js
│   ├── routes/          # Express routers
│   ├── socket/          # Socket.IO manager
│   ├── utils/           # geoUtils, seed.js
│   ├── server.js
│   └── .env.example
│
├── frontend/
│   └── src/
│       ├── components/
│       │   └── ui/      # AppLayout, shared UI
│       ├── pages/       # LoginPage, MapPage, DashboardPage, etc.
│       ├── services/    # api.js, socket.js
│       ├── store/       # Zustand: authStore, trackingStore
│       ├── utils/       # formatters.js
│       └── App.jsx
│
├── docker-compose.yml
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** ≥ 18
- **MongoDB** running locally (`mongod`) OR use MongoDB Atlas
- **npm** or **yarn**

### 1. Clone & install

```bash
git clone https://github.com/your-username/trailtracker-pro.git
cd trailtracker-pro
npm install          # installs concurrently
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 2. Configure environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/trailtracker
JWT_SECRET=your-super-secret-key-at-least-32-chars
CLIENT_URL=http://localhost:5173
```

### 3. Seed demo data (optional)

```bash
cd backend && npm run seed
# Creates: demo@trailtracker.pro / demo1234
```

### 4. Run development servers

```bash
# From project root:
npm run dev
```

This starts:
- **Backend** → http://localhost:5000
- **Frontend** → http://localhost:5173

Open http://localhost:5173 and log in with the demo account or register.

---

## 🐳 Docker

```bash
# Build and run everything (MongoDB + backend + frontend)
docker-compose up --build

# Frontend → http://localhost:3000
# Backend API → http://localhost:5000
```

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET  | `/api/auth/me` | Get current user |
| PUT  | `/api/auth/profile` | Update profile & preferences |
| PUT  | `/api/auth/password` | Change password |

### Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/api/routes` | List routes (paginated, filterable) |
| POST | `/api/routes` | Create route |
| GET  | `/api/routes/:id` | Get route with GPS points |
| PATCH | `/api/routes/:id` | Update route metadata |
| DELETE | `/api/routes/:id` | Delete route |
| GET  | `/api/routes/:id/export?format=gpx|csv|json` | Export route |

### Tracking
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tracking/start` | Start session |
| POST | `/api/tracking/point` | Add GPS point |
| POST | `/api/tracking/batch` | Add points (offline sync) |
| POST | `/api/tracking/pause` | Pause session |
| POST | `/api/tracking/resume` | Resume session |
| POST | `/api/tracking/stop` | Stop & finalize session |
| GET  | `/api/tracking/active` | Get active session |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/overview` | Lifetime stats |
| GET | `/api/analytics/daily?days=30` | Daily breakdown |
| GET | `/api/analytics/heatmap?days=30` | Heatmap points |
| GET | `/api/analytics/stops?limit=50` | Stops timeline |
| GET | `/api/analytics/speed/:routeId` | Speed chart data |

---

## 🗄️ Database Schemas

### User
- `username`, `email`, `password` (hashed)
- `preferences`: units, theme, defaultTrailColor, autoCenter, trackingInterval
- `stats`: totalDistance, totalTime, totalRoutes, totalStops

### Route
- `user` (ref), `name`, `type`, `color`, `status`
- `points[]`: lat, lng, altitude, speed, heading, accuracy, timestamp
- `stops[]`: lat, lng, arrivalTime, departureTime, duration
- `stats`: totalDistance, totalDuration, avgSpeed, maxSpeed, elevationGain…
- `bounds`: north, south, east, west

### DailyAnalytics
- `user`, `dateString` (YYYY-MM-DD)
- Aggregated: totalDistance, totalDuration, routeCount, stopCount, avgSpeed
- `heatmapPoints[]`: lat, lng, weight

---

## 🔒 Security

- Passwords hashed with **bcryptjs** (12 salt rounds)
- JWT tokens (7d expiry, configurable)
- **Helmet** HTTP security headers
- **Rate limiting**: 100 requests / 15 min per IP
- Input validation via **express-validator**
- CORS restricted to `CLIENT_URL`

---

## 🧭 GPS Accuracy Notes

GPS tracking quality depends on:
- **Browser**: Chrome/Edge have the best Geolocation API support
- **Device**: Mobile devices with real GPS hardware are most accurate
- **Environment**: Open sky > indoors; accuracy shows in the map ring
- **HTTPS**: Required for Geolocation in production (localhost works without)

---

## 📱 PWA / Mobile

The app is mobile-responsive. For full PWA support (offline caching, home screen install), add a `vite-plugin-pwa` and a `manifest.json` — the foundation is already in place.

---

## 🤝 Contributing

1. Fork the repo
2. Create your feature branch: `git checkout -b feat/my-feature`
3. Commit changes: `git commit -m 'Add my feature'`
4. Push and open a Pull Request

---

## 📄 License

MIT © TrailTracker Pro
