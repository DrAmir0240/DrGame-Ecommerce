import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/lib/app";
import { PlayStationModeProvider } from "@/components/PlayStationModeProvider";
import { DevModeToolbar } from "@/components/DevModeToolbar";

export const metadata: Metadata = {
  title: "DrGame — پلتفرم تخصصی دانلود سریع دیتای بازی‌های پلی‌استیشن",
  description:
    "پلتفرم پیشرفته دانلود مستقیم و پرسرعت دیتای بازی‌های PS4 و PS5، زیرنویس فارسی، مدیریت حافظه کنسول و هارد اکسترنال با سیستم طراحی اختصاصی Figr",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" data-theme="dark">
      <body className="antialiased min-h-screen bg-bg text-fg font-sans">
        <AppProvider>
          <PlayStationModeProvider>
            {children}
            <DevModeToolbar />
          </PlayStationModeProvider>
        </AppProvider>
      </body>
    </html>
  );
}
