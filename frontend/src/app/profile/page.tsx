"use client";

import { useState, useEffect } from "react";
import {
  BadgeCheck,
  CalendarDays,
  Camera,
  Check,
  Clock,
  Download,
  Gamepad2,
  Gauge,
  HardDrive,
  Pause,
  Pencil,
  Plus,
  RefreshCw,
  Sparkles,
  Trophy,
  Wallet,
  X,
  Users,
  Copy,
  Cpu,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { Page } from "@/components/Shell";
import { GameArt, GameTile } from "@/components/GameTile";
import { Button, Card, Pill, PlatformBadge, SectionTitle, ShapePattern } from "@/components/ui";
import { useApp } from "@/lib/app";
import {
  EDGE,
  GAMES,
  USER,
  FIRMWARE_DATABASE,
  ConsoleFirmwareStatus,
  REFERRAL_DATA,
  WALLET_DATA,
} from "@/lib/data";

type StatProps = { icon: LucideIcon; label: string; value: string; hero?: boolean; tone?: string };

function Stat({ icon: Icon, label, value, hero = false, tone = "text-accent-2" }: StatProps) {
  return (
    <Card
      className={`flex flex-col gap-3 p-4 ${hero ? "border-accent/60 bg-accent-soft shadow-glow-sm" : ""}`}
    >
      <span
        className={`grid size-10 place-items-center rounded-xl ${
          hero ? "bg-accent text-on-accent" : "bg-surface-2"
        } ${tone}`}
      >
        <Icon size={18} />
      </span>
      <div>
        <p className="text-xs text-fg-2">{label}</p>
        <p className={`mt-1 font-latin font-bold ${hero ? "text-2xl text-accent-2" : "text-lg"}`}>
          {value}
        </p>
      </div>
    </Card>
  );
}

function Cover() {
  const { t } = useApp();
  return (
    <section className="relative h-56 overflow-hidden rounded-panel border border-line">
      <img src={GAMES[3].image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
      <div className="absolute inset-0 bg-linear-135 from-accent-deep/80 via-bg/60 to-bg" />
      <ShapePattern />
      <div className="absolute end-4 top-4">
        <Button variant="secondary" size="sm">
          <Camera size={15} />
          {t("ویرایش کاور", "Edit cover")}
        </Button>
      </div>
    </section>
  );
}

function Identity() {
  const { t, n } = useApp();
  return (
    <div className="relative z-10 -mt-16 flex flex-wrap items-end gap-6 px-8">
      <span className="grid size-32 shrink-0 place-items-center rounded-full bg-surface-3 font-latin text-4xl font-extrabold ring-4 ring-accent-2">
        {USER.avatar}
      </span>
      <div className="min-w-0 flex-1 pb-1">
        <h1 className="flex items-center gap-2.5 text-3xl font-extrabold tracking-tight">
          <bdi className="font-latin">{USER.name}</bdi>
          <BadgeCheck size={24} className="text-accent-2" />
        </h1>
        <div className="mt-2.5 flex flex-wrap items-center gap-3">
          <Pill tone="psn">
            <span dir="ltr" className="font-latin">
              PSN · {USER.psnId}
            </span>
            <span>· {t("متصل", "Connected")}</span>
          </Pill>
          <div className="flex items-center gap-2.5">
            <Trophy size={16} className="text-gold" />
            <span className="text-sm font-semibold">{t(`سطح ${n(28)}`, `Level ${n(28)}`)}</span>
            <span className="h-1.5 w-32 overflow-hidden rounded-full bg-line-strong">
              <span className="block h-full w-[72%] rounded-full bg-accent-2" />
            </span>
            <span className="text-xs text-fg-2">{t("۷۲٪ تا سطح ۲۹", "72% to level 29")}</span>
          </div>
        </div>
        <p className="mt-2 font-latin text-sm text-fg-2">Game More, Live Better</p>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="secondary" size="sm">
          <Pencil size={15} />
          {t("ویرایش پروفایل", "Edit profile")}
        </Button>
      </div>
    </div>
  );
}

function StatRow() {
  const { t, n } = useApp();
  return (
    <section className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
      <Stat icon={CalendarDays} label={t("عضویت از", "Member since")} value={t("دی ۱۴۰۱", "Jan 2023")} />
      <Stat icon={Gamepad2} label={t("بازی‌های PSN", "Games in PSN library")} value={n(54)} />
      <Stat icon={Download} label={t("دانلود از DrGame", "Downloaded via DrGame")} value={`${n(2.8)} TB`} />
      <Stat icon={Gauge} label={t("میانگین سرعت", "Average speed")} value={`${n(19.4)} Mbps`} />
      <Stat
        hero
        icon={Clock}
        label={t("زمان صرفه‌جویی‌شده", "Time saved")}
        value={`${n(312)} ${t("ساعت", "hours")}`}
      />
      <Stat icon={Trophy} label={t("تروفی‌های PSN", "PSN trophies")} value={n(276)} tone="text-gold" />
    </section>
  );
}

/** Console Device Detection & Firmware / Jailbreak Matrix */
function ConsoleDeviceDetection() {
  const { t, n } = useApp();
  const [userAgent, setUserAgent] = useState<string>("");
  const [selectedFwKey, setSelectedFwKey] = useState<string>("ps5-4.50");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUserAgent(navigator.userAgent);
    }
  }, []);

  const fwStatus: ConsoleFirmwareStatus =
    FIRMWARE_DATABASE[selectedFwKey] ?? FIRMWARE_DATABASE["ps5-4.50"];

  return (
    <Card className="p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Cpu size={18} className="text-accent-2" />
            <h3 className="text-base font-bold text-fg">
              {t("شناسایی هوشمند دستگاه و وضعیت کپی‌خور (Jailbreak Detection)", "Console Device & Jailbreak Matrix")}
            </h3>
          </div>
          <p className="mt-1 text-xs text-fg-2">
            {t(
              "پایش هوشمند User-Agent کنسول پلی‌استیشن و بررسی خودکار امکان نصب مستقیم دیتای بازی‌ها (PKG/FPKG).",
              "Automated User-Agent inspection and jailbreak payload compatibility checker."
            )}
          </p>
        </div>

        {/* Firmware Switcher Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-muted">
            {t("انتخاب نسخه فریمور:", "Target Firmware:")}
          </label>
          <select
            value={selectedFwKey}
            onChange={(e) => setSelectedFwKey(e.target.value)}
            className="h-9 rounded-lg border border-line bg-surface-2 px-3 text-xs font-bold text-fg outline-none focus:border-accent-2 cursor-pointer"
          >
            <option value="ps5-4.50">PS5 FW 4.50 (EtaHEN Ready)</option>
            <option value="ps5-4.03">PS5 FW 4.03 (WebKit + Kstuff)</option>
            <option value="ps5-3.20">PS5 FW 3.20 (IPv6 Kernel)</option>
            <option value="ps5-official">PS5 FW 9.60 (Official PSN)</option>
            <option value="ps4-9.00">PS4 FW 9.00 (GoldHEN 2.4b)</option>
            <option value="ps4-11.00">PS4 FW 11.00 (PPPwn LAN)</option>
          </select>
        </div>
      </div>

      {/* Firmware Status Box */}
      <div className="mt-5 rounded-xl border border-line bg-surface-2 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className={`flex size-11 items-center justify-center rounded-xl font-latin text-xs font-black ${
                fwStatus.isJailbreakable
                  ? "bg-success-soft text-success border border-success/30"
                  : "bg-psn-soft text-psn border border-psn/30"
              }`}
            >
              {fwStatus.platform}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-latin text-sm font-bold text-fg">
                  {fwStatus.platform} FW {fwStatus.firmware}
                </span>
                <Pill tone={fwStatus.statusTone}>
                  {t(fwStatus.exploitNameFa, fwStatus.exploitNameEn)}
                </Pill>
              </div>
              <p className="mt-1 text-xs text-fg-2">
                {t(fwStatus.supportDetailsFa, fwStatus.supportDetailsEn)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {fwStatus.pkgDirectInstall ? (
              <span className="flex items-center gap-1.5 rounded-lg bg-success-soft px-3 py-1.5 text-xs font-bold text-success">
                <ShieldCheck size={16} />
                {t("نصب دیتای FPKG فعال", "Direct PKG Injection Ready")}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-lg bg-psn-soft px-3 py-1.5 text-xs font-bold text-psn">
                <Check size={16} />
                {t("دانلود مستقیم PSN فعال", "Official PSN Route Active")}
              </span>
            )}
          </div>
        </div>

        {/* User-Agent String */}
        <div className="mt-4 border-t border-line pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-muted">
          <div className="truncate max-w-xl">
            <span className="font-bold text-fg-2">{t("شناسه مرورگر (User-Agent):", "Device User-Agent:")}</span>{" "}
            <span dir="ltr" className="font-mono text-muted">
              {userAgent || "Mozilla/5.0 (PlayStation; PlayStation 5/4.50) AppleWebKit/605.1.15"}
            </span>
          </div>
          <span className="shrink-0 font-semibold text-accent-2">
            {t("هاردور آیدی: PS5-CFI-1216A", "Hardware ID: PS5-CFI-1216A")}
          </span>
        </div>
      </div>
    </Card>
  );
}

/** Referral & Wallet Summary Row */
function EconomySummary() {
  const { t, n } = useApp();
  const [copied, setCopied] = useState(false);

  const formatPrice = (val: number) => {
    return n(val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));
  };

  const copyRef = () => {
    navigator.clipboard.writeText(REFERRAL_DATA.referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Wallet Widget */}
      <Card className="flex flex-col justify-between p-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Wallet size={18} className="text-accent-2" />
              {t("کیف پول کاربری", "User Wallet")}
            </h3>
            <Pill tone="success">{t("فعال و متصل", "Online")}</Pill>
          </div>
          <p className="text-xs text-fg-2">
            {t(
              "موجودی فعلی قابل استفاده برای خرید و تمدید اشتراک‌ها یا تسویه به حساب بانکی:",
              "Available balance for subscription purchases or bank settlement:"
            )}
          </p>

          <div className="mt-4 rounded-xl border border-line bg-surface-2 p-4">
            <span className="text-[11px] text-muted">{t("موجودی کیف پول", "Current Balance")}</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-latin text-2xl font-black text-fg">
                {formatPrice(WALLET_DATA.balanceToman)}
              </span>
              <span className="text-xs font-bold text-accent-2">{t("تومان", "Toman")}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <Button variant="primary" size="sm" to="/wallet" className="flex-1">
            <Plus size={14} />
            {t("شارژ آنلاین", "Top Up")}
          </Button>
          <Button variant="secondary" size="sm" to="/wallet" className="flex-1">
            {t("درخواست تسویه", "Withdraw")}
          </Button>
        </div>
      </Card>

      {/* Referral Quick Card */}
      <Card className="flex flex-col justify-between p-6 border-gold/30 bg-gold/5">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Users size={18} className="text-gold" />
              {t("سیستم رفرال و کسب درآمد", "Affiliate & Referral")}
            </h3>
            <span className="rounded-full bg-gold/20 px-2.5 py-0.5 text-[10px] font-bold text-gold">
              {t("سطح ۲ نقره‌ای", "Tier 2 Silver")}
            </span>
          </div>
          <p className="text-xs text-fg-2">
            {t(
              `تا کنون ${n(REFERRAL_DATA.totalInvites)} نفر را دعوت کرده‌اید و مبلغ ${formatPrice(REFERRAL_DATA.totalCommissionToman)} تومان پورسانت کسب کرده‌اید.`,
              `You have invited ${n(REFERRAL_DATA.totalInvites)} gamers and earned ${formatPrice(REFERRAL_DATA.totalCommissionToman)} Toman in commissions.`
            )}
          </p>

          <div className="mt-4 flex items-center justify-between rounded-xl border border-line bg-surface p-2.5">
            <span dir="ltr" className="font-mono text-xs font-bold text-accent-2 truncate max-w-[200px]">
              {REFERRAL_DATA.referralLink}
            </span>
            <button
              onClick={copyRef}
              className="flex items-center gap-1 rounded bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent-2 hover:bg-accent/30 transition-colors cursor-pointer"
            >
              {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
              <span>{copied ? t("کپی شد", "Copied") : t("کپی", "Copy")}</span>
            </button>
          </div>
        </div>

        <div className="mt-6">
          <Button variant="secondary" size="sm" to="/referral" className="w-full">
            <span>{t("مشاهده شبکه زیرمجموعه‌ها و گزارش درآمد", "View Referral Network Report")}</span>
            <ArrowRight size={14} className="rtl:rotate-180" />
          </Button>
        </div>
      </Card>
    </section>
  );
}

function ConsoleDownloads() {
  const { t, n } = useApp();
  const gow = GAMES[0];
  const queued = [
    { g: GAMES[1], slug: "rdr2", title: { fa: "Red Dead Redemption 2", en: "Red Dead Redemption 2" } },
    { g: GAMES[4], slug: "gtav", title: { fa: "Grand Theft Auto V", en: "Grand Theft Auto V" } },
  ];
  const recent = [
    { g: GAMES[2], console: { fa: "PS5 اتاق نشیمن", en: "Living room PS5" }, date: "۱۴۰۵/۰۲/۱۴", status: "delivered" },
    { g: GAMES[3], console: { fa: "PS5 اتاق کار", en: "Office PS5" }, date: "۱۴۰۵/۰۲/۱۲", status: "delivered" },
  ];

  return (
    <div className="space-y-8">
      {/* Active Console Queue */}
      <section>
        <SectionTitle
          action={
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs font-semibold text-fg-2">{t("کنسول آنلاین", "Console online")}</span>
            </div>
          }
        >
          {t("صف دانلود کنسول PS5", "Console download queue")}
        </SectionTitle>

        <Card className="p-6">
          <div className="flex items-start gap-4">
            <GameArt src={gow.image} alt="" className="size-16 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-latin text-base font-bold text-fg"><bdi>{gow.title}</bdi></h3>
                <span className="font-latin text-sm font-bold text-accent-2">62%</span>
              </div>
              <p className="text-xs text-fg-2 mt-0.5">{t("PS5 اتاق نشیمن", "Living room PS5")}</p>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-3">
                <div className="h-full rounded-full bg-accent-2" style={{ width: "62%" }} />
              </div>

              <div className="mt-2.5 flex items-center justify-between text-xs text-muted">
                <span>
                  <span dir="ltr" className="font-latin font-medium">32.4</span> /{" "}
                  <span dir="ltr" className="font-latin font-medium">{n(gow.sizeGb)} GB</span>
                </span>
                <span>{n(EDGE.speedMbps)} Mbps · {t("حدود ۶ ساعت باقیمانده", "~6 h left")}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-line pt-4 space-y-2">
            <p className="text-xs font-bold text-muted uppercase tracking-wider">
              {t("در صف انتظار", "Next in Queue")}
            </p>
            {queued.map((item) => (
              <div key={item.slug} className="flex items-center justify-between text-sm py-1">
                <div className="flex items-center gap-3">
                  <span className="size-2 rounded-full bg-line-strong" />
                  <span className="font-latin font-medium">{t(item.title.fa, item.title.en)}</span>
                </div>
                <span className="text-xs text-muted font-latin">{n(item.g.sizeGb)} GB</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* Recent Deliveries */}
      <section>
        <SectionTitle>{t("تاریخچه تحویل‌های اخیر", "Recent deliveries")}</SectionTitle>
        <Card className="overflow-hidden">
          {recent.map((r, i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-6 py-4 border-b border-line last:border-0 hover:bg-surface-2 transition-colors"
            >
              <GameArt src={r.g.image} alt="" className="size-10 shrink-0 rounded-lg" />
              <div className="flex-1 min-w-0">
                <p className="font-latin text-sm font-semibold truncate">{r.g.title}</p>
                <p className="text-xs text-fg-2">{t(r.console.fa, r.console.en)}</p>
              </div>
              <span className="text-xs font-latin text-muted">{r.date}</span>
              <Pill tone="success">
                <Check size={12} strokeWidth={3} /> {t("تحویل شد", "Delivered")}
              </Pill>
            </div>
          ))}
        </Card>
      </section>
    </div>
  );
}

function Sidebar() {
  const { t, n } = useApp();
  const ownedGames = GAMES.filter((g) => g.ownership === "owned").slice(0, 6);

  return (
    <div className="flex flex-col gap-8">
      {/* Quota & Subscription */}
      <Card className="p-6 border-accent/40 bg-gradient-to-br from-accent-soft via-surface to-surface">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-accent-2">
            {t("پلن اشتراک نقره‌ای", "Silver Subscription")}
          </span>
          <Pill tone="accent">{t(USER.renewsFa, USER.renewsEn)}</Pill>
        </div>
        <div className="mb-4">
          <p className="text-xs text-fg-2">{t("سهمیه حجم باقی‌مانده", "Remaining Quota")}</p>
          <p className="text-2xl font-black font-latin mt-1">
            {n(USER.quotaLeftGb)} GB <span className="text-sm font-medium text-fg-2">/ {n(USER.quotaTotalGb)} GB</span>
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-line-strong">
            <span
              className="block h-full rounded-full bg-accent-2"
              style={{ width: `${(USER.quotaLeftGb / USER.quotaTotalGb) * 100}%` }}
            />
          </div>
        </div>
        <Button to="/plans" size="md" className="w-full">
          <Sparkles size={16} />
          {t("ارتقای پلن به طلایی ۲٫۲ ترابایت", "Upgrade to Gold 2.2 TB")}
        </Button>
      </Card>

      {/* Storage Manager Quick Link */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <HardDrive size={16} className="text-accent-2" />
            {t("مدیریت حافظه کنسول", "Console Storage")}
          </h3>
          <Pill tone="neutral">PS5</Pill>
        </div>
        <p className="text-xs text-fg-2 mb-4 leading-relaxed">
          {t(
            "مدیریت فضای SSD داخلی، M.2 NVMe و هارد اکسترنال USB متصل به کنسول با قابلیت انتقال بازی‌ها.",
            "Manage internal SSD, M.2 NVMe, and external USB storage with game transfer capabilities."
          )}
        </p>
        <Button to="/storage" variant="secondary" size="sm" className="w-full">
          {t("ورود به مدیریت فایل و حافظه", "Open Storage Manager")}
        </Button>
      </Card>

      {/* My PSN Library Preview */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm">{t("بازی‌های کتابخانه من", "My PSN Library")}</h3>
          <Link href="/games" className="text-xs font-semibold text-accent-2 hover:underline">
            {t("همه", "View all")}
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {ownedGames.map((g) => (
            <Link key={g.slug} href={`/games/${g.slug}`} className="group">
              <GameArt
                src={g.image}
                alt=""
                className="aspect-[3/4] rounded-lg border border-line group-hover:border-accent-2 transition-colors"
              />
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Page>
      <div className="mx-auto max-w-[1440px] px-6 pt-6 space-y-8">
        <Cover />
        <Identity />
        <StatRow />

        {/* Firmware & Jailbreak Detection */}
        <ConsoleDeviceDetection />

        {/* Economy Row: Wallet & Referral */}
        <EconomySummary />

        {/* Main 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ConsoleDownloads />
          </div>
          <div className="lg:col-span-1">
            <Sidebar />
          </div>
        </div>
      </div>
    </Page>
  );
}
