'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Gamepad2, Copy, Check, RotateCcw, Timer, Sparkles } from 'lucide-react';
import { apiRequest } from '@/lib/apiClient';

interface ConsoleCodeResponse {
  code: string;
  expires_in: number;
}

export default function ConsolePairWidget() {
  const [code, setCode] = useState<string | null>(null);
  const [totalSeconds, setTotalSeconds] = useState(120);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Countdown timer effect
  useEffect(() => {
    if (remainingSeconds > 0) {
      timerRef.current = setTimeout(() => {
        setRemainingSeconds((prev) => prev - 1);
      }, 1000);
    } else if (remainingSeconds === 0 && code !== null) {
      // Code expired
      setCode(null);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [remainingSeconds, code]);

  const generateCode = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<ConsoleCodeResponse>('/users/console-code/generate', {
        method: 'POST',
      });
      setCode(res.code);
      const expiry = res.expires_in || 120;
      setTotalSeconds(expiry);
      setRemainingSeconds(expiry);
    } catch (err: any) {
      setError(err.message || 'خطا در دریافت کد اتصال کنسول');
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Circular progress calculations for SVG pie timer
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;
  const strokeDashoffset = circumference - progressRatio * circumference;
  const isUrgent = remainingSeconds <= 30 && remainingSeconds > 0;

  return (
    <div className="p-3.5 rounded-2xl glass-card border border-cosmic-purple/30 bg-[#0d121f]/90 space-y-2.5 shadow-lg relative overflow-hidden">
      {/* Decorative ambient glow */}
      <div className="absolute -top-10 -right-10 w-20 h-20 bg-cosmic-purple/15 rounded-full blur-xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-white font-bold text-xs">
          <Gamepad2 className="w-4 h-4 text-nebula-violet shrink-0" />
          <span>ورود کنسول پلی‌استیشن</span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cosmic-purple/20 text-nebula-violet border border-cosmic-purple/30 shrink-0">
          PS4 / PS5
        </span>
      </div>

      {error && (
        <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px]">
          {error}
        </div>
      )}

      {/* Code Display or Generate Action */}
      {code && remainingSeconds > 0 ? (
        <div className="space-y-2 pt-0.5">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-base border border-cosmic-purple/40">
            {/* SVG Circular Pie Timer */}
            <div className="relative flex items-center justify-center shrink-0">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 48 48">
                {/* Background circle */}
                <circle
                  cx="24"
                  cy="24"
                  r={radius}
                  fill="transparent"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="3.5"
                />
                {/* Dynamic animated progress circle */}
                <circle
                  cx="24"
                  cy="24"
                  r={radius}
                  fill="transparent"
                  stroke={isUrgent ? '#f43f5e' : '#10b981'}
                  strokeWidth="3.5"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              <span className={`absolute text-[9px] font-mono font-bold ${isUrgent ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                {remainingSeconds}s
              </span>
            </div>

            {/* Generated Code */}
            <div className="text-center px-1">
              <div className="text-[10px] text-text-muted font-mono">{formatTime(remainingSeconds)} مانده</div>
              <span className="font-mono text-xl font-black tracking-widest text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)] select-all" dir="ltr">
                {code}
              </span>
            </div>

            {/* Copy Button */}
            <button
              onClick={copyCode}
              className="p-2 rounded-lg bg-cosmic-purple/20 hover:bg-cosmic-purple/40 text-nebula-violet hover:text-white transition-all cursor-pointer shrink-0"
              title="کپی کد اتصال"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <button
            onClick={generateCode}
            disabled={loading}
            className="w-full py-1 text-[10px] text-text-muted hover:text-white flex items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>تولید مجدد کد جدید</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {code === null && remainingSeconds === 0 && (
            <p className="text-[10px] text-amber-400/90 flex items-center gap-1">
              <Timer className="w-3 h-3 shrink-0" />
              <span>کد موقت قبلی منقضی شد.</span>
            </p>
          )}

          <p className="text-[10px] text-text-muted leading-relaxed">
            کد یکبارمصرف موقت ۲ دقیقه‌ای برای ورود فوری در مرورگر کنسول:
          </p>

          <button
            onClick={generateCode}
            disabled={loading}
            className="w-full py-2 px-3 rounded-xl bg-cosmic-gradient hover:opacity-90 text-white font-bold text-xs shadow-neon-purple transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{loading ? 'در حال تولید...' : 'تولید کد اتصال کنسول'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
