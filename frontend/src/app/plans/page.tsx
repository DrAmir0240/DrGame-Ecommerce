"use client";

import { useState, type ReactNode } from "react";
import { Check, Info, Tag, X } from "lucide-react";
import { Page } from "@/components/Shell";
import { GameArt } from "@/components/GameTile";
import { Button, Pill, useGb } from "@/components/ui";
import { useApp } from "@/lib/app";
import { EDGE, GAMES, USER, hoursAt } from "@/lib/data";

type Pair = [string, string];

/** Thousands-separated price, Persian digits + Persian separator in fa. */
function usePrice() {
  const { lang, n } = useApp();
  return (v: number) => {
    const grouped = String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return lang === "fa" ? n(grouped).replace(/،/g, "٬") : grouped;
  };
}

function PlanCard({
  name,
  desc,
  price,
  quotaLabel,
  quotaValue,
  head,
  features,
  limits,
  body,
  note,
  cta,
  ctaVariant = "secondary",
  ctaDisabled = false,
  highlight = false,
}: {
  name: Pair;
  desc: Pair;
  price: ReactNode;
  quotaLabel: Pair;
  quotaValue: ReactNode;
  head: string;
  features?: Pair[];
  limits?: Pair[];
  body?: ReactNode;
  note?: Pair;
  cta: Pair;
  ctaVariant?: "primary" | "secondary";
  ctaDisabled?: boolean;
  highlight?: boolean;
}) {
  const { t } = useApp();
  const tt = (p: Pair) => t(p[0], p[1]);
  return (
    <article
      className={`relative flex flex-col overflow-hidden rounded-card border bg-surface shadow-card ${
        highlight ? "border-gold shadow-glow" : "border-line"
      }`}
    >
      <header className={`relative px-5 pb-5 pt-6 ${head}`}>
        {highlight && (
          <span className="absolute end-4 top-4 inline-flex h-6 items-center rounded-full bg-bg px-2.5 text-xs font-bold text-gold">
            {t("پیشنهاد ویژه", "Recommended")}
          </span>
        )}
        <h2 className="text-xl font-extrabold tracking-tight">{tt(name)}</h2>
        <p className="mt-1 min-h-10 text-sm font-medium leading-snug opacity-85">{tt(desc)}</p>
        <div className="mt-4">{price}</div>
      </header>

      <div className="flex flex-1 flex-col gap-5 p-5">
        <div className="rounded-tile border border-line bg-surface-2 p-3 text-center">
          <p className="text-xs text-fg-2">{tt(quotaLabel)}</p>
          <p className="mt-0.5 font-latin text-xl font-extrabold">
            <bdi>{quotaValue}</bdi>
          </p>
        </div>

        {body ? (
          <div className="flex-1">{body}</div>
        ) : (
          <div className="flex flex-1 flex-col gap-4">
            <ul className="flex flex-col gap-2.5">
              {features?.map((f) => (
                <li key={f[1]} className="flex items-start gap-2.5 text-sm">
                  <Check size={16} strokeWidth={2.5} className="mt-0.5 shrink-0 text-success" />
                  <span>{tt(f)}</span>
                </li>
              ))}
            </ul>
            {limits && limits.length > 0 && (
              <ul className="flex flex-col gap-2.5 border-t border-line pt-4">
                {limits.map((l) => (
                  <li key={l[1]} className="flex items-start gap-2.5 text-sm text-muted">
                    <X size={16} strokeWidth={2.5} className="mt-0.5 shrink-0 text-muted" />
                    <span>{tt(l)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {note && (
          <div className="flex items-start gap-2.5 rounded-tile bg-surface-2 p-3 text-xs leading-relaxed text-fg-2">
            <Info size={15} className="mt-0.5 shrink-0 text-accent-2" />
            <span>{tt(note)}</span>
          </div>
        )}
      </div>

      <div className="px-5 pb-5">
        <Button
          variant={ctaVariant}
          size="lg"
          className="w-full"
          disabled={ctaDisabled}
          aria-disabled={ctaDisabled}
        >
          {tt(cta)}
        </Button>
      </div>
    </article>
  );
}

function FreeTitles() {
  const { t } = useApp();
  const rocket = GAMES.find((g) => g.slug === "rocket-league");
  const rows: { fa: string; en: string; initials: string; image?: string }[] = [
    { fa: "Rocket League", en: "Rocket League", initials: "RL", image: rocket?.image },
    { fa: "Fortnite", en: "Fortnite", initials: "FN" },
    { fa: "Apex Legends", en: "Apex Legends", initials: "AL" },
    { fa: "Brawlhalla", en: "Brawlhalla", initials: "BH" },
    { fa: "eFootball", en: "eFootball", initials: "EF" },
  ];
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold text-fg-2">
        {t("بازی‌های رایگان کتابخانه شما", "Free-to-play titles in your library")}
      </p>
      <ul className="flex flex-col gap-2">
        {rows.map((r) => (
          <li key={r.en} className="flex items-center gap-3 rounded-tile border border-line bg-surface-2 p-2">
            {r.image ? (
              <GameArt src={r.image} alt="" className="size-10 shrink-0 rounded-lg" />
            ) : (
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-linear-135 from-accent-deep to-surface-3 font-latin text-xs font-bold">
                {r.initials}
              </span>
            )}
            <span className="font-latin text-sm font-semibold">
              <bdi>{r.en}</bdi>
            </span>
            <span className="ms-auto rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-bold text-success">
              {t("رایگان", "Free")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SpeedStrip() {
  const { t, n } = useApp();
  const g = GAMES[0]; // God of War — 85.4 GB
  const direct = hoursAt(g.sizeGb, EDGE.psnBaselineMbps);
  const silver = hoursAt(g.sizeGb, USER.speedMbps);
  const gold = hoursAt(g.sizeGb, 40);
  const rows: { label: Pair; h: number; bar: string; hours: string; mbps: string }[] = [
    { label: ["مسیر مستقیم PSN", "Direct PSN route"], h: direct, bar: "bg-muted", hours: `~${Math.round(direct)}`, mbps: "3.1 Mbps" },
    { label: ["DrGame CDN — برنز و نقره‌ای", "DrGame CDN — Bronze & Silver"], h: silver, bar: "bg-accent-2", hours: silver.toFixed(1), mbps: "20 Mbps" },
    { label: ["DrGame CDN — طلایی", "DrGame CDN — Gold"], h: gold, bar: "bg-accent-2", hours: gold.toFixed(1), mbps: "40 Mbps" },
  ];
  return (
    <section className="rounded-card border border-line bg-surface p-6 shadow-card">
      <div className="mb-5 flex items-baseline justify-between gap-4">
        <h2 className="flex items-center gap-3 text-lg font-bold tracking-tight">
          <span className="h-5 w-1 rounded-full bg-accent-2" />
          {t("مقایسه سرعت دانلود", "Download speed comparison")}
        </h2>
        <p className="text-sm text-fg-2">
          {t(
            `بازی نمونه: ${g.title} · ${n(g.sizeGb)} GB`,
            `Sample game: ${g.title} · ${g.sizeGb} GB`
          )}
        </p>
      </div>
      <div className="flex flex-col gap-4">
        {rows.map((r) => (
          <div key={r.label[1]} className="grid grid-cols-[260px_1fr_160px] items-center gap-5">
            <div className="text-sm">
              <p className="font-semibold">{t(r.label[0], r.label[1])}</p>
              <p dir="ltr" className="font-latin text-xs text-muted">{r.mbps}</p>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-surface-3">
              <div className={`h-full rounded-full ${r.bar}`} style={{ width: `${(r.h / direct) * 100}%` }} />
            </div>
            <p dir="ltr" className="text-end font-latin text-sm font-bold">
              {n(r.hours)} {t("ساعت", "h")}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function DiscountBox() {
  const { t, n } = useApp();
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<null | "ok" | "bad">(null);
  const apply = () => {
    const c = code.trim();
    if (!c) return setApplied(null);
    setApplied(c.toUpperCase() === "DRGAME20" || c.toUpperCase() === "SONY20" ? "ok" : "bad");
  };
  return (
    <section className="flex flex-col gap-4 rounded-card border border-line bg-surface p-6 shadow-card md:flex-row md:items-center">
      <div className="flex items-center gap-3 md:w-72 md:shrink-0">
        <span className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent-2">
          <Tag size={18} />
        </span>
        <div>
          <p className="text-sm font-bold">{t("کد تخفیف دارید؟", "Have a discount code?")}</p>
          <p className="text-xs text-fg-2">{t("روی پلن پس از ثبت‌نام اعمال می‌شود", "Applied to your plan at checkout")}</p>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-center gap-3">
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setApplied(null);
            }}
            dir="ltr"
            placeholder={t("کد تخفیف خود را وارد کنید… (تست: DRGAME20)", "Enter discount code… (e.g. DRGAME20)")}
            className="h-12 flex-1 rounded-xl border border-line-strong bg-surface-2 px-4 font-latin text-sm uppercase text-fg placeholder:normal-case placeholder:text-muted focus:border-accent-2 focus:outline-none"
          />
          <Button variant="primary" size="lg" onClick={apply}>
            {t("اعمال", "Apply")}
          </Button>
        </div>
        {applied === "ok" && (
          <p className="text-sm font-semibold text-success">
            {t(`${n(20)}٪ تخفیف اعمال شد`, `${n(20)}% discount applied`)}
          </p>
        )}
        {applied === "bad" && (
          <p className="text-sm font-semibold text-danger">{t("کد معتبر نیست", "Invalid code")}</p>
        )}
      </div>
    </section>
  );
}

export default function PlansPage() {
  const { t, n } = useApp();
  const gb = useGb();
  const price = usePrice();

  const priceRow = (v: number) => (
    <p className="flex items-end gap-1.5">
      <span className="font-latin text-3xl font-extrabold tracking-tight">{price(v)}</span>
      <span className="pb-1 text-sm font-semibold opacity-85">
        {t("تومان / ۳۰ روز", "Toman / 30 days")}
      </span>
    </p>
  );

  return (
    <Page>
      <div className="mx-auto flex max-w-[1440px] flex-col gap-10 pb-4 pt-4">
        <header className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-extrabold tracking-tight">
                {t("پلن‌های سرعت و سهمیه دانلود", "Speed & Quota Plans")}
              </h1>
              <p className="max-w-2xl text-base text-fg-2">
                {t(
                  "پلن‌ها سرعت و حجم دانلود را ارائه می‌دهند — خودِ بازی‌ها همیشه از کتابخانه PSN شما تأیید و دانلود می‌شوند.",
                  "Plans provide speed and download quota — games always verify from your own PSN library."
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-fg-2">{t("پلن فعلی شما:", "Your current plan:")}</span>
              <Pill tone="accent">
                <span className="font-bold">{t("نقره‌ای", "Silver")}</span>
                <span className="text-fg-2">·</span>
                <span className="font-latin">
                  {n(USER.quotaLeftGb)} GB {t("باقی‌مانده", "left")}
                </span>
                <span className="text-fg-2">·</span>
                <span>{t(`تمدید ${USER.renewsFa}`, `renews ${USER.renewsEn}`)}</span>
              </Pill>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 items-stretch gap-5 pt-3">
          <PlanCard
            name={["رایگان", "Free"]}
            desc={[
              "دانلود سریع فقط برای بازی‌های رایگانِ (Free-to-play) کتابخانه شما — بدون سقف حجم.",
              "Fast downloads only for free-to-play titles in your library — no volume cap.",
            ]}
            price={
              <p className="text-2xl font-extrabold">
                {t("رایگان", "Free")}
                <span className="ms-2 text-sm font-semibold opacity-85">{t("برای همیشه", "forever")}</span>
              </p>
            }
            quotaLabel={["سهمیه", "Quota"]}
            quotaValue={t("بدون سقف", "No cap")}
            head="bg-surface-3 text-fg"
            body={<FreeTitles />}
            limits={[
              ["بازی‌های پولی با سرعت عادی PSN دانلود می‌شوند", "Paid games download at standard PSN speed"],
              ["سقف سرعت: ۳٫۱ Mbps برای بازی‌های پولی", "Speed cap: 3.1 Mbps for paid titles"],
            ]}
            cta={["شروع رایگان", "Start free"]}
            ctaVariant="secondary"
          />
          <PlanCard
            name={["برنز", "Bronze"]}
            desc={["سرعت پایه برای مجموعه بازی‌های PS4 و PS5 شما.", "Entry speed for your PS4 and PS5 library."]}
            price={priceRow(698000)}
            quotaLabel={["حجم ماهانه", "Monthly quota"]}
            quotaValue={gb(500)}
            head="bg-linear-135 from-bronze to-bronze-2 text-on-accent"
            features={[
              ["حداکثر سرعت بدون محدودیت پهنای باند", "Maximum uncapped speed"],
              ["بازی‌های PS4 و PS5 که مالکشان هستید", "PS4 & PS5 games you own"],
              ["۱ کنسول", "1 console"],
            ]}
            limits={[
              ["بسته‌های زیرنویس فارسی", "Persian subtitle packs"],
              ["DLC و اولویت آپدیت", "DLC & update priority"],
            ]}
            note={[
              "با تمام شدن سهمیه، دانلودها با سرعت عادی PSN ادامه پیدا می‌کنند. چیزی قفل نمی‌شود.",
              "When quota runs out, downloads continue at standard PSN speed. Nothing gets locked.",
            ]}
            cta={["انتخاب برنز", "Choose Bronze"]}
          />
          <PlanCard
            name={["نقره‌ای", "Silver"]}
            desc={["سرعت فوق‌العاده با حجم کافی برای کل کتابخانه.", "Balanced speed with room for your whole library."]}
            price={priceRow(1198000)}
            quotaLabel={["حجم ماهانه", "Monthly quota"]}
            quotaValue={gb(1000)}
            head="bg-linear-135 from-slate-200 to-slate-400 text-slate-950 font-bold"
            features={[
              ["حداکثر سرعت بدون محدودیت پهنای باند", "Maximum uncapped speed"],
              ["PS4 و PS5", "PS4 & PS5"],
              ["بسته‌های زیرنویس فارسی", "Persian subtitle packs"],
              ["DLC و آپدیت‌ها در سهمیه", "DLC & updates included in quota"],
              ["۲ کنسول", "2 consoles"],
            ]}
            limits={[["پیش‌بارگیری بازی‌های آینده", "Pre-load of upcoming releases"]]}
            note={[
              "با تمام شدن سهمیه، دانلودها با سرعت عادی PSN ادامه پیدا می‌کنند. چیزی قفل نمی‌شود.",
              "When quota runs out, downloads continue at standard PSN speed. Nothing gets locked.",
            ]}
            cta={["پلن فعلی شما", "Your current plan"]}
            ctaDisabled
          />
          <PlanCard
            highlight
            name={["طلایی VIP", "Gold VIP"]}
            desc={["نهایت سرعت و بیشترین حجم برای خانواده و تمام کنسول‌ها.", "Maximum speed and quota for the whole household."]}
            price={priceRow(2988000)}
            quotaLabel={["حجم ماهانه", "Monthly quota"]}
            quotaValue={gb(2250)}
            head="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black shadow-lg"
            features={[
              ["حداکثر سرعت بدون محدودیت پهنای باند", "Maximum uncapped speed"],
              ["PS4 و PS5 و تمامی عناوین FPKG", "PS4 & PS5 and all FPKG titles"],
              ["بسته‌های زیرنویس و دوبله فارسی اختصاصی", "Persian subtitle & dubbing packs"],
              ["DLC و آپدیت‌ها در سهمیه", "DLC & updates included in quota"],
              ["پیش‌بارگیری بازی‌های جدید در روز انتشار", "Pre-load upcoming releases on release day"],
              ["پشتیبانی تلفنی و تلگرامی ۲۴ ساعته", "24/7 Phone & Telegram VIP support"],
              ["۴ کنسول همزمان", "4 consoles"],
            ]}
            note={[
              "با تمام شدن سهمیه، دانلودها با سرعت عادی PSN ادامه پیدا می‌کنند. چیزی قفل نمی‌شود.",
              "When quota runs out, downloads continue at standard PSN speed. Nothing gets locked.",
            ]}
            cta={["ارتقا به طلایی VIP", "Upgrade to Gold VIP"]}
            ctaVariant="primary"
          />
        </section>

        <SpeedStrip />
        <DiscountBox />
      </div>
    </Page>
  );
}
