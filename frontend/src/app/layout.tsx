import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

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
import GeoLanguageModal from '@/components/layout/GeoLanguageModal';
import FloatingQuickActions from '@/components/layout/FloatingQuickActions';
import TvModeHost from '@/components/layout/TvModeHost';
import Ps5HandoffListener from '@/components/layout/Ps5HandoffListener';
import { I18nProvider } from '@/i18n';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,300;0,400;0,500;0,700;0,900;1,400&family=Vazirmatn:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css" rel="stylesheet" />
        {/* Apply the stored locale before first paint so lang/dir never flash or drift from the UI copy */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var isIntl=${process.env.NEXT_PUBLIC_DEPLOYMENT_MODE === 'international' ? 'true' : 'false'};var def=isIntl?'en':'fa';var m=document.cookie.match(/(?:^|;\\s*)drgame_lang=([a-z]{2})/);var l=localStorage.getItem('drgame_lang')||(m&&m[1])||def;var valid=['fa','en','ar','de','es','fr','ru','zh','ja','ko','tr','it','pt','hi','nl'];if(valid.indexOf(l)<0){l=def;}var d=(l==='fa'||l==='ar')?'rtl':'ltr';document.documentElement.lang=l;document.documentElement.dir=d;var r=new URLSearchParams(window.location.search).get('ref');if(r){localStorage.setItem('drgame_referral_code',r);document.cookie='drgame_ref='+encodeURIComponent(r)+';path=/;max-age=2592000;SameSite=Lax';}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="bg-oled text-text-primary selection:bg-cosmic-purple selection:text-white antialiased">
        <I18nProvider>
          <div className="relative min-h-screen flex flex-col">
            {/* Subtle cosmic background glow */}
            <div className="pointer-events-none fixed inset-0 z-0 bg-dark-radial opacity-60" />
            {/* Vector dark gaming pattern */}
            <div className="pointer-events-none fixed inset-0 z-0 bg-[url('/bg-pattern-dark.svg')] bg-repeat opacity-[0.04]" />
            <Header />
            <main className="relative z-10 flex-1 pb-16 md:pb-6">{children}</main>
            <Footer />
            <AuthModal />
            <GamepadNavigationListener />
            <Ps5HandoffListener />
            <TvModeHost />
            <GeoLanguageModal />
            <FloatingQuickActions />
          </div>
        </I18nProvider>
      </body>
    </html>
  );
}
