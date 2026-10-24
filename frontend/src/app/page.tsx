"use client";

import React from "react";
import Link from "next/link";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Download,
  Gauge,
  Info,
  Server,
  Flame,
  Sparkles,
  Trophy,
  Zap,
  Wrench,
  Crown,
  BookOpen,
  MessageSquare,
  Star,
  ArrowRight,
  ShieldAlert,
  Play,
  Cpu,
} from "lucide-react";
import { Page } from "@/components/Shell";
import { HomeReferralSummary } from "@/components/HomeReferralSummary";
import { HomeBannerSlots } from "@/components/HomeBannerSlots";
import { HomeCategoriesGrid } from "@/components/HomeCategoriesGrid";
import { GameCard } from "@/components/GameCard";

import { PlayStationGlyph } from "@/components/PlayStationGlyph";
import { Button, PlatformBadge, SectionTitle } from "@/components/ui";
import { useApp } from "@/lib/app";
import { EDGE, GAMES, USER, game, hoursAt } from "@/lib/data";

function Hero() {
  const { t, n } = useApp();
  const g = game("god-of-war");
  const fast = hoursAt(g.sizeGb, EDGE.speedMbps);
  const slow = hoursAt(g.sizeGb, EDGE.psnBaselineMbps);

  // Marquee background poster images
  const marqueeCovers = GAMES.slice(0, 10).map((item) => item.image);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#151722] shadow-2xl">
      {/* Background Poster Marquee Track (GameDr parity lines 527-589) */}
      <div className="absolute inset-0 opacity-15 overflow-hidden pointer-events-none transform -rotate-3 scale-110">
        <div className="hero-poster-track">
          {[...marqueeCovers, ...marqueeCovers].map((imgSrc, idx) => (
            <div
              key={idx}
              className="w-36 h-52 shrink-0 rounded-xl overflow-hidden shadow-lg border border-white/10 bg-slate-900"
            >
              <img src={imgSrc} alt="" className="w-full h-full object-cover filter blur-[1px]" />
            </div>
          ))}
        </div>
      </div>

      {/* Hero Ambient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0f1016] via-[#0f1016]/85 to-transparent z-0" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0f1016] via-transparent to-transparent z-0 rtl:bg-gradient-to-l" />

      {/* Hero Content */}
      <div className="relative z-10 p-6 md:p-12 lg:p-14 max-w-3xl flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-400 text-xs font-extrabold uppercase shadow-sm">
            <Flame className="w-3.5 h-3.5 fill-purple-400" />
            {t("ویترین برگزیده هفته", "Featured Spotlight")}
          </span>
          <PlatformBadge p="PS5" solid />
          <PlatformBadge p="PS4" />
          <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 border border-green-500/30 px-2.5 py-0.5 text-xs font-semibold text-green-400">
            {t("پکیج کامل + زیرنویس فارسی", "Full Package + Persian Subtitles")}
          </span>
        </div>

        <h1 className="font-extrabold text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white tracking-tight leading-tight">
          <bdi>{g.title}</bdi>
        </h1>

        <p className="text-sm md:text-base leading-relaxed text-slate-300">
          {t(
            "کریتوس و آترئوس در سرزمین خدایان نورس. نسخه نهایی همراه با آخرین آپدیت رسمی سونی، زیرنویس فارسی اختصاصی و کش شده روی سرور لبه تهران برای دانلود بدون افت سرعت.",
            "Kratos and Atreus in the realm of Norse gods. Complete package with official Sony patch, Persian subtitles, cached on Tehran edge."
          )}
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link
            href={`/shop/${g.slug}`}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>{t("دانلود مستقیم بازی", "Direct Download")}</span>
            <span dir="ltr" className="font-mono text-xs opacity-90">
              · {n(g.sizeGb)} GB
            </span>
          </Link>

          <Link
            href={`/shop/${g.slug}`}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm border border-white/10 transition-all"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{t("مشاهده تریلر و جزئیات", "Trailer & Specs")}</span>
          </Link>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
          <Gauge className="w-4 h-4 text-purple-400" />
          <span>
            {t(
              `زمان تخمینی دانلود: ${n(fast.toFixed(1))} ساعت روی سرور لبه دکتر گیم (در برابر ${n(
                Math.round(slow)
              )} ساعت مسیر تحریمی)`,
              `Estimated download: ${fast.toFixed(1)}h on DrGame vs ${Math.round(slow)}h on direct PSN route`
            )}
          </span>
        </div>
      </div>
    </section>
  );
}

function EdgeStatus() {
  const { t, n } = useApp();
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.08] rounded-2xl border border-white/10 bg-[#181a27] rtl:divide-x-reverse shadow-lg">
      <div className="flex items-center gap-3.5 px-5 py-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-purple-500/10 text-purple-400">
          <Server size={18} />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-slate-400">{t("سرور لبه شما", "Your edge node")}</p>
          <p className="mt-0.5 text-sm font-bold text-white flex items-center gap-2">
            <span>{t(EDGE.nodeFa, EDGE.nodeEn)}</span>
            <span className="size-2 rounded-full bg-green-500 animate-pulse" />
          </p>
          <p className="text-[11px] text-green-400">{t("آنلاین · ۹۹٫۹۸٪ آپ‌تایم", "Online · 99.98% uptime")}</p>
        </div>
      </div>

      <div className="flex items-center gap-3.5 px-5 py-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-500/10 text-blue-400">
          <Gauge size={18} />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-slate-400">{t("سرعت دانلود شما", "Download Speed")}</p>
          <p className="mt-0.5 text-sm font-bold text-white font-mono" dir="ltr">
            {n(EDGE.speedMbps)} Mbps
          </p>
          <p className="text-[11px] text-slate-400">
            {t(`سقف پلن: ${n(USER.speedMbps)} Mbps`, `Plan cap: ${USER.speedMbps} Mbps`)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3.5 px-5 py-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-purple-500/10 text-purple-400">
          <Activity size={18} />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-slate-400">{t("پینگ تا سرور", "Latency")}</p>
          <p className="mt-0.5 text-sm font-bold text-white font-mono" dir="ltr">
            {n(EDGE.pingMs)} ms
          </p>
          <p className="text-[11px] text-slate-400">{t("مسیر مستقیم: ۱۸۶ ms", "Direct route: 186 ms")}</p>
        </div>
      </div>

      <div className="flex items-center gap-3.5 px-5 py-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-500/10 text-amber-400">
          <Trophy size={18} />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-slate-400">{t("همگام‌سازی کاتالوگ سونی", "PS Store Sync")}</p>
          <p className="mt-0.5 text-sm font-bold text-white">
            {t(`${n(EDGE.librarySize)} بازی شاخص`, `${EDGE.librarySize} verified titles`)}
          </p>
          <p className="text-[11px] text-slate-400">{t("۲ دقیقه پیش به‌روز شد", "Updated 2 min ago")}</p>
        </div>
      </div>
    </section>
  );
}

function RailSection({
  title,
  sub,
  games,
  actionLink = "/shop",
  badge,
}: {
  title: string;
  sub?: string;
  games: typeof GAMES;
  actionLink?: string;
  badge?: React.ReactNode;
}) {
  const { t } = useApp();

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-3">
          <h2 className="text-lg md:text-xl font-extrabold text-white flex items-center gap-2">
            {badge}
            <span>{title}</span>
          </h2>
          {sub && <span className="hidden sm:inline text-xs text-slate-400 font-normal">({sub})</span>}
        </div>
        <Link
          href={actionLink}
          className="flex items-center gap-1 text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors"
        >
          <span>{t("مشاهده همه", "View all")}</span>
          <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {games.slice(0, 6).map((g) => (
          <GameCard key={g.slug} game={g} />
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const { t, n } = useApp();

  // 11 Category Rails & Groupings (GameDr Parity)
  const top10Games = [...GAMES].sort((a, b) => b.metacritic - a.metacritic).slice(0, 10);
  const newlyReleased = [...GAMES].sort((a, b) => b.year - a.year);
  const freeGames = GAMES.filter((g) => g.ownership === "free" || g.sizeGb < 50);
  const actionAdventure = GAMES.filter((g) => g.genreEn.includes("Action") || g.genreEn.includes("Adventure"));
  const rpgGames = GAMES.filter((g) => g.genreEn.includes("RPG") || g.genreFa.includes("نقش‌آفرینی"));
  const shooterGames = GAMES.filter((g) => g.genreEn.includes("Shooter") || g.genreFa.includes("شوتر"));
  const sportsRacing = GAMES.filter((g) => g.genreEn.includes("Sports") || g.genreEn.includes("Racing"));
  const horrorSurvival = GAMES.filter((g) => g.genreEn.includes("Horror") || g.genreFa.includes("ترسناک"));

  return (
    <Page>
      {/* Background glow token */}
      <div className="home-bg-glow" />

      <div className="mx-auto flex max-w-[1440px] flex-col gap-10 px-4 md:px-6 pt-6">
        {/* 1. Top Referral Summary Card (TSK-04-08) */}
        <HomeReferralSummary />

        {/* 2. Hero Showcase Section */}
        <div id="hero-showcase">
          <Hero />
        </div>

        {/* 3. Edge Node Status Bar */}
        <EdgeStatus />

        {/* 4. Two Configurable Banner Slots (TSK-04-09) */}
        <HomeBannerSlots />

        {/* 17 Official Categories Grid (TSK-06-04) */}
        <HomeCategoriesGrid />

        {/* 5. Rail: Top 10 Games Rank (TSK-04-10) */}

        <div id="top-games-grid">
          <RailSection
            title={t("جدول برترین بازی‌های تاریخ پلی‌استیشن (Top 10)", "Top 10 Rated PlayStation Games")}
            sub={t("بر اساس متای سونی و منتقدین", "Official Metacritic rank")}
            badge={<Trophy className="w-5 h-5 text-yellow-400" />}
            games={top10Games}
          />
        </div>

        {/* 6. Rail: Newly Released */}
        <div id="new-games-grid">
          <RailSection
            title={t("جدیدترین بازی‌های اضافه‌شده به کاتالوگ", "Newly Released & Updated Titles")}
            sub={t("آماده دانلود با آخرین پچ رسمی", "Latest patch verified")}
            badge={<Sparkles className="w-5 h-5 text-blue-400" />}
            games={newlyReleased}
          />
        </div>

        {/* 7. Rail: Free Plan Games */}
        <div id="free-games-grid">
          <RailSection
            title={t("بازی‌های ویژه پلن رایگان (بدون اشتراک پولی)", "Free Tier Games (No Sub Required)")}
            sub={t("ترافیک بدون کسر از سهمیه", "Zero quota usage")}
            badge={<Download className="w-5 h-5 text-green-400" />}
            games={freeGames}
          />
        </div>

        {/* 8. Genre Rails (8 Rails from GameDr parity) */}
        <RailSection
          title={t("اکشن و ماجراجویی حماسی", "Action & Epic Adventure")}
          badge={<PlayStationGlyph type="triangle" className="w-4 h-4" />}
          games={actionAdventure}
        />

        <RailSection
          title={t("نقش‌آفرینی و جهان‌باز (RPG)", "Role Playing & Open World")}
          badge={<PlayStationGlyph type="circle" className="w-4 h-4" />}
          games={rpgGames}
        />

        <RailSection
          title={t("ورزشی، اتومبیل‌رانی و شبیه‌ساز", "Sports & High-Octane Racing")}
          badge={<PlayStationGlyph type="cross" className="w-4 h-4" />}
          games={sportsRacing.length > 0 ? sportsRacing : GAMES.slice(2, 8)}
        />

        {/* 9. Tools & Hardware Box */}
        <section className="rounded-2xl border border-white/10 bg-[#151722] p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-purple-500" />
                <span>{t("هاب سخت‌افزار و ابزارهای عیب‌یابی کنسول", "Hardware Diagnostics & Tools")}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {t(
                  "تست بلادرنگ کنترلرهای DualSense و مرجع تخصصی هک و جیلبریک کنسول‌های نسل ۸ و ۹",
                  "Real-time DualSense WebHID calibration & PS4/PS5 jailbreak payload delivery"
                )}
              </p>
            </div>
            <Link
              href="/tools"
              className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              <span>{t("همه ابزارها", "All Tools")}</span>
              <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/tools/gamepad"
              className="group p-5 rounded-xl border border-white/10 bg-white/5 hover:border-purple-500/40 hover:bg-white/10 transition-all flex items-start gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <PlayStationGlyph type="dpad" size={24} />
              </div>
              <div>
                <h4 className="font-bold text-white group-hover:text-purple-400 transition-colors">
                  {t("تستر پیشرفته دسته بازی (DualSense / Gamepad)", "DualSense & Gamepad Hardware Tester")}
                </h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {t(
                    "تست ددزون شوک‌های آنالوگ، محرک‌های تطبیقی (Adaptive Triggers)، بازخورد لمسی Haptic و ژیروسکوپ سه‌بعدی.",
                    "Analog stick drift inspection, adaptive trigger resistance, haptic vibration, and 3D gyroscope."
                  )}
                </p>
              </div>
            </Link>

            <Link
              href="/jailbreak"
              className="group p-5 rounded-xl border border-white/10 bg-white/5 hover:border-blue-500/40 hover:bg-white/10 transition-all flex items-start gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors">
                  {t("پایگاه ارسال پی‌لود جیلبریک و فلش USB", "Jailbreak WebSocket Payload & Firmware Hub")}
                </h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {t(
                    "ارسال پی‌لود GoldHEN به کنسول در شبکه محلی، پکیج‌های کرنل اکسپلویت و آموزش گام‌به‌گام فلش USB.",
                    "Local network GoldHEN payload delivery, kernel exploit packages, and step-by-step flashing."
                  )}
                </p>
              </div>
            </Link>
          </div>
        </section>

        {/* 10. Subscription Tiers Preview */}
        <section className="rounded-2xl border border-amber-500/30 bg-gradient-to-b from-[#1c1827] to-[#151722] p-6 md:p-8 shadow-xl text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold">
            <Crown className="w-4 h-4 text-amber-400" />
            <span>{t("پلن‌های اشتراک پرسرعت دکتر گیم", "DrGame High-Speed Membership")}</span>
          </div>
          <h3 className="text-xl md:text-2xl font-extrabold text-white">
            {t("انتخاب اشتراک متناسب با حجم مصرف شما", "Choose Your High-Performance Plan")}
          </h3>
          <p className="text-xs md:text-sm text-slate-400 max-w-xl mx-auto">
            {t(
              "از پلن رایگان با ترافیک پایه تا پلن طلایی نامحدود با پهنای باند اختصاصی ۱ گیگابیت بر ثانیه بدون تحریم و قطعی.",
              "From Free tier with base traffic to Unlimited Gold tier with 1Gbps unmetered dedicated bandwidth."
            )}
          </p>
          <div className="pt-2">
            <Link
              href="/subscriptions"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg hover:shadow-purple-500/30 transition-all"
            >
              <span>{t("مشاهده جدول مقایسه کامل پلن‌ها", "Compare All 4 Membership Tiers")}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </Link>
          </div>
        </section>
      </div>
    </Page>
  );
}
