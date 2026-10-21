"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  Bell,
  Search,
  HardDrive,
  Sun,
  Moon,
  Tv,
  Globe,
  ChevronDown,
  Check,
  Wallet,
  Users,
  Gamepad2,
  BookOpen,
  Video,
} from "lucide-react";
import { useApp, Lang, LanguageInfo } from "@/lib/app";
import { GAMES, USER } from "@/lib/data";
import { GameArt, OwnershipTag } from "./GameTile";
import { ShapePattern } from "./ui";
import { DnsBanner } from "./DnsBanner";

export function Logo() {
  const { t } = useApp();
  return (
    <Link href="/" className="flex items-center gap-3 shrink-0 group">
      <div className="relative size-9 overflow-hidden rounded-xl bg-surface-2 p-1 border border-line-strong shadow-glow-sm group-hover:shadow-glow transition-all duration-300">
        <Image
          src="/logo.png"
          alt="DrGame"
          width={36}
          height={36}
          className="object-contain"
        />
      </div>
      <div className="flex flex-col">
        <span className="font-latin text-base font-extrabold tracking-tight text-fg group-hover:text-accent-2 transition-colors">
          DrGame
        </span>
        <span className="font-latin text-[10px] font-medium text-muted -mt-0.5">
          {t("شبکه دانلود سریع PS5", "Fast PS5 download network")}
        </span>
      </div>
    </Link>
  );
}

export function QuotaPill() {
  const { n } = useApp();
  const used = 1 - USER.quotaLeftGb / USER.quotaTotalGb;
  return (
    <Link
      href="/plans"
      title="مشاهده سهمیه دانلود و تمدید اشتراک"
      className="flex h-9 items-center gap-2 rounded-full border border-line bg-surface-2 ps-3 pe-3.5 text-xs font-semibold text-fg hover:border-accent-2 transition-all duration-200"
    >
      <HardDrive size={14} className="text-accent-2 shrink-0" />
      <span dir="ltr" className="font-latin">
        {n(USER.quotaLeftGb)} GB <span className="text-muted">/ {n(USER.quotaTotalGb / 1000)} TB</span>
      </span>
      <span className="h-1 w-12 overflow-hidden rounded-full bg-line-strong shrink-0">
        <span
          className="block h-full rounded-full bg-accent-2 transition-all duration-300"
          style={{ width: `${(1 - used) * 100}%` }}
        />
      </span>
    </Link>
  );
}

export function LiveSearch() {
  const { t, n } = useApp();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const results = q.trim()
    ? GAMES.filter(
        (g) =>
          g.title.toLowerCase().includes(q.toLowerCase()) ||
          g.genreFa.includes(q) ||
          g.genreEn.toLowerCase().includes(q.toLowerCase())
      ).slice(0, 5)
    : [];

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", handle);
    return () => window.removeEventListener("mousedown", handle);
  }, []);

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={t("جستجوی بازی در کتابخانه یا کاتالوگ…", "Search your PSN library or catalog…")}
          className="h-10 w-full rounded-full border border-line bg-surface-2 ps-10 pe-4 text-xs font-medium text-fg placeholder:text-muted focus:border-accent-2 focus:bg-surface focus:outline-none transition-all duration-200"
        />
      </div>

      {open && results.length > 0 && (
        <div className="absolute inset-x-0 top-12 z-50 overflow-hidden rounded-card border border-line-strong bg-surface shadow-md">
          {results.map((g) => (
            <Link
              key={g.slug}
              href={`/games/${g.slug}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface-2 transition-colors duration-150"
            >
              <GameArt src={g.image} alt="" className="size-10 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-latin text-sm font-semibold">
                  <bdi>{g.title}</bdi>
                </p>
                <p dir="ltr" className="text-start font-latin text-xs text-fg-2">
                  {n(g.sizeGb)} GB · {g.platforms.join(" / ")}
                </p>
              </div>
              <OwnershipTag g={g} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/** Dropdown menu supporting 8 languages */
export function LanguageDropdown() {
  const { languages, currentLanguage, setLang, t } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface-2 px-3 text-xs font-semibold text-fg hover:border-accent-2 hover:bg-surface transition-all duration-150 cursor-pointer"
        aria-label="Select Language"
      >
        <span className="text-sm leading-none">{currentLanguage.flag}</span>
        <span className="hidden sm:inline font-medium">{currentLanguage.nativeName}</span>
        <ChevronDown size={13} className={`text-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute end-0 top-11 z-50 min-w-44 overflow-hidden rounded-xl border border-line-strong bg-surface/98 p-1.5 shadow-glow backdrop-blur-md">
          <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted">
            {t("انتخاب زبان پلتفرم", "Select Platform Language")}
          </p>
          <div className="mt-1 flex flex-col gap-0.5">
            {languages.map((l) => {
              const isSelected = l.code === currentLanguage.code;
              return (
                <button
                  key={l.code}
                  onClick={() => {
                    setLang(l.code);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-accent-soft text-accent-2"
                      : "text-fg-2 hover:bg-surface-2 hover:text-fg"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base leading-none">{l.flag}</span>
                    <span>{l.nativeName}</span>
                    <span className="font-latin text-[10px] text-muted">({l.name})</span>
                  </span>
                  {isSelected && <Check size={14} className="text-accent-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const pathname = usePathname();
  const { t, theme, setTheme } = useApp();

  const nav = [
    { to: "/", fa: "خانه", en: "Home" },
    { to: "/games", fa: "فروشگاه", en: "Store" },
    { to: "/tutorials", fa: "آموزش‌ها", en: "Tutorials" },
    { to: "/blog", fa: "بلاگ", en: "Blog" },
    { to: "/storage", fa: "مدیریت حافظه", en: "Storage" },
    { to: "/plans", fa: "اشتراک‌ها", en: "Plans" },
    { to: "/gamepad-test", fa: "تست دسته", en: "Gamepad" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-5 px-6">
        <Logo />

        <nav className="hidden xl:flex items-center gap-0.5">
          {nav.map((i) => {
            const isActive = pathname === i.to;
            return (
              <Link
                key={i.to}
                href={i.to}
                className={`rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors duration-150 ${
                  isActive ? "bg-surface-2 text-fg" : "text-fg-2 hover:text-fg"
                }`}
              >
                {t(i.fa, i.en)}
              </Link>
            );
          })}
          <Link
            href="/tv"
            className={`flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors duration-150 ${
              pathname === "/tv" ? "bg-surface-2 text-fg" : "text-fg-2 hover:text-fg"
            }`}
          >
            <Tv size={14} />
            {t("تلویزیون", "TV")}
          </Link>
        </nav>

        <div className="flex flex-1 justify-center">
          <LiveSearch />
        </div>

        <div className="flex items-center gap-2">
          {/* Quick links for Wallet and Referral */}
          <Link
            href="/wallet"
            title={t("کیف پول کاربری", "User Wallet")}
            className="flex size-9 items-center justify-center rounded-full border border-line bg-surface-2 text-fg-2 hover:border-accent-2 hover:text-fg transition-colors"
          >
            <Wallet size={16} />
          </Link>

          <Link
            href="/referral"
            title={t("سیستم درآمدزایی و رفرال", "Affiliate & Referral")}
            className="flex size-9 items-center justify-center rounded-full border border-line bg-surface-2 text-fg-2 hover:border-accent-2 hover:text-fg transition-colors"
          >
            <Users size={16} />
          </Link>

          <QuotaPill />

          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="grid size-9 place-items-center rounded-full text-fg-2 hover:bg-surface-2 hover:text-fg transition-colors duration-150 cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          <LanguageDropdown />

          <Link
            href="/profile"
            className="flex items-center gap-2 rounded-full py-1 ps-1 pe-2.5 hover:bg-surface-2 transition-colors duration-150"
          >
            <span className="grid size-8 place-items-center rounded-full bg-surface-3 font-latin text-xs font-bold ring-2 ring-accent-2">
              {USER.avatar}
            </span>
            <span className="hidden md:block leading-tight">
              <span className="block font-latin text-xs font-bold">{USER.name}</span>
              <span className="flex items-center gap-1 text-[10px] font-medium text-psn">
                <span className="size-1.5 rounded-full bg-psn" />
                {t("PSN متصل", "PSN linked")}
              </span>
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export function Page({
  children,
  pattern = true,
}: {
  children: ReactNode;
  pattern?: boolean;
}) {
  const { t } = useApp();
  return (
    <div className="relative min-h-screen bg-bg text-fg">
      {/* Top DNS Warning Banner */}
      <DnsBanner />

      {pattern && <ShapePattern />}
      <Header />
      <main className="relative">{children}</main>

      <footer className="relative mt-20 border-t border-line">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-4 sm:flex-row items-center justify-between px-6 py-6 text-xs text-muted">
          <span>
            {t(
              "پلتفرم دکتر گیم (DrGame) — شبکه دانلود مستقیم و تحویل سریع دیتای کنسول‌های پلی‌استیشن ۴ و ۵.",
              "DrGame Platform — High-speed download & delivery network for PlayStation 4 & 5 console data."
            )}
          </span>
          <div className="flex items-center gap-4">
            <Link href="/tutorials" className="hover:text-fg">
              {t("آموزش‌ها", "Tutorials")}
            </Link>
            <Link href="/blog" className="hover:text-fg">
              {t("بلاگ", "Blog")}
            </Link>
            <Link href="/referral" className="hover:text-fg">
              {t("سیستم رفرال", "Referral")}
            </Link>
            <Link href="/gamepad-test" className="hover:text-fg">
              {t("تست دسته DualSense", "Gamepad Test")}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
