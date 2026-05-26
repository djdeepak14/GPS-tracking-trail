import { create } from 'zustand';
import api from '../services/api';

export const useTrackingStore = create((set, get) => ({
  // Session state
  activeRoute: null,
  sessionId: null,
  isTracking: false,
  isPaused: false,

  // Current position
  currentPosition: null,
  currentSpeed: null,
  currentHeading: null,
  currentAltitude: null,
  accuracy: null,

  // Live trail points (for map display)
  livePoints: [],

  // Stats
  stats: {
    totalDistance: 0,
    totalDuration: 0,
    avgSpeed: 0,
    maxSpeed: 0,
    stopCount: 0,
  },

  // Geolocation watcher ID
  watchId: null,

  startTracking: async (options = {}) => {
    try {
      const res = await api.post('/tracking/start', options);
      const { route, sessionId } = res.data.data;
      set({
        activeRoute: route,
        sessionId,
        isTracking: true,
        isPaused: false,
        livePoints: [],
        stats: { totalDistance: 0, totalDuration: 0, avgSpeed: 0, maxSpeed: 0, stopCount: 0 },
      });
      return { success: true, route };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to start tracking' };
    }
  },

  stopTracking: async () => {
    const { activeRoute, watchId } = get();
    if (!activeRoute) return;

    // Stop geolocation watcher
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      set({ watchId: null });
    }

    try {
      const res = await api.post('/tracking/stop', { routeId: activeRoute._id });
      set({
        activeRoute: null,
        sessionId: null,
        isTracking: false,
        isPaused: false,
        livePoints: [],
        currentPosition: null,
      });
      return { success: true, route: res.data.data };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to stop tracking' };
    }
  },

  pauseTracking: async () => {
    const { activeRoute, watchId } = get();
    if (!activeRoute) return;

    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      set({ watchId: null });
    }

    await api.post('/tracking/pause', { routeId: activeRoute._id });
    set({ isPaused: true, isTracking: false });
  },

  resumeTracking: async () => {
    const { activeRoute } = get();
    if (!activeRoute) return;

    await api.post('/tracking/resume', { routeId: activeRoute._id });
    set({ isPaused: false, isTracking: true });
  },

  addPoint: async (position) => {
    const { activeRoute, isTracking, isPaused } = get();
    if (!activeRoute || !isTracking || isPaused) return;

    const { latitude: lat, longitude: lng, altitude, speed, heading, accuracy } = position.coords;
    const timestamp = new Date(position.timestamp);

    const point = { lat, lng, altitude, speed, heading, accuracy, timestamp };

    // Optimistic UI update
    set(state => ({
      currentPosition: { lat, lng },
      currentSpeed: speed,
      currentHeading: heading,
      currentAltitude: altitude,
      accuracy,
      livePoints: [...state.livePoints, point],
    }));

    // Send to backend
    try {
      const res = await api.post('/tracking/point', {
        routeId: activeRoute._id,
        lat, lng, altitude, speed, heading, accuracy,
        timestamp: timestamp.toISOString(),
      });

      if (res.data.data?.stats) {
        set({ stats: res.data.data.stats });
      }
    } catch (err) {
      console.error('Failed to save GPS point:', err.message);
    }
  },

  setWatchId: (id) => set({ watchId: id }),

  updatePosition: (coords) => set({
    currentPosition: { lat: coords.latitude, lng: coords.longitude },
    currentSpeed: coords.speed,
    currentHeading: coords.heading,
    currentAltitude: coords.altitude,
    accuracy: coords.accuracy,
  }),
}));
