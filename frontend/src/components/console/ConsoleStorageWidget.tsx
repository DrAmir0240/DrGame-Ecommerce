'use client';

import React, { useEffect, useState } from 'react';
import {
  HardDrive,
  Gamepad2,
  AlertTriangle,
  CheckCircle2,
  Wifi,
  WifiOff,
  RefreshCw,
} from 'lucide-react';
import { usePs5Handoff } from '@/hooks/usePs5Handoff';
import { apiRequest } from '@/lib/apiClient';

export interface DeviceStorageItem {
  device_name: string;
  volume: string;
  total_bytes: number;
  free_bytes: number;
  reported_at: number;
  age_seconds: number;
  stale: boolean;
}

interface ConsoleStorageWidgetProps {
  requiredGameSizeGb?: number;
  compact?: boolean;
  className?: string;
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export default function ConsoleStorageWidget({
  requiredGameSizeGb,
  compact = false,
  className = '',
}: ConsoleStorageWidgetProps) {
  const { handoffSecret, isPs5Device } = usePs5Handoff();
  const [devices, setDevices] = useState<DeviceStorageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchStorage = async () => {
    try {
      const res = await apiRequest<{ devices: DeviceStorageItem[] }>('/account/storage', {
        method: 'POST',
        body: JSON.stringify({ handoff: handoffSecret || undefined }),
      });
      if (res?.devices) {
        setDevices(res.devices);
        setLastRefreshed(new Date());
      }
    } catch {
      // Quiet fail if not logged in or backend storage endpoint unavailable
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStorage();
    // Poll every 10 seconds according to PS5 Download32 specification
    const timer = setInterval(fetchStorage, 10000);
    return () => clearInterval(timer);
  }, [handoffSecret]);

  if (!isPs5Device && devices.length === 0) {
    return null;
  }

  const primaryDevice = devices[0];

  if (!primaryDevice) {
    if (loading) {
      return (
        <div className={`p-4 rounded-2xl bg-neutral-900/60 border border-white/5 animate-pulse flex items-center gap-3 ${className}`}>
          <HardDrive className="w-5 h-5 text-purple-400" />
          <span className="text-xs text-neutral-400">در حال دریافت وضعیت حافظه کنسول PS5...</span>
        </div>
      );
    }
    return null;
  }

  const total = primaryDevice.total_bytes;
  const free = primaryDevice.free_bytes;
  const used = Math.max(0, total - free);
  const usedPercent = Math.min(100, Math.max(0, Math.round((used / total) * 100)));

  const freeGb = free / (1024 * 1024 * 1024);
  const isInsufficient = requiredGameSizeGb !== undefined && freeGb < requiredGameSizeGb;
  const isStale = primaryDevice.stale;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-4 transition-all duration-300 border ${
        isInsufficient
          ? 'bg-red-950/20 border-red-500/40 shadow-lg shadow-red-950/30'
          : 'bg-neutral-900/80 border-purple-500/20 backdrop-blur-md shadow-xl'
      } ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Gamepad2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-wide">
                {primaryDevice.device_name || 'کنسول پلی‌استیشن ۵'}
              </span>
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-neutral-400">
                {primaryDevice.volume}
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">حافظه داخلی کنسول</p>
          </div>
        </div>

        {/* Live Status Tag */}
        <div className="flex items-center gap-1.5">
          {isStale ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <WifiOff className="w-3 h-3" />
              گزارش قدیمی
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              آنلاین
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar Gauge */}
      <div className="space-y-1.5 mb-3">
        <div className="flex justify-between text-xs text-neutral-300">
          <span>فضای مصرف‌شده: {formatBytes(used)} ({usedPercent}%)</span>
          <span className="font-semibold text-white">آزاد: {formatBytes(free)}</span>
        </div>
        <div className="w-full h-2 rounded-full bg-neutral-800/80 overflow-hidden relative">
          <div
            className={`h-full transition-all duration-700 rounded-full ${
              isInsufficient
                ? 'bg-gradient-to-r from-amber-500 to-red-500 shadow-sm shadow-red-500'
                : 'bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400'
            }`}
            style={{ width: `${usedPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-neutral-400">
          <span>۰ B</span>
          <span>کل: {formatBytes(total)}</span>
        </div>
      </div>

      {/* Insufficient Storage Alert or Confirmation */}
      {requiredGameSizeGb !== undefined && (
        <div
          className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
            isInsufficient
              ? 'bg-red-500/10 border border-red-500/30 text-red-200'
              : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-200'
          }`}
        >
          {isInsufficient ? (
            <>
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>
                <strong>کمبود فضای ذخیره‌سازی:</strong> این بازی به حداقل {requiredGameSizeGb.toFixed(1)} گیگابایت فضا نیاز دارد اما کنسول تنها {freeGb.toFixed(1)} گیگابایت فضای خالی دارد.
              </span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                فضای کافی در کنسول وجود دارد (حجم بازی: {requiredGameSizeGb.toFixed(1)} گیگابایت).
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
