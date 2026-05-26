import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for managing browser Geolocation API
 * Handles watching position, errors, and cleanup
 */
export function useGeolocation(options = {}) {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [isWatching, setIsWatching] = useState(false);
  const watchIdRef = useRef(null);

  const defaultOptions = {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 0,
    ...options,
  };

  const onSuccess = useCallback((pos) => {
    setError(null);
    setPosition({
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      altitude: pos.coords.altitude,
      speed: pos.coords.speed,
      heading: pos.coords.heading,
      accuracy: pos.coords.accuracy,
      timestamp: pos.timestamp,
      raw: pos,
    });
  }, []);

  const onError = useCallback((err) => {
    const messages = {
      1: 'Location access denied. Please allow GPS in your browser settings.',
      2: 'GPS position unavailable. Try moving to an open area.',
      3: 'GPS request timed out. Please try again.',
    };
    setError(messages[err.code] || `GPS error: ${err.message}`);
  }, []);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    if (watchIdRef.current !== null) return; // already watching

    const id = navigator.geolocation.watchPosition(onSuccess, onError, defaultOptions);
    watchIdRef.current = id;
    setIsWatching(true);
    setError(null);
  }, [onSuccess, onError]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsWatching(false);
  }, []);

  const getCurrentPosition = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, defaultOptions);
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    position,
    error,
    isWatching,
    startWatching,
    stopWatching,
    getCurrentPosition,
    isSupported: 'geolocation' in navigator,
  };
}
