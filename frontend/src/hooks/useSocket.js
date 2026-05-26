import { useEffect, useRef, useCallback } from 'react';
import { initSocket, getSocket, disconnectSocket } from '../services/socket';
import { useAuthStore } from '../store/authStore';

/**
 * Custom hook to manage Socket.IO connection and event listeners
 */
export function useSocket() {
  const { token } = useAuthStore();
  const listenersRef = useRef([]);

  useEffect(() => {
    if (!token) return;
    initSocket(token);
    return () => {
      // Clean up all registered listeners on unmount
      listenersRef.current.forEach(({ event, handler }) => {
        getSocket()?.off(event, handler);
      });
      listenersRef.current = [];
    };
  }, [token]);

  const on = useCallback((event, handler) => {
    const socket = getSocket();
    if (!socket) return;
    socket.on(event, handler);
    listenersRef.current.push({ event, handler });
  }, []);

  const off = useCallback((event, handler) => {
    getSocket()?.off(event, handler);
    listenersRef.current = listenersRef.current.filter(
      l => !(l.event === event && l.handler === handler)
    );
  }, []);

  const emit = useCallback((event, data) => {
    getSocket()?.emit(event, data);
  }, []);

  const joinRoom = useCallback((roomId) => {
    getSocket()?.emit('join:session', roomId);
  }, []);

  const leaveRoom = useCallback((roomId) => {
    getSocket()?.emit('leave:session', roomId);
  }, []);

  return {
    socket: getSocket(),
    on,
    off,
    emit,
    joinRoom,
    leaveRoom,
    isConnected: getSocket()?.connected ?? false,
  };
}
