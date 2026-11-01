'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
} from 'lucide-react';
import type { LogLevel } from './SystemLog';

export type { LogLevel };

interface MicTestPanelProps {
  onLog?: (level: LogLevel, text: string) => void;
}

type Health = 'idle' | 'silent' | 'weak' | 'good' | 'hot' | 'clipping';

const MIN_DB = -60;
const MAX_DB = 0;
const FFT_SIZE = 2048;
/** Push React state every N frames — the meter does not need 60fps. */
const UPDATE_EVERY = 4;

function toDb(amplitude: number): number {
  if (amplitude <= 0) return MIN_DB;
  return Math.max(MIN_DB, Math.min(MAX_DB, 20 * Math.log10(amplitude)));
}

const HEALTH: Record<
  Health,
  { label: string; advice: string; badge: string; icon: 'idle' | 'ok' | 'warn' | 'bad' }
> = {
  idle: {
    label: 'آماده',
    advice: 'دکمه «شروع تست» را بزنید و اجازه‌ی دسترسی به میکروفون را بدهید.',
    badge: 'border-white/10 bg-white/5 text-slate-400',
    icon: 'idle',
  },
  silent: {
    label: 'بی‌صدا',
    advice: 'سیگنالی دریافت نمی‌شود. مطمئن شوید میکروفون دسته انتخاب شده و کلید Mute روی دسته فعال نیست.',
    badge: 'border-slate-400/25 bg-slate-500/15 text-slate-300',
    icon: 'warn',
  },
  weak: {
    label: 'ضعیف',
    advice: 'سطح صدا پایین است. نزدیک‌تر به میکروفون صحبت کنید یا در تنظیمات ویندوز سطح ورودی را بالا ببرید.',
    badge: 'border-amber-500/30 bg-amber-500/15 text-amber-300',
    icon: 'warn',
  },
  good: {
    label: 'سالم',
    advice: 'سطح سیگنال در محدوده‌ی طبیعی است؛ میکروفون دسته سالم به نظر می‌رسد.',
    badge: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300',
    icon: 'ok',
  },
  hot: {
    label: 'بسیار بلند',
    advice: 'سیگنال خیلی بلند است و ممکن است اعوجاج داشته باشد. فاصله را بیشتر کنید.',
    badge: 'border-orange-500/30 bg-orange-500/15 text-orange-300',
    icon: 'warn',
  },
  clipping: {
    label: 'اشباع',
    advice: 'سیگنال در حال برش (Clipping) است. سطح ورودی را کم کنید تا اعوجاج از بین برود.',
    badge: 'border-rose-500/30 bg-rose-500/15 text-rose-300',
    icon: 'bad',
  },
};

const clampPct = (db: number) => Math.max(0, Math.min(100, ((db - MIN_DB) / (MAX_DB - MIN_DB)) * 100));

export default function MicTestPanel({ onLog }: MicTestPanelProps) {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState('');
  const [active, setActive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [avgDb, setAvgDb] = useState(MIN_DB);
  const [peakDb, setPeakDb] = useState(MIN_DB);
  const [loopback, setLoopback] = useState(false);
  const [volume, setVolume] = useState(35);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const bufRef = useRef<Float32Array | null>(null);
  const rafRef = useRef<number | null>(null);
  const frameRef = useRef(0);
  const smoothRef = useRef(MIN_DB);
  const peakHoldRef = useRef(MIN_DB);
  const healthRef = useRef<Health>('idle');

  const stop = useCallback(() => {
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    try {
      gainRef.current?.disconnect();
      sourceRef.current?.disconnect();
      analyserRef.current?.disconnect();
    } catch {
      /* already detached */
    }
    gainRef.current = null;
    sourceRef.current = null;
    analyserRef.current = null;

    void ctxRef.current?.close().catch(() => undefined);
    ctxRef.current = null;

    smoothRef.current = MIN_DB;
    peakHoldRef.current = MIN_DB;
    healthRef.current = 'idle';
    setActive(false);
    setAvgDb(MIN_DB);
    setPeakDb(MIN_DB);
  }, []);

  const start = useCallback(
    async (overrideId?: string) => {
      const wanted = overrideId ?? deviceId;
      setError(null);
      setStarting(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            ...(wanted ? { deviceId: { exact: wanted } } : {}),
            // measure the raw signal: any DSP would mask a broken mic
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        });
        streamRef.current = stream;

        const Ctor =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new Ctor();
        ctxRef.current = ctx;
        if (ctx.state === 'suspended') await ctx.resume();

        const source = ctx.createMediaStreamSource(stream);
        sourceRef.current = source;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = FFT_SIZE;
        analyser.smoothingTimeConstant = 0.2;
        analyserRef.current = analyser;

        const gain = ctx.createGain();
        gain.gain.value = loopback ? volume / 100 : 0;
        gainRef.current = gain;

        source.connect(analyser);
        source.connect(gain);
        gain.connect(ctx.destination);

        bufRef.current = new Float32Array(analyser.fftSize);
        smoothRef.current = MIN_DB;
        peakHoldRef.current = MIN_DB;
        frameRef.current = 0;

        setActive(true);
        onLog?.('info', 'تست میکروفون آغاز شد — با صدای معمولی صحبت کنید');

        const listed = await navigator.mediaDevices.enumerateDevices();
        const mics = listed.filter((d) => d.kind === 'audioinput');
        setDevices(mics);

        const current = stream.getAudioTracks()[0]?.getSettings().deviceId;
        if (current && !wanted) setDeviceId(current);
        const label = mics.find((d) => d.deviceId === current)?.label;
        if (label) onLog?.('ok', `میکروفون فعال: ${label}`);
      } catch {
        setError('دسترسی به میکروفون ممکن نشد. اجازه‌ی مرورگر و اتصال دسته را بررسی کنید.');
        onLog?.('error', 'دسترسی به میکروفون رد شد');
        stop();
      } finally {
        setStarting(false);
      }
    },
    [deviceId, loopback, volume, onLog, stop],
  );

  // unmount cleanup
  useEffect(() => stop, [stop]);

  // live gain for the loopback monitor
  useEffect(() => {
    const gain = gainRef.current;
    if (!gain) return;
    gain.gain.setTargetAtTime(loopback ? volume / 100 : 0, gain.context.currentTime, 0.02);
  }, [loopback, volume]);

  // analysis loop
  useEffect(() => {
    if (!active) return;
    const analyser = analyserRef.current;
    if (!analyser) return;

    const buf = bufRef.current ?? new Float32Array(analyser.fftSize);
    // TS 5.7+ narrows the DOM signature to Float32Array<ArrayBuffer>; our buffer
    // is always a plain ArrayBuffer, so this cast is safe and version-agnostic.
    type TimeDomainBuffer = Parameters<AnalyserNode['getFloatTimeDomainData']>[0];

    const loop = () => {
      analyser.getFloatTimeDomainData(buf as TimeDomainBuffer);
      let sum = 0;
      let peak = 0;
      for (let i = 0; i < buf.length; i += 1) {
        const v = buf[i];
        sum += v * v;
        const abs = Math.abs(v);
        if (abs > peak) peak = abs;
      }

      const dbNow = toDb(Math.sqrt(sum / buf.length));
      const peakNow = toDb(peak);

      smoothRef.current =
        smoothRef.current <= MIN_DB ? dbNow : smoothRef.current * 0.78 + dbNow * 0.22;
      // peak marker falls back slowly so short transients stay readable
      peakHoldRef.current = Math.max(peakNow, peakHoldRef.current - 0.6);

      frameRef.current += 1;
      if (frameRef.current % UPDATE_EVERY === 0) {
        setAvgDb(smoothRef.current);
        setPeakDb(peakHoldRef.current);
      }

      rafRef.current = window.requestAnimationFrame(loop);
    };

    rafRef.current = window.requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [active]);

  const health: Health = !active
    ? 'idle'
    : peakDb > -0.4
      ? 'clipping'
      : avgDb < -52
        ? 'silent'
        : avgDb < -36
          ? 'weak'
          : avgDb > -8
            ? 'hot'
            : 'good';

  useEffect(() => {
    if (health === healthRef.current) return;
    healthRef.current = health;
    if (health === 'good') onLog?.('ok', 'سطح سیگنال میکروفون سالم است');
    else if (health === 'weak') onLog?.('warn', 'سطح صدای میکروفون پایین است');
    else if (health === 'silent') onLog?.('warn', 'سیگنالی از میکروفون دریافت نمی‌شود');
    else if (health === 'hot') onLog?.('warn', 'سطح ورودی بسیار بلند است');
    else if (health === 'clipping') onLog?.('error', 'سیگنال اشباع شده (Clipping)');
  }, [health, onLog]);

  const handleDeviceChange = useCallback(
    (id: string) => {
      setDeviceId(id);
      if (active) {
        stop();
        void start(id);
      }
    },
    [active, stop, start],
  );

  const meta = HEALTH[health];
  const levelPct = clampPct(avgDb);
  const peakPct = clampPct(peakDb);

  return (
    <section className="rounded-2xl border border-white/10 bg-[#0d121f] p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mic className="h-4 w-4 text-cyan-400" />
          <h2 className="text-sm font-bold text-white">تست بازگشتی میکروفون</h2>
        </div>
        <span className={`rounded-lg border px-2 py-0.5 text-[10px] font-bold ${meta.badge}`}>
          {meta.label}
        </span>
      </div>

      {/* device picker */}
      <div className="mb-3">
        <label className="mb-1 block text-[10px] text-slate-500">دستگاه ورودی</label>
        <select
          value={deviceId}
          onChange={(e) => handleDeviceChange(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-[11px] text-slate-200 outline-none transition-colors focus:border-cyan-500/50"
        >
          <option value="">میکروفون پیش‌فرض سیستم</option>
          {devices.map((d, i) => (
            <option key={d.deviceId || `mic-${i}`} value={d.deviceId}>
              {d.label || `میکروفون ${i + 1}`}
            </option>
          ))}
        </select>
      </div>

      {/* meter */}
      <div className="mb-2">
        <div className="relative h-3 overflow-hidden rounded-full bg-black/50 ring-1 ring-inset ring-white/10">
          <div
            className="absolute inset-y-0 start-0 rounded-full"
            style={{
              width: `${levelPct}%`,
              background: 'linear-gradient(90deg,#10b981 0%,#22d3ee 45%,#f59e0b 75%,#f43f5e 100%)',
              transition: 'width 80ms linear',
            }}
          />
          {peakPct > 0 && (
            <span
              className="absolute inset-y-0 w-0.5 bg-white/80"
              style={{ insetInlineStart: `${peakPct}%`, transition: 'inset-inline-start 80ms linear' }}
            />
          )}
        </div>
        <div className="mt-1 flex justify-between font-mono text-[9px] text-slate-600" dir="ltr">
          <span>-60</span>
          <span>-30</span>
          <span>-12</span>
          <span>0 dB</span>
        </div>
      </div>

      {/* readouts */}
      <div className="mb-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-white/5 bg-white/[0.03] p-2 text-center">
          <p className="text-[9px] text-slate-500">میانگین</p>
          <p className="font-mono text-sm font-bold text-white" dir="ltr">
            {avgDb.toFixed(1)}
            <span className="ms-0.5 text-[9px] font-normal text-slate-500">dB</span>
          </p>
        </div>
        <div className="rounded-xl border border-white/5 bg-white/[0.03] p-2 text-center">
          <p className="text-[9px] text-slate-500">اوج</p>
          <p className="font-mono text-sm font-bold text-white" dir="ltr">
            {peakDb.toFixed(1)}
            <span className="ms-0.5 text-[9px] font-normal text-slate-500">dB</span>
          </p>
        </div>
      </div>

      {/* verdict */}
      <p className="mb-3 flex items-start gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-2.5 text-[10px] leading-relaxed text-slate-400">
        {meta.icon === 'ok' ? (
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
        ) : meta.icon === 'bad' ? (
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />
        ) : meta.icon === 'warn' ? (
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
        ) : (
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-400" />
        )}
        {meta.advice}
      </p>

      {/* loopback */}
      <div className="mb-3 rounded-xl border border-white/5 bg-black/25 p-2.5">
        <button
          type="button"
          onClick={() => setLoopback((v) => !v)}
          className="flex w-full items-center justify-between text-[11px]"
        >
          <span className="flex items-center gap-2 text-slate-300">
            {loopback ? (
              <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <VolumeX className="h-3.5 w-3.5 text-slate-500" />
            )}
            پخش هم‌زمان صدا (شنیدن از اسپیکر)
          </span>
          <span
            className={`relative h-4 w-8 rounded-full transition-colors ${
              loopback ? 'bg-emerald-500' : 'bg-white/15'
            }`}
          >
            <span
              className="absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all"
              style={{ insetInlineStart: loopback ? '18px' : '2px' }}
            />
          </span>
        </button>

        {loopback && (
          <div className="mt-2.5 flex items-center gap-2">
            <span className="text-[10px] text-slate-500">بلندی</span>
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-white/15 accent-emerald-500"
            />
            <span className="w-8 text-end font-mono text-[10px] text-slate-400" dir="ltr">
              {volume}%
            </span>
          </div>
        )}

        {loopback && (
          <p className="mt-2 flex items-start gap-1.5 text-[9px] leading-relaxed text-amber-400/80">
            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
            با هدست این کار را نکنید؛ بازخورد صوتی (howling) می‌تواند به اسپیکر آسیب بزند.
          </p>
        )}
      </div>

      {error && (
        <p className="mb-2 rounded-xl border border-rose-500/25 bg-rose-500/10 p-2 text-[10px] text-rose-300">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={() => (active ? stop() : void start())}
        disabled={starting}
        className={`flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[11px] font-bold transition-colors disabled:opacity-50 ${
          active
            ? 'bg-rose-600/90 text-white hover:bg-rose-500'
            : 'bg-cyan-600 text-white hover:bg-cyan-500'
        }`}
      >
        {starting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : active ? (
          <MicOff className="h-3.5 w-3.5" />
        ) : (
          <Mic className="h-3.5 w-3.5" />
        )}
        {starting ? 'در حال اتصال…' : active ? 'پایان تست' : 'شروع تست'}
      </button>
    </section>
  );
}
