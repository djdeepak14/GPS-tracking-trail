/**
 * Format distance in meters to human-readable string
 */
export function formatDistance(meters, unit = 'metric') {
  if (!meters && meters !== 0) return '—';
  if (unit === 'imperial') {
    const miles = meters / 1609.344;
    return miles < 0.1 ? `${Math.round(meters * 3.28084)} ft` : `${miles.toFixed(2)} mi`;
  }
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(2)} km`;
}

/**
 * Format speed in m/s to km/h or mph
 */
export function formatSpeed(mps, unit = 'metric') {
  if (!mps && mps !== 0) return '—';
  if (unit === 'imperial') return `${(mps * 2.23694).toFixed(1)} mph`;
  return `${(mps * 3.6).toFixed(1)} km/h`;
}

/**
 * Format duration in seconds to HH:MM:SS or human-readable
 */
export function formatDuration(seconds, short = false) {
  if (!seconds && seconds !== 0) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (short) {
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

/**
 * Format date to readable string
 */
export function formatDate(date, opts = {}) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...opts,
  });
}

/**
 * Format date + time
 */
export function formatDateTime(date) {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/**
 * Get route type icon character
 */
export function getRouteTypeIcon(type) {
  const icons = {
    hiking: '🥾',
    driving: '🚗',
    cycling: '🚴',
    walking: '🚶',
    running: '🏃',
    other: '📍',
  };
  return icons[type] || icons.other;
}

/**
 * Compute haversine distance between two points in meters
 */
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Debounce utility
 */
export function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
