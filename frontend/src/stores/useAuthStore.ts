'use client';

import { create } from 'zustand';
import { User, TokenResponse } from '@/types/auth';
import { apiRequest } from '@/lib/apiClient';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalInitialTab: 'otp' | 'password' | 'console';

  // Actions
  setAuthModalOpen: (open: boolean, tab?: 'otp' | 'password' | 'console') => void;
  setAuth: (data: TokenResponse) => void;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  updateUser: (updatedUser: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('drgame_access_token') : null,
  refreshToken: typeof window !== 'undefined' ? localStorage.getItem('drgame_refresh_token') : null,
  isAuthenticated: typeof window !== 'undefined' ? !!localStorage.getItem('drgame_access_token') : false,
  isLoading: false,
  isAuthModalOpen: false,
  authModalInitialTab: 'otp',

  setAuthModalOpen: (open, tab = 'otp') => {
    set({ isAuthModalOpen: open, authModalInitialTab: tab });
  },

  setAuth: (data: TokenResponse) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('drgame_access_token', data.access_token);
      localStorage.setItem('drgame_refresh_token', data.refresh_token);
      localStorage.setItem('drgame_user', JSON.stringify(data.user));
    }
    set({
      user: data.user,
      token: data.access_token,
      refreshToken: data.refresh_token,
      isAuthenticated: true,
      isAuthModalOpen: false,
    });
  },

  logout: async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch (e) {
      console.warn('Logout API failed or session already expired:', e);
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('drgame_access_token');
        localStorage.removeItem('drgame_refresh_token');
        localStorage.removeItem('drgame_user');
      }
      set({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
      });
    }
  },

  fetchCurrentUser: async () => {
    const token = get().token;
    if (!token) return;

    set({ isLoading: true });
    try {
      const user = await apiRequest<User>('/users/me');
      set({ user, isAuthenticated: true });
      if (typeof window !== 'undefined') {
        localStorage.setItem('drgame_user', JSON.stringify(user));
      }
    } catch (e) {
      console.error('Failed to fetch user:', e);
      // If unauthorized, clear auth state
      get().logout();
    } finally {
      set({ isLoading: false });
    }
  },

  updateUser: (updatedUser: Partial<User>) => {
    const current = get().user;
    if (current) {
      const merged = { ...current, ...updatedUser };
      set({ user: merged });
      if (typeof window !== 'undefined') {
        localStorage.setItem('drgame_user', JSON.stringify(merged));
      }
    }
  },
}));
