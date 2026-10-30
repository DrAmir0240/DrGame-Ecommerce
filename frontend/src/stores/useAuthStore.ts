'use client';

import { create } from 'zustand';
import { User, TokenResponse } from '@/types/auth';
import { apiRequest, ApiError } from '@/lib/apiClient';
import {
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
  clearAuthTokens,
} from '@/lib/authTokens';

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
  token: typeof window !== 'undefined' ? getAccessToken() : null,
  refreshToken: typeof window !== 'undefined' ? getRefreshToken() : null,
  isAuthenticated: typeof window !== 'undefined' ? !!getAccessToken() : false,
  isLoading: false,
  isAuthModalOpen: false,
  authModalInitialTab: 'otp',

  setAuthModalOpen: (open, tab = 'otp') => {
    set({ isAuthModalOpen: open, authModalInitialTab: tab });
  },

  setAuth: (data: TokenResponse) => {
    // Store tokens in-memory and Secure SameSite=Strict cookies (NEVER in localStorage)
    setAuthTokens(data.access_token, data.refresh_token);

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
      // Clear tokens from in-memory vault and secure cookies
      clearAuthTokens();

      set({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
      });
    }
  },

  fetchCurrentUser: async () => {
    const token = getAccessToken();
    if (!token) {
      set({ user: null, isAuthenticated: false, token: null });
      return;
    }

    set({ isLoading: true });
    try {
      // Server is the single source of truth for user profile & role verification
      const user = await apiRequest<User>('/users/me');
      set({
        user,
        isAuthenticated: true,
        token: getAccessToken(),
      });
    } catch (e: any) {
      console.error('Failed to fetch user:', e);

      // SECURITY & RELIABILITY DISTINCTION:
      // Only log out if the backend explicitly rejects the credentials (HTTP 401 or 403).
      // Temporary network drops, DNS issues, or 5xx server errors do NOT invalidate the local session.
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        await get().logout();
      } else {
        console.warn('Temporary network disruption during fetchCurrentUser. Auth session maintained.');
      }
    } finally {
      set({ isLoading: false });
    }
  },

  updateUser: (updatedUser: Partial<User>) => {
    const current = get().user;
    if (current) {
      const merged = { ...current, ...updatedUser };
      // User data is held strictly in-memory (never in localStorage)
      set({ user: merged });
    }
  },
}));
