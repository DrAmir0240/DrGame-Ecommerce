import { create } from "zustand";
import { QuotaStatus } from "@/types";

interface QuotaState {
  quota: QuotaStatus;
  isLoading: boolean;
  setQuota: (quota: QuotaStatus) => void;
  fetchQuota: () => Promise<void>;
}

const defaultQuota: QuotaStatus = {
  user_id: null,
  has_active_subscription: false,
  tier_name: "No Active Plan",
  tier_slug: "none",
  total_quota_bytes: 0,
  used_quota_bytes: 0,
  remaining_quota_bytes: 0,
  total_quota_gb: 0,
  used_quota_gb: 0,
  remaining_quota_gb: 0,
  used_percentage: 0,
  formatted_pill_text: "GB 0",
  is_exhausted: false,
};

export const useQuotaStore = create<QuotaState>((set) => ({
  quota: defaultQuota,
  isLoading: false,
  setQuota: (quota) => set({ quota }),
  fetchQuota: async () => {
    set({ isLoading: true });
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${apiUrl}/quota/status`);
      if (res.ok) {
        const data = await res.json();
        set({ quota: data, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
