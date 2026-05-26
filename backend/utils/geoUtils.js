/**
 * Haversine formula - calculate distance between two GPS coords in meters
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Compute aggregate stats from array of GPS points
 */
function computeRouteStats(points) {
  if (!points || points.length < 2) {
    return {
      totalDistance: 0,
      totalDuration: 0,
      movingTime: 0,
      stopTime: 0,
      avgSpeed: 0,
      maxSpeed: 0,
      avgAltitude: null,
      maxAltitude: null,
      minAltitude: null,
      elevationGain: 0,
      pointCount: points?.length || 0,
    };
  }

  let totalDistance = 0;
  let maxSpeed = 0;
  let totalSpeedSum = 0;
  let speedCount = 0;
  let elevationGain = 0;
  const altitudes = points.filter(p => p.altitude !== null).map(p => p.altitude);

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];

    totalDistance += calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng);

    if (curr.speed !== null) {
      if (curr.speed > maxSpeed) maxSpeed = curr.speed;
      totalSpeedSum += curr.speed;
      speedCount++;
    }

    if (altitudes.length > 1 && curr.altitude !== null && prev.altitude !== null) {
      const gain = curr.altitude - prev.altitude;
      if (gain > 0) elevationGain += gain;
    }
  }

  const firstTime = new Date(points[0].timestamp).getTime();
  const lastTime = new Date(points[points.length - 1].timestamp).getTime();
  const totalDuration = Math.max(0, (lastTime - firstTime) / 1000); // seconds

  const avgSpeed = speedCount > 0 ? totalSpeedSum / speedCount : totalDistance / Math.max(1, totalDuration);

  return {
    totalDistance: Math.round(totalDistance),
    totalDuration: Math.round(totalDuration),
    movingTime: Math.round(totalDuration * 0.8), // approximation
    stopTime: Math.round(totalDuration * 0.2),
    avgSpeed: parseFloat(avgSpeed.toFixed(3)),
    maxSpeed: parseFloat(maxSpeed.toFixed(3)),
    avgAltitude: altitudes.length ? parseFloat((altitudes.reduce((a, b) => a + b, 0) / altitudes.length).toFixed(1)) : null,
    maxAltitude: altitudes.length ? parseFloat(Math.max(...altitudes).toFixed(1)) : null,
    minAltitude: altitudes.length ? parseFloat(Math.min(...altitudes).toFixed(1)) : null,
    elevationGain: parseFloat(elevationGain.toFixed(1)),
    pointCount: points.length,
  };
}

/**
 * Detect if the last N points indicate a stop
 * Returns stop object or null
 */
function detectStop(points, thresholdMeters = 30, thresholdSeconds = 60) {
  if (points.length < 5) return null;

  const recentPoints = points.slice(-20); // Check last 20 points
  const center = {
    lat: recentPoints[0].lat,
    lng: recentPoints[0].lng,
  };

  // Check if all recent points are within threshold distance
  const allClose = recentPoints.every(p =>
    calculateDistance(center.lat, center.lng, p.lat, p.lng) <= thresholdMeters
  );

  if (!allClose) return null;

  const firstTime = new Date(recentPoints[0].timestamp).getTime();
  const lastTime = new Date(recentPoints[recentPoints.length - 1].timestamp).getTime();
  const duration = (lastTime - firstTime) / 1000;

  if (duration < thresholdSeconds) return null;

  // Compute centroid
  const avgLat = recentPoints.reduce((s, p) => s + p.lat, 0) / recentPoints.length;
  const avgLng = recentPoints.reduce((s, p) => s + p.lng, 0) / recentPoints.length;

  return {
    lat: parseFloat(avgLat.toFixed(6)),
    lng: parseFloat(avgLng.toFixed(6)),
    arrivalTime: new Date(firstTime),
    departureTime: null,
    duration: Math.round(duration),
  };
}

/**
 * Convert meters to km or miles
 */
function formatDistance(meters, unit = 'metric') {
  if (unit === 'imperial') {
    const miles = meters / 1609.344;
    return miles < 0.1 ? `${Math.round(meters * 3.28084)} ft` : `${miles.toFixed(2)} mi`;
  }
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(2)} km`;
}

/**
 * Convert m/s to km/h or mph
 */
function formatSpeed(mps, unit = 'metric') {
  if (unit === 'imperial') return `${(mps * 2.23694).toFixed(1)} mph`;
  return `${(mps * 3.6).toFixed(1)} km/h`;
}

module.exports = { calculateDistance, computeRouteStats, detectStop, formatDistance, formatSpeed };
