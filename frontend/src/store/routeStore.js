import { create } from 'zustand';
import api from '../services/api';

export const useRouteStore = create((set, get) => ({
  routes: [],
  selectedRoute: null,
  loading: false,
  error: null,
  pagination: {},

  fetchRoutes: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const query = new URLSearchParams({
        page: params.page || 1,
        limit: params.limit || 20,
        ...(params.status && { status: params.status }),
        ...(params.type && { type: params.type }),
        ...(params.search && { search: params.search }),
        ...(params.favorite && { favorite: 'true' }),
      });
      const res = await api.get(`/routes?${query}`);
      set({
        routes: res.data.data,
        pagination: res.data.pagination,
        loading: false,
      });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to fetch routes', loading: false });
    }
  },

  fetchRoute: async (id) => {
    try {
      const res = await api.get(`/routes/${id}`);
      set({ selectedRoute: res.data.data });
      return res.data.data;
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to fetch route' });
    }
  },

  updateRoute: async (id, data) => {
    try {
      const res = await api.patch(`/routes/${id}`, data);
      set(state => ({
        routes: state.routes.map(r => r._id === id ? { ...r, ...res.data.data } : r),
        selectedRoute: state.selectedRoute?._id === id ? res.data.data : state.selectedRoute,
      }));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message };
    }
  },

  deleteRoute: async (id) => {
    try {
      await api.delete(`/routes/${id}`);
      set(state => ({
        routes: state.routes.filter(r => r._id !== id),
        selectedRoute: state.selectedRoute?._id === id ? null : state.selectedRoute,
      }));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message };
    }
  },

  toggleFavorite: async (id) => {
    const route = get().routes.find(r => r._id === id);
    if (!route) return;
    return get().updateRoute(id, { isFavorite: !route.isFavorite });
  },

  selectRoute: (route) => set({ selectedRoute: route }),
  clearSelected: () => set({ selectedRoute: null }),
  clearError: () => set({ error: null }),
}));
