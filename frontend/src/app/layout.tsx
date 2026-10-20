import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { ClientAppWrapper } from "@/components/layout/ClientAppWrapper";

export const metadata: Metadata = {
  title: "DrGame — پلتفرم تخصصی بازی‌های پلی‌استیشن ۴ و ۵ کپی‌خور و اشتراک دانلود",
  description:
    "مرجع دانلود مستقیم دیتای بازی‌های کنسول PS4 و PS5، رترو، متادیتای RAWG، زیرنویس فارسی و پلن‌های اشتراک سهمیه حجمی با طراحی کهکشانی بنفش",
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
      <body className="relative bg-oled-bg text-white selection:bg-cosmic-light selection:text-white">
        {/* PlayStation Vector Pattern Background */}
        <div
          className="fixed inset-0 pointer-events-none ps-pattern-bg opacity-[0.035] z-0"
          aria-hidden="true"
        />

        {/* Ambient Top Glow */}
        <div
          className="fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[350px] bg-cosmic-primary/15 blur-[140px] pointer-events-none rounded-full -z-10"
          aria-hidden="true"
        />

        <ClientAppWrapper>
          <div className="relative z-10 flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <MobileBottomNav />
          </div>
        </ClientAppWrapper>
      </body>
    </html>
  );
}
