import { useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import {
  AlertTriangle, Award, BadgeCheck, CalendarDays, Check, Clock, Download, FileArchive, Gamepad2,
  Globe, HardDrive, Languages, Lock, Monitor, ShieldCheck, ShoppingBag, Sparkles, Trophy, Users, Wrench,
} from "lucide-react";
import { Page } from "../components/Shell";
import { GameTile } from "../components/GameTile";
import { Button, Card, MetaScore, Pill, PlatformBadge, SectionTitle } from "../components/ui";
import { useApp } from "../lib/app";
import { EDGE, GAMES, USER, game, hoursAt, type Game, type Ownership } from "../lib/data";
import { useScreenInit } from "../useScreenInit";

type Quota = "ok" | "low";

const FILES = [
  { icon: FileArchive, fa: "بازی کامل", en: "Full game", ver: "v1.00", gb: 78.2 },
  { icon: Wrench, fa: "آخرین آپدیت", en: "Latest update", ver: "v1.35", gb: 5.8 },
  { icon: Languages, fa: "بسته زیرنویس فارسی", en: "Persian subtitle pack", ver: "v2.1", gb: 1.4 },
];

function CardHead({ icon, title, label }: { icon: ReactNode; title: string; label?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-t-card border-b border-line bg-linear-to-b from-accent-soft to-transparent px-6 py-4">
      <h3 className="flex items-center gap-2.5 text-[15px] font-bold">
        <span className="text-accent-2">{icon}</span>
        {title}
      </h3>
      {label && <Pill tone="accent">{label}</Pill>}
    </div>
  );
}

function KV({ k, v, icon }: { k: string; v: ReactNode; icon: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-3.5 last:border-0">
      <span className="flex items-center gap-2.5 text-sm text-fg-2">
        <span className="text-muted">{icon}</span>
        {k}
      </span>
      <span className="text-sm font-semibold">{v}</span>
    </div>
  );
}

function OwnershipPanel({ g, own, quota, sent, onSend }: { g: Game; own: Ownership; quota: Quota; sent: boolean; onSend: () => void }) {
  const { t, n } = useApp();
  const left = quota === "low" ? 42 : USER.quotaLeftGb;
  const enough = left >= g.sizeGb;

  if (own === "not-owned")
    return (
      <Card className="w-[380px] p-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-fg-2">
          <Lock size={16} />
          {t("این بازی در کتابخانه PSN شما نیست", "Not in your PSN library")}
        </div>
        <p className="mt-3 text-sm leading-relaxed text-fg-2">
          {t(
            "Nebula فقط بازی‌هایی را دانلود می‌کند که روی حساب PlayStation شما خریداری شده‌اند. پس از خرید، بازی ظرف چند دقیقه اینجا آماده می‌شود.",
            "Nebula only delivers games purchased on your PlayStation account. Once bought, it's ready here within minutes.",
          )}
        </p>
        <Button variant="psn" size="lg" className="mt-5 w-full">
          <ShoppingBag size={18} />
          {t("خرید از PlayStation Store", "Buy on PlayStation Store")}
        </Button>
        <Button variant="secondary" className="mt-2.5 w-full" disabled>
          <Download size={16} />
          {t("ارسال به PS5", "Send to PS5")}
        </Button>
      </Card>
    );

  return (
    <Card className="w-[380px] p-6">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold text-success">
          <ShieldCheck size={17} />
          {t("مالکیت تأیید شد", "Ownership verified")}
        </span>
        <span className="text-xs text-fg-2">{t("حساب PSN · arman_rhm", "PSN · arman_rhm")}</span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-surface-2 p-3.5">
          <p className="text-xs text-fg-2">{t("حجم مصرفی سهمیه", "Quota used")}</p>
          <p dir="ltr" className="mt-1 text-start font-latin text-lg font-bold">{n(g.sizeGb)} GB</p>
        </div>
        <div className="rounded-xl bg-surface-2 p-3.5">
          <p className="text-xs text-fg-2">{t("زمان تقریبی", "Est. time")}</p>
          <p className="mt-1 text-lg font-bold">{t(`${n(hoursAt(g.sizeGb, EDGE.speedMbps).toFixed(1))} ساعت`, `${hoursAt(g.sizeGb, EDGE.speedMbps).toFixed(1)} h`)}</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-xs text-fg-2">
          <span>{t("سهمیه باقی‌مانده", "Quota left")}</span>
          <span dir="ltr" className="font-latin">
            {n(left)} GB → <span className={enough ? "text-fg" : "text-danger"}>{enough ? `${n((left - g.sizeGb).toFixed(1))} GB` : "—"}</span>
          </span>
        </div>
        <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-line-strong">
          <span className="h-full bg-fg-2" style={{ width: `${(Math.min(left, g.sizeGb) / USER.quotaTotalGb) * 100}%` }} />
          <span className="h-full bg-accent-2" style={{ width: `${(Math.max(left - g.sizeGb, 0) / USER.quotaTotalGb) * 100}%` }} />
        </div>
      </div>

      {!enough ? (
        <>
          <div className="mt-5 flex gap-2.5 rounded-xl border border-warning/40 bg-warning-soft p-3.5 text-sm">
            <AlertTriangle size={17} className="mt-0.5 shrink-0 text-warning" />
            <p className="text-fg-2">
              {t(
                `برای این بازی ${n(g.sizeGb)} گیگابایت لازم است و ${n(left)} گیگابایت دارید. می‌توانید با سرعت عادی PSN دانلود کنید یا پلن را ارتقا دهید.`,
                `This needs ${g.sizeGb} GB and you have ${left} GB. Download at standard PSN speed, or upgrade your plan.`,
              )}
            </p>
          </div>
          <Button size="lg" className="mt-4 w-full" to="/plans">
            <Sparkles size={18} />
            {t("ارتقا به طلایی · ۲٫۲ ترابایت", "Upgrade to Gold · 2.2 TB")}
          </Button>
          <Button variant="ghost" className="mt-2 w-full">
            {t("دانلود با سرعت عادی PSN", "Download at standard PSN speed")}
          </Button>
        </>
      ) : sent ? (
        <div className="mt-5 rounded-xl border border-success/40 bg-success-soft p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-success">
            <Check size={16} strokeWidth={3} />
            {t("به صف دانلود PS5 شما اضافه شد", "Added to your PS5 download queue")}
          </p>
          <p className="mt-1.5 text-xs text-fg-2">
            {t("کنسول «PS5 اتاق نشیمن» · دانلود از سرور تهران ۱ شروع شد", "Console “Living room PS5” · streaming from Tehran-1")}
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line-strong">
            <span className="block h-full w-[6%] rounded-full bg-success" />
          </div>
        </div>
      ) : (
        <>
          <Button size="lg" className="mt-5 w-full" onClick={onSend}>
            <Download size={18} />
            {t("ارسال کامل به PS5", "Send everything to PS5")}
          </Button>
          <p className="mt-2.5 text-center text-xs text-muted">
            {t("از طریق صف دانلود PSN به کنسول «PS5 اتاق نشیمن»", "Via PSN download queue to “Living room PS5”")}
          </p>
        </>
      )}
    </Card>
  );
}

export default function GameDetail() {
  const { t, n } = useApp();
  const init = useScreenInit() as { ownership?: Ownership; quota?: Quota; sent?: boolean };
  const { slug = "god-of-war" } = useParams();
  const g = game(slug);
  const own: Ownership = init.ownership ?? (g.ownership === "free" ? "owned" : g.ownership);
  const quota: Quota = init.quota ?? "ok";
  const [sent, setSent] = useState(Boolean(init.sent));
  const similar = GAMES.filter((x) => x.slug !== g.slug).slice(0, 6);

  return (
    <Page>
      {/* Wallpaper hero, fading to black */}
      <div className="absolute inset-x-0 top-0 h-[620px] overflow-hidden">
        <img src={g.image} alt="" className="h-full w-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-linear-to-b from-bg/30 via-bg/70 to-bg" />
      </div>

      <div className="relative mx-auto max-w-[1440px] px-6">
        <section className="flex items-end justify-between gap-10 pb-8 pt-28">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2">
              {g.platforms.map((p) => (
                <PlatformBadge key={p} p={p} solid={p === "PS5"} />
              ))}
              <span className="text-sm text-white/70">{t(g.genreFa, g.genreEn)}</span>
            </div>
            <h1 className="mt-4 font-latin text-6xl font-extrabold tracking-tight text-white">
              <bdi>{g.title}</bdi>
            </h1>
            <p className="mt-3 font-latin text-lg text-white/80"><bdi>{g.studio}</bdi></p>
            <div className="mt-6 flex items-center gap-5 text-sm text-white/80">
              <span className="flex items-center gap-2">
                <MetaScore v={g.metacritic} /> Metacritic
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarDays size={15} /> {n(g.year)}
              </span>
              <span className="rounded border border-white/40 px-1.5 font-latin text-xs font-bold">M 17+</span>
              <span className="flex items-center gap-1.5">
                <HardDrive size={15} /> <span dir="ltr">{n(g.sizeGb)} GB</span>
              </span>
            </div>
          </div>
          <OwnershipPanel g={g} own={own} quota={quota} sent={sent} onSend={() => setSent(true)} />
        </section>

        {/* Quota info banner */}
        <section className="flex items-center gap-5 rounded-card border border-gold/30 bg-linear-to-l from-accent-soft to-surface px-6 py-5 ltr:bg-linear-to-r">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold">
            <Download size={22} />
          </span>
          <div className="flex-1">
            <p className="font-semibold">
              {t(
                "کل بازی و همه فایل‌های آن را یک‌جا به کنسول بفرستید. حجم مصرفی سهمیه برابر با اندازه کامل دانلود است.",
                "Send the whole game and every file to your console in one go. Quota used equals the full download size.",
              )}
            </p>
            <p className="mt-1 text-sm text-fg-2">
              PS5 • {t(`${n(FILES.length)} فایل`, `${FILES.length} files`)} • {t("سهمیه مصرفی:", "Quota:")}{" "}
              <span dir="ltr" className="font-latin font-semibold text-gold">{n(g.sizeGb)} GB</span>
            </p>
          </div>
        </section>

        {/* Three equal cards */}
        <section className="mt-6 grid grid-cols-3 items-stretch gap-5">
          <Card>
            <CardHead icon={<Award size={18} />} title={t("استودیو و جوایز", "Studio & awards")} />
            <div className="space-y-6 p-6">
              <div className="flex items-center gap-3.5">
                <span className="grid size-14 place-items-center rounded-xl bg-linear-135 from-psn to-accent font-latin text-lg font-extrabold text-white">SMS</span>
                <div>
                  <p className="font-latin font-bold"><bdi>{g.studio}</bdi></p>
                  <p className="text-xs text-fg-2">{t("استودیوی فرست‌پارتی PlayStation", "PlayStation first-party studio")}</p>
                </div>
              </div>
              <div>
                <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted">{t("جوایز بازی", "Game awards")}</p>
                <ul className="space-y-2 text-sm">
                  {["Game of the Year — The Game Awards (2018)", "Best Game Direction (2018)", "Best Action/Adventure (2018)"].map((a) => (
                    <li key={a} className="flex items-start gap-2">
                      <Trophy size={15} className="mt-0.5 shrink-0 text-gold" />
                      <bdi className="font-latin">{a}</bdi>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted">{t("افتخارات استودیو", "Studio honours")}</p>
                <ul className="space-y-1.5 text-sm text-fg-2">
                  {["God of War Ragnarök — Best Narrative (2022)", "God of War Ragnarök — Innovation in Accessibility (2022)"].map((a) => (
                    <li key={a} className="font-latin">• <bdi>{a}</bdi></li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>

          <Card>
            <CardHead icon={<Gamepad2 size={18} />} title={t("ویژگی‌های بازی", "What it supports")} />
            <div className="px-6 py-2">
              <KV icon={<Gamepad2 size={15} />} k={t("بازخورد لمسی DualSense", "DualSense haptics")} v={<span className="text-fg-2">{t("ثبت نشده است", "Not listed")}</span>} />
              <KV icon={<Monitor size={15} />} k="PS VR2" v={<span className="text-fg-2">{t("ندارد", "No")}</span>} />
              <KV icon={<Globe size={15} />} k={t("بازی آنلاین", "Online play")} v={t("آفلاین", "Offline")} />
              <KV icon={<Users size={15} />} k={t("تعداد بازیکن", "Players")} v={<Pill>{t("۱ نفره", "1 player")}</Pill>} />
              <KV icon={<Clock size={15} />} k={t("مدت زمان بازی", "Playtime")} v={t("حدود ۳۳ ساعت", "~33 hours")} />
              <KV icon={<BadgeCheck size={15} />} k={t("رده سنی (ESRB)", "Rating (ESRB)")} v={<span className="font-latin">M 17+</span>} />
              <KV icon={<HardDrive size={15} />} k={t("پلتفرم‌ها", "Platforms")} v={<span dir="ltr" className="font-latin">PS4, PS5</span>} />
            </div>
          </Card>

          <Card>
            <CardHead icon={<Sparkles size={18} />} title={t("قلب بازی | داستان", "The story")} label={t("خلاصه تدوین‌شده", "Editor's summary")} />
            <div className="space-y-4 p-6 text-[15px] leading-8 text-fg-2">
              <p>
                {t(
                  "سال‌ها پس از انتقام از خدایان المپ، کریتوس در سرزمین خدایان نورس زندگی تازه‌ای ساخته است. مرگ همسرش او و پسرش آترئوس را به سفری می‌کشاند تا خاکستر او را از بلندترین قله نُه قلمرو پراکنده کنند.",
                  "Years after his vengeance against the gods of Olympus, Kratos has built a new life in the realm of the Norse gods. His wife's death sets him and his son Atreus on a journey to scatter her ashes from the highest peak in the nine realms.",
                )}
              </p>
              <p>
                {t(
                  "داستانی درباره پدری که باید خشمش را مهار کند و پسری که هنوز نمی‌داند کیست — با دوربینی بی‌وقفه و نبردهایی سنگین و حساب‌شده.",
                  "A story of a father learning to master his rage, and a son who doesn't yet know who he is — told in a single unbroken shot, with weighty, deliberate combat.",
                )}
              </p>
            </div>
          </Card>
        </section>

        {/* Files */}
        <section className="mt-12">
          <SectionTitle
            action={
              <span className="flex items-center gap-2 text-sm text-fg-2">
                <span className="size-2 rounded-full bg-success" />
                {t("همه فایل‌ها روی سرور تهران ۱ کش شده‌اند", "All files cached on Tehran-1")}
              </span>
            }
          >
            {t("فایل‌ها", "Files")}
          </SectionTitle>
          <Card className="overflow-hidden">
            {FILES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.en} className="flex items-center gap-4 border-b border-line px-6 py-4 last:border-0">
                  <span className="grid size-10 place-items-center rounded-lg bg-surface-2 text-fg-2">
                    <Icon size={18} />
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold">{t(f.fa, f.en)}</p>
                    <p className="font-latin text-xs text-muted">{f.ver}</p>
                  </div>
                  <span dir="ltr" className="w-24 font-latin text-sm font-semibold">{n(f.gb)} GB</span>
                  {own === "not-owned" ? (
                    <Pill><Lock size={12} /> {t("نیاز به مالکیت", "Requires ownership")}</Pill>
                  ) : (
                    <Pill tone="success"><Check size={12} strokeWidth={3} /> {t("آماده", "Ready")}</Pill>
                  )}
                </div>
              );
            })}
            <div className="flex items-center justify-between bg-surface-2 px-6 py-4">
              <span className="text-sm text-fg-2">
                {t("DLC برای این بازی منتشر نشده است.", "No DLC has been released for this game.")}
              </span>
              <span className="text-sm">
                {t("مجموع:", "Total:")} <span dir="ltr" className="font-latin font-bold">{n(g.sizeGb)} GB</span>
              </span>
            </div>
          </Card>
        </section>

        <section className="mt-12">
          <SectionTitle>{t("بازی‌های مشابه", "More like this")}</SectionTitle>
          <div className="flex gap-5 overflow-x-auto pb-3 pt-1">
            {similar.map((s) => (
              <GameTile key={s.slug} g={s} />
            ))}
          </div>
        </section>
      </div>
    </Page>
  );
}
