import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const res = await api.post('/auth/login', { email, password });
          const { token, user } = res.data;
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          set({ user, token, isLoading: false, error: null });
          return { success: true };
        } catch (err) {
          const message = err.response?.data?.message || 'Login failed';
          set({ isLoading: false, error: message });
          return { success: false, message };
        }
      },

      register: async (username, email, password) => {
        set({ isLoading: true, error: null });
        try {
          const res = await api.post('/auth/register', { username, email, password });
          const { token, user } = res.data;
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          set({ user, token, isLoading: false, error: null });
          return { success: true };
        } catch (err) {
          const message = err.response?.data?.message || 'Registration failed';
          set({ isLoading: false, error: message });
          return { success: false, message };
        }
      },

      logout: () => {
        delete api.defaults.headers.common['Authorization'];
        set({ user: null, token: null, error: null });
      },

      updateUser: (userData) => {
        set({ user: { ...get().user, ...userData } });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'trailtracker-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (state) => {
        // Restore auth header after rehydration
        if (state?.token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
        }
      },
    }
  )
);
