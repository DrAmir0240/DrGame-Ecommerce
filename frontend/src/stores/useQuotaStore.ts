'use client';

import { create } from 'zustand';
import { UserQuota } from '@/types/subscription';
import { apiRequest } from '@/lib/apiClient';

interface QuotaState {
  quota: UserQuota | null;
  isLoading: boolean;
  error: string | null;
  fetchQuota: () => Promise<void>;
  setQuota: (quota: UserQuota) => void;
}

export const useQuotaStore = create<QuotaState>((set) => ({
  quota: null,
  isLoading: false,
  error: null,

  fetchQuota: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiRequest<UserQuota>('/quota/me');
      set({ quota: data, isLoading: false });
    } catch (e: any) {
      set({ error: e.message || 'خطا در دریافت حجم مصرفی', isLoading: false });
    }
  },

  setQuota: (quota: UserQuota) => {
    set({ quota });
  },
}));
