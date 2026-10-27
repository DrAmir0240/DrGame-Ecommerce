'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Gamepad2, X, ChevronUp, ChevronDown } from 'lucide-react';

export default function PlayStationControllerBar() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isConsoleDetected, setIsConsoleDetected] = useState(false);

  useEffect(() => {
    // Check if running on PlayStation or Gamepad connected or force preview mode
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase();
      const isPS = ua.includes('playstation') || ua.includes('ps4') || ua.includes('ps5');
      const isPreview = window.location.search.includes('ps_bar=1');
      
      // Also listen to gamepad connection
      const handleGamepadConnected = () => {
        setIsVisible(true);
        setIsConsoleDetected(true);
      };

      window.addEventListener('gamepadconnected', handleGamepadConnected);

      if (isPS || isPreview) {
        setIsVisible(true);
        setIsConsoleDetected(true);
      }

      return () => {
        window.removeEventListener('gamepadconnected', handleGamepadConnected);
      };
    }
  }, []);

  // Exclude admin pages
  if (pathname.startsWith('/admin')) {
    return null;
  }

  if (!isVisible) {
    return null;
  }

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-3 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0d121f]/90 border border-purple-500/40 text-purple-300 text-xs font-bold shadow-neon-purple backdrop-blur-md hover:bg-[#141b2d] transition-all"
        title="نمایش نوار کلیدهای کنترلر پلی‌استیشن"
      >
        <Gamepad2 className="w-4 h-4 text-purple-400" />
        <span className="text-[11px]">راهنمای کنترلر</span>
        <ChevronUp className="w-3.5 h-3.5" />
      </button>
    );
  }

  return (
    <aside aria-label="PlayStation Controller Guide" className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0e17]/95 border-t border-purple-500/30 backdrop-blur-xl px-4 sm:px-8 py-2.5 shadow-2xl transition-all font-vazir">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Title / Indicator */}
        <div className="flex items-center gap-2 text-purple-300 font-bold shrink-0">
          <Gamepad2 className="w-4 h-4 text-purple-400 animate-pulse" />
          <span className="text-white hidden sm:inline">حالت کنسولی پلی‌استیشن</span>
          {isConsoleDetected && (
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              DualSense / DualShock
            </span>
          )}
        </div>

        {/* Action Buttons Guide */}
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap justify-center font-medium text-text-secondary text-[11px] sm:text-xs">
          
          {/* X - Cross (Blue) */}
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-400/60 text-blue-400 font-black text-[11px] flex items-center justify-center font-roboto shadow-[0_0_8px_rgba(59,130,246,0.4)]">
              ✕
            </span>
            <span className="text-white">انتخاب و تایید</span>
          </div>

          {/* O - Circle (Red) */}
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-rose-500/20 border border-rose-400/60 text-rose-400 font-black text-[11px] flex items-center justify-center font-roboto shadow-[0_0_8px_rgba(244,63,94,0.4)]">
              ○
            </span>
            <span className="text-white">بازگشت / لغو</span>
          </div>

          {/* Square (Pink) */}
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-md bg-pink-500/20 border border-pink-400/60 text-pink-400 font-black text-[11px] flex items-center justify-center font-roboto shadow-[0_0_8px_rgba(236,72,153,0.4)]">
              □
            </span>
            <span className="text-white">جستجو و فیلتر</span>
          </div>

          {/* Triangle (Green) */}
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400/60 text-emerald-400 font-black text-[11px] flex items-center justify-center font-roboto shadow-[0_0_8px_rgba(52,211,153,0.4)]">
              △
            </span>
            <span className="text-white">بالای صفحه / منو</span>
          </div>

          {/* D-Pad / Stick */}
          <div className="flex items-center gap-1.5 hidden md:flex">
            <span className="px-2 py-0.5 rounded-lg bg-white/10 border border-white/20 text-white font-black text-[10px] flex items-center justify-center font-roboto">
              D-Pad / L3
            </span>
            <span className="text-white">جابجایی بین بازی‌ها</span>
          </div>
        </div>

        {/* Controls: Minimize & Close */}
        <div className="flex items-center gap-1.5 shrink-0 mr-auto sm:mr-0">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-text-muted hover:text-white transition-colors"
            title="کوچک کردن نوار"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 rounded-lg bg-white/5 hover:bg-rose-500/20 text-text-muted hover:text-rose-400 transition-colors"
            title="بستن راهنما"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </aside>
  );
}
