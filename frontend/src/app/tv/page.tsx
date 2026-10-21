"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Circle,
  Download,
  Gauge,
  HardDrive,
  Server,
  Square,
  Triangle,
  Tv,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Shell";
import { GameArt } from "@/components/GameTile";
import { Button, PlatformBadge } from "@/components/ui";
import { useApp } from "@/lib/app";
import { EDGE, GAMES, USER, hoursAt } from "@/lib/data";

/* 10-foot layout: tiles are 160px with a 16px gap (176px pitch). */
const TILE = 160;
const GAP = 16;
const PITCH = TILE + GAP;
const VIEW_W = 1440;

type Hint = { icon: LucideIcon; fa: string; en: string };

const HINTS: Hint[] = [
  { icon: X, fa: "انتخاب", en: "Select" },
  { icon: Circle, fa: "بازگشت", en: "Back" },
  { icon: Triangle, fa: "جستجو", en: "Search" },
  { icon: Square, fa: "گزینه‌ها", en: "Options" },
];

function TopBar() {
  const { t, n } = useApp();
  const used = 1 - USER.quotaLeftGb / USER.quotaTotalGb;
  return (
    <header className="flex h-20 shrink-0 items-center justify-between gap-6 px-12">
      <Logo />
      <div className="flex items-center gap-5">
        <Link href="/" className="text-sm font-medium text-fg-2 hover:text-fg">
          {t("خروج از حالت تلویزیون", "Exit TV mode")}
        </Link>
        <div className="flex h-12 items-center gap-3 rounded-full border border-accent/50 bg-accent-soft ps-4 pe-5 shadow-glow-sm">
          <HardDrive size={18} className="text-accent-2" />
          <span dir="ltr" className="font-latin text-base font-bold">
            {n(USER.quotaLeftGb)} GB
          </span>
          <span className="h-1.5 w-16 overflow-hidden rounded-full bg-line-strong">
            <span
              className="block h-full rounded-full bg-accent-2"
              style={{ width: `${(1 - used) * 100}%` }}
            />
          </span>
        </div>
        <span className="font-latin text-lg font-semibold tabular-nums text-fg-2">
          {n("21:40")}
        </span>
        <span className="grid size-12 place-items-center rounded-full bg-surface-3 font-latin text-sm font-bold ring-2 ring-accent-2">
          {USER.avatar}
        </span>
      </div>
    </header>
  );
}

function Hero({ slug }: { slug: string }) {
  const { t, n } = useApp();
  const g = GAMES.find((x) => x.slug === slug) ?? GAMES[0];
  const fast = hoursAt(g.sizeGb, EDGE.speedMbps);
  const ownText =
    g.ownership === "owned"
      ? t("در کتابخانه PSN شما", "In your PSN library")
      : g.ownership === "free"
        ? t("رایگان", "Free to play")
        : t("خرید از PlayStation Store", "Buy on PlayStation Store");
  return (
    <section className="relative flex-1 overflow-hidden">
      <img
        src={g.image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-70"
      />
      <div className="absolute inset-0 bg-linear-to-t from-bg via-bg/60 to-bg/10" />
      <div className="absolute inset-0 from-bg/80 via-transparent to-transparent rtl:bg-linear-to-l ltr:bg-linear-to-r" />
      <div className="relative flex h-full flex-col justify-end gap-5 px-12 pb-10">
        <div className="flex items-center gap-3">
          {g.platforms.map((p) => (
            <PlatformBadge key={p} p={p} solid={p === "PS5"} />
          ))}
          <span className="inline-flex h-7 items-center rounded-full bg-success-soft px-3 text-sm font-semibold text-success">
            {ownText}
          </span>
        </div>
        <h1 className="font-latin text-6xl font-extrabold tracking-tight text-white">
          <bdi>{g.title}</bdi>
        </h1>
        <p className="flex items-center gap-3 text-lg text-white/80">
          <span dir="ltr" className="font-latin">
            {n(g.sizeGb)} GB
          </span>
          <span className="text-white/40">·</span>
          <span>
            {t(
              `حدود ${n(fast.toFixed(1))} ساعت با DrGame`,
              `~${fast.toFixed(1)} h on DrGame`
            )}
          </span>
        </p>
        <div className="flex items-center gap-4">
          <Button size="lg" className="h-16 px-10 text-lg" to={`/games/${g.slug}`}>
            <Download size={22} />
            {t("ارسال به PS5", "Send to PS5")}
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="h-16 px-10 text-lg"
            to={`/games/${g.slug}`}
          >
            {t("جزئیات", "Details")}
          </Button>
        </div>
      </div>
    </section>
  );
}

function TileRow({
  focused,
  onFocus,
}: {
  focused: number;
  onFocus: (i: number) => void;
}) {
  const { dir } = useApp();
  const count = GAMES.length;
  const innerW = count * PITCH - GAP;
  const isRtl = dir === "rtl";
  const xOf = (i: number) => (isRtl ? (count - 1 - i) * PITCH : i * PITCH);
  const EDGE_PAD = 48;
  const offset = isRtl
    ? VIEW_W - EDGE_PAD - TILE - xOf(focused)
    : EDGE_PAD - xOf(focused);
  return (
    <div className="relative h-[240px] w-full overflow-hidden">
      <div
        className="absolute inset-y-0 left-0 w-full transition-transform duration-300"
        style={{ transform: `translateX(${offset}px)` }}
      >
        <div className="absolute inset-y-0 left-0" style={{ width: innerW }}>
          {GAMES.map((g, i) => {
            const isFocused = i === focused;
            return (
              <button
                key={g.slug}
                type="button"
                aria-label={g.title}
                aria-current={isFocused ? "true" : undefined}
                onClick={() => onFocus(i)}
                style={{ left: xOf(i) }}
                className={`absolute top-10 aspect-square w-40 overflow-hidden rounded-card outline-none cursor-pointer transition-all duration-200 ${
                  isFocused
                    ? "z-10 scale-105 border-2 border-accent-2 shadow-focus"
                    : "border border-line opacity-80"
                }`}
              >
                <GameArt src={g.image} alt="" className="absolute inset-0 h-full w-full" />
                <span className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/90 to-transparent px-3 pb-3 pt-10 text-start">
                  <span className="block truncate font-latin text-sm font-semibold text-white">
                    <bdi>{g.title}</bdi>
                  </span>
                </span>
                {g.ownership === "owned" && (
                  <span className="absolute end-2 top-2 grid size-7 place-items-center rounded-full bg-success text-black">
                    <Download size={14} strokeWidth={2.5} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function EdgeStrip() {
  const { t, n } = useApp();
  return (
    <div className="flex items-center justify-center gap-8 text-base text-fg-2">
      <span className="flex items-center gap-2.5">
        <Server size={18} className="text-accent-2" />
        {t("سرور لبه تهران ۱ دکتر گیم", "DrGame Tehran-1 Edge")}
        <span className="size-2 rounded-full bg-success" />
      </span>
      <span className="flex items-center gap-2.5">
        <Gauge size={18} className="text-accent-2" />
        <span dir="ltr" className="font-latin">
          {n(EDGE.speedMbps)} Mbps
        </span>
      </span>
      <span className="flex items-center gap-2.5">
        <Activity size={18} className="text-accent-2" />
        <span dir="ltr" className="font-latin">
          {n(EDGE.pingMs)} ms
        </span>
      </span>
    </div>
  );
}

function ControllerHints() {
  const { t } = useApp();
  return (
    <footer className="flex h-20 shrink-0 items-center justify-between gap-6 border-t border-line px-12">
      <div className="flex items-center gap-8">
        {HINTS.map((h) => {
          const Icon = h.icon;
          return (
            <span
              key={h.en}
              className="flex items-center gap-3 text-base font-medium text-fg-2"
            >
              <span className="grid size-9 place-items-center rounded-full border border-line-strong text-fg">
                <Icon size={16} strokeWidth={2.5} />
              </span>
              {t(h.fa, h.en)}
            </span>
          );
        })}
        <span className="flex items-center gap-3 text-base font-medium text-fg-2">
          <span className="flex items-center gap-1 rounded-full border border-line-strong px-1.5 py-1 text-fg">
            <ArrowLeft size={14} strokeWidth={2.5} />
            <ArrowRight size={14} strokeWidth={2.5} />
          </span>
          {t("حرکت", "Move")}
        </span>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted">
        <Tv size={16} />
        {t("حالت تلویزیون و دسته بازی · DrGame", "TV 10-Foot Mode · DrGame")}
      </div>
    </footer>
  );
}

export default function TvHomePage() {
  const router = useRouter();
  const { dir } = useApp();
  const [focused, setFocused] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const rtl = dir === "rtl";
      const forward = e.key === (rtl ? "ArrowLeft" : "ArrowRight");
      const back = e.key === (rtl ? "ArrowRight" : "ArrowLeft");
      if (forward) {
        e.preventDefault();
        setFocused((i) => Math.min(i + 1, GAMES.length - 1));
      } else if (back) {
        e.preventDefault();
        setFocused((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        router.push(`/games/${GAMES[focused].slug}`);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focused, router, dir]);

  return (
    <div className="flex h-screen min-h-[840px] flex-col overflow-hidden bg-bg text-fg select-none">
      <TopBar />
      <Hero slug={GAMES[focused].slug} />
      <div className="flex shrink-0 flex-col gap-4 pb-4 pt-2">
        <TileRow focused={focused} onFocus={setFocused} />
        <EdgeStrip />
      </div>
      <ControllerHints />
    </div>
  );
}
