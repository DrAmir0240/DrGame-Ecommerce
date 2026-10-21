"use client";

import { Activity, ChevronLeft, ChevronRight, Download, Gauge, Info, RefreshCw, Server } from "lucide-react";
import type { ReactNode } from "react";
import Link from "next/link";
import { Page } from "@/components/Shell";
import { GameTile } from "@/components/GameTile";
import { Button, PlatformBadge, SectionTitle } from "@/components/ui";
import { useApp } from "@/lib/app";
import { EDGE, GAMES, USER, game, hoursAt } from "@/lib/data";

function Hero() {
  const { t, n } = useApp();
  const g = game("god-of-war");
  const fast = hoursAt(g.sizeGb, EDGE.speedMbps);
  const slow = hoursAt(g.sizeGb, EDGE.psnBaselineMbps);

  return (
    <section className="relative h-[440px] overflow-hidden rounded-panel border border-line">
      <img src={g.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 from-bg via-bg/75 to-transparent rtl:bg-gradient-to-l ltr:bg-gradient-to-r" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-bg to-transparent" />
      <div className="relative flex h-full max-w-xl flex-col justify-end gap-4 p-10">
        <div className="flex items-center gap-2">
          <PlatformBadge p="PS5" solid />
          <PlatformBadge p="PS4" />
          <span className="inline-flex h-6 items-center rounded-full bg-success-soft px-2.5 text-xs font-semibold text-success">
            {t("در کتابخانه PSN شما", "In your PSN library")}
          </span>
        </div>
        <h1 className="font-latin text-5xl font-extrabold tracking-tight text-white">
          <bdi>{g.title}</bdi>
        </h1>
        <p className="text-base leading-relaxed text-white/80">
          {t(
            "کریتوس و آترئوس در سرزمین خدایان نورس. نسخه کامل به‌همراه آخرین آپدیت و زیرنویس فارسی، آماده روی سرور تهران.",
            "Kratos and Atreus in the realm of the Norse gods. Full game, latest patch and Persian subtitles — cached on the Tehran edge.",
          )}
        </p>
        <div className="flex items-center gap-3">
          <Button size="lg" to={`/games/${g.slug}`}>
            <Download size={18} />
            {t("ارسال به PS5", "Send to PS5")}
            <span dir="ltr" className="font-latin opacity-80">· {n(g.sizeGb)} GB</span>
          </Button>
          <Button size="lg" variant="secondary" to={`/games/${g.slug}`}>
            {t("جزئیات بازی", "Game details")}
          </Button>
        </div>
        <p className="flex items-center gap-2 text-sm text-white/70">
          <Gauge size={15} className="text-accent-2" />
          {t(
            `زمان تقریبی دانلود: ${n(fast.toFixed(1))} ساعت با DrGame — در برابر ${n(Math.round(slow))} ساعت از مسیر مستقیم`,
            `Est. download: ${fast.toFixed(1)} h on DrGame — vs ${Math.round(slow)} h on direct route`,
          )}
        </p>
      </div>
      <div className="absolute bottom-8 end-10 flex items-center gap-2">
        <span className="h-1.5 w-6 rounded-full bg-white" />
        <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
        <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
        <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
      </div>
    </section>
  );
}

function Stat({
  icon,
  label,
  value,
  sub,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  sub?: string;
}) {
  return (
    <div className="flex items-center gap-3.5 px-5 py-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent-2">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs text-fg-2">{label}</p>
        <p className="mt-0.5 text-[15px] font-bold">{value}</p>
        {sub && <p className="text-[11px] text-muted">{sub}</p>}
      </div>
    </div>
  );
}

function EdgeStatus() {
  const { t, n } = useApp();
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-line rounded-card border border-line bg-surface rtl:divide-x-reverse">
      <Stat
        icon={<Server size={18} />}
        label={t("سرور لبه شما", "Your edge node")}
        value={
          <span className="flex items-center gap-2">
            {t(EDGE.nodeFa, EDGE.nodeEn)}
            <span className="size-2 rounded-full bg-success" />
          </span>
        }
        sub={t("آنلاین · ۹۹٫۹۸٪ دسترس‌پذیری", "Online · 99.98% uptime")}
      />
      <Stat
        icon={<Gauge size={18} />}
        label={t("سرعت دانلود شما", "Your download speed")}
        value={<span dir="ltr">{n(EDGE.speedMbps)} Mbps</span>}
        sub={t(`سقف پلن نقره‌ای: ${n(USER.speedMbps)} Mbps`, `Silver plan cap: ${USER.speedMbps} Mbps`)}
      />
      <Stat
        icon={<Activity size={18} />}
        label={t("تأخیر تا سرور", "Latency")}
        value={<span dir="ltr">{n(EDGE.pingMs)} ms</span>}
        sub={t(`مسیر مستقیم: ${n(186)} ms`, "Direct route: 186 ms")}
      />
      <Stat
        icon={<RefreshCw size={18} />}
        label={t("همگام‌سازی کتابخانه PSN", "PSN library sync")}
        value={t(`${n(EDGE.librarySize)} بازی`, `${EDGE.librarySize} games`)}
        sub={t(`آخرین همگام‌سازی ${EDGE.syncFa}`, `Last synced ${EDGE.syncEn}`)}
      />
    </section>
  );
}

function Row({
  title,
  sub,
  games,
  size,
}: {
  title: string;
  sub?: string;
  games: typeof GAMES;
  size?: "md" | "lg";
}) {
  const { t } = useApp();
  return (
    <section>
      <SectionTitle
        action={
          <div className="flex items-center gap-1">
            <button
              className="grid size-8 place-items-center rounded-full border border-line-strong text-fg-2 hover:text-fg"
              aria-label="Previous"
            >
              <ChevronRight size={16} className="ltr:rotate-180" />
            </button>
            <button
              className="grid size-8 place-items-center rounded-full border border-line-strong text-fg-2 hover:text-fg"
              aria-label="Next"
            >
              <ChevronLeft size={16} className="ltr:rotate-180" />
            </button>
            <Link href="/games" className="ms-2 text-sm font-medium text-accent-2 hover:underline">
              {t("مشاهده همه", "See all")}
            </Link>
          </div>
        }
      >
        {title}
        {sub && <span className="text-sm font-normal text-fg-2">{sub}</span>}
      </SectionTitle>
      <div className="-mx-2 flex gap-5 overflow-x-auto px-2 pb-3 pt-1">
        {games.map((g) => (
          <GameTile key={g.slug} g={g} size={size} />
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const { t, n } = useApp();
  const owned = GAMES.filter((g) => g.ownership === "owned");
  const trending = [...GAMES].sort((a, b) => b.metacritic - a.metacritic);
  const recent = GAMES.filter((g) => g.year >= 2015);

  return (
    <Page>
      <div className="mx-auto flex max-w-[1440px] flex-col gap-10 px-6 pt-6">
        <Hero />
        <EdgeStatus />

        <Row
          title={t("آماده دانلود از کتابخانه شما", "Ready from your PSN library")}
          sub={t(`· ${n(owned.length)} بازی روی سرور تهران`, `· ${owned.length} cached on Tehran-1`)}
          games={owned}
          size="lg"
        />

        <div className="flex items-start gap-3 rounded-card border border-psn/30 bg-psn-soft px-5 py-4 text-sm">
          <Info size={18} className="mt-0.5 shrink-0 text-psn" />
          <p className="text-fg-2">
            <span className="font-semibold text-fg">
              {t("فقط بازی‌هایی که مالکشان هستید دانلود می‌شوند. ", "Only games you own can be downloaded. ")}
            </span>
            {t(
              "مالکیت هر بازی هنگام ارسال از طریق حساب PSN شما بررسی می‌شود. برای بازی‌های دیگر، خرید از PlayStation Store انجام می‌شود.",
              "Ownership is verified against your PSN account at send time. Other titles link out to PlayStation Store to purchase.",
            )}
          </p>
        </div>

        <Row title={t("پرطرفدارترین‌های PS5 این هفته", "Trending on PS5 this week")} games={trending} />
        <Row title={t("تازه اضافه‌شده به سرور تهران", "New on the Tehran edge")} games={recent} />
      </div>
    </Page>
  );
}
