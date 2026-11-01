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

import AppShell from '@/components/layout/AppShell';
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
            __html: `(function(){try{var m=document.cookie.match(/(?:^|;\\s*)drgame_lang=([a-z]{2})/);var l=localStorage.getItem('drgame_lang')||(m&&m[1])||'fa';if(['fa','en','ar'].indexOf(l)<0){l='fa';}var d=(l==='fa'||l==='ar')?'rtl':'ltr';document.documentElement.lang=l;document.documentElement.dir=d;}catch(e){}})();`,
          }}
        />
      </head>
      <body className="bg-oled text-text-primary selection:bg-cosmic-purple selection:text-white antialiased">
        <I18nProvider>
          <AppShell>{children}</AppShell>
        </I18nProvider>
      </body>
    </html>
  );
}
