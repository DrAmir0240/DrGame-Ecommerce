'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Gamepad2, KeyRound, Copy, Check, RotateCcw, Timer, Sparkles } from 'lucide-react';
import { apiRequest } from '@/lib/apiClient';
import { useTranslation } from '@/i18n';

interface ConsoleCodeResponse {
  code: string;
  expires_in: number;
}

export default function ConsolePairWidget() {
  const { t } = useTranslation();
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
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;
  const strokeDashoffset = circumference - progressRatio * circumference;
  const isUrgent = remainingSeconds <= 30 && remainingSeconds > 0;

  return (
    <div className="p-4 rounded-2xl glass-card border border-cosmic-purple/30 bg-[#0d121f]/90 space-y-3 shadow-lg relative overflow-hidden">
      {/* Glow decorative background */}
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-cosmic-purple/20 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white font-bold text-xs">
          <Gamepad2 className="w-4 h-4 text-nebula-violet" />
          <span>ورود سریع کنسول (PS4 / PS5)</span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cosmic-purple/20 text-nebula-violet border border-cosmic-purple/30">
          اعتبار ۲ دقیقه
        </span>
      </div>

      <p className="text-[11px] text-text-muted leading-relaxed">
        برای ورود بدون رمز در مرورگر پلی‌استیشن، کد یکبارمصرف موقت زیر را ایجاد و در کنسول وارد کنید.
      </p>

      {error && (
        <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px]">
          {error}
        </div>
      )}

      {/* Code Display or Generate Action */}
      {code && remainingSeconds > 0 ? (
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface-base border border-cosmic-purple/40">
            {/* SVG Circular Pie Timer */}
            <div className="relative flex items-center justify-center shrink-0">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 52 52">
                {/* Background circle */}
                <circle
                  cx="26"
                  cy="26"
                  r={radius}
                  fill="transparent"
                  stroke="rgba(255, 255, 255, 0.1)"
                  strokeWidth="4"
                />
                {/* Dynamic animated progress circle */}
                <circle
                  cx="26"
                  cy="26"
                  r={radius}
                  fill="transparent"
                  stroke={isUrgent ? '#f43f5e' : '#a855f7'}
                  strokeWidth="4"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              <span className={`absolute text-[10px] font-mono font-bold ${isUrgent ? 'text-rose-400 animate-pulse' : 'text-slate-300'}`}>
                {remainingSeconds}s
              </span>
            </div>

            {/* Generated Code */}
            <div className="text-center flex-1 px-2">
              <div className="text-[10px] text-text-muted mb-0.5 flex items-center justify-center gap-1">
                <Timer className="w-3 h-3 text-nebula-violet" />
                <span>زمان باقی‌مانده: {formatTime(remainingSeconds)}</span>
              </div>
              <span className="font-mono text-2xl font-black tracking-widest text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.4)] select-all" dir="ltr">
                {code}
              </span>
            </div>

            {/* Copy Button */}
            <button
              onClick={copyCode}
              className="p-2 rounded-lg bg-cosmic-purple/20 hover:bg-cosmic-purple/40 text-nebula-violet hover:text-white transition-all cursor-pointer"
              title="کپی کد اتصال"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <button
            onClick={generateCode}
            disabled={loading}
            className="w-full py-1.5 rounded-lg border border-white/10 hover:border-white/20 text-text-muted hover:text-white text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>تولید کد جدید</span>
          </button>
        </div>
      ) : (
        <div className="pt-1">
          {code === null && remainingSeconds === 0 && (
            <p className="text-[11px] text-amber-400/90 mb-2">
              ⚠️ کد قبلی منقضی شده است. جهت اتصال مجدد کلیک کنید.
            </p>
          )}

          <button
            onClick={generateCode}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-cosmic-gradient hover:opacity-90 text-white font-bold text-xs shadow-neon-purple transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'در حال تولید کد...' : 'تولید کد اتصال کنسول'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
