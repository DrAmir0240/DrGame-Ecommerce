import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'دکتر گیم | پلتفرم تخصصی بازی‌های پلی‌استیشن',
  description: 'پلتفرم پیشرفته دانلود دیتای بازی‌های کنسول، پلن‌های اشتراکی حجمی، همگام‌سازی RAWG و تجربه استاندارد کنسولی',
  icons: {
    icon: '/logo.png',
  },
};

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AuthModal from '@/components/auth/AuthModal';
import GamepadNavigationListener from '@/components/layout/GamepadNavigationListener';
import PlayStationControllerBar from '@/components/layout/PlayStationControllerBar';
import GeoLanguageModal from '@/components/layout/GeoLanguageModal';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" className="dark">
      <body className="bg-oled text-text-primary selection:bg-cosmic-purple selection:text-white antialiased">
        <div className="relative min-h-screen flex flex-col">
          {/* Subtle cosmic background glow */}
          <div className="pointer-events-none fixed inset-0 z-0 bg-dark-radial opacity-60" />
          {/* Vector dark gaming pattern */}
          <div className="pointer-events-none fixed inset-0 z-0 bg-[url('/bg-pattern-dark.svg')] bg-repeat opacity-[0.04]" />
          <Header />
          <main className="relative z-10 flex-1 pb-20 md:pb-0">{children}</main>
          <Footer />
          <AuthModal />
          <GamepadNavigationListener />
          <PlayStationControllerBar />
          <GeoLanguageModal />
        </div>
      </body>
    </html>
  );
}
