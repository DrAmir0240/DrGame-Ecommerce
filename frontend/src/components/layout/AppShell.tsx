'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import AuthModal from '@/components/auth/AuthModal';
import GamepadNavigationListener from './GamepadNavigationListener';
import TvModeHost from './TvModeHost';
import GeoLanguageModal from './GeoLanguageModal';
import FloatingQuickActions from './FloatingQuickActions';

/**
 * Routes that render edge-to-edge: no header, no footer, no floating widgets.
 * `/gamepad` is a full-screen tester — the global gamepad navigation listener
 * must also stay off there, otherwise pressing a button would navigate away
 * while the user is testing that very button.
 */
const BARE_ROUTES = ['/gamepad'];

function isBareRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return BARE_ROUTES.some((base) => pathname === base || pathname.startsWith(`${base}/`));
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (isBareRoute(pathname)) {
    return (
      <main className="relative z-10 h-[100dvh] w-full overflow-hidden bg-oled">{children}</main>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Subtle cosmic background glow */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-dark-radial opacity-60" />
      {/* Vector dark gaming pattern */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[url('/bg-pattern-dark.svg')] bg-repeat opacity-[0.04]" />
      <Header />
      <main className="relative z-10 flex-1 pb-16 md:pb-6">{children}</main>
      <Footer />
      <AuthModal />
      <GamepadNavigationListener />
      <TvModeHost />
      <GeoLanguageModal />
      <FloatingQuickActions />
    </div>
  );
}
