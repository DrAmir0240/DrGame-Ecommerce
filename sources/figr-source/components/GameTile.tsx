import { Check, Download, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import type { Game } from "../lib/data";
import { useApp } from "../lib/app";
import { MetaScore, PlatformBadge } from "./ui";

export function GameArt({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-linear-135 from-accent-deep via-surface-2 to-surface ${className}`}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
        onError={(e) => (e.currentTarget.style.display = "none")}
      />
    </div>
  );
}

export function OwnershipTag({ g }: { g: Game }) {
  const { t } = useApp();
  if (g.ownership === "owned")
    return (
      <span className="inline-flex h-6 items-center gap-1 rounded-full bg-success px-2 text-[11px] font-bold text-black">
        <Check size={12} strokeWidth={3} />
        {t("در کتابخانه", "Owned")}
      </span>
    );
  if (g.ownership === "free")
    return (
      <span className="inline-flex h-6 items-center rounded-full bg-white px-2 text-[11px] font-bold text-black">
        {t("رایگان", "Free to play")}
      </span>
    );
  return null;
}

export function GameTile({ g, size = "md" }: { g: Game; size?: "md" | "lg" }) {
  const { t, n } = useApp();
  const ready = g.ownership !== "not-owned";
  return (
    <Link
      to={`/games/${g.slug}`}
      className={`group block shrink-0 rounded-tile outline-none focus-visible:scale-105 focus-visible:shadow-focus ${size === "lg" ? "w-56" : "w-44"}`}
    >
      <div className="relative">
        <GameArt
          src={g.image}
          alt={g.title}
          className="aspect-[3/4] rounded-tile border border-line group-hover:border-accent-2"
        />
        <div className="absolute inset-x-2 top-2 flex items-start justify-between gap-1">
          <div className="flex gap-1">
            {g.platforms.map((p) => (
              <PlatformBadge key={p} p={p} solid={p === "PS5"} />
            ))}
          </div>
          <OwnershipTag g={g} />
        </div>
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between rounded-b-tile bg-linear-to-t from-black/85 to-transparent px-2.5 pb-2 pt-8">
          <span dir="ltr" className="font-latin text-xs font-semibold text-white">
            {n(g.sizeGb)} GB
          </span>
          {ready ? (
            <Download size={14} className="text-white" strokeWidth={2} />
          ) : (
            <ShoppingBag size={14} className="text-white/70" strokeWidth={2} />
          )}
        </div>
      </div>
      <div className="mt-2.5 px-0.5">
        <p className="truncate font-latin text-sm font-semibold text-fg">
          <bdi>{g.title}</bdi>
        </p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="truncate text-xs text-fg-2">{t(g.genreFa, g.genreEn)}</span>
          <MetaScore v={g.metacritic} />
        </div>
      </div>
    </Link>
  );
}
