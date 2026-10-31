'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Tv, Sparkles, X, CreditCard, Landmark, Bitcoin } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { useTvModeStore } from '@/stores/useTvModeStore';
import { useRegionStore } from '@/stores/useRegionStore';

/**
 * Floating quick-actions launcher (fixed bottom-right).
 * Expands with an animated panel exposing:
 *   1. Console / TV mode toggle
 *   2. Payment region switch (Shaparak ↔ Crypto) — same state as the footer banner
 */
export default function FloatingQuickActions() {
  const pathname = usePathname();
  const { t, dir } = useTranslation();
  const [open, setOpen] = useState(false);

  const { isTvMode, toggleTvMode } = useTvModeStore();
  const { mode: regionMode, setMode: setRegionMode, initRegion } = useRegionStore();

  useEffect(() => {
    initRegion();
  }, [initRegion]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Close when navigating
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Hidden in the admin panel and while the TV (10-foot) UI is active
  if (pathname?.startsWith('/admin') || isTvMode) return null;

  const isDomestic = regionMode === 'domestic';

  return (
    <div className="fixed bottom-20 md:bottom-6 start-4 md:start-6 z-[60] print:hidden">
      {/* Invisible click-away layer */}
      <AnimatePresence>
        {open && (
          <motion.button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 -z-10 cursor-default bg-black/40 backdrop-blur-[2px] md:bg-transparent md:backdrop-blur-0"
          />
        )}
      </AnimatePresence>

      {/* Expanding panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="quick-actions-panel"
            initial={{ opacity: 0, y: 18, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30, mass: 0.7 }}
            style={{ transformOrigin: dir === 'rtl' ? 'bottom right' : 'bottom left' }}
            className="absolute bottom-full start-0 mb-3 w-[19.5rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-3xl border border-white/10 bg-[#0b0f19]/95 p-3.5 shadow-[0_24px_70px_-12px_rgba(0,0,0,0.9)] backdrop-blur-2xl"
          >
            {/* Glow accents */}
            <div className="pointer-events-none absolute -top-16 end-0 h-32 w-32 rounded-full bg-cosmic-purple/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 start-0 h-32 w-32 rounded-full bg-fuchsia-500/15 blur-3xl" />

            <div className="relative">
              {/* Panel header */}
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-cosmic-purple/20 ring-1 ring-cosmic-purple/40">
                    <Sparkles className="h-3.5 w-3.5 text-purple-300" />
                  </span>
                  <div className="leading-tight">
                    <p className="text-[11px] font-black text-white">{t('quickActions.title')}</p>
                    <p className="text-[10px] text-text-muted">{t('quickActions.subtitle')}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={t('quickActions.close')}
                  title={t('quickActions.close')}
                  className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-white/5 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
                }}
                className="space-y-2.5"
              >
                {/* 1. Console / TV mode */}
                <motion.button
                  type="button"
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  onClick={() => toggleTvMode()}
                  className="group flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-start transition-all hover:border-purple-500/50 hover:bg-purple-500/[0.08] active:scale-[0.98]"
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                      isTvMode
                        ? 'border-purple-400/60 bg-purple-500/25 text-purple-200'
                        : 'border-white/10 bg-white/5 text-slate-300 group-hover:text-purple-300'
                    }`}
                  >
                    <Tv className="h-5 w-5" />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-bold text-white">
                      {t('quickActions.consoleTitle')}
                    </span>
                    <span className="mt-0.5 block truncate text-[10px] text-text-muted">
                      {t('quickActions.consoleDesc')}
                    </span>
                  </span>

                  {/* iOS-style switch */}
                  <span
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ${
                      isTvMode ? 'bg-purple-500' : 'bg-white/15'
                    }`}
                    aria-hidden="true"
                  >
                    <span
                      style={{ insetInlineStart: isTvMode ? 'calc(100% - 1.375rem)' : '0.125rem' }}
                      className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-[inset-inline-start] duration-300 ease-out"
                    />
                  </span>
                </motion.button>

                {/* 2. Payment region switch */}
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"
                >
                  <div className="mb-2.5 flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-500/15 text-emerald-300">
                      <CreditCard className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-bold text-white">
                        {t('quickActions.paymentTitle')}
                      </span>
                      <span className="mt-0.5 block truncate text-[10px] text-text-muted">
                        {t('quickActions.paymentDesc')}
                      </span>
                    </span>
                  </div>

                  {/* Segmented control */}
                  <div
                    role="group"
                    aria-label={t('quickActions.paymentTitle')}
                    className="relative grid grid-cols-2 rounded-xl border border-white/10 bg-black/30 p-1"
                  >
                    <span
                      className={`pointer-events-none absolute inset-y-1 w-[calc(50%-0.25rem)] rounded-lg bg-gradient-to-r from-cosmic-purple to-fuchsia-500 shadow-[0_0_18px_rgba(168,85,247,0.45)] transition-[inset-inline-start] duration-300 ease-out ${
                        isDomestic ? 'start-1' : 'start-[50%]'
                      }`}
                      aria-hidden="true"
                    />

                    <button
                      type="button"
                      onClick={() => setRegionMode('domestic')}
                      aria-pressed={isDomestic}
                      className={`relative z-10 flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[10px] font-bold transition-colors ${
                        isDomestic ? 'text-white' : 'text-text-muted hover:text-white'
                      }`}
                    >
                      <Landmark className="h-3 w-3" />
                      {t('quickActions.domestic')}
                    </button>

                    <button
                      type="button"
                      onClick={() => setRegionMode('international')}
                      aria-pressed={!isDomestic}
                      className={`relative z-10 flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[10px] font-bold transition-colors ${
                        !isDomestic ? 'text-white' : 'text-text-muted hover:text-white'
                      }`}
                    >
                      <Bitcoin className="h-3 w-3" />
                      {t('quickActions.international')}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Launcher */}
      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? t('quickActions.close') : t('quickActions.open')}
        title={open ? t('quickActions.close') : t('quickActions.open')}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="relative flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-gradient-to-br from-cosmic-purple via-nebula-violet to-fuchsia-500 text-white shadow-[0_10px_35px_-6px_rgba(168,85,247,0.8)] outline-none focus-visible:ring-2 focus-visible:ring-purple-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      >
        {/* pulse ring while closed */}
        {!open && (
          <span className="pointer-events-none absolute inset-0 animate-ping rounded-full border border-fuchsia-400/40" />
        )}
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <X className="h-6 w-6" strokeWidth={2.5} />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <Sparkles className="h-6 w-6" strokeWidth={2.2} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
