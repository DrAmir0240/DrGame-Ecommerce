import { useState, type ReactNode } from "react";
import { Bell, Gamepad2, HardDrive, Moon, Search, Sun, Tv } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { useApp } from "../lib/app";
import { GAMES, USER } from "../lib/data";
import { GameArt, OwnershipTag } from "./GameTile";
import { ShapePattern } from "./ui";

export function Logo() {
  const { t } = useApp();
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-xl bg-accent shadow-glow">
        <Gamepad2 size={20} strokeWidth={2} className="text-on-accent" />
      </span>
      <span className="leading-tight">
        <span className="block font-latin text-[15px] font-extrabold tracking-tight">Nebula</span>
        <span className="block text-[10px] font-medium text-fg-2">{t("شبکه دانلود سریع PS5", "Fast PS5 download network")}</span>
      </span>
    </Link>
  );
}

function QuotaPill() {
  const { t, n } = useApp();
  const used = 1 - USER.quotaLeftGb / USER.quotaTotalGb;
  return (
    <Link
      to="/plans"
      title={t("سهمیه باقی‌مانده", "Quota left")}
      className="flex h-10 items-center gap-2.5 rounded-full border border-accent/50 bg-accent-soft ps-3 pe-3.5 shadow-glow-sm hover:border-accent-2"
    >
      <HardDrive size={16} className="text-accent-2" strokeWidth={2} />
      <div className="flex flex-col gap-1">
        <span dir="ltr" className="font-latin text-xs font-bold leading-none">
          {n(USER.quotaLeftGb)} GB <span className="font-medium text-fg-2">/ {n(1)} TB</span>
        </span>
        <span className="h-1 w-20 overflow-hidden rounded-full bg-line-strong">
          <span className="block h-full rounded-full bg-accent-2" style={{ width: `${(1 - used) * 100}%` }} />
        </span>
      </div>
    </Link>
  );
}

function LiveSearch() {
  const { t, n } = useApp();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const results = q.trim()
    ? GAMES.filter((g) => g.title.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 5)
    : [];
  return (
    <div className="relative w-full max-w-md">
      <Search size={16} className="pointer-events-none absolute start-4 top-1/2 -mt-2 text-fg-2" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={t("جستجو در کتابخانه PSN و فروشگاه…", "Search your PSN library and the store…")}
        className="h-10 w-full rounded-full border border-line-strong bg-surface-2 ps-11 pe-4 text-sm text-fg placeholder:text-muted focus:border-accent-2 focus:outline-none"
      />
      {open && results.length > 0 && (
        <div className="absolute inset-x-0 top-12 z-50 overflow-hidden rounded-card border border-line-strong bg-surface shadow-md">
          {results.map((g) => (
            <Link key={g.slug} to={`/games/${g.slug}`} className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface-2">
              <GameArt src={g.image} alt="" className="size-10 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-latin text-sm font-semibold"><bdi>{g.title}</bdi></p>
                <p dir="ltr" className="text-start font-latin text-xs text-fg-2">{n(g.sizeGb)} GB · {g.platforms.join(" / ")}</p>
              </div>
              <OwnershipTag g={g} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function Header() {
  const { t, lang, setLang, theme, setTheme } = useApp();
  const nav = [
    { to: "/", fa: "فروشگاه", en: "Store", end: true },
    { to: "/profile", fa: "کتابخانه من", en: "My library" },
    { to: "/plans", fa: "اشتراک‌ها", en: "Plans" },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-6 px-6">
        <Logo />
        <nav className="flex items-center gap-1">
          {nav.map((i) => (
            <NavLink
              key={i.to}
              to={i.to}
              end={i.end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium ${isActive ? "bg-surface-2 text-fg" : "text-fg-2 hover:text-fg"}`
              }
            >
              {t(i.fa, i.en)}
            </NavLink>
          ))}
          <NavLink to="/tv" className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-fg-2 hover:text-fg">
            <Tv size={15} />
            {t("حالت تلویزیون", "TV mode")}
          </NavLink>
        </nav>
        <div className="flex flex-1 justify-center">
          <LiveSearch />
        </div>
        <div className="flex items-center gap-2">
          <QuotaPill />
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="grid size-10 place-items-center rounded-full text-fg-2 hover:bg-surface-2 hover:text-fg"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={() => setLang(lang === "fa" ? "en" : "fa")}
            className="h-10 rounded-full px-3 text-sm font-semibold text-fg-2 hover:bg-surface-2 hover:text-fg"
          >
            {lang === "fa" ? "English" : "فارسی"}
          </button>
          <button className="relative grid size-10 place-items-center rounded-full text-fg-2 hover:bg-surface-2 hover:text-fg" aria-label="Notifications">
            <Bell size={18} />
            <span className="absolute end-2.5 top-2.5 size-2 rounded-full bg-accent-2 ring-2 ring-bg" />
          </button>
          <Link to="/profile" className="flex items-center gap-2.5 rounded-full py-1 ps-1 pe-3 hover:bg-surface-2">
            <span className="grid size-8 place-items-center rounded-full bg-surface-3 font-latin text-xs font-bold ring-2 ring-accent-2">
              {USER.avatar}
            </span>
            <span className="leading-tight">
              <span className="block font-latin text-sm font-semibold">{USER.name}</span>
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

export function Page({ children, pattern = true }: { children: ReactNode; pattern?: boolean }) {
  const { t } = useApp();
  return (
    <div className="relative min-h-screen">
      {pattern && <ShapePattern />}
      <Header />
      <main className="relative">{children}</main>
      <footer className="relative mt-20 border-t border-line">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-6 text-xs text-muted">
          <span>{t("پیش‌نمایش برای ارائه به Sony Interactive Entertainment — داده‌ها نمونه هستند.", "Prototype for Sony Interactive Entertainment review — sample data.")}</span>
          <span className="font-latin">Game data: RAWG</span>
        </div>
      </footer>
    </div>
  );
}
