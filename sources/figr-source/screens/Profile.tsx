import {
  AlertTriangle, BadgeCheck, Camera, CalendarDays, Check, Clock, Download, Gamepad2, Gauge, HardDrive,
  Monitor, Pause, Pencil, Plus, RefreshCw, Sparkles, Trophy, Tv, Wallet, X, type LucideIcon,
} from "lucide-react";
import { Page } from "../components/Shell";
import { GameArt, GameTile } from "../components/GameTile";
import { Button, Card, Pill, PlatformBadge, SectionTitle, ShapePattern } from "../components/ui";
import { useApp } from "../lib/app";
import { EDGE, GAMES, USER } from "../lib/data";

type StatProps = { icon: LucideIcon; label: string; value: string; hero?: boolean; tone?: string };

function Stat({ icon: Icon, label, value, hero = false, tone = "text-accent-2" }: StatProps) {
  return (
    <Card
      className={`flex flex-col gap-3 p-4 ${hero ? "border-accent/60 bg-accent-soft shadow-glow-sm" : ""}`}
    >
      <span className={`grid size-10 place-items-center rounded-xl ${hero ? "bg-accent text-on-accent" : "bg-surface-2"} ${tone}`}>
        <Icon size={18} />
      </span>
      <div>
        <p className="text-xs text-fg-2">{label}</p>
        <p className={`mt-1 font-latin font-bold ${hero ? "text-2xl text-accent-2" : "text-lg"}`}>{value}</p>
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
            <span dir="ltr" className="font-latin">PSN · {USER.psnId}</span>
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
      <div className="pb-1">
        <Button variant="secondary" size="md">
          <Pencil size={16} />
          {t("ویرایش پروفایل", "Edit profile")}
        </Button>
      </div>
    </div>
  );
}

function StatRow() {
  const { t, n } = useApp();
  return (
    <section className="grid grid-cols-6 gap-3">
      <Stat icon={CalendarDays} label={t("عضویت از", "Member since")} value={t("دی ۱۴۰۱", "Jan 2023")} />
      <Stat icon={Gamepad2} label={t("بازی در کتابخانه PSN", "Games in PSN library")} value={n(EDGE.librarySize)} />
      <Stat icon={Download} label={t("دانلود شده با Nebula", "Downloaded via Nebula")} value={t("۲٫۸ ترابایت", "2.8 TB")} />
      <Stat icon={Gauge} label={t("میانگین سرعت", "Average speed")} value={`${n("19.4")} Mbps`} />
      <Stat
        icon={Clock}
        label={t("زمان صرفه‌جویی‌شده", "Time saved")}
        value={t(`${n(312)} ساعت`, `${312} hours`)}
        hero
      />
      <Stat icon={Trophy} label={t("تروفی‌های PSN", "PSN trophies")} value={n(276)} tone="text-gold" />
    </section>
  );
}

const QUEUED = [
  { slug: "horizon-zero-dawn", title: { fa: "Horizon Zero Dawn", en: "Horizon Zero Dawn" } },
  { slug: "the-witcher-3", title: { fa: "آپدیت The Witcher 3", en: "The Witcher 3 update" } },
];

const RECENT = [
  { slug: "gta-v", console: { fa: "PS5 اتاق نشیمن", en: "PS5 Living room" }, date: "1405/07/26", status: "delivered" as const },
  { slug: "rocket-league", console: { fa: "PS5 اتاق نشیمن", en: "PS5 Living room" }, date: "1405/07/25", status: "transit" as const },
  { slug: "life-is-strange", console: { fa: "PS4 Pro اتاق کار", en: "PS4 Pro Study" }, date: "1405/07/24", status: "failed" as const },
  { slug: "the-witcher-3", console: { fa: "PS5 اتاق نشیمن", en: "PS5 Living room" }, date: "1405/07/20", status: "delivered" as const },
];

const TROPHIES = [
  { slug: "god-of-war", tier: { fa: "پلاتین", en: "Platinum" }, icon: Trophy, box: "bg-silver-2/15 text-silver-2 ring-1 ring-silver-2/40" },
  { slug: "horizon-zero-dawn", tier: { fa: "طلایی", en: "Gold" }, icon: Trophy, box: "bg-gold/15 text-gold ring-1 ring-gold/40" },
  { slug: "the-witcher-3", tier: { fa: "نقره‌ای", en: "Silver" }, icon: Trophy, box: "bg-silver/15 text-silver ring-1 ring-silver/40" },
  { slug: "life-is-strange", tier: { fa: "برنزی", en: "Bronze" }, icon: Trophy, box: "bg-bronze-2/15 text-bronze-2 ring-1 ring-bronze-2/40" },
];

function ConsoleDownloads() {
  const { t, n } = useApp();
  const god = GAMES[0];
  const queued = QUEUED.map((q) => ({ ...q, g: GAMES.find((x) => x.slug === q.slug) ?? GAMES[0] }));
  const recent = RECENT.map((r) => ({ ...r, g: GAMES.find((x) => x.slug === r.slug) ?? GAMES[0] }));
  return (
    <div className="flex flex-col gap-8">
      <section>
        <SectionTitle>{t("صف دانلود کنسول", "Console download queue")}</SectionTitle>
        <Card className="space-y-5 p-6">
          <div className="flex items-center gap-5">
            <GameArt src={god.image} alt="" className="h-24 w-20 shrink-0 rounded-tile border border-line" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="font-latin text-lg font-bold">
                  <bdi>{god.title}</bdi>
                </p>
                <span className="font-latin text-sm font-bold text-accent-2">{n(62)}٪</span>
              </div>
              <p className="mt-1 text-sm text-fg-2">{t("PS5 اتاق نشیمن", "PS5 Living room")}</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-line-strong">
                <span className="block h-full w-[62%] rounded-full bg-accent-2" />
              </div>
              <p className="mt-2.5 text-sm text-fg-2">
                {t(
                  `${n("32.4")} از ${n("85.4")} GB · ${n("19.6")} Mbps · حدود ${n(6)} ساعت مانده`,
                  `${n("32.4")} of ${n("85.4")} GB · ${n("19.6")} Mbps · ~${n(6)} h left`,
                )}
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2">
              <Button variant="ghost" size="sm">
                <Pause size={15} />
                {t("توقف", "Pause")}
              </Button>
              <Button variant="ghost" size="sm">
                <X size={15} />
                {t("لغو", "Cancel")}
              </Button>
            </div>
          </div>
          {queued.map((q) => (
            <div key={q.slug} className="flex items-center gap-4 rounded-xl bg-surface-2 p-3">
              <GameArt src={q.g.image} alt="" className="size-12 shrink-0 rounded-lg" />
              <p className="min-w-0 flex-1 truncate font-latin text-sm font-semibold">
                <bdi>{t(q.title.fa, q.title.en)}</bdi>
              </p>
              <Pill>
                <Clock size={12} />
                {t("در صف", "Queued")}
              </Pill>
            </div>
          ))}
        </Card>
      </section>

      <section>
        <SectionTitle>{t("دانلودهای اخیر", "Recent downloads")}</SectionTitle>
        <Card className="overflow-hidden">
          <div className="grid grid-cols-[minmax(0,2.2fr)_0.8fr_1.2fr_1fr_1.3fr] gap-4 border-b border-line bg-surface-2 px-5 py-3 text-xs font-semibold text-muted">
            <span>{t("بازی", "Game")}</span>
            <span>{t("حجم", "Size")}</span>
            <span>{t("کنسول", "Console")}</span>
            <span>{t("تاریخ", "Date")}</span>
            <span>{t("وضعیت", "Status")}</span>
          </div>
          {recent.map((r) => (
            <div
              key={`${r.slug}-${r.date}`}
              className="grid grid-cols-[minmax(0,2.2fr)_0.8fr_1.2fr_1fr_1.3fr] items-center gap-4 border-b border-line px-5 py-3.5 last:border-0"
            >
              <div className="flex min-w-0 items-center gap-3">
                <GameArt src={r.g.image} alt="" className="size-10 shrink-0 rounded-lg" />
                <p className="truncate font-latin text-sm font-semibold">
                  <bdi>{r.g.title}</bdi>
                </p>
              </div>
              <span dir="ltr" className="font-latin text-sm text-fg-2">{n(r.g.sizeGb)} GB</span>
              <span className="truncate text-sm text-fg-2">{t(r.console.fa, r.console.en)}</span>
              <span className="font-latin text-sm text-fg-2">{n(r.date)}</span>
              <div>
                {r.status === "delivered" && (
                  <Pill tone="success">
                    <Check size={12} strokeWidth={3} />
                    {t("تحویل شده", "Delivered")}
                  </Pill>
                )}
                {r.status === "transit" && (
                  <Pill tone="psn">
                    <RefreshCw size={12} />
                    {t("در حال انتقال", "In transit")}
                  </Pill>
                )}
                {r.status === "failed" && (
                  <div className="flex items-center gap-2.5">
                    <Pill tone="danger">
                      <AlertTriangle size={12} />
                      {t("ناموفق", "Failed")}
                    </Pill>
                    <button className="text-xs font-semibold text-accent-2 hover:underline">
                      {t("تلاش مجدد", "Retry")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </Card>
      </section>

      <section>
        <SectionTitle
          action={
            <button className="text-sm font-medium text-accent-2 hover:underline">{t("مشاهده همه", "See all")}</button>
          }
        >
          {t("کتابخانه PSN شما", "Your PSN library")}
        </SectionTitle>
        <div className="-mx-2 flex gap-5 overflow-x-auto px-2 pb-3 pt-1">
          {GAMES.filter((g) => g.ownership === "owned").map((g) => (
            <GameTile key={g.slug} g={g} />
          ))}
        </div>
      </section>
    </div>
  );
}

function QuotaCard() {
  const { t, n } = useApp();
  const used = 100 - (USER.quotaLeftGb / USER.quotaTotalGb) * 100;
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2.5 text-[15px] font-bold">
          <HardDrive size={18} className="text-accent-2" />
          {t("سهمیه و پلن", "Quota & plan")}
        </h3>
        <span className="flex items-center gap-2 rounded-full bg-silver/15 px-3 py-1 text-xs font-bold text-silver-2">
          <span className="size-2 rounded-full bg-silver" />
          {t("نقره‌ای", "Silver")}
        </span>
      </div>
      <div className="mt-5 flex items-center gap-5">
        <div className="relative grid size-28 shrink-0 place-items-center">
          <svg viewBox="0 0 36 36" className="size-28 -rotate-90">
            <circle cx="18" cy="18" r="15.9155" fill="none" strokeWidth="3" className="stroke-line-strong" />
            <circle
              cx="18"
              cy="18"
              r="15.9155"
              fill="none"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${100 - used} 100`}
              className="stroke-accent-2"
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <p dir="ltr" className="font-latin text-lg font-extrabold">{n(USER.quotaLeftGb)} GB</p>
              <p className="text-[10px] text-fg-2">{t("باقی‌مانده", "left")}</p>
            </div>
          </div>
        </div>
        <div className="min-w-0 text-sm">
          <p className="font-semibold">
            {t(`${n(USER.quotaLeftGb)} گیگابایت از ${n(1)} ترابایت`, `${USER.quotaLeftGb} GB of 1 TB`)}
          </p>
          <p className="mt-1.5 text-fg-2">{t(`تمدید ${USER.renewsFa}`, `Renews ${USER.renewsEn}`)}</p>
        </div>
      </div>
      <Button size="md" className="mt-5 w-full" to="/plans">
        <Sparkles size={16} />
        {t("ارتقا پلن", "Upgrade plan")}
      </Button>
    </Card>
  );
}

function WalletCard() {
  const { t } = useApp();
  return (
    <section className="rounded-card border border-accent-2/40 bg-linear-135 from-accent-deep via-accent to-accent-2 p-6 text-on-accent shadow-glow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-on-accent/80">{t("موجودی کیف پول", "Wallet balance")}</span>
        <Wallet size={20} />
      </div>
      <p className="mt-3 font-latin text-3xl font-extrabold">
        {t("۱٬۲۵۰٬۰۰۰ تومان", "1,250,000 Toman")}
      </p>
      <Button variant="secondary" size="md" className="mt-5 w-full border-transparent bg-bg/25 text-on-accent hover:border-transparent hover:bg-bg/40">
        <Plus size={16} />
        {t("شارژ کیف پول", "Top up wallet")}
      </Button>
    </section>
  );
}

function ConsolesCard() {
  const { t } = useApp();
  return (
    <Card className="p-6">
      <h3 className="mb-4 flex items-center gap-2.5 text-[15px] font-bold">
        <Tv size={18} className="text-accent-2" />
        {t("کنسول‌های من", "My consoles")}
      </h3>
      <div className="space-y-2.5">
        <div className="flex items-center gap-3.5 rounded-xl bg-surface-2 p-3.5">
          <PlatformBadge p="PS5" solid />
          <p className="min-w-0 flex-1 truncate text-sm font-semibold">{t("PS5 اتاق نشیمن", "PS5 Living room")}</p>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-success">
            <span className="size-2 rounded-full bg-success" />
            {t("آنلاین", "Online")}
          </span>
        </div>
        <div className="flex items-center gap-3.5 rounded-xl bg-surface-2 p-3.5">
          <PlatformBadge p="PS4" />
          <p className="min-w-0 flex-1 truncate text-sm font-semibold">{t("PS4 Pro اتاق کار", "PS4 Pro Study")}</p>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-fg-2">
            <span className="size-2 rounded-full bg-muted" />
            {t("آفلاین", "Offline")}
          </span>
        </div>
      </div>
      <Button variant="ghost" size="sm" className="mt-3 w-full">
        <Monitor size={15} />
        {t("افزودن کنسول", "Add console")}
      </Button>
    </Card>
  );
}

function TrophiesCard() {
  const { t } = useApp();
  const items = TROPHIES.map((tr) => ({ ...tr, g: GAMES.find((x) => x.slug === tr.slug) ?? GAMES[0] }));
  return (
    <Card className="p-6">
      <h3 className="mb-5 flex items-center gap-2.5 text-[15px] font-bold">
        <Trophy size={18} className="text-gold" />
        {t("تروفی‌های اخیر PSN", "Recent PSN trophies")}
      </h3>
      <div className="grid grid-cols-4 gap-3 text-center">
        {items.map((tr) => {
          const Icon = tr.icon;
          return (
            <div key={tr.slug} className="flex flex-col items-center gap-2">
              <span className={`grid size-14 place-items-center rounded-full ${tr.box}`}>
                <Icon size={22} />
              </span>
              <p className="w-full truncate font-latin text-[11px] font-semibold">
                <bdi>{tr.g.title}</bdi>
              </p>
              <p className="text-[10px] text-fg-2">{t(tr.tier.fa, tr.tier.en)}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default function Profile() {
  return (
    <Page>
      <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-6 pt-6">
        <Cover />
        <Identity />
        <StatRow />
        <div className="grid grid-cols-[2fr_1fr] items-start gap-6">
          <ConsoleDownloads />
          <aside className="flex flex-col gap-5">
            <QuotaCard />
            <WalletCard />
            <ConsolesCard />
            <TrophiesCard />
          </aside>
        </div>
      </div>
    </Page>
  );
}
